/**
 * Unit tests for assetItems.service.js
 * Tests the asset items service including:
 * - Individual equipment item CRUD operations
 * - Status tracking (EN_STOCK, PRETE, HS, REPARATION)
 * - Unique identifier validation (asset tags and serial numbers)
 * - Filtering and search capabilities
 * - Bulk creation with auto-generated sequential tags
 */

import { jest } from '@jest/globals';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';

// Mock Prisma client before importing service
const mockPrisma = {
  assetItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  assetModel: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

// Set up mocks before importing service
jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

// Import service after mocks are set up
const {
  getAllAssetItems,
  getAssetItemById,
  createAssetItem,
  updateAssetItem,
  updateAssetItemStatus,
  deleteAssetItem,
  previewBulkCreation,
  createAssetItemsBulk,
} = await import('../assetItems.service.js');

describe('AssetItems Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssetItems', () => {
    it('should return all asset items without filters', async () => {
      const mockItems = [
        {
          id: 'item1',
          assetTag: 'LAP-001',
          serial: 'SN123',
          status: 'EN_STOCK',
          assetModel: { type: 'Ordinateur portable', brand: 'Dell' }
        },
        {
          id: 'item2',
          assetTag: 'LAP-002',
          serial: 'SN456',
          status: 'PRETE',
          assetModel: { type: 'Ordinateur portable', brand: 'HP' }
        }
      ];

      mockPrisma.assetItem.findMany.mockResolvedValue(mockItems);

      const result = await getAllAssetItems();

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        include: {
          assetModel: true
        }
      });
      expect(result).toEqual(mockItems);
    });

    it('should filter by status', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await getAllAssetItems({ status: 'PRETE' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PRETE' }
        })
      );
    });

    it('should filter by assetModelId', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await getAllAssetItems({ assetModelId: 'model1' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assetModelId: 'model1' }
        })
      );
    });

    it('should search in asset tag and serial number', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await getAllAssetItems({ search: 'LAP-001' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { assetTag: { contains: 'LAP-001', mode: 'insensitive' } },
              { serial: { contains: 'LAP-001', mode: 'insensitive' } }
            ]
          }
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await getAllAssetItems({
        status: 'EN_STOCK',
        assetModelId: 'model1',
        search: 'SN123'
      });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'EN_STOCK',
            assetModelId: 'model1',
            OR: [
              { assetTag: { contains: 'SN123', mode: 'insensitive' } },
              { serial: { contains: 'SN123', mode: 'insensitive' } }
            ]
          }
        })
      );
    });
  });

  describe('getAssetItemById', () => {
    it('should return asset item with loan history', async () => {
      const mockItem = {
        id: 'item1',
        assetTag: 'LAP-001',
        status: 'EN_STOCK',
        assetModel: { type: 'Ordinateur portable' },
        loanLines: [
          {
            id: 'line1',
            loan: {
              id: 'loan1',
              employee: { firstName: 'Jean', lastName: 'Dupont' }
            }
          }
        ]
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockItem);

      const result = await getAssetItemById('item1');

      expect(mockPrisma.assetItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item1' },
        include: {
          assetModel: true,
          loanLines: {
            take: 50, // Limit to 50 most recent loan lines
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
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundError if item does not exist', async () => {
      mockPrisma.assetItem.findUnique.mockResolvedValue(null);

      await expect(getAssetItemById('nonexistent'))
        .rejects.toThrow('Article d\'équipement non trouvé');
    });
  });

  describe('createAssetItem', () => {
    const mockAssetModel = {
      id: 'model1',
      type: 'Ordinateur portable',
      brand: 'Dell'
    };

    const mockItemData = {
      assetModelId: 'model1',
      assetTag: 'LAP-001',
      serial: 'SN123456',
      status: 'EN_STOCK'
    };

    it('should create asset item successfully', async () => {
      const mockCreatedItem = {
        id: 'item1',
        ...mockItemData,
        assetModel: mockAssetModel,
        createdAt: new Date()
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findUnique
        .mockResolvedValueOnce(null) // No existing asset tag
        .mockResolvedValueOnce(null); // No existing serial
      mockPrisma.assetItem.create.mockResolvedValue(mockCreatedItem);

      const result = await createAssetItem(mockItemData);

      expect(mockPrisma.assetModel.findUnique).toHaveBeenCalledWith({
        where: { id: mockItemData.assetModelId }
      });
      expect(mockPrisma.assetItem.findUnique).toHaveBeenCalledWith({
        where: { assetTag: mockItemData.assetTag }
      });
      expect(mockPrisma.assetItem.findUnique).toHaveBeenCalledWith({
        where: { serial: mockItemData.serial }
      });
      expect(mockPrisma.assetItem.create).toHaveBeenCalledWith({
        data: mockItemData,
        include: {
          assetModel: true
        }
      });
      expect(result).toEqual(mockCreatedItem);
    });

    it('should throw NotFoundError if asset model does not exist', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(createAssetItem(mockItemData))
        .rejects.toThrow('Modèle d\'équipement non trouvé');

      expect(mockPrisma.assetItem.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if asset tag already exists', async () => {
      const existingItem = { id: 'item2', assetTag: 'LAP-001' };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findUnique.mockResolvedValue(existingItem);

      await expect(createAssetItem(mockItemData))
        .rejects.toThrow('Ce numéro d\'inventaire existe déjà');

      expect(mockPrisma.assetItem.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if serial number already exists', async () => {
      const existingItem = { id: 'item2', serial: 'SN123456' };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findUnique
        .mockResolvedValueOnce(null) // Asset tag doesn't exist
        .mockResolvedValueOnce(existingItem); // Serial exists

      await expect(createAssetItem(mockItemData))
        .rejects.toThrow('Ce numéro de série existe déjà');

      expect(mockPrisma.assetItem.create).not.toHaveBeenCalled();
    });

    it('should create item without asset tag', async () => {
      const dataWithoutTag = {
        assetModelId: 'model1',
        serial: 'SN123456',
        status: 'EN_STOCK'
      };

      const mockCreatedItem = {
        id: 'item1',
        ...dataWithoutTag,
        assetTag: null,
        assetModel: mockAssetModel
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findUnique.mockResolvedValue(null); // Serial check
      mockPrisma.assetItem.create.mockResolvedValue(mockCreatedItem);

      const result = await createAssetItem(dataWithoutTag);

      expect(result.assetTag).toBeNull();
      expect(mockPrisma.assetItem.create).toHaveBeenCalled();
    });

    it('should create item without serial number', async () => {
      const dataWithoutSerial = {
        assetModelId: 'model1',
        assetTag: 'LAP-001',
        status: 'EN_STOCK'
      };

      const mockCreatedItem = {
        id: 'item1',
        ...dataWithoutSerial,
        serial: null,
        assetModel: mockAssetModel
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findUnique.mockResolvedValue(null); // Asset tag check
      mockPrisma.assetItem.create.mockResolvedValue(mockCreatedItem);

      const result = await createAssetItem(dataWithoutSerial);

      expect(result.serial).toBeNull();
      expect(mockPrisma.assetItem.create).toHaveBeenCalled();
    });
  });

  describe('updateAssetItem', () => {
    const mockItemId = 'item1';
    const mockExistingItem = {
      id: mockItemId,
      assetModelId: 'model1',
      assetTag: 'LAP-001',
      serial: 'SN123',
      status: 'EN_STOCK'
    };

    it('should update asset item successfully', async () => {
      const updateData = {
        status: 'HS',
        notes: 'Écran cassé'
      };

      const mockUpdatedItem = {
        ...mockExistingItem,
        ...updateData,
        assetModel: { type: 'Ordinateur portable' }
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockExistingItem);
      mockPrisma.assetItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await updateAssetItem(mockItemId, updateData);

      expect(mockPrisma.assetItem.update).toHaveBeenCalledWith({
        where: { id: mockItemId },
        data: updateData,
        include: {
          assetModel: true
        }
      });
      expect(result).toEqual(mockUpdatedItem);
    });

    it('should throw NotFoundError if item does not exist', async () => {
      mockPrisma.assetItem.findUnique.mockResolvedValue(null);

      await expect(updateAssetItem('nonexistent', { status: 'HS' }))
        .rejects.toThrow('Article d\'équipement non trouvé');

      expect(mockPrisma.assetItem.update).not.toHaveBeenCalled();
    });

    it('should validate new asset model exists when changing model', async () => {
      const updateData = { assetModelId: 'newModel' };
      const mockNewModel = { id: 'newModel', type: 'Écran' };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockExistingItem);
      mockPrisma.assetModel.findUnique.mockResolvedValue(mockNewModel);
      mockPrisma.assetItem.update.mockResolvedValue({
        ...mockExistingItem,
        assetModelId: 'newModel'
      });

      await updateAssetItem(mockItemId, updateData);

      expect(mockPrisma.assetModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'newModel' }
      });
    });

    it('should throw NotFoundError if new asset model does not exist', async () => {
      const updateData = { assetModelId: 'nonexistent' };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockExistingItem);
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(updateAssetItem(mockItemId, updateData))
        .rejects.toThrow('Modèle d\'équipement non trouvé');
    });

    it('should throw ConflictError if new asset tag already exists', async () => {
      const updateData = { assetTag: 'LAP-999' };
      const conflictingItem = { id: 'item2', assetTag: 'LAP-999' };

      mockPrisma.assetItem.findUnique
        .mockResolvedValueOnce(mockExistingItem) // Item exists check
        .mockResolvedValueOnce(conflictingItem); // Asset tag conflict

      await expect(updateAssetItem(mockItemId, updateData))
        .rejects.toThrow('Ce numéro d\'inventaire existe déjà');
    });

    it('should throw ConflictError if new serial already exists', async () => {
      const updateData = { serial: 'SN999' };
      const conflictingItem = { id: 'item2', serial: 'SN999' };

      mockPrisma.assetItem.findUnique
        .mockResolvedValueOnce(mockExistingItem) // Item exists check
        .mockResolvedValueOnce(conflictingItem); // Serial conflict

      await expect(updateAssetItem(mockItemId, updateData))
        .rejects.toThrow('Ce numéro de série existe déjà');
    });

    it('should allow updating to same asset tag (no change)', async () => {
      const updateData = {
        assetTag: 'LAP-001', // Same as existing
        notes: 'Updated notes'
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockExistingItem);
      mockPrisma.assetItem.update.mockResolvedValue({
        ...mockExistingItem,
        notes: 'Updated notes'
      });

      await updateAssetItem(mockItemId, updateData);

      // Calls findUnique twice: once to get existing item, once to check for tag conflict
      // (even though it's the same tag, the service still checks)
      expect(mockPrisma.assetItem.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.assetItem.update).toHaveBeenCalled();
    });

    it('should allow updating to same serial (no change)', async () => {
      const updateData = {
        serial: 'SN123', // Same as existing
        notes: 'Updated notes'
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockExistingItem);
      mockPrisma.assetItem.update.mockResolvedValue({
        ...mockExistingItem,
        notes: 'Updated notes'
      });

      await updateAssetItem(mockItemId, updateData);

      // Calls findUnique twice: once to get existing item, once to check for serial conflict
      // (even though it's the same serial, the service still checks)
      expect(mockPrisma.assetItem.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.assetItem.update).toHaveBeenCalled();
    });
  });

  describe('updateAssetItemStatus', () => {
    it('should update status successfully', async () => {
      const mockItem = {
        id: 'item1',
        assetTag: 'LAP-001',
        status: 'EN_STOCK'
      };

      const mockUpdatedItem = {
        ...mockItem,
        status: 'HS',
        assetModel: { type: 'Ordinateur portable' }
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.assetItem.update.mockResolvedValue(mockUpdatedItem);

      const result = await updateAssetItemStatus('item1', 'HS');

      expect(mockPrisma.assetItem.update).toHaveBeenCalledWith({
        where: { id: 'item1' },
        data: { status: 'HS' },
        include: {
          assetModel: true
        }
      });
      expect(result.status).toBe('HS');
    });

    it('should throw NotFoundError if item does not exist', async () => {
      mockPrisma.assetItem.findUnique.mockResolvedValue(null);

      await expect(updateAssetItemStatus('nonexistent', 'HS'))
        .rejects.toThrow('Article d\'équipement non trouvé');
    });
  });

  describe('deleteAssetItem', () => {
    it('should delete asset item successfully', async () => {
      const mockItem = {
        id: 'item1',
        assetTag: 'LAP-001',
        loanLines: []
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.assetItem.delete.mockResolvedValue(mockItem);

      const result = await deleteAssetItem('item1');

      expect(mockPrisma.assetItem.delete).toHaveBeenCalledWith({
        where: { id: 'item1' }
      });
      expect(result).toEqual({ message: 'Article d\'équipement supprimé avec succès' });
    });

    it('should throw NotFoundError if item does not exist', async () => {
      mockPrisma.assetItem.findUnique.mockResolvedValue(null);

      await expect(deleteAssetItem('nonexistent'))
        .rejects.toThrow('Article d\'équipement non trouvé');

      expect(mockPrisma.assetItem.delete).not.toHaveBeenCalled();
    });

    it('should delete item even if it has loan history', async () => {
      const mockItem = {
        id: 'item1',
        assetTag: 'LAP-001',
        loanLines: [
          { id: 'line1', loanId: 'loan1' },
          { id: 'line2', loanId: 'loan2' }
        ]
      };

      mockPrisma.assetItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.assetItem.delete.mockResolvedValue(mockItem);

      const result = await deleteAssetItem('item1');

      expect(mockPrisma.assetItem.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Article d\'équipement supprimé avec succès' });
    });
  });

  describe('previewBulkCreation', () => {
    it('should return preview with no conflicts', async () => {
      // No existing tags
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([]) // findNextAvailableNumber
        .mockResolvedValueOnce([]); // Check for conflicts

      const result = await previewBulkCreation('KB-', 3);

      expect(result).toEqual({
        tags: ['KB-001', 'KB-002', 'KB-003'],
        conflicts: [],
        startNumber: 1
      });
    });

    it('should return preview starting from next available number', async () => {
      // Existing tags: KB-001, KB-002
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([
          { assetTag: 'KB-001' },
          { assetTag: 'KB-002' }
        ]) // findNextAvailableNumber
        .mockResolvedValueOnce([]); // No conflicts

      const result = await previewBulkCreation('KB-', 2);

      expect(result).toEqual({
        tags: ['KB-003', 'KB-004'],
        conflicts: [],
        startNumber: 3
      });
    });

    it('should detect conflicts', async () => {
      // Existing: KB-001, KB-002, KB-005
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([
          { assetTag: 'KB-001' },
          { assetTag: 'KB-002' },
          { assetTag: 'KB-005' }
        ]) // findNextAvailableNumber (max = 5, next = 6)
        .mockResolvedValueOnce([
          { assetTag: 'KB-006' } // KB-006 already exists
        ]); // Conflict check

      const result = await previewBulkCreation('KB-', 3);

      expect(result).toEqual({
        tags: ['KB-006', 'KB-007', 'KB-008'],
        conflicts: ['KB-006'],
        startNumber: 6
      });
    });
  });

  describe('createAssetItemsBulk', () => {
    const mockAssetModel = {
      id: 'model1',
      type: 'Clavier',
      brand: 'Logitech'
    };

    const mockBulkData = {
      assetModelId: 'model1',
      tagPrefix: 'KB-',
      quantity: 3,
      status: 'EN_STOCK',
      notes: 'Commande 2025'
    };

    it('should create multiple items with sequential tags', async () => {
      const mockCreatedItems = [
        { id: 'item1', assetTag: 'KB-001', assetModel: mockAssetModel },
        { id: 'item2', assetTag: 'KB-002', assetModel: mockAssetModel },
        { id: 'item3', assetTag: 'KB-003', assetModel: mockAssetModel }
      ];

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([]) // findNextAvailableNumber
        .mockResolvedValueOnce([]); // No conflicts
      mockPrisma.assetItem.create
        .mockResolvedValueOnce(mockCreatedItems[0])
        .mockResolvedValueOnce(mockCreatedItems[1])
        .mockResolvedValueOnce(mockCreatedItems[2]);

      const result = await createAssetItemsBulk(mockBulkData);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].assetTag).toBe('KB-001');
      expect(result[2].assetTag).toBe('KB-003');
    });

    it('should throw NotFoundError if asset model does not exist', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(null);

      await expect(createAssetItemsBulk(mockBulkData))
        .rejects.toThrow('Modèle d\'équipement non trouvé');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if quantity is less than 1', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);

      await expect(createAssetItemsBulk({ ...mockBulkData, quantity: 0 }))
        .rejects.toThrow('La quantité doit être entre 1 et 100');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if quantity is greater than 100', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);

      await expect(createAssetItemsBulk({ ...mockBulkData, quantity: 101 }))
        .rejects.toThrow('La quantité doit être entre 1 et 100');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if generated tags conflict', async () => {
      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([]) // findNextAvailableNumber
        .mockResolvedValueOnce([
          { assetTag: 'KB-001' },
          { assetTag: 'KB-002' }
        ]); // Conflicts

      await expect(createAssetItemsBulk(mockBulkData))
        .rejects.toThrow('Les tags suivants existent déjà: KB-001, KB-002');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should continue numbering from existing tags', async () => {
      const mockCreatedItems = [
        { id: 'item4', assetTag: 'KB-003', assetModel: mockAssetModel },
        { id: 'item5', assetTag: 'KB-004', assetModel: mockAssetModel }
      ];

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([
          { assetTag: 'KB-001' },
          { assetTag: 'KB-002' }
        ]) // Existing tags
        .mockResolvedValueOnce([]); // No conflicts
      mockPrisma.assetItem.create
        .mockResolvedValueOnce(mockCreatedItems[0])
        .mockResolvedValueOnce(mockCreatedItems[1]);

      const result = await createAssetItemsBulk({ ...mockBulkData, quantity: 2 });

      expect(result).toHaveLength(2);
      expect(result[0].assetTag).toBe('KB-003');
      expect(result[1].assetTag).toBe('KB-004');
    });

    it('should create items with null serial numbers', async () => {
      const mockCreatedItem = {
        id: 'item1',
        assetTag: 'KB-001',
        serial: null,
        assetModel: mockAssetModel
      };

      mockPrisma.assetModel.findUnique.mockResolvedValue(mockAssetModel);
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.assetItem.create.mockResolvedValue(mockCreatedItem);

      const result = await createAssetItemsBulk({ ...mockBulkData, quantity: 1 });

      expect(result[0].serial).toBeNull();
      expect(mockPrisma.assetItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            serial: null
          })
        })
      );
    });
  });
});
