/**
 * Stock Items service - Business logic for stock item management
 */
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all stock items
 */
export async function getAllStockItems() {
  const stockItems = await prisma.stockItem.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return stockItems;
}

/**
 * Get stock item by ID
 */
export async function getStockItemById(id) {
  const stockItem = await prisma.stockItem.findUnique({
    where: { id },
    include: {
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

  if (!stockItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  return stockItem;
}

/**
 * Create new stock item
 */
export async function createStockItem(data) {
  const stockItem = await prisma.stockItem.create({
    data
  });

  return stockItem;
}

/**
 * Update stock item
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
 */
export async function adjustStockQuantity(id, adjustment) {
  // Check if stock item exists
  const existingItem = await prisma.stockItem.findUnique({ where: { id } });
  if (!existingItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  const newQuantity = existingItem.quantity + adjustment;

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
 * Delete stock item
 */
export async function deleteStockItem(id) {
  // Check if stock item exists
  const existingItem = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      loanLines: true
    }
  });

  if (!existingItem) {
    throw new NotFoundError('Article de stock non trouvé');
  }

  await prisma.stockItem.delete({ where: { id } });

  return { message: 'Article de stock supprimé avec succès' };
}
