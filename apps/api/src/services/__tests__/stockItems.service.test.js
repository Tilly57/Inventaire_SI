/**
 * Unit Tests for StockItems Service
 *
 * Tests for consumable stock management business logic:
 * - CRUD operations (create, read, update, delete)
 * - Quantity tracking and adjustments
 * - Loan history tracking
 * - Asset model validation
 * - Negative quantity prevention
 * - Cache invalidation
 */

import { describe, test, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Mock audit helpers BEFORE importing service
jest.unstable_mockModule('../../utils/auditHelpers.js', () => ({
  logCreate: jest.fn(),
  logUpdate: jest.fn(),
  logDelete: jest.fn()
}));

// Mock cache service BEFORE importing service
jest.unstable_mockModule('../cache.service.js', () => ({
  getCached: jest.fn((key, fn) => fn()), // Execute function directly without caching
  invalidateEntity: jest.fn(),
  generateKey: jest.fn((entity, id) => `${entity}:${id}`),
  TTL: {
    STOCK_ITEMS: 300
  }
}));

// Import service AFTER mocks are set up
const stockItemsService = await import('../stockItems.service.js');

import {
  cleanDatabase,
  disconnectDatabase,
  createTestAssetModel,
  createTestStockItem,
  createTestEmployee,
  createTestUser,
  createTestLoan,
  getPrismaClient
} from '../../__tests__/utils/testUtils.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

describe('StockItems Service - getAllStockItems()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return empty array when no stock items exist', async () => {
    const stockItems = await stockItemsService.getAllStockItems();

    expect(stockItems).toEqual([]);
    expect(stockItems).toHaveLength(0);
  });

  test('should return all stock items with asset models', async () => {
    // Create test stock items
    const model1 = await createTestAssetModel({ type: 'CABLE', modelName: 'USB-C Cable' });
    const model2 = await createTestAssetModel({ type: 'ADAPTER', modelName: 'HDMI Adapter' });

    await createTestStockItem({ assetModelId: model1.id, quantity: 50 });
    await createTestStockItem({ assetModelId: model2.id, quantity: 20 });

    const stockItems = await stockItemsService.getAllStockItems();

    expect(stockItems).toHaveLength(2);
    expect(stockItems[0]).toHaveProperty('id');
    expect(stockItems[0]).toHaveProperty('quantity');
    expect(stockItems[0]).toHaveProperty('assetModel');
    expect(stockItems[0].assetModel).toHaveProperty('type');
    expect(stockItems[0].assetModel).toHaveProperty('modelName');
  });

  test('should return stock items ordered by createdAt descending (newest first)', async () => {
    const model = await createTestAssetModel();

    const item1 = await createTestStockItem({ assetModelId: model.id, quantity: 10 });
    await new Promise(resolve => setTimeout(resolve, 10)); // Delay for timestamp
    const item2 = await createTestStockItem({ assetModelId: model.id, quantity: 20 });
    await new Promise(resolve => setTimeout(resolve, 10));
    const item3 = await createTestStockItem({ assetModelId: model.id, quantity: 30 });

    const stockItems = await stockItemsService.getAllStockItems();

    expect(stockItems).toHaveLength(3);
    // Newest first (item3, item2, item1)
    expect(stockItems[0].id).toBe(item3.id);
    expect(stockItems[1].id).toBe(item2.id);
    expect(stockItems[2].id).toBe(item1.id);
  });
});

describe('StockItems Service - getStockItemById()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return stock item by ID with asset model', async () => {
    const model = await createTestAssetModel({ type: 'CABLE', modelName: 'Ethernet Cable' });
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 100 });

    const result = await stockItemsService.getStockItemById(stockItem.id);

    expect(result).toBeDefined();
    expect(result.id).toBe(stockItem.id);
    expect(result.quantity).toBe(100);
    expect(result.assetModel).toBeDefined();
    expect(result.assetModel.modelName).toBe('Ethernet Cable');
  });

  test('should include loan history (loanLines)', async () => {
    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    // Create loan with this stock item
    const employee = await createTestEmployee();
    const user = await createTestUser();
    const loan = await createTestLoan({ employeeId: employee.id, createdById: user.id });

    const prisma = getPrismaClient();
    await prisma.loanLine.create({
      data: {
        loanId: loan.id,
        stockItemId: stockItem.id,
        quantity: 5
      }
    });

    const result = await stockItemsService.getStockItemById(stockItem.id);

    expect(result.loanLines).toBeDefined();
    expect(result.loanLines).toHaveLength(1);
    expect(result.loanLines[0].quantity).toBe(5);
    expect(result.loanLines[0].loan).toBeDefined();
    expect(result.loanLines[0].loan.employee).toBeDefined();
  });

  test('should throw NotFoundError if stock item does not exist', async () => {
    await expect(
      stockItemsService.getStockItemById('non-existent-id')
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.getStockItemById('non-existent-id')
    ).rejects.toThrow('Article de stock non trouvé');
  });
});

describe('StockItems Service - createStockItem()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should create stock item with valid asset model', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel({ type: 'CABLE', modelName: 'USB Cable' });

    const data = {
      assetModelId: model.id,
      quantity: 100,
      notes: 'Initial stock'
    };

    const stockItem = await stockItemsService.createStockItem(data, mockReq);

    expect(stockItem).toBeDefined();
    expect(stockItem.assetModelId).toBe(model.id);
    expect(stockItem.quantity).toBe(100);
    expect(stockItem.notes).toBe('Initial stock');
    expect(stockItem.assetModel).toBeDefined();
    expect(stockItem.assetModel.modelName).toBe('USB Cable');
  });

  test('should create stock item with default quantity (0)', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();

    const data = {
      assetModelId: model.id
    };

    const stockItem = await stockItemsService.createStockItem(data, mockReq);

    expect(stockItem.quantity).toBe(0);
  });

  test('should throw NotFoundError if asset model does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const data = {
      assetModelId: 'non-existent-model-id',
      quantity: 50
    };

    await expect(
      stockItemsService.createStockItem(data, mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.createStockItem(data, mockReq)
    ).rejects.toThrow('Modèle d\'équipement non trouvé');
  });
});

describe('StockItems Service - updateStockItem()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should update stock item notes', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const updated = await stockItemsService.updateStockItem(
      stockItem.id,
      { notes: 'Updated notes for tracking' },
      mockReq
    );

    expect(updated.notes).toBe('Updated notes for tracking');
    expect(updated.quantity).toBe(50); // Unchanged
  });

  test('should update stock item quantity directly (not recommended)', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const updated = await stockItemsService.updateStockItem(
      stockItem.id,
      { quantity: 75 },
      mockReq
    );

    expect(updated.quantity).toBe(75);
  });

  test('should update asset model if new model exists', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model1 = await createTestAssetModel({ modelName: 'Old Model' });
    const model2 = await createTestAssetModel({ modelName: 'New Model' });
    const stockItem = await createTestStockItem({ assetModelId: model1.id });

    const updated = await stockItemsService.updateStockItem(
      stockItem.id,
      { assetModelId: model2.id },
      mockReq
    );

    expect(updated.assetModelId).toBe(model2.id);
    expect(updated.assetModel.modelName).toBe('New Model');
  });

  test('should throw NotFoundError if stock item does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    await expect(
      stockItemsService.updateStockItem('non-existent-id', { quantity: 100 }, mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.updateStockItem('non-existent-id', { quantity: 100 }, mockReq)
    ).rejects.toThrow('Article de stock non trouvé');
  });

  test('should throw NotFoundError if new asset model does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id });

    await expect(
      stockItemsService.updateStockItem(stockItem.id, { assetModelId: 'non-existent-model' }, mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.updateStockItem(stockItem.id, { assetModelId: 'non-existent-model' }, mockReq)
    ).rejects.toThrow('Modèle d\'équipement non trouvé');
  });
});

describe('StockItems Service - adjustStockQuantity()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should increase stock quantity with positive adjustment', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const updated = await stockItemsService.adjustStockQuantity(stockItem.id, 25, mockReq);

    expect(updated.quantity).toBe(75); // 50 + 25
  });

  test('should decrease stock quantity with negative adjustment', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const updated = await stockItemsService.adjustStockQuantity(stockItem.id, -20, mockReq);

    expect(updated.quantity).toBe(30); // 50 - 20
  });

  test('should allow adjustment to zero', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const updated = await stockItemsService.adjustStockQuantity(stockItem.id, -50, mockReq);

    expect(updated.quantity).toBe(0);
  });

  test('should throw ValidationError if adjustment results in negative quantity', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    // Try to remove more than available
    await expect(
      stockItemsService.adjustStockQuantity(stockItem.id, -60, mockReq)
    ).rejects.toThrow(ValidationError);

    await expect(
      stockItemsService.adjustStockQuantity(stockItem.id, -60, mockReq)
    ).rejects.toThrow('La quantité ne peut pas être négative');

    // Verify quantity was not changed
    const unchangedItem = await stockItemsService.getStockItemById(stockItem.id);
    expect(unchangedItem.quantity).toBe(50);
  });

  test('should throw NotFoundError if stock item does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    await expect(
      stockItemsService.adjustStockQuantity('non-existent-id', 10, mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.adjustStockQuantity('non-existent-id', 10, mockReq)
    ).rejects.toThrow('Article de stock non trouvé');
  });
});

describe('StockItems Service - deleteStockItem()', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks(); // Clear cache mocks between tests
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should delete existing stock item', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    const result = await stockItemsService.deleteStockItem(stockItem.id, mockReq);

    expect(result).toEqual({ message: 'Article de stock supprimé avec succès' });

    // Verify item no longer exists
    const prisma = getPrismaClient();
    const deletedItem = await prisma.stockItem.findUnique({ where: { id: stockItem.id } });
    expect(deletedItem).toBeNull();
  });

  test('should allow deleting stock item with loan history', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 50 });

    // Create loan with this stock item
    const employee = await createTestEmployee();
    const user = await createTestUser();
    const loan = await createTestLoan({ employeeId: employee.id, createdById: user.id });

    const prisma = getPrismaClient();
    await prisma.loanLine.create({
      data: {
        loanId: loan.id,
        stockItemId: stockItem.id,
        quantity: 10
      }
    });

    // Deletion should succeed even with loan history
    const result = await stockItemsService.deleteStockItem(stockItem.id, mockReq);

    expect(result).toEqual({ message: 'Article de stock supprimé avec succès' });

    // Verify loan line still exists but stockItemId is null (ON DELETE SET NULL)
    const loanLines = await prisma.loanLine.findMany({ where: { loanId: loan.id } });
    expect(loanLines).toHaveLength(1);
    expect(loanLines[0].stockItemId).toBeNull(); // FK set to null when stock item deleted
  });

  test('should throw NotFoundError if stock item does not exist', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    await expect(
      stockItemsService.deleteStockItem('non-existent-id', mockReq)
    ).rejects.toThrow(NotFoundError);

    await expect(
      stockItemsService.deleteStockItem('non-existent-id', mockReq)
    ).rejects.toThrow('Article de stock non trouvé');
  });

  test('should permanently remove stock item from database', async () => {
    const mockReq = {
      user: { id: 'admin-id' },
      headers: { 'x-forwarded-for': '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' }
    };

    const model = await createTestAssetModel();
    const item1 = await createTestStockItem({ assetModelId: model.id, quantity: 50 });
    const item2 = await createTestStockItem({ assetModelId: model.id, quantity: 30 });

    // Delete item1
    await stockItemsService.deleteStockItem(item1.id, mockReq);

    // Verify only item2 remains
    const stockItems = await stockItemsService.getAllStockItems();
    expect(stockItems).toHaveLength(1);
    expect(stockItems[0].id).toBe(item2.id);
  });
});
