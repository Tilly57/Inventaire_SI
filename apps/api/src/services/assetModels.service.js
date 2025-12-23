/**
 * @fileoverview Asset Models service - Business logic for equipment model management
 *
 * This service handles:
 * - Equipment model templates (type, brand, model name)
 * - Model CRUD operations
 * - Item count tracking for each model
 * - Deletion constraints (prevents deletion if model has items)
 *
 * Asset Models represent templates/categories of equipment (e.g., "Dell Latitude 5420 Laptop").
 * Individual physical items reference these models via assetModelId.
 */

import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all asset models with item counts
 *
 * Returns all equipment models ordered by creation date (newest first).
 * Includes count of physical items for each model.
 *
 * @returns {Promise<Array>} Array of asset model objects with item counts
 *
 * @example
 * const models = await getAllAssetModels();
 * // models[0] = {
 * //   id, type, brand, modelName,
 * //   _count: { items: 15 }  // 15 physical items of this model
 * // }
 */
export async function getAllAssetModels() {
  const assetModels = await prisma.assetModel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true }  // Count of physical items for this model
      }
    }
  });

  return assetModels;
}

/**
 * Get a single asset model by ID with all its items
 *
 * Returns model details along with all physical items that use this model.
 *
 * @param {string} id - Asset model ID (CUID format)
 * @returns {Promise<Object>} Asset model with items array
 * @throws {NotFoundError} If model doesn't exist
 *
 * @example
 * const model = await getAssetModelById('modelId123');
 * // model.items = [{ id, serial, assetTag, status, ... }, ...]
 */
export async function getAssetModelById(id) {
  const assetModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: 'desc' }  // Newest items first
      },
      _count: {
        select: { items: true }
      }
    }
  });

  if (!assetModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  return assetModel;
}

/**
 * Create a new asset model
 *
 * Creates a new equipment model template that can be referenced
 * by multiple physical asset items.
 *
 * @param {Object} data - Model creation data
 * @param {string} data.type - Equipment type (LAPTOP, DESKTOP, MONITOR, etc.)
 * @param {string} data.brand - Manufacturer brand name
 * @param {string} data.modelName - Specific model name
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created asset model
 *
 * @example
 * const model = await createAssetModel({
 *   type: 'LAPTOP',
 *   brand: 'Dell',
 *   modelName: 'Latitude 5420'
 * });
 */
export async function createAssetModel(data) {
  const assetModel = await prisma.assetModel.create({
    data
  });

  return assetModel;
}

/**
 * Update an existing asset model
 *
 * Updates model details. Changes cascade to all items using this model
 * (items reference the model, so they see updated info automatically).
 *
 * @param {string} id - Asset model ID to update
 * @param {Object} data - Updated model data
 * @param {string} [data.type] - Updated equipment type
 * @param {string} [data.brand] - Updated brand
 * @param {string} [data.modelName] - Updated model name
 * @param {string} [data.description] - Updated description
 * @returns {Promise<Object>} Updated asset model
 * @throws {NotFoundError} If model doesn't exist
 *
 * @example
 * const updated = await updateAssetModel('modelId123', {
 *   modelName: 'Latitude 5430'
 * });
 */
export async function updateAssetModel(id, data) {
  // Check if asset model exists
  const existingModel = await prisma.assetModel.findUnique({ where: { id } });
  if (!existingModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  const assetModel = await prisma.assetModel.update({
    where: { id },
    data
  });

  return assetModel;
}

/**
 * Delete an asset model
 *
 * IMPORTANT: Cannot delete models that have associated physical items.
 * This prevents orphaned items and maintains data integrity.
 *
 * @param {string} id - Asset model ID to delete
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If model doesn't exist
 * @throws {ValidationError} If model has associated items
 *
 * @example
 * await deleteAssetModel('modelId123');
 * // Error if any items reference this model
 */
export async function deleteAssetModel(id) {
  // Check if asset model exists and fetch items
  const existingModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: true  // Fetch all items to check count
    }
  });

  if (!existingModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Business rule: Cannot delete models with associated items
  // This prevents orphaned items and maintains referential integrity
  if (existingModel.items.length > 0) {
    throw new ValidationError(
      'Impossible de supprimer un modèle qui a des articles associés'
    );
  }

  await prisma.assetModel.delete({ where: { id } });

  return { message: 'Modèle d\'équipement supprimé avec succès' };
}
