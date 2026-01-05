/**
 * @fileoverview Unit tests for assetModels.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - CRUD operations
 * - Batch operations
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllAssetModels = jest.fn();
const mockGetAssetModelById = jest.fn();
const mockCreateAssetModel = jest.fn();
const mockUpdateAssetModel = jest.fn();
const mockDeleteAssetModel = jest.fn();
const mockBatchDeleteAssetModels = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../services/assetModels.service.js', () => ({
  getAllAssetModels: mockGetAllAssetModels,
  getAssetModelById: mockGetAssetModelById,
  createAssetModel: mockCreateAssetModel,
  updateAssetModel: mockUpdateAssetModel,
  deleteAssetModel: mockDeleteAssetModel,
  batchDeleteAssetModels: mockBatchDeleteAssetModels
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

// Import controllers AFTER mocks
const {
  getAllAssetModels,
  getAssetModelById,
  createAssetModel,
  updateAssetModel,
  deleteAssetModel,
  batchDeleteAssetModels
} = await import('../assetModels.controller.js');

describe('assetModels.controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getAllAssetModels', () => {
    const mockModels = [
      {
        id: 'model-001',
        type: 'Laptop',
        brand: 'Dell',
        modelName: 'XPS 15'
      }
    ];

    it('should get all asset models successfully', async () => {
      mockGetAllAssetModels.mockResolvedValue(mockModels);

      await getAllAssetModels(req, res);

      expect(mockGetAllAssetModels).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockModels
      });
    });

    it('should return empty array when no models exist', async () => {
      mockGetAllAssetModels.mockResolvedValue([]);

      await getAllAssetModels(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockGetAllAssetModels.mockRejectedValue(error);

      await expect(getAllAssetModels(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getAssetModelById', () => {
    it('should get asset model by ID successfully', async () => {
      const mockModel = { id: 'model-001', type: 'Laptop' };
      req.params = { id: 'model-001' };
      mockGetAssetModelById.mockResolvedValue(mockModel);

      await getAssetModelById(req, res);

      expect(mockGetAssetModelById).toHaveBeenCalledWith('model-001');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockModel
      });
    });

    it('should handle model not found', async () => {
      req.params = { id: 'non-existent' };
      mockGetAssetModelById.mockRejectedValue(new Error('Model not found'));

      await expect(getAssetModelById(req, res)).rejects.toThrow('Model not found');
    });
  });

  describe('createAssetModel', () => {
    it('should create asset model successfully', async () => {
      req.body = { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' };
      const mockResult = {
        assetModel: { id: 'model-new', ...req.body },
        created: { equipmentType: true, brand: false }
      };
      mockCreateAssetModel.mockResolvedValue(mockResult);

      await createAssetModel(req, res);

      expect(mockCreateAssetModel).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.assetModel,
        created: mockResult.created
      });
    });

    it('should handle validation errors', async () => {
      req.body = { type: 'Laptop' };
      mockCreateAssetModel.mockRejectedValue(new Error('Missing required fields'));

      await expect(createAssetModel(req, res)).rejects.toThrow('Missing required fields');
    });
  });

  describe('updateAssetModel', () => {
    it('should update asset model successfully', async () => {
      req.params = { id: 'model-001' };
      req.body = { modelName: 'XPS 17' };
      const mockUpdated = { id: 'model-001', modelName: 'XPS 17' };
      mockUpdateAssetModel.mockResolvedValue(mockUpdated);

      await updateAssetModel(req, res);

      expect(mockUpdateAssetModel).toHaveBeenCalledWith('model-001', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated
      });
    });

    it('should handle model not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { modelName: 'Test' };
      mockUpdateAssetModel.mockRejectedValue(new Error('Model not found'));

      await expect(updateAssetModel(req, res)).rejects.toThrow('Model not found');
    });
  });

  describe('deleteAssetModel', () => {
    it('should delete asset model successfully', async () => {
      req.params = { id: 'model-001' };
      mockDeleteAssetModel.mockResolvedValue({ message: 'Deleted' });

      await deleteAssetModel(req, res);

      expect(mockDeleteAssetModel).toHaveBeenCalledWith('model-001');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Deleted' }
      });
    });

    it('should handle model not found', async () => {
      req.params = { id: 'non-existent' };
      mockDeleteAssetModel.mockRejectedValue(new Error('Model not found'));

      await expect(deleteAssetModel(req, res)).rejects.toThrow('Model not found');
    });

    it('should handle model in use error', async () => {
      req.params = { id: 'model-001' };
      mockDeleteAssetModel.mockRejectedValue(new Error('Model has associated items'));

      await expect(deleteAssetModel(req, res)).rejects.toThrow('Model has associated items');
    });
  });

  describe('batchDeleteAssetModels', () => {
    it('should batch delete models successfully', async () => {
      req.body = { modelIds: ['model-001', 'model-002'] };
      mockBatchDeleteAssetModels.mockResolvedValue({ count: 2 });

      await batchDeleteAssetModels(req, res);

      expect(mockBatchDeleteAssetModels).toHaveBeenCalledWith(['model-001', 'model-002']);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 2 }
      });
    });

    it('should handle empty array', async () => {
      req.body = { modelIds: [] };
      mockBatchDeleteAssetModels.mockRejectedValue(new Error('No IDs provided'));

      await expect(batchDeleteAssetModels(req, res)).rejects.toThrow('No IDs provided');
    });

    it('should handle partial deletion', async () => {
      req.body = { modelIds: ['model-001', 'model-002', 'non-existent'] };
      mockBatchDeleteAssetModels.mockResolvedValue({ count: 2 });

      await batchDeleteAssetModels(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 2 }
      });
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors with asyncHandler', async () => {
      req.params = { id: 'model-001' };
      mockGetAssetModelById.mockRejectedValue(new Error('Database error'));

      await expect(getAssetModelById(req, res)).rejects.toThrow('Database error');
    });

    it('should return consistent response format', async () => {
      mockGetAllAssetModels.mockResolvedValue([]);

      await getAllAssetModels(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should use 201 status for creation', async () => {
      req.body = { type: 'Test', brand: 'Test', modelName: 'Test' };
      mockCreateAssetModel.mockResolvedValue({ id: 'new' });

      await createAssetModel(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
