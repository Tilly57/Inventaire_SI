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
import { createAssetItemsBulk } from './assetItems.service.js';

/**
 * Types d'équipements uniques (trackés individuellement)
 */
const UNIQUE_ASSET_TYPES = ['LAPTOP', 'DESKTOP', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET', 'WEBCAM', 'DOCK'];

/**
 * Types de consommables (stock global)
 */
const CONSUMABLE_TYPES = ['CABLE', 'ADAPTER', 'OTHER'];

/**
 * Génère un préfixe de tag selon le type d'équipement
 */
function generateTagPrefix(type) {
  const prefixes = {
    'LAPTOP': 'LAP-',
    'DESKTOP': 'DSK-',
    'MONITOR': 'MON-',
    'KEYBOARD': 'KB-',
    'MOUSE': 'MS-',
    'HEADSET': 'HS-',
    'WEBCAM': 'WC-',
    'DOCK': 'DOCK-',
    'CABLE': 'CAB-',
    'ADAPTER': 'ADP-',
    'OTHER': 'OTH-'
  };
  return prefixes[type] || 'ASSET-';
}

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
        select: {
          items: {
            where: {
              status: 'EN_STOCK'  // Count only available items
            }
          }
        }
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
        select: {
          items: {
            where: {
              status: 'EN_STOCK'  // Count only available items
            }
          }
        }
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
 * If quantity is provided:
 * - For unique assets (LAPTOP, KEYBOARD, etc.): Creates individual AssetItems with auto-generated tags
 * - For consumables (CABLE, ADAPTER, etc.): Creates a StockItem with the specified quantity
 *
 * @param {Object} data - Model creation data
 * @param {string} data.type - Equipment type (LAPTOP, DESKTOP, MONITOR, etc.)
 * @param {string} data.brand - Manufacturer brand name
 * @param {string} data.modelName - Specific model name
 * @param {number} [data.quantity] - Optional quantity for auto-creation
 * @param {string} [data.description] - Optional description
 * @returns {Promise<Object>} Created asset model with creation results
 *
 * @example
 * // Create model with 20 keyboards
 * const model = await createAssetModel({
 *   type: 'KEYBOARD',
 *   brand: 'Logitech',
 *   modelName: 'K780',
 *   quantity: 20
 * });
 * // → Creates model + 20 AssetItems (KB-001 to KB-020)
 */
export async function createAssetModel(data) {
  const { quantity, ...modelData } = data;

  // Create the asset model
  const assetModel = await prisma.assetModel.create({
    data: modelData
  });

  const result = {
    assetModel,
    created: {
      assetItems: [],
      stockItem: null
    }
  };

  // If quantity is provided, create items automatically
  if (quantity && quantity > 0) {
    const { type } = assetModel;
    console.log('🔍 Type detected:', type);
    console.log('🔍 Is UNIQUE_ASSET_TYPE?', UNIQUE_ASSET_TYPES.includes(type));
    console.log('🔍 Is CONSUMABLE_TYPE?', CONSUMABLE_TYPES.includes(type));

    if (UNIQUE_ASSET_TYPES.includes(type)) {
      // Create individual AssetItems with auto-generated tags
      const tagPrefix = generateTagPrefix(type);
      console.log('🔍 Tag prefix generated:', tagPrefix);
      console.log('🔍 Calling createAssetItemsBulk with:', {
        assetModelId: assetModel.id,
        tagPrefix,
        quantity
      });

      try {
        const assetItems = await createAssetItemsBulk({
          assetModelId: assetModel.id,
          tagPrefix,
          quantity,
          status: 'EN_STOCK',
          notes: `Créé automatiquement depuis le modèle ${assetModel.brand} ${assetModel.modelName}`
        });
        console.log('✅ createAssetItemsBulk returned:', assetItems.length, 'items');
        result.created.assetItems = assetItems;
      } catch (error) {
        console.error('❌ Error in createAssetItemsBulk:', error);
        throw error;
      }
    } else if (CONSUMABLE_TYPES.includes(type)) {
      // Create a single StockItem with the quantity
      const stockItem = await prisma.stockItem.create({
        data: {
          assetModelId: assetModel.id,
          quantity,
          loaned: 0,
          notes: `Créé automatiquement depuis le modèle ${assetModel.brand} ${assetModel.modelName}`
        },
        include: {
          assetModel: true
        }
      });
      result.created.stockItem = stockItem;
    }
  }

  return result;
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
