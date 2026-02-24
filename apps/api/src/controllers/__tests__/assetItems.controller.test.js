/**
 * @fileoverview Unit tests for assetItems.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - CRUD operations
 * - Status updates
 * - Bulk operations
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllAssetItemsPaginated = jest.fn();
const mockGetAssetItemById = jest.fn();
const mockCreateAssetItem = jest.fn();
const mockUpdateAssetItem = jest.fn();
const mockUpdateAssetItemStatus = jest.fn();
const mockDeleteAssetItem = jest.fn();
const mockCreateAssetItemsBulk = jest.fn();
const mockPreviewBulkCreation = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn);

jest.unstable_mockModule('../../services/assetItems.service.js', () => ({
  getAllAssetItemsPaginated: mockGetAllAssetItemsPaginated,
  getAssetItemById: mockGetAssetItemById,
  createAssetItem: mockCreateAssetItem,
  updateAssetItem: mockUpdateAssetItem,
  updateAssetItemStatus: mockUpdateAssetItemStatus,
  deleteAssetItem: mockDeleteAssetItem,
  createAssetItemsBulk: mockCreateAssetItemsBulk,
  previewBulkCreation: mockPreviewBulkCreation
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

const {
  getAllAssetItems,
  getAssetItemById,
  createAssetItem,
  updateAssetItem,
  updateAssetItemStatus,
  deleteAssetItem,
  createAssetItemsBulk,
  previewBulkCreation
} = await import('../assetItems.controller.js');

describe('assetItems.controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllAssetItems', () => {
    it('should get all asset items successfully', async () => {
      const mockItems = [
        { id: 'item-1', assetTag: 'LAP001', serialNumber: 'SN12345', status: 'EN_STOCK' },
        { id: 'item-2', assetTag: 'LAP002', serialNumber: 'SN12346', status: 'PRETE' }
      ];
      mockGetAllAssetItemsPaginated.mockResolvedValue({ data: mockItems });

      await getAllAssetItems(req, res);

      expect(mockGetAllAssetItemsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 1000 })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockItems
      });
    });

    it('should return empty array when no items exist', async () => {
      mockGetAllAssetItemsPaginated.mockResolvedValue({ data: [] });

      await getAllAssetItems(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should handle service errors', async () => {
      mockGetAllAssetItemsPaginated.mockRejectedValue(new Error('Database error'));

      await expect(getAllAssetItems(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getAssetItemById', () => {
    it('should get asset item by ID successfully', async () => {
      const mockItem = { id: 'item-1', assetTag: 'LAP001', status: 'EN_STOCK' };
      req.params = { id: 'item-1' };
      mockGetAssetItemById.mockResolvedValue(mockItem);

      await getAssetItemById(req, res);

      expect(mockGetAssetItemById).toHaveBeenCalledWith('item-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem
      });
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      mockGetAssetItemById.mockRejectedValue(new Error('Asset item not found'));

      await expect(getAssetItemById(req, res)).rejects.toThrow('Asset item not found');
    });
  });

  describe('createAssetItem', () => {
    it('should create asset item successfully', async () => {
      req.body = {
        assetModelId: 'model-1',
        assetTag: 'LAP001',
        serialNumber: 'SN12345',
        status: 'EN_STOCK'
      };
      const mockCreated = { id: 'item-new', ...req.body };
      mockCreateAssetItem.mockResolvedValue(mockCreated);

      await createAssetItem(req, res);

      expect(mockCreateAssetItem).toHaveBeenCalledWith(req.body, req);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated
      });
    });

    it('should handle missing required fields', async () => {
      req.body = { assetTag: 'LAP001' };
      mockCreateAssetItem.mockRejectedValue(new Error('Asset model ID is required'));

      await expect(createAssetItem(req, res)).rejects.toThrow('Asset model ID is required');
    });

    it('should handle duplicate asset tag', async () => {
      req.body = { assetModelId: 'model-1', assetTag: 'LAP001', serialNumber: 'SN001' };
      mockCreateAssetItem.mockRejectedValue(new Error('Asset tag already exists'));

      await expect(createAssetItem(req, res)).rejects.toThrow('Asset tag already exists');
    });

    it('should handle duplicate serial number', async () => {
      req.body = { assetModelId: 'model-1', assetTag: 'LAP999', serialNumber: 'SN12345' };
      mockCreateAssetItem.mockRejectedValue(new Error('Serial number already exists'));

      await expect(createAssetItem(req, res)).rejects.toThrow('Serial number already exists');
    });
  });

  describe('updateAssetItem', () => {
    it('should update asset item successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { assetTag: 'LAP001-UPDATED', serialNumber: 'SN-NEW' };
      const mockUpdated = { id: 'item-1', ...req.body };
      mockUpdateAssetItem.mockResolvedValue(mockUpdated);

      await updateAssetItem(req, res);

      expect(mockUpdateAssetItem).toHaveBeenCalledWith('item-1', req.body, req);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated
      });
    });

    it('should update only asset tag', async () => {
      req.params = { id: 'item-1' };
      req.body = { assetTag: 'LAP002' };
      mockUpdateAssetItem.mockResolvedValue({ id: 'item-1', assetTag: 'LAP002' });

      await updateAssetItem(req, res);

      expect(mockUpdateAssetItem).toHaveBeenCalledWith('item-1', req.body, req);
    });

    it('should update only serial number', async () => {
      req.params = { id: 'item-1' };
      req.body = { serialNumber: 'SN-NEW' };
      mockUpdateAssetItem.mockResolvedValue({ id: 'item-1', serialNumber: 'SN-NEW' });

      await updateAssetItem(req, res);

      expect(mockUpdateAssetItem).toHaveBeenCalledWith('item-1', req.body, req);
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { assetTag: 'TEST' };
      mockUpdateAssetItem.mockRejectedValue(new Error('Asset item not found'));

      await expect(updateAssetItem(req, res)).rejects.toThrow('Asset item not found');
    });
  });

  describe('updateAssetItemStatus', () => {
    it('should update status to PRETE successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { status: 'PRETE' };
      const mockUpdated = { id: 'item-1', status: 'PRETE' };
      mockUpdateAssetItemStatus.mockResolvedValue(mockUpdated);

      await updateAssetItemStatus(req, res);

      expect(mockUpdateAssetItemStatus).toHaveBeenCalledWith('item-1', 'PRETE', req);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated
      });
    });

    it('should update status to HS successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { status: 'HS' };
      const mockUpdated = { id: 'item-1', status: 'HS' };
      mockUpdateAssetItemStatus.mockResolvedValue(mockUpdated);

      await updateAssetItemStatus(req, res);

      expect(mockUpdateAssetItemStatus).toHaveBeenCalledWith('item-1', 'HS', req);
    });

    it('should update status to REPARATION successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { status: 'REPARATION' };
      const mockUpdated = { id: 'item-1', status: 'REPARATION' };
      mockUpdateAssetItemStatus.mockResolvedValue(mockUpdated);

      await updateAssetItemStatus(req, res);

      expect(mockUpdateAssetItemStatus).toHaveBeenCalledWith('item-1', 'REPARATION', req);
    });

    it('should update status to EN_STOCK successfully', async () => {
      req.params = { id: 'item-1' };
      req.body = { status: 'EN_STOCK' };
      const mockUpdated = { id: 'item-1', status: 'EN_STOCK' };
      mockUpdateAssetItemStatus.mockResolvedValue(mockUpdated);

      await updateAssetItemStatus(req, res);

      expect(mockUpdateAssetItemStatus).toHaveBeenCalledWith('item-1', 'EN_STOCK', req);
    });

    it('should handle invalid status', async () => {
      req.params = { id: 'item-1' };
      req.body = { status: 'INVALID_STATUS' };
      mockUpdateAssetItemStatus.mockRejectedValue(new Error('Invalid status'));

      await expect(updateAssetItemStatus(req, res)).rejects.toThrow('Invalid status');
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { status: 'EN_STOCK' };
      mockUpdateAssetItemStatus.mockRejectedValue(new Error('Asset item not found'));

      await expect(updateAssetItemStatus(req, res)).rejects.toThrow('Asset item not found');
    });
  });

  describe('deleteAssetItem', () => {
    it('should delete asset item successfully', async () => {
      req.params = { id: 'item-1' };
      mockDeleteAssetItem.mockResolvedValue({ message: 'Asset item deleted' });

      await deleteAssetItem(req, res);

      expect(mockDeleteAssetItem).toHaveBeenCalledWith('item-1', req);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Asset item deleted' }
      });
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      mockDeleteAssetItem.mockRejectedValue(new Error('Asset item not found'));

      await expect(deleteAssetItem(req, res)).rejects.toThrow('Asset item not found');
    });

    it('should handle item in use error', async () => {
      req.params = { id: 'item-1' };
      mockDeleteAssetItem.mockRejectedValue(new Error('Item is currently loaned'));

      await expect(deleteAssetItem(req, res)).rejects.toThrow('Item is currently loaned');
    });
  });

  describe('createAssetItemsBulk', () => {
    it('should create multiple items successfully', async () => {
      req.body = {
        assetModelId: 'model-1',
        items: [
          { assetTag: 'LAP001', serialNumber: 'SN001' },
          { assetTag: 'LAP002', serialNumber: 'SN002' },
          { assetTag: 'LAP003', serialNumber: 'SN003' }
        ]
      };
      const mockCreated = [
        { id: 'item-1', assetTag: 'LAP001', serialNumber: 'SN001' },
        { id: 'item-2', assetTag: 'LAP002', serialNumber: 'SN002' },
        { id: 'item-3', assetTag: 'LAP003', serialNumber: 'SN003' }
      ];
      mockCreateAssetItemsBulk.mockResolvedValue(mockCreated);

      await createAssetItemsBulk(req, res);

      expect(mockCreateAssetItemsBulk).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated,
        count: 3
      });
    });

    it('should handle empty items array', async () => {
      req.body = { assetModelId: 'model-1', items: [] };
      mockCreateAssetItemsBulk.mockRejectedValue(new Error('No items provided'));

      await expect(createAssetItemsBulk(req, res)).rejects.toThrow('No items provided');
    });

    it('should handle duplicate asset tags in batch', async () => {
      req.body = {
        assetModelId: 'model-1',
        items: [
          { assetTag: 'LAP001', serialNumber: 'SN001' },
          { assetTag: 'LAP001', serialNumber: 'SN002' }
        ]
      };
      mockCreateAssetItemsBulk.mockRejectedValue(new Error('Duplicate asset tags in batch'));

      await expect(createAssetItemsBulk(req, res)).rejects.toThrow('Duplicate asset tags in batch');
    });

    it('should handle partial success', async () => {
      req.body = {
        assetModelId: 'model-1',
        items: [
          { assetTag: 'LAP001', serialNumber: 'SN001' },
          { assetTag: 'LAP002', serialNumber: 'SN002' }
        ]
      };
      const mockCreated = [
        { id: 'item-1', assetTag: 'LAP001', serialNumber: 'SN001' },
        { id: 'item-2', assetTag: 'LAP002', serialNumber: 'SN002' }
      ];
      mockCreateAssetItemsBulk.mockResolvedValue(mockCreated);

      await createAssetItemsBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated,
        count: 2
      });
    });
  });

  describe('previewBulkCreation', () => {
    it('should preview bulk creation successfully', async () => {
      req.query = { tagPrefix: 'LAP', quantity: '5' };
      const mockPreview = {
        generatedTags: ['LAP-001', 'LAP-002', 'LAP-003', 'LAP-004', 'LAP-005'],
        conflicts: [],
        available: 5,
        total: 5
      };
      mockPreviewBulkCreation.mockResolvedValue(mockPreview);

      await previewBulkCreation(req, res);

      expect(mockPreviewBulkCreation).toHaveBeenCalledWith('LAP', 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreview
      });
    });

    it('should detect conflicts in preview', async () => {
      req.query = { tagPrefix: 'LAP', quantity: '3' };
      const mockPreview = {
        generatedTags: ['LAP-001', 'LAP-002', 'LAP-003'],
        conflicts: ['LAP-002'],
        available: 2,
        total: 3
      };
      mockPreviewBulkCreation.mockResolvedValue(mockPreview);

      await previewBulkCreation(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreview
      });
    });

    it('should handle invalid quantity in preview', async () => {
      req.query = { tagPrefix: 'LAP', quantity: 'invalid' };
      mockPreviewBulkCreation.mockRejectedValue(new Error('Invalid quantity'));

      await expect(previewBulkCreation(req, res)).rejects.toThrow('Invalid quantity');
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors', async () => {
      req.params = { id: 'item-1' };
      mockGetAssetItemById.mockRejectedValue(new Error('Database error'));

      await expect(getAssetItemById(req, res)).rejects.toThrow('Database error');
    });

    it('should return consistent response format', async () => {
      mockGetAllAssetItemsPaginated.mockResolvedValue({ data: [] });

      await getAllAssetItems(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it('should use 201 status for creation', async () => {
      req.body = { assetModelId: 'model-1', assetTag: 'LAP001', serialNumber: 'SN001' };
      mockCreateAssetItem.mockResolvedValue({ id: 'new' });

      await createAssetItem(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should use 201 status for bulk creation', async () => {
      req.body = { assetModelId: 'model-1', items: [{ assetTag: 'LAP001', serialNumber: 'SN001' }] };
      mockCreateAssetItemsBulk.mockResolvedValue({ count: 1 });

      await createAssetItemsBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
