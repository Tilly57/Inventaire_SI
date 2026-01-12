/**
 * @fileoverview Stock Items service - Business logic for consumable stock management
 *
 * This service handles:
 * - Consumable item CRUD operations
 * - Quantity tracking and adjustments
 * - Loan history tracking
 * - Stock level management
 *
 * Stock Items represent consumable supplies (cables, adapters, office supplies)
 * tracked by quantity rather than individual units. Unlike AssetItems, they don't
 * have unique serial numbers or asset tags.
 */

import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { findOneOrFail } from '../utils/prismaHelpers.js';
import { logCreate, logUpdate, logDelete } from '../utils/auditHelpers.js';
import { getCached, invalidateEntity, generateKey, TTL } from './cache.service.js';

/**
 * Get all stock items
 *
 * Returns all consumable items ordered by creation date (newest first).
 * Each item includes current quantity available.
 * Cached for 5 minutes (TTL.STOCK_ITEMS) - Phase 3.2
 *
 * @returns {Promise<Array>} Array of stock item objects
 *
 * @example
 * const stockItems = await getAllStockItems();
 * // stockItems = [{ id, name, quantity, unit, createdAt, ... }, ...]
 */
export async function getAllStockItems() {
  const cacheKey = generateKey('stock_items', 'all');

  return getCached(
    cacheKey,
    async () => {
      const stockItems = await prisma.stockItem.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          assetModel: true  // Include model details (type, brand, modelName)
        }
      });

      return stockItems;
    },
    TTL.STOCK_ITEMS
  );
}

/**
 * Get a single stock item by ID with loan history
 *
 * Returns stock item details including:
 * - Current quantity
 * - Complete loan history showing quantity borrowed
 * - Employee details for each loan
 *
 * @param {string} id - Stock item ID (CUID format)
 * @returns {Promise<Object>} Stock item with loan history
 * @throws {NotFoundError} If stock item doesn't exist
 *
 * @example
 * const item = await getStockItemById('stockId123');
 * // item.loanLines = [{ quantity: 5, loan: { employee: {...} } }, ...]
 */
export async function getStockItemById(id) {
  const stockItem = await findOneOrFail('stockItem', { id }, {
    include: {
      assetModel: true,  // Include model details
      loanLines: {
        include: {
          loan: {
            include: {
              employee: true  // Employee who borrowed items
            }
          }
        },
        orderBy: {
          loan: {
            openedAt: 'desc'  // Most recent loans first
          }
        }
      }
    },
    errorMessage: 'Article de stock non trouvé'
  });

  return stockItem;
}

/**
 * Create a new stock item
 *
 * Creates a consumable item with initial quantity linked to an AssetModel.
 *
 * @param {Object} data - Stock item creation data
 * @param {string} data.assetModelId - Asset model ID (must exist)
 * @param {number} [data.quantity=0] - Initial quantity in stock
 * @param {string} [data.notes] - Optional notes
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Created stock item with assetModel populated
 * @throws {NotFoundError} If asset model doesn't exist
 *
 * @example
 * const item = await createStockItem({
 *   assetModelId: 'modelId123',
 *   quantity: 50,
 *   notes: 'Câbles de recharge pour postes de travail'
 * }, req);
 */
export async function createStockItem(data, req) {
  // Validate that asset model exists
  await findOneOrFail('assetModel', { id: data.assetModelId }, {
    errorMessage: 'Modèle d\'équipement non trouvé'
  });

  const stockItem = await prisma.stockItem.create({
    data,
    include: {
      assetModel: true  // Include model in response
    }
  });

  // Audit trail
  await logCreate('StockItem', stockItem.id, req, stockItem);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('stock_items');

  return stockItem;
}

/**
 * Update an existing stock item
 *
 * Updates stock item details. For quantity changes, prefer using
 * adjustStockQuantity() which provides better audit trail.
 *
 * @param {string} id - Stock item ID to update
 * @param {Object} data - Updated stock item data
 * @param {string} [data.assetModelId] - Updated asset model ID (must exist)
 * @param {number} [data.quantity] - Updated quantity (prefer adjustStockQuantity)
 * @param {string} [data.notes] - Updated notes
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated stock item with assetModel populated
 * @throws {NotFoundError} If stock item or asset model doesn't exist
 *
 * @example
 * const updated = await updateStockItem('stockId123', {
 *   notes: 'Câbles USB-C neufs commandés en décembre'
 * }, req);
 */
export async function updateStockItem(id, data, req) {
  // Check if stock item exists
  const existingItem = await findOneOrFail('stockItem', { id }, {
    errorMessage: 'Article de stock non trouvé'
  });

  // If asset model is being changed, validate it exists
  if (data.assetModelId) {
    await findOneOrFail('assetModel', { id: data.assetModelId }, {
      errorMessage: 'Modèle d\'équipement non trouvé'
    });
  }

  const stockItem = await prisma.stockItem.update({
    where: { id },
    data,
    include: {
      assetModel: true  // Include model in response
    }
  });

  // Audit trail
  await logUpdate('StockItem', id, req, existingItem, stockItem);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('stock_items');

  return stockItem;
}

/**
 * Adjust stock item quantity
 *
 * Adds or removes quantity from stock. Positive values increase stock,
 * negative values decrease it. Prevents negative stock quantities.
 *
 * Note: Loan workflow automatically manages stock quantities:
 * - Adding stock to loan: quantity -= loan quantity
 * - Removing stock from loan: quantity += loan quantity
 *
 * @param {string} id - Stock item ID
 * @param {number} adjustment - Quantity to add (positive) or remove (negative)
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated stock item with new quantity
 * @throws {NotFoundError} If stock item doesn't exist
 * @throws {ValidationError} If adjustment would result in negative quantity
 *
 * @example
 * // Receive new stock (+50 units)
 * await adjustStockQuantity('stockId123', 50, req);
 *
 * @example
 * // Manual removal (-10 units for damaged items)
 * await adjustStockQuantity('stockId123', -10, req);
 *
 * @example
 * // This will throw ValidationError if current quantity is 5
 * await adjustStockQuantity('stockId123', -10, req);
 * // Error: "La quantité ne peut pas être négative"
 */
export async function adjustStockQuantity(id, adjustment, req) {
  // Check if stock item exists
  const existingItem = await findOneOrFail('stockItem', { id }, {
    errorMessage: 'Article de stock non trouvé'
  });

  // Calculate new quantity
  const newQuantity = existingItem.quantity + adjustment;

  // Business rule: Stock quantity cannot be negative
  // This prevents over-allocation and maintains inventory accuracy
  if (newQuantity < 0) {
    throw new ValidationError('La quantité ne peut pas être négative');
  }

  const stockItem = await prisma.stockItem.update({
    where: { id },
    data: { quantity: newQuantity },
    include: {
      assetModel: true  // Include model in response
    }
  });

  // Audit trail
  await logUpdate('StockItem', id, req, { quantity: existingItem.quantity }, { quantity: newQuantity, adjustment });

  // Invalidate cache - Phase 3.2
  await invalidateEntity('stock_items');

  return stockItem;
}

/**
 * Delete a stock item
 *
 * Note: Stock items can be deleted even if they have loan history.
 * The loan history is preserved via the loanLines table which maintains
 * the reference for audit purposes.
 *
 * Consider checking if current quantity is zero before deletion to avoid
 * deleting items that are still physically in stock.
 *
 * @param {string} id - Stock item ID to delete
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If stock item doesn't exist
 *
 * @example
 * await deleteStockItem('stockId123', req);
 */
export async function deleteStockItem(id, req) {
  // Check if stock item exists and fetch loan history for audit
  const existingItem = await findOneOrFail('stockItem', { id }, {
    include: {
      loanLines: true  // Loan history preserved in database
    },
    errorMessage: 'Article de stock non trouvé'
  });

  // Delete item (loan history remains in loanLines table)
  await prisma.stockItem.delete({ where: { id } });

  // Audit trail
  await logDelete('StockItem', id, req, existingItem);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('stock_items');

  return { message: 'Article de stock supprimé avec succès' };
}
