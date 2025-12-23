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

/**
 * Get all stock items
 *
 * Returns all consumable items ordered by creation date (newest first).
 * Each item includes current quantity available.
 *
 * @returns {Promise<Array>} Array of stock item objects
 *
 * @example
 * const stockItems = await getAllStockItems();
 * // stockItems = [{ id, name, quantity, unit, createdAt, ... }, ...]
 */
export async function getAllStockItems() {
  const stockItems = await prisma.stockItem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return stockItems;
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
  const stockItem = await prisma.stockItem.findUnique({
    where: { id },
    include: {
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
    }
  });

  if (!stockItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  return stockItem;
}

/**
 * Create a new stock item
 *
 * Creates a consumable item with initial quantity.
 *
 * @param {Object} data - Stock item creation data
 * @param {string} data.name - Item name (e.g., "Câble HDMI 2m")
 * @param {number} [data.quantity=0] - Initial quantity in stock
 * @param {string} [data.unit='pièce'] - Unit of measurement (pièce, mètre, boîte, etc.)
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created stock item
 *
 * @example
 * const item = await createStockItem({
 *   name: 'Câble USB-C',
 *   quantity: 50,
 *   unit: 'pièce',
 *   description: 'Câble USB-C 1m pour chargement'
 * });
 */
export async function createStockItem(data) {
  const stockItem = await prisma.stockItem.create({
    data
  });

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
 * @param {string} [data.name] - Updated name
 * @param {number} [data.quantity] - Updated quantity (prefer adjustStockQuantity)
 * @param {string} [data.unit] - Updated unit
 * @param {string} [data.description] - Updated description
 * @returns {Promise<Object>} Updated stock item
 * @throws {NotFoundError} If stock item doesn't exist
 *
 * @example
 * const updated = await updateStockItem('stockId123', {
 *   description: 'Câble USB-C 2m (nouvelle version)'
 * });
 */
export async function updateStockItem(id, data) {
  // Check if stock item exists
  const existingItem = await prisma.stockItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  const stockItem = await prisma.stockItem.update({
    where: { id },
    data
  });

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
 * @returns {Promise<Object>} Updated stock item with new quantity
 * @throws {NotFoundError} If stock item doesn't exist
 * @throws {ValidationError} If adjustment would result in negative quantity
 *
 * @example
 * // Receive new stock (+50 units)
 * await adjustStockQuantity('stockId123', 50);
 *
 * @example
 * // Manual removal (-10 units for damaged items)
 * await adjustStockQuantity('stockId123', -10);
 *
 * @example
 * // This will throw ValidationError if current quantity is 5
 * await adjustStockQuantity('stockId123', -10);
 * // Error: "La quantité ne peut pas être négative"
 */
export async function adjustStockQuantity(id, adjustment) {
  // Check if stock item exists
  const existingItem = await prisma.stockItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  // Calculate new quantity
  const newQuantity = existingItem.quantity + adjustment;

  // Business rule: Stock quantity cannot be negative
  // This prevents over-allocation and maintains inventory accuracy
  if (newQuantity < 0) {
    throw new ValidationError('La quantité ne peut pas être négative');
  }

  const stockItem = await prisma.stockItem.update({
    where: { id },
    data: { quantity: newQuantity }
  });

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
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If stock item doesn't exist
 *
 * @example
 * await deleteStockItem('stockId123');
 */
export async function deleteStockItem(id) {
  // Check if stock item exists and fetch loan history for audit
  const existingItem = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      loanLines: true  // Loan history preserved in database
    }
  });

  if (!existingItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  // Delete item (loan history remains in loanLines table)
  await prisma.stockItem.delete({ where: { id } });

  return { message: 'Article de stock supprimé avec succès' };
}
