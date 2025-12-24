/**
 * @fileoverview Asset Items service - Business logic for individual equipment management
 *
 * This service handles:
 * - Physical equipment item CRUD operations
 * - Status tracking (EN_STOCK, PRETE, HS, REPARATION)
 * - Unique identifier validation (asset tags and serial numbers)
 * - Filtering and search capabilities
 * - Loan history tracking
 *
 * Asset Items represent individual physical equipment (e.g., a specific laptop with serial #12345).
 * Each item references an AssetModel template and has unique tracking identifiers.
 */

import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Get all asset items with optional filters
 *
 * Supports filtering by status, model, and text search (asset tag or serial).
 * Returns items ordered by creation date (newest first) with model details.
 *
 * @param {Object} [filters={}] - Optional filters
 * @param {string} [filters.status] - Filter by status (EN_STOCK, PRETE, HS, REPARATION)
 * @param {string} [filters.assetModelId] - Filter by asset model ID
 * @param {string} [filters.search] - Search in asset tag or serial number (case-insensitive)
 * @returns {Promise<Array>} Array of asset items with model details
 *
 * @example
 * // Get all items
 * const all = await getAllAssetItems();
 *
 * @example
 * // Get only loaned laptops
 * const loaned = await getAllAssetItems({
 *   status: 'PRETE',
 *   assetModelId: 'laptopModelId123'
 * });
 *
 * @example
 * // Search by serial number
 * const items = await getAllAssetItems({ search: 'SN12345' });
 */
export async function getAllAssetItems(filters = {}) {
  const { status, assetModelId, search } = filters;

  const where = {};

  // Filter by status if provided
  if (status) {
    where.status = status;
  }

  // Filter by asset model if provided
  if (assetModelId) {
    where.assetModelId = assetModelId;
  }

  // Search in asset tag OR serial number (case-insensitive)
  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: 'insensitive' } },
      { serial: { contains: search, mode: 'insensitive' } }
    ];
  }

  const assetItems = await prisma.assetItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      assetModel: true  // Include model details (type, brand, modelName)
    }
  });

  return assetItems;
}

/**
 * Get a single asset item by ID with complete loan history
 *
 * Returns item details including:
 * - Asset model information
 * - Complete loan history with employee details
 * - Loan lines ordered by most recent first
 *
 * @param {string} id - Asset item ID (CUID format)
 * @returns {Promise<Object>} Asset item with model and loan history
 * @throws {NotFoundError} If item doesn't exist
 *
 * @example
 * const item = await getAssetItemById('itemId123');
 * // item.loanLines[0].loan.employee.firstName = 'Jean'
 */
export async function getAssetItemById(id) {
  const assetItem = await prisma.assetItem.findUnique({
    where: { id },
    include: {
      assetModel: true,  // Model details
      loanLines: {
        include: {
          loan: {
            include: {
              employee: true  // Employee who borrowed this item
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

  if (!assetItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  return assetItem;
}

/**
 * Create a new asset item
 *
 * Validates:
 * - Asset model exists
 * - Asset tag is unique (if provided)
 * - Serial number is unique (if provided)
 *
 * @param {Object} data - Asset item creation data
 * @param {string} data.assetModelId - Reference to asset model template
 * @param {string} [data.assetTag] - Unique inventory/asset tag number
 * @param {string} [data.serial] - Unique manufacturer serial number
 * @param {string} [data.status='EN_STOCK'] - Initial status
 * @param {string} [data.notes] - Optional notes
 * @returns {Promise<Object>} Created asset item with model details
 * @throws {NotFoundError} If asset model doesn't exist
 * @throws {ConflictError} If asset tag or serial already exists
 *
 * @example
 * const item = await createAssetItem({
 *   assetModelId: 'modelId123',
 *   assetTag: 'INV-2024-001',
 *   serial: 'SN123456789',
 *   status: 'EN_STOCK'
 * });
 */
export async function createAssetItem(data) {
  // Validate asset model exists
  const assetModel = await prisma.assetModel.findUnique({ where: { id: data.assetModelId } });
  if (!assetModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Validate unique asset tag if provided
  // Asset tags are used for internal inventory tracking
  if (data.assetTag) {
    const existingTag = await prisma.assetItem.findUnique({ where: { assetTag: data.assetTag } });
    if (existingTag) {
      throw new ConflictError('Ce numéro d\'inventaire existe déjà');
    }
  }

  // Validate unique serial number if provided
  // Serial numbers are manufacturer identifiers
  if (data.serial) {
    const existingSerial = await prisma.assetItem.findUnique({ where: { serial: data.serial } });
    if (existingSerial) {
      throw new ConflictError('Ce numéro de série existe déjà');
    }
  }

  const assetItem = await prisma.assetItem.create({
    data,
    include: {
      assetModel: true
    }
  });

  return assetItem;
}

/**
 * Update an existing asset item
 *
 * Validates:
 * - Item exists
 * - New asset model exists (if being changed)
 * - New asset tag is unique (if being changed)
 * - New serial is unique (if being changed)
 *
 * @param {string} id - Asset item ID to update
 * @param {Object} data - Updated asset item data
 * @param {string} [data.assetModelId] - New asset model reference
 * @param {string} [data.assetTag] - New asset tag
 * @param {string} [data.serial] - New serial number
 * @param {string} [data.status] - New status
 * @param {string} [data.notes] - Updated notes
 * @returns {Promise<Object>} Updated asset item with model details
 * @throws {NotFoundError} If item or new asset model doesn't exist
 * @throws {ConflictError} If new asset tag or serial already exists
 *
 * @example
 * const updated = await updateAssetItem('itemId123', {
 *   status: 'HS',
 *   notes: 'Écran cassé - en attente de réparation'
 * });
 */
export async function updateAssetItem(id, data) {
  // Check if asset item exists
  const existingItem = await prisma.assetItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  // If asset model is being changed, validate it exists
  if (data.assetModelId) {
    const assetModel = await prisma.assetModel.findUnique({ where: { id: data.assetModelId } });
    if (!assetModel) {
      throw new NotFoundError('Modèle d\'équipement non trouvé');
    }
  }

  // If asset tag is being changed, validate uniqueness
  if (data.assetTag && data.assetTag !== existingItem.assetTag) {
    const existingTag = await prisma.assetItem.findUnique({ where: { assetTag: data.assetTag } });
    if (existingTag) {
      throw new ConflictError('Ce numéro d\'inventaire existe déjà');
    }
  }

  // If serial number is being changed, validate uniqueness
  if (data.serial && data.serial !== existingItem.serial) {
    const existingSerial = await prisma.assetItem.findUnique({ where: { serial: data.serial } });
    if (existingSerial) {
      throw new ConflictError('Ce numéro de série existe déjà');
    }
  }

  const assetItem = await prisma.assetItem.update({
    where: { id },
    data,
    include: {
      assetModel: true
    }
  });

  return assetItem;
}

/**
 * Update asset item status only
 *
 * Convenience function for quick status changes without full update.
 * Useful for bulk status updates or UI quick-actions.
 *
 * Note: Loan workflow automatically manages status transitions:
 * - Adding item to loan: EN_STOCK → PRETE
 * - Removing item from loan: PRETE → EN_STOCK
 *
 * @param {string} id - Asset item ID
 * @param {string} status - New status (EN_STOCK, PRETE, HS, REPARATION)
 * @returns {Promise<Object>} Updated asset item with model details
 * @throws {NotFoundError} If item doesn't exist
 *
 * @example
 * // Mark item as broken
 * await updateAssetItemStatus('itemId123', 'HS');
 *
 * @example
 * // Mark repaired item as back in stock
 * await updateAssetItemStatus('itemId123', 'EN_STOCK');
 */
export async function updateAssetItemStatus(id, status) {
  // Check if asset item exists
  const existingItem = await prisma.assetItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  const assetItem = await prisma.assetItem.update({
    where: { id },
    data: { status },
    include: {
      assetModel: true
    }
  });

  return assetItem;
}

/**
 * Delete an asset item
 *
 * Note: Unlike employees and asset models, asset items can be deleted
 * even if they have loan history. The loan history is preserved via
 * the loanLines table which maintains the reference for audit purposes.
 *
 * @param {string} id - Asset item ID to delete
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If item doesn't exist
 *
 * @example
 * await deleteAssetItem('itemId123');
 */
export async function deleteAssetItem(id) {
  // Check if asset item exists and fetch loan lines for audit
  const existingItem = await prisma.assetItem.findUnique({
    where: { id },
    include: {
      loanLines: true  // Loan history preserved in database
    }
  });

  if (!existingItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  // Delete item (loan history remains in loanLines table)
  await prisma.assetItem.delete({ where: { id } });

  return { message: 'Article d\'équipement supprimé avec succès' };
}
