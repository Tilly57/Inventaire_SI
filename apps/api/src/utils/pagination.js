/**
 * @fileoverview Pagination utilities
 *
 * Provides reusable pagination logic for API endpoints.
 * Implements cursor-based and offset-based pagination.
 *
 * Features:
 * - Automatic total count calculation
 * - Page metadata (hasNextPage, hasPreviousPage, totalPages)
 * - Configurable default and max page sizes
 * - Input validation and sanitization
 */

import { ValidationError } from './errors.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
};

/**
 * Parse and validate pagination parameters from query string
 *
 * @param {Object} query - Express req.query object
 * @param {number} query.page - Page number (1-indexed)
 * @param {number} query.pageSize - Items per page
 * @returns {{page: number, pageSize: number, skip: number}}
 *
 * @example
 * const { page, pageSize, skip } = parsePaginationParams(req.query);
 * // page=2, pageSize=20 => { page: 2, pageSize: 20, skip: 20 }
 */
export function parsePaginationParams(query) {
  // Parse page (default to 1)
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE;
  }

  // Parse pageSize (default to 20, max 100)
  let pageSize = parseInt(query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < PAGINATION_DEFAULTS.MIN_PAGE_SIZE) {
    pageSize = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE;
  }
  if (pageSize > PAGINATION_DEFAULTS.MAX_PAGE_SIZE) {
    pageSize = PAGINATION_DEFAULTS.MAX_PAGE_SIZE;
  }

  // Calculate skip for Prisma (0-indexed)
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

/**
 * Build paginated response with metadata
 *
 * @param {Array} data - Array of items for current page
 * @param {number} total - Total count of items (all pages)
 * @param {number} page - Current page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated response with metadata
 *
 * @example
 * const response = buildPaginatedResponse(items, 150, 2, 20);
 * // {
 * //   data: [...20 items...],
 * //   pagination: {
 * //     page: 2,
 * //     pageSize: 20,
 * //     totalItems: 150,
 * //     totalPages: 8,
 * //     hasNextPage: true,
 * //     hasPreviousPage: true
 * //   }
 * // }
 */
export function buildPaginatedResponse(data, total, page, pageSize) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

/**
 * Execute paginated query with Prisma
 *
 * Automatically handles count and data fetching in parallel for performance.
 *
 * @param {Object} prismaModel - Prisma model (e.g., prisma.loan)
 * @param {Object} options - Query options
 * @param {Object} options.where - Prisma where clause
 * @param {Object} options.orderBy - Prisma orderBy clause
 * @param {Object} options.include - Prisma include clause
 * @param {Object} options.select - Prisma select clause
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Items per page
 * @returns {Promise<Object>} Paginated response
 *
 * @example
 * const result = await executePaginatedQuery(prisma.loan, {
 *   where: { status: 'OPEN' },
 *   orderBy: { createdAt: 'desc' },
 *   include: { employee: true },
 *   page: 1,
 *   pageSize: 20
 * });
 */
export async function executePaginatedQuery(prismaModel, options) {
  const {
    where = {},
    orderBy = {},
    include,
    select,
    page,
    pageSize
  } = options;

  const skip = (page - 1) * pageSize;

  // Execute count and data queries in parallel for performance
  const [total, data] = await Promise.all([
    prismaModel.count({ where }),
    prismaModel.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      ...(include && { include }),
      ...(select && { select })
    })
  ]);

  return buildPaginatedResponse(data, total, page, pageSize);
}

/**
 * Validate sort parameters
 *
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @param {string[]} allowedFields - Allowed fields for sorting
 * @returns {{sortBy: string, sortOrder: string}}
 *
 * @throws {ValidationError} If sortBy not in allowedFields or sortOrder invalid
 *
 * @example
 * const { sortBy, sortOrder } = validateSortParams(
 *   req.query.sortBy,
 *   req.query.sortOrder,
 *   ['createdAt', 'name', 'email']
 * );
 */
export function validateSortParams(sortBy, sortOrder, allowedFields) {
  // Validate sortBy
  if (sortBy && !allowedFields.includes(sortBy)) {
    throw new ValidationError(
      `Champ de tri invalide. Champs autorisés: ${allowedFields.join(', ')}`
    );
  }

  // Validate sortOrder
  const validOrders = ['asc', 'desc'];
  if (sortOrder && !validOrders.includes(sortOrder.toLowerCase())) {
    throw new ValidationError(
      `Ordre de tri invalide. Ordres autorisés: ${validOrders.join(', ')}`
    );
  }

  return {
    sortBy: sortBy || allowedFields[0], // Default to first allowed field
    sortOrder: sortOrder ? sortOrder.toLowerCase() : 'desc' // Default to desc
  };
}

/**
 * Build Prisma orderBy object from sort parameters
 *
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Object} Prisma orderBy object
 *
 * @example
 * const orderBy = buildOrderBy('createdAt', 'desc');
 * // { createdAt: 'desc' }
 *
 * @example
 * // For nested fields
 * const orderBy = buildOrderBy('employee.lastName', 'asc');
 * // { employee: { lastName: 'asc' } }
 */
export function buildOrderBy(sortBy, sortOrder) {
  // Handle nested fields (e.g., 'employee.lastName')
  if (sortBy.includes('.')) {
    const parts = sortBy.split('.');
    let orderBy = {};
    let current = orderBy;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = sortOrder;
      } else {
        current[part] = {};
        current = current[part];
      }
    });

    return orderBy;
  }

  // Simple field
  return { [sortBy]: sortOrder };
}
