/**
 * @fileoverview Search service - Full-text search across multiple entities
 *
 * Provides:
 * - Global search with PostgreSQL full-text search (tsvector + GIN indexes)
 * - Ranking by relevance (ts_rank)
 * - Typo tolerance (plainto_tsquery)
 * - Autocomplete for quick suggestions
 */

import prisma from '../config/database.js';
import { createContextLogger } from '../config/logger.js';

const logger = createContextLogger('SearchService');

/**
 * Global search across employees, asset items, and asset models
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query string
 * @param {number} [params.limit=10] - Max results per category
 * @returns {Promise<Object>} Search results grouped by category
 *
 * @example
 * const results = await globalSearch({ query: 'laptop dell' });
 * // Returns: { employees: [], assetItems: [...], assetModels: [...] }
 */
export async function globalSearch({ query, limit = 10 }) {
  if (!query || query.trim().length < 2) {
    return {
      employees: [],
      assetItems: [],
      assetModels: [],
      stockItems: []
    };
  }

  const searchQuery = query.trim();
  const maxLimit = Math.min(parseInt(limit), 50); // Cap at 50 results

  try {
    // Execute searches in parallel for performance
    const [employees, assetItems, assetModels, stockItems] = await Promise.all([
      // Search employees
      prisma.$queryRaw`
        SELECT
          id,
          "firstName",
          "lastName",
          email,
          dept,
          ts_rank("searchVector", plainto_tsquery('french', ${searchQuery})) as rank
        FROM "Employee"
        WHERE "searchVector" @@ plainto_tsquery('french', ${searchQuery})
        ORDER BY rank DESC, "lastName" ASC
        LIMIT ${maxLimit}
      `,

      // Search asset items with model info
      prisma.$queryRaw`
        SELECT
          ai.id,
          ai."assetTag",
          ai.serial,
          ai.status,
          ai.notes,
          am.type,
          am.brand,
          am."modelName",
          ts_rank(ai."searchVector", plainto_tsquery('french', ${searchQuery})) as rank
        FROM "AssetItem" ai
        JOIN "AssetModel" am ON ai."assetModelId" = am.id
        WHERE ai."searchVector" @@ plainto_tsquery('french', ${searchQuery})
           OR am."searchVector" @@ plainto_tsquery('french', ${searchQuery})
        ORDER BY rank DESC
        LIMIT ${maxLimit}
      `,

      // Search asset models
      prisma.$queryRaw`
        SELECT
          id,
          type,
          brand,
          "modelName",
          ts_rank("searchVector", plainto_tsquery('french', ${searchQuery})) as rank
        FROM "AssetModel"
        WHERE "searchVector" @@ plainto_tsquery('french', ${searchQuery})
        ORDER BY rank DESC
        LIMIT ${maxLimit}
      `,

      // Search stock items with model info
      prisma.$queryRaw`
        SELECT
          si.id,
          si.quantity,
          si.loaned,
          si.notes,
          am.type,
          am.brand,
          am."modelName",
          ts_rank(si."searchVector", plainto_tsquery('french', ${searchQuery})) as rank
        FROM "StockItem" si
        JOIN "AssetModel" am ON si."assetModelId" = am.id
        WHERE si."searchVector" @@ plainto_tsquery('french', ${searchQuery})
           OR am."searchVector" @@ plainto_tsquery('french', ${searchQuery})
        ORDER BY rank DESC
        LIMIT ${maxLimit}
      `
    ]);

    return {
      employees,
      assetItems,
      assetModels,
      stockItems
    };
  } catch (error) {
    logger.error('Global search error', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Autocomplete employees by name or email
 *
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Matching employees
 */
export async function autocompleteEmployees(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }

  const searchPattern = `%${query}%`;

  return await prisma.employee.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      dept: true
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' }
    ],
    take: Math.min(parseInt(limit), 20)
  });
}

/**
 * Autocomplete asset items (available only)
 *
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @param {boolean} [availableOnly=true] - Only show EN_STOCK items
 * @returns {Promise<Array>} Matching asset items with model info
 */
export async function autocompleteAssetItems(query, limit = 10, availableOnly = true) {
  if (!query || query.length < 2) {
    return [];
  }

  return await prisma.assetItem.findMany({
    where: {
      AND: [
        {
          OR: [
            { assetTag: { contains: query, mode: 'insensitive' } },
            { serial: { contains: query, mode: 'insensitive' } }
          ]
        },
        ...(availableOnly ? [{ status: 'EN_STOCK' }] : [])
      ]
    },
    include: {
      assetModel: {
        select: {
          type: true,
          brand: true,
          modelName: true
        }
      }
    },
    orderBy: { assetTag: 'asc' },
    take: Math.min(parseInt(limit), 20)
  });
}

/**
 * Autocomplete asset models
 *
 * @param {string} query - Search query
 * @param {number} [limit=10] - Max results
 * @returns {Promise<Array>} Matching asset models
 */
export async function autocompleteAssetModels(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }

  return await prisma.assetModel.findMany({
    where: {
      OR: [
        { type: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { modelName: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      type: true,
      brand: true,
      modelName: true
    },
    orderBy: [
      { type: 'asc' },
      { brand: 'asc' }
    ],
    take: Math.min(parseInt(limit), 20)
  });
}
