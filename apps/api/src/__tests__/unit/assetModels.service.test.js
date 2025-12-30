/**
 * Unit Tests for Asset Models Service
 *
 * Tests for asset model management business logic
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import * as assetModelsService from '../../services/assetModels.service.js';
import {
  cleanDatabase,
  disconnectDatabase,
  createTestAssetModel,
  createTestAssetItem,
  createTestStockItem,
  getPrismaClient,
} from '../utils/testUtils.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

const prisma = getPrismaClient();

describe('Asset Models Service - getAllAssetModels()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return all asset models with item counts', async () => {
    // Create test models
    const model1 = await createTestAssetModel({ type: 'Ordinateur portable', brand: 'Dell', modelName: 'Latitude 5420' });
    const model2 = await createTestAssetModel({ type: 'Écran', brand: 'HP', modelName: 'E24 G5' });

    // Create items for model1
    await createTestAssetItem({ assetModelId: model1.id });
    await createTestAssetItem({ assetModelId: model1.id, assetTag: 'TAG002' });

    const models = await assetModelsService.getAllAssetModels();

    expect(models).toHaveLength(2);
    expect(models[0]._count.items).toBeDefined();

    // Find model1 in results
    const foundModel1 = models.find(m => m.id === model1.id);
    expect(foundModel1._count.items).toBe(2);
  });

  test('should return empty array when no models exist', async () => {
    const models = await assetModelsService.getAllAssetModels();
    expect(models).toEqual([]);
  });
});

describe('Asset Models Service - getAssetModelById()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should return model with items and stock items', async () => {
    const model = await createTestAssetModel();
    await createTestAssetItem({ assetModelId: model.id });
    await createTestAssetItem({ assetModelId: model.id, assetTag: 'TAG002' });

    const result = await assetModelsService.getAssetModelById(model.id);

    expect(result).toBeDefined();
    expect(result.id).toBe(model.id);
    expect(result.items).toHaveLength(2);
  });

  test('should throw NotFoundError if model does not exist', async () => {
    await expect(
      assetModelsService.getAssetModelById('nonexistent-id')
    ).rejects.toThrow(NotFoundError);
  });
});

describe('Asset Models Service - createAssetModel()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should create model without quantity', async () => {
    const data = {
      type: 'Ordinateur portable',
      brand: 'Dell',
      modelName: 'XPS 15',
    };

    const result = await assetModelsService.createAssetModel(data);

    expect(result.assetModel).toBeDefined();
    expect(result.assetModel.type).toBe('Ordinateur portable');
    expect(result.assetModel.brand).toBe('Dell');
    expect(result.assetModel.modelName).toBe('XPS 15');
    expect(result.created.assetItems).toEqual([]);
    expect(result.created.stockItem).toBeNull();
  });

  test('should create model with auto-generated asset items', async () => {
    const data = {
      type: 'Ordinateur portable',
      brand: 'HP',
      modelName: 'ProBook 450',
      quantity: 3,
    };

    const result = await assetModelsService.createAssetModel(data);

    expect(result.assetModel).toBeDefined();
    expect(result.created.assetItems).toHaveLength(3);

    // Verify tags are sequential
    const tags = result.created.assetItems.map(item => item.assetTag).sort();
    expect(tags[0]).toMatch(/^LAP-\d+$/);
    expect(tags[1]).toMatch(/^LAP-\d+$/);
    expect(tags[2]).toMatch(/^LAP-\d+$/);
  });

  test('should create model with stock item for consumables', async () => {
    const data = {
      type: 'Câble',
      brand: 'Generic',
      modelName: 'HDMI Cable',
      quantity: 50,
    };

    const result = await assetModelsService.createAssetModel(data);

    expect(result.assetModel).toBeDefined();
    expect(result.created.stockItem).toBeDefined();
    expect(result.created.stockItem.quantity).toBe(50);
    expect(result.created.stockItem.loaned).toBe(0);
    expect(result.created.assetItems).toEqual([]);
  });
});

describe('Asset Models Service - updateAssetModel()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should update model without creating items', async () => {
    const model = await createTestAssetModel({ brand: 'Dell', modelName: 'Old Model' });

    const updateData = {
      brand: 'HP',
      modelName: 'New Model',
    };

    const result = await assetModelsService.updateAssetModel(model.id, updateData);

    expect(result.assetModel.brand).toBe('HP');
    expect(result.assetModel.modelName).toBe('New Model');
    expect(result.created.assetItems).toEqual([]);
  });

  test('should create additional items when quantity provided', async () => {
    const model = await createTestAssetModel({ type: 'Ordinateur portable' });

    // Create 2 existing items
    await createTestAssetItem({ assetModelId: model.id, assetTag: 'LAP-001' });
    await createTestAssetItem({ assetModelId: model.id, assetTag: 'LAP-002' });

    const updateData = {
      quantity: 3, // Add 3 more items
    };

    const result = await assetModelsService.updateAssetModel(model.id, updateData);

    expect(result.created.assetItems).toHaveLength(3);

    // Verify all items for this model (2 existing + 3 new)
    const allItems = await prisma.assetItem.findMany({
      where: { assetModelId: model.id },
    });
    expect(allItems).toHaveLength(5);
  });

  test('should increment stock quantity for consumables', async () => {
    const model = await createTestAssetModel({ type: 'Câble' });
    const stockItem = await createTestStockItem({ assetModelId: model.id, quantity: 10 });

    const updateData = {
      quantity: 5, // Add 5 more to stock
    };

    const result = await assetModelsService.updateAssetModel(model.id, updateData);

    expect(result.created.stockItem).toBeDefined();
    expect(result.created.stockItem.quantity).toBe(15); // 10 + 5
  });

  test('should throw NotFoundError if model does not exist', async () => {
    await expect(
      assetModelsService.updateAssetModel('nonexistent-id', { brand: 'Test' })
    ).rejects.toThrow(NotFoundError);
  });
});

describe('Asset Models Service - deleteAssetModel()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should delete model without items', async () => {
    const model = await createTestAssetModel();

    const result = await assetModelsService.deleteAssetModel(model.id);

    expect(result.message).toContain('supprimé');
    expect(result.assetItemsDeleted).toBe(0);
    expect(result.stockItemsDeleted).toBe(0);

    const deletedModel = await prisma.assetModel.findUnique({
      where: { id: model.id },
    });
    expect(deletedModel).toBeNull();
  });

  test('should delete model with non-loaned items (cascade delete)', async () => {
    const model = await createTestAssetModel();
    await createTestAssetItem({ assetModelId: model.id, status: 'EN_STOCK' });
    await createTestAssetItem({ assetModelId: model.id, status: 'EN_STOCK' });

    const result = await assetModelsService.deleteAssetModel(model.id);

    expect(result.assetItemsDeleted).toBe(2);

    // Verify model and items are deleted
    const deletedModel = await prisma.assetModel.findUnique({ where: { id: model.id } });
    expect(deletedModel).toBeNull();
  });

  test('should throw ValidationError if any item is loaned', async () => {
    const model = await createTestAssetModel();
    await createTestAssetItem({ assetModelId: model.id, status: 'EN_STOCK' });
    await createTestAssetItem({ assetModelId: model.id, status: 'PRETE' }); // Loaned

    await expect(
      assetModelsService.deleteAssetModel(model.id)
    ).rejects.toThrow(ValidationError);
  });

  test('should delete model with non-loaned stock items', async () => {
    const model = await createTestAssetModel({ type: 'Câble' });
    await createTestStockItem({ assetModelId: model.id, quantity: 10, loaned: 0 });

    const result = await assetModelsService.deleteAssetModel(model.id);

    expect(result.stockItemsDeleted).toBe(1);

    const deletedModel = await prisma.assetModel.findUnique({ where: { id: model.id } });
    expect(deletedModel).toBeNull();
  });

  test('should throw ValidationError if stock has loaned items', async () => {
    const model = await createTestAssetModel({ type: 'Câble' });
    await createTestStockItem({ assetModelId: model.id, quantity: 10, loaned: 5 });

    await expect(
      assetModelsService.deleteAssetModel(model.id)
    ).rejects.toThrow(ValidationError);
  });

  test('should throw NotFoundError if model does not exist', async () => {
    await expect(
      assetModelsService.deleteAssetModel('nonexistent-id')
    ).rejects.toThrow(NotFoundError);
  });
});

describe('Asset Models Service - batchDeleteAssetModels()', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should delete multiple models with items and stock', async () => {
    const model1 = await createTestAssetModel({ type: 'Ordinateur portable' });
    const model2 = await createTestAssetModel({ type: 'Écran' });
    const model3 = await createTestAssetModel({ type: 'Câble' });

    // Create items (all non-loaned)
    await createTestAssetItem({ assetModelId: model1.id, status: 'EN_STOCK' });
    await createTestAssetItem({ assetModelId: model2.id, status: 'EN_STOCK' });
    await createTestStockItem({ assetModelId: model3.id, quantity: 10, loaned: 0 });

    const result = await assetModelsService.batchDeleteAssetModels([model1.id, model2.id, model3.id]);

    expect(result.modelsDeleted).toBe(3);
    expect(result.assetItemsDeleted).toBe(2);
    expect(result.stockItemsDeleted).toBe(1);

    // Verify models are deleted
    const remainingModels = await prisma.assetModel.findMany();
    expect(remainingModels).toHaveLength(0);
  });

  test('should throw ValidationError if any item is loaned', async () => {
    const model = await createTestAssetModel();
    await createTestAssetItem({ assetModelId: model.id, status: 'PRETE' }); // Loaned

    await expect(
      assetModelsService.batchDeleteAssetModels([model.id])
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError if stock item has loaned quantity', async () => {
    const model = await createTestAssetModel({ type: 'Câble' });
    await createTestStockItem({ assetModelId: model.id, quantity: 10, loaned: 5 });

    await expect(
      assetModelsService.batchDeleteAssetModels([model.id])
    ).rejects.toThrow(ValidationError);
  });

  test('should return zero counts when no items exist', async () => {
    const model = await createTestAssetModel();

    const result = await assetModelsService.batchDeleteAssetModels([model.id]);

    expect(result.modelsDeleted).toBe(1);
    expect(result.assetItemsDeleted).toBe(0);
    expect(result.stockItemsDeleted).toBe(0);
  });
});
