/**
 * Unit tests for assetModels.service.js
 * Tests the asset models service including:
 * - Model CRUD operations
 * - Item count tracking for each model
 * - Deletion constraints (prevents deletion if model has loaned items)
 * - Auto-creation of AssetItems and StockItems based on quantity
 * - Cascade deletion with transactions
 */

import { jest } from '@jest/globals';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

// Mock Prisma client before importing service
const mockPrisma = {
  assetModel: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  assetItem: {
    deleteMany: jest.fn(),
  },
  stockItem: {
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

// Mock createAssetItemsBulk
const mockCreateAssetItemsBulk = jest.fn();

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up mocks before importing service
jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

jest.unstable_mockModule('../assetItems.service.js', () => ({
  createAssetItemsBulk: mockCreateAssetItemsBulk
}));

jest.unstable_mockModule('../../config/logger.js', () => ({
  createContextLogger: jest.fn(() => mockLogger)
}));

// Import service after mocks are set up
const {
  getAllAssetModels,
  getAssetModelById,
  createAssetModel,
  updateAssetModel,
  deleteAssetModel,
  batchDeleteAssetModels,
} = await import('../assetModels.service.js');

describe('AssetModels Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssetModels', () => {
    it('should return all asset models with item counts', async () => {
      const mockModels = [
        {
          id: 'model1',
          type: 'Ordinateur portable',
          brand: 'Dell',
          modelName: 'Latitude 5420',
          _count: {
            items: 10  // 10 items EN_STOCK
          }
        },
        {
          id: 'model2',
          type: 'Écran',
          brand: 'Samsung',
          modelName: 'U28E590D',
          _count: {
            items: 5
          }
        }
      ];

      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);

      const result = await getAllAssetModels();

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              items: {
                where: {
                  status: 'EN_STOCK'
                }
              }
            }
          }
        }
      });
      expect(result).toEqual(mockModels);
    });

    it('should return empty array when no models exist', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      const result = await getAllAssetModels();

      expect(result).toEqual([]);
    });

    it('should only count EN_STOCK items', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await getAllAssetModels();

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            _count: expect.objectContaining({
              select: expect.objectContaining({
                items: expect.objectContaining({
                  where: { status: 'EN_STOCK' }
                })
              })
            })
          })
        })
      );
    });
  });

  describe('getAssetModelById', () => {
    it('should return asset model with items', async () => {
      const mockModel = {
        id: 'model1',
        type: 'Ordinateur portable',
        brand: 'Dell',
        modelName: 'Latitude 5420',
        items: [
          { id: 'item1', assetTag: 'LAP-001', status: 'EN_STOCK' },
          { id: 'item2', assetTag: 'LAP-002', status: 'PRETE' }
        ],
        _count: { items: 1 }  // Only EN_STOCK count
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockModel);

      const result = await getAssetModelById('model1');

      expect(mockPrisma.assetModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'model1' },
        include: {
          items: {
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              items: {
                where: {
                  status: 'EN_STOCK'
                }
              }
            }
          }
        }
      });
      expect(result).toEqual(mockModel);
    });

    it('should throw NotFoundError if model does not exist', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(getAssetModelById('nonexistent'))
        .rejects.toThrow('Modèle d\'équipement non trouvé');
    });
  });

  describe('createAssetModel', () => {
    const mockModelData = {
      type: 'Ordinateur portable',
      brand: 'Dell',
      modelName: 'Latitude 5420',
      description: 'Laptop professionnel'
    };

    it('should create asset model without quantity', async () => {
      const mockCreatedModel = {
        id: 'model1',
        ...mockModelData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.assetModel.create.mockResolvedValue(mockCreatedModel);

      const result = await createAssetModel(mockModelData);

      expect(mockPrisma.assetModel.create).toHaveBeenCalledWith({
        data: mockModelData
      });
      expect(result).toEqual({
        assetModel: mockCreatedModel,
        created: {
          assetItems: [],
          stockItem: null
        }
      });
      expect(mockCreateAssetItemsBulk).not.toHaveBeenCalled();
    });

    it('should create asset model with AssetItems for unique asset types', async () => {
      const mockModelWithQuantity = {
        ...mockModelData,
        quantity: 10
      };

      const mockCreatedModel = {
        id: 'model1',
        type: mockModelData.type,
        brand: mockModelData.brand,
        modelName: mockModelData.modelName,
        description: mockModelData.description
      };

      const mockAssetItems = [
        { id: 'item1', assetTag: 'LAP-001' },
        { id: 'item2', assetTag: 'LAP-002' }
      ];

      mockPrisma.assetModel.create.mockResolvedValue(mockCreatedModel);
      mockCreateAssetItemsBulk.mockResolvedValue(mockAssetItems);

      const result = await createAssetModel(mockModelWithQuantity);

      expect(mockCreateAssetItemsBulk).toHaveBeenCalledWith({
        assetModelId: mockCreatedModel.id,
        tagPrefix: 'LAP-',
        quantity: 10,
        status: 'EN_STOCK',
        notes: expect.stringContaining('Créé automatiquement')
      });
      expect(result.created.assetItems).toEqual(mockAssetItems);
    });

    it('should create asset model with StockItem for consumable types', async () => {
      const mockConsumableData = {
        type: 'Câble',
        brand: 'Generic',
        modelName: 'USB-C Cable',
        quantity: 50
      };

      const mockCreatedModel = {
        id: 'model1',
        type: mockConsumableData.type,
        brand: mockConsumableData.brand,
        modelName: mockConsumableData.modelName
      };

      const mockStockItem = {
        id: 'stock1',
        assetModelId: mockCreatedModel.id,
        quantity: 50,
        loaned: 0,
        assetModel: mockCreatedModel
      };

      mockPrisma.assetModel.create.mockResolvedValue(mockCreatedModel);
      mockPrisma.stockItem.create.mockResolvedValue(mockStockItem);

      const result = await createAssetModel(mockConsumableData);

      expect(mockPrisma.stockItem.create).toHaveBeenCalledWith({
        data: {
          assetModelId: mockCreatedModel.id,
          quantity: 50,
          loaned: 0,
          notes: expect.stringContaining('Créé automatiquement')
        },
        include: {
          assetModel: true
        }
      });
      expect(result.created.stockItem).toEqual(mockStockItem);
      expect(mockCreateAssetItemsBulk).not.toHaveBeenCalled();
    });

    it('should handle zero quantity', async () => {
      const mockModelWithZeroQuantity = {
        ...mockModelData,
        quantity: 0
      };

      const mockCreatedModel = { id: 'model1', ...mockModelData };

      mockPrisma.assetModel.create.mockResolvedValue(mockCreatedModel);

      const result = await createAssetModel(mockModelWithZeroQuantity);

      expect(mockCreateAssetItemsBulk).not.toHaveBeenCalled();
      expect(mockPrisma.stockItem.create).not.toHaveBeenCalled();
      expect(result.created.assetItems).toEqual([]);
      expect(result.created.stockItem).toBeNull();
    });
  });

  describe('updateAssetModel', () => {
    const mockModelId = 'model1';
    const mockExistingModel = {
      id: mockModelId,
      type: 'Ordinateur portable',
      brand: 'Dell',
      modelName: 'Latitude 5420',
      items: [],
      stockItems: []
    };

    it('should update asset model without quantity', async () => {
      const updateData = {
        description: 'Updated description'
      };

      const mockUpdatedModel = {
        ...mockExistingModel,
        ...updateData
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockExistingModel);
      mockPrisma.assetModel.update.mockResolvedValue(mockUpdatedModel);

      const result = await updateAssetModel(mockModelId, updateData);

      expect(mockPrisma.assetModel.update).toHaveBeenCalledWith({
        where: { id: mockModelId },
        data: updateData
      });
      expect(result.assetModel).toEqual(mockUpdatedModel);
      expect(result.created.assetItems).toEqual([]);
    });

    it('should throw NotFoundError if model does not exist', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(updateAssetModel('nonexistent', { description: 'test' }))
        .rejects.toThrow('Modèle d\'équipement non trouvé');
    });

    it('should create additional AssetItems when quantity provided for unique assets', async () => {
      const updateData = { quantity: 5 };

      const mockExistingWithItems = {
        ...mockExistingModel,
        items: [
          { id: 'item1', assetTag: 'LAP-001' },
          { id: 'item2', assetTag: 'LAP-002' }
        ]
      };

      const mockNewItems = [
        { id: 'item3', assetTag: 'LAP-003' },
        { id: 'item4', assetTag: 'LAP-004' }
      ];

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockExistingWithItems);
      mockCreateAssetItemsBulk.mockResolvedValue(mockNewItems);

      const result = await updateAssetModel(mockModelId, updateData);

      expect(mockCreateAssetItemsBulk).toHaveBeenCalledWith({
        assetModelId: mockModelId,
        tagPrefix: 'LAP-',
        quantity: 5,
        status: 'EN_STOCK',
        notes: expect.stringContaining('Ajouté le')
      });
      expect(result.created.assetItems).toEqual(mockNewItems);
    });

    it('should increment StockItem quantity for consumables', async () => {
      const mockConsumableModel = {
        id: mockModelId,
        type: 'Câble',
        brand: 'Generic',
        modelName: 'USB-C Cable',
        items: [],
        stockItems: [
          { id: 'stock1', quantity: 50, loaned: 0 }
        ]
      };

      const mockUpdatedStock = {
        id: 'stock1',
        quantity: 70,  // 50 + 20
        loaned: 0,
        assetModel: mockConsumableModel
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockConsumableModel);
      mockPrisma.stockItem.update.mockResolvedValue(mockUpdatedStock);

      const result = await updateAssetModel(mockModelId, { quantity: 20 });

      expect(mockPrisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: 'stock1' },
        data: {
          quantity: { increment: 20 },
          notes: expect.stringContaining('Stock augmenté de 20')
        },
        include: { assetModel: true }
      });
      expect(result.created.stockItem).toEqual(mockUpdatedStock);
    });

    it('should create new StockItem for consumables if none exists', async () => {
      const mockConsumableModel = {
        id: mockModelId,
        type: 'Adaptateur',
        brand: 'Generic',
        modelName: 'HDMI to VGA',
        items: [],
        stockItems: []  // No existing stock
      };

      const mockNewStock = {
        id: 'stock1',
        assetModelId: mockModelId,
        quantity: 15,
        loaned: 0,
        assetModel: mockConsumableModel
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockConsumableModel);
      mockPrisma.stockItem.create.mockResolvedValue(mockNewStock);

      const result = await updateAssetModel(mockModelId, { quantity: 15 });

      expect(mockPrisma.stockItem.create).toHaveBeenCalledWith({
        data: {
          assetModelId: mockModelId,
          quantity: 15,
          loaned: 0,
          notes: expect.stringContaining('Créé le')
        },
        include: { assetModel: true }
      });
      expect(result.created.stockItem).toEqual(mockNewStock);
    });

    it('should not update model if only quantity is provided', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(mockExistingModel);
      mockCreateAssetItemsBulk.mockResolvedValue([]);

      await updateAssetModel(mockModelId, { quantity: 5 });

      expect(mockPrisma.assetModel.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteAssetModel', () => {
    const mockModelId = 'model1';

    it('should delete asset model with cascade when no items loaned', async () => {
      const mockModel = {
        id: mockModelId,
        type: 'Ordinateur portable',
        items: [
          { id: 'item1', status: 'EN_STOCK' },
          { id: 'item2', status: 'HS' }
        ],
        stockItems: []
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockModel);
      mockPrisma.assetItem.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.stockItem.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.assetModel.delete.mockResolvedValue(mockModel);

      const result = await deleteAssetModel(mockModelId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.assetItem.deleteMany).toHaveBeenCalledWith({
        where: { assetModelId: mockModelId }
      });
      expect(mockPrisma.stockItem.deleteMany).toHaveBeenCalledWith({
        where: { assetModelId: mockModelId }
      });
      expect(mockPrisma.assetModel.delete).toHaveBeenCalledWith({
        where: { id: mockModelId }
      });
      expect(result).toEqual({
        message: 'Modèle d\'équipement supprimé avec succès',
        assetItemsDeleted: 2,
        stockItemsDeleted: 0
      });
    });

    it('should throw NotFoundError if model does not exist', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(deleteAssetModel('nonexistent'))
        .rejects.toThrow('Modèle d\'équipement non trouvé');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if AssetItems are loaned', async () => {
      const mockModel = {
        id: mockModelId,
        items: [
          { id: 'item1', status: 'PRETE' },
          { id: 'item2', status: 'PRETE' },
          { id: 'item3', status: 'EN_STOCK' }
        ],
        stockItems: []
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockModel);

      await expect(deleteAssetModel(mockModelId))
        .rejects.toThrow('2 équipement(s) sont actuellement prêtés');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if StockItems are loaned', async () => {
      const mockModel = {
        id: mockModelId,
        items: [],
        stockItems: [
          { id: 'stock1', quantity: 50, loaned: 10 },
          { id: 'stock2', quantity: 30, loaned: 5 }
        ]
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockModel);

      await expect(deleteAssetModel(mockModelId))
        .rejects.toThrow('15 article(s) de stock sont actuellement prêtés');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should delete model with both AssetItems and StockItems', async () => {
      const mockModel = {
        id: mockModelId,
        items: [
          { id: 'item1', status: 'EN_STOCK' }
        ],
        stockItems: [
          { id: 'stock1', quantity: 20, loaned: 0 }
        ]
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockModel);
      mockPrisma.assetItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.stockItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.assetModel.delete.mockResolvedValue(mockModel);

      const result = await deleteAssetModel(mockModelId);

      expect(result).toEqual({
        message: 'Modèle d\'équipement supprimé avec succès',
        assetItemsDeleted: 1,
        stockItemsDeleted: 1
      });
    });
  });

  describe('batchDeleteAssetModels', () => {
    it('should batch delete multiple models successfully', async () => {
      const modelIds = ['model1', 'model2'];
      const mockModels = [
        {
          id: 'model1',
          items: [{ id: 'item1', status: 'EN_STOCK' }],
          stockItems: []
        },
        {
          id: 'model2',
          items: [{ id: 'item2', status: 'HS' }],
          stockItems: []
        }
      ];

      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);
      mockPrisma.assetItem.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.stockItem.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.assetModel.deleteMany.mockResolvedValue({ count: 2 });

      const result = await batchDeleteAssetModels(modelIds);

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith({
        where: { id: { in: modelIds } },
        include: {
          items: true,
          stockItems: true
        }
      });
      expect(result).toEqual({
        message: '2 modèle(s) supprimé(s) avec succès',
        modelsDeleted: 2,
        assetItemsDeleted: 2,
        stockItemsDeleted: 0
      });
    });

    it('should throw ValidationError if modelIds array is empty', async () => {
      await expect(batchDeleteAssetModels([]))
        .rejects.toThrow('Au moins un modèle doit être sélectionné');
    });

    it('should throw NotFoundError if no models found', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await expect(batchDeleteAssetModels(['nonexistent']))
        .rejects.toThrow('Aucun modèle trouvé avec les IDs fournis');
    });

    it('should throw ValidationError if any AssetItem is loaned', async () => {
      const mockModels = [
        {
          id: 'model1',
          items: [{ id: 'item1', status: 'EN_STOCK' }],
          stockItems: []
        },
        {
          id: 'model2',
          items: [
            { id: 'item2', status: 'PRETE' },
            { id: 'item3', status: 'PRETE' }
          ],
          stockItems: []
        }
      ];

      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);

      await expect(batchDeleteAssetModels(['model1', 'model2']))
        .rejects.toThrow('2 équipement(s) sont actuellement prêtés');
    });

    it('should throw ValidationError if any StockItem is loaned', async () => {
      const mockModels = [
        {
          id: 'model1',
          items: [],
          stockItems: [{ id: 'stock1', quantity: 50, loaned: 10 }]
        },
        {
          id: 'model2',
          items: [],
          stockItems: [{ id: 'stock2', quantity: 30, loaned: 5 }]
        }
      ];

      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);

      await expect(batchDeleteAssetModels(['model1', 'model2']))
        .rejects.toThrow('15 article(s) de stock sont actuellement prêtés');
    });
  });
});
