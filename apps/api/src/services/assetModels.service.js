/**
 * Asset Models service - Business logic for asset model management
 */
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all asset models
 */
export async function getAllAssetModels() {
  const assetModels = await prisma.assetModel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });

  return assetModels;
}

/**
 * Get asset model by ID
 */
export async function getAssetModelById(id) {
  const assetModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: 'desc' }
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
 * Create new asset model
 */
export async function createAssetModel(data) {
  const assetModel = await prisma.assetModel.create({
    data
  });

  return assetModel;
}

/**
 * Update asset model
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
 * Delete asset model
 */
export async function deleteAssetModel(id) {
  // Check if asset model exists
  const existingModel = await prisma.assetModel.findUnique({
    where: { id },
    include: {
      items: true
    }
  });

  if (!existingModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Check if model has any items
  if (existingModel.items.length > 0) {
    throw new ValidationError('Impossible de supprimer un modèle qui a des articles associés');
  }

  await prisma.assetModel.delete({ where: { id } });

  return { message: 'Modèle d\'équipement supprimé avec succès' };
}
