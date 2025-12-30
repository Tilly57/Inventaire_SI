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
import { createContextLogger } from '../config/logger.js';

const logger = createContextLogger('AssetModelsService');

/**
 * Types d'équipements uniques (trackés individuellement)
 */
const UNIQUE_ASSET_TYPES = [
  'Ordinateur portable',
  'Ordinateur fixe',
  'Écran',
  'Clavier',
  'Souris',
  'Casque audio',
  'Webcam',
  'Station d\'accueil'
];

/**
 * Types de consommables (stock global)
 */
const CONSUMABLE_TYPES = ['Câble', 'Adaptateur', 'Autre'];

/**
 * Génère un préfixe de tag selon le type d'équipement
 */
function generateTagPrefix(type) {
  const prefixes = {
    'Ordinateur portable': 'LAP-',
    'Ordinateur fixe': 'DSK-',
    'Écran': 'MON-',
    'Clavier': 'KB-',
    'Souris': 'MS-',
    'Casque audio': 'HS-',
    'Webcam': 'WC-',
    'Station d\'accueil': 'DOCK-',
    'Téléphone portable': 'TEL-',
    'Câble': 'CAB-',
    'Adaptateur': 'ADP-',
    'Autre': 'OTH-'
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
    logger.debug('🔍 Type detected:', { type });
    logger.debug('🔍 Is CONSUMABLE_TYPE?', { isConsumable: CONSUMABLE_TYPES.includes(type) });

    // By default, all types are treated as unique assets (individually tracked)
    // unless explicitly defined as consumables
    if (!CONSUMABLE_TYPES.includes(type)) {
      // Create individual AssetItems with auto-generated tags
      const tagPrefix = generateTagPrefix(type);
      logger.debug('🔍 Tag prefix generated:', { tagPrefix });
      logger.debug('🔍 Calling createAssetItemsBulk with:', {
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
        logger.info('✅ createAssetItemsBulk returned:', { count: assetItems.length });
        result.created.assetItems = assetItems;
      } catch (error) {
        logger.error('❌ Error in createAssetItemsBulk:', { error });
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
 * If quantity is provided, creates additional AssetItems without touching existing ones.
 *
 * @param {string} id - Asset model ID to update
 * @param {Object} data - Updated model data
 * @param {string} [data.type] - Updated equipment type
 * @param {string} [data.brand] - Updated brand
 * @param {string} [data.modelName] - Updated model name
 * @param {number} [data.quantity] - Additional quantity to create
 * @param {string} [data.description] - Updated description
 * @returns {Promise<Object>} Updated asset model with creation results
 * @throws {NotFoundError} If model doesn't exist
 *
 * @example
 * // Add 5 more keyboards to existing model
 * const updated = await updateAssetModel('modelId123', {
 *   quantity: 5
 * });
 * // → Creates 5 new AssetItems (continues numbering from existing)
 */
export async function updateAssetModel(id, data) {
  const { quantity, ...updateData } = data;

  // Check if asset model exists and get existing items count
  const existingModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: true,
      stockItems: true
    }
  });

  if (!existingModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Update the model if there are changes
  const assetModel = Object.keys(updateData).length > 0
    ? await prisma.assetModel.update({
        where: { id },
        data: updateData
      })
    : existingModel;

  const result = {
    assetModel,
    created: {
      assetItems: [],
      stockItem: null
    }
  };

  // If quantity is provided, create additional items
  if (quantity && quantity > 0) {
    const { type } = existingModel;

    // Create additional AssetItems (unique assets)
    if (!CONSUMABLE_TYPES.includes(type)) {
      const tagPrefix = generateTagPrefix(type);
      const existingItemsCount = existingModel.items.length;

      logger.info('Création d\'équipements supplémentaires', {
        modelId: id,
        existingCount: existingItemsCount,
        newQuantity: quantity
      });

      const assetItems = await createAssetItemsBulk({
        assetModelId: id,
        tagPrefix,
        quantity,
        status: 'EN_STOCK',
        notes: `Ajouté le ${new Date().toLocaleDateString('fr-FR')} (quantité: +${quantity})`
      });

      result.created.assetItems = assetItems;
    }
    // For consumables, update the existing StockItem quantity
    else if (CONSUMABLE_TYPES.includes(type)) {
      if (existingModel.stockItems.length > 0) {
        // Update existing stock item
        const stockItem = await prisma.stockItem.update({
          where: { id: existingModel.stockItems[0].id },
          data: {
            quantity: { increment: quantity },
            notes: `Stock augmenté de ${quantity} le ${new Date().toLocaleDateString('fr-FR')}`
          },
          include: { assetModel: true }
        });
        result.created.stockItem = stockItem;
      } else {
        // Create new stock item if none exists
        const stockItem = await prisma.stockItem.create({
          data: {
            assetModelId: id,
            quantity,
            loaned: 0,
            notes: `Créé le ${new Date().toLocaleDateString('fr-FR')} avec quantité ${quantity}`
          },
          include: { assetModel: true }
        });
        result.created.stockItem = stockItem;
      }
    }
  }

  return result;
}

/**
 * Delete an asset model with cascade deletion
 *
 * Deletes the model and all associated items (AssetItems and StockItems).
 * IMPORTANT: Cannot delete if any AssetItem is currently loaned (status PRETE)
 * or if any StockItem has loaned items (loaned > 0).
 *
 * @param {string} id - Asset model ID to delete
 * @returns {Promise<Object>} Success message with deletion counts
 * @throws {NotFoundError} If model doesn't exist
 * @throws {ValidationError} If model has loaned items
 *
 * @example
 * await deleteAssetModel('modelId123');
 * // Deletes model + all AssetItems + all StockItems
 */
export async function deleteAssetModel(id) {
  // Check if asset model exists and fetch items
  const existingModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: true,  // AssetItems
      stockItems: true  // StockItems
    }
  });

  if (!existingModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Verify no AssetItem is currently loaned
  const loanedAssetItems = existingModel.items.filter(item => item.status === 'PRETE');
  if (loanedAssetItems.length > 0) {
    throw new ValidationError(
      `Impossible de supprimer ce modèle : ${loanedAssetItems.length} équipement(s) sont actuellement prêtés`
    );
  }

  // Verify no StockItem has loaned items
  const loanedStockItems = existingModel.stockItems.filter(stock => stock.loaned > 0);
  if (loanedStockItems.length > 0) {
    throw new ValidationError(
      `Impossible de supprimer ce modèle : ${loanedStockItems.reduce((sum, s) => sum + s.loaned, 0)} article(s) de stock sont actuellement prêtés`
    );
  }

  // Delete in transaction: items first, then model (respects foreign keys)
  const result = await prisma.$transaction(async (tx) => {
    // Delete all AssetItems
    const deletedAssetItems = await tx.assetItem.deleteMany({
      where: { assetModelId: id }
    });

    // Delete all StockItems
    const deletedStockItems = await tx.stockItem.deleteMany({
      where: { assetModelId: id }
    });

    // Delete the model
    await tx.assetModel.delete({ where: { id } });

    return {
      assetItemsDeleted: deletedAssetItems.count,
      stockItemsDeleted: deletedStockItems.count
    };
  });

  return {
    message: 'Modèle d\'équipement supprimé avec succès',
    ...result
  };
}

/**
 * Delete multiple asset models in batch with cascade deletion
 *
 * Deletes models and all associated items (AssetItems and StockItems).
 * IMPORTANT: Cannot delete if any AssetItem is currently loaned (status PRETE)
 * or if any StockItem has loaned items (loaned > 0).
 *
 * @param {string[]} modelIds - Array of asset model IDs to delete
 * @returns {Promise<Object>} Success message with deletion counts
 * @throws {NotFoundError} If no models found
 * @throws {ValidationError} If any model has loaned items
 *
 * @example
 * await batchDeleteAssetModels(['modelId1', 'modelId2', 'modelId3']);
 */
export async function batchDeleteAssetModels(modelIds) {
  if (!modelIds || modelIds.length === 0) {
    throw new ValidationError('Au moins un modèle doit être sélectionné');
  }

  // Fetch all models with their items
  const models = await prisma.assetModel.findMany({
    where: { id: { in: modelIds } },
    include: {
      items: true,
      stockItems: true
    }
  });

  if (models.length === 0) {
    throw new NotFoundError('Aucun modèle trouvé avec les IDs fournis');
  }

  // Verify no AssetItem is currently loaned
  const loanedAssetItems = models.flatMap(m => m.items).filter(item => item.status === 'PRETE');
  if (loanedAssetItems.length > 0) {
    throw new ValidationError(
      `Impossible de supprimer ces modèles : ${loanedAssetItems.length} équipement(s) sont actuellement prêtés`
    );
  }

  // Verify no StockItem has loaned items
  const loanedStockItems = models.flatMap(m => m.stockItems).filter(stock => stock.loaned > 0);
  if (loanedStockItems.length > 0) {
    const totalLoaned = loanedStockItems.reduce((sum, s) => sum + s.loaned, 0);
    throw new ValidationError(
      `Impossible de supprimer ces modèles : ${totalLoaned} article(s) de stock sont actuellement prêtés`
    );
  }

  // Delete in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete all AssetItems for these models
    const deletedAssetItems = await tx.assetItem.deleteMany({
      where: { assetModelId: { in: modelIds } }
    });

    // Delete all StockItems for these models
    const deletedStockItems = await tx.stockItem.deleteMany({
      where: { assetModelId: { in: modelIds } }
    });

    // Delete all models
    const deletedModels = await tx.assetModel.deleteMany({
      where: { id: { in: modelIds } }
    });

    return {
      modelsDeleted: deletedModels.count,
      assetItemsDeleted: deletedAssetItems.count,
      stockItemsDeleted: deletedStockItems.count
    };
  });

  return {
    message: `${result.modelsDeleted} modèle(s) supprimé(s) avec succès`,
    ...result
  };
}
