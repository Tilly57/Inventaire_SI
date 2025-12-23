/**
 * Asset Items service - Business logic for asset item management
 */
import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Get all asset items with filters
 */
export async function getAllAssetItems(filters = {}) {
  const { status, assetModelId, search } = filters;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (assetModelId) {
    where.assetModelId = assetModelId;
  }

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
      assetModel: true
    }
  });

  return assetItems;
}

/**
 * Get asset item by ID
 */
export async function getAssetItemById(id) {
  const assetItem = await prisma.assetItem.findUnique({
    where: { id },
    include: {
      assetModel: true,
      loanLines: {
        include: {
          loan: {
            include: {
              employee: true
            }
          }
        },
        orderBy: {
          loan: {
            openedAt: 'desc'
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
 * Create new asset item
 */
export async function createAssetItem(data) {
  // Check if asset model exists
  const assetModel = await prisma.assetModel.findUnique({ where: { id: data.assetModelId } });
  if (!assetModel) {
    throw new NotFoundError('Modèle d\'équipement non trouvé');
  }

  // Check for unique asset tag
  if (data.assetTag) {
    const existingTag = await prisma.assetItem.findUnique({ where: { assetTag: data.assetTag } });
    if (existingTag) {
      throw new ConflictError('Ce numéro d\'inventaire existe déjà');
    }
  }

  // Check for unique serial
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
 * Update asset item
 */
export async function updateAssetItem(id, data) {
  // Check if asset item exists
  const existingItem = await prisma.assetItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  // If asset model is being changed, check if it exists
  if (data.assetModelId) {
    const assetModel = await prisma.assetModel.findUnique({ where: { id: data.assetModelId } });
    if (!assetModel) {
      throw new NotFoundError('Modèle d\'équipement non trouvé');
    }
  }

  // Check for unique asset tag
  if (data.assetTag && data.assetTag !== existingItem.assetTag) {
    const existingTag = await prisma.assetItem.findUnique({ where: { assetTag: data.assetTag } });
    if (existingTag) {
      throw new ConflictError('Ce numéro d\'inventaire existe déjà');
    }
  }

  // Check for unique serial
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
 * Update asset item status
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
 * Delete asset item
 */
export async function deleteAssetItem(id) {
  // Check if asset item exists
  const existingItem = await prisma.assetItem.findUnique({
    where: { id },
    include: {
      loanLines: true
    }
  });

  if (!existingItem) {
    throw new NotFoundError('Article d\'équipement non trouvé');
  }

  await prisma.assetItem.delete({ where: { id } });

  return { message: 'Article d\'équipement supprimé avec succès' };
}
