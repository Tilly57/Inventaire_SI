/**
 * @fileoverview Unit tests for stockItems.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - CRUD operations
 * - Quantity adjustments
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllStockItems = jest.fn();
const mockGetStockItemById = jest.fn();
const mockCreateStockItem = jest.fn();
const mockUpdateStockItem = jest.fn();
const mockAdjustStockQuantity = jest.fn();
const mockDeleteStockItem = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn);

jest.unstable_mockModule('../../services/stockItems.service.js', () => ({
  getAllStockItems: mockGetAllStockItems,
  getStockItemById: mockGetStockItemById,
  createStockItem: mockCreateStockItem,
  updateStockItem: mockUpdateStockItem,
  adjustStockQuantity: mockAdjustStockQuantity,
  deleteStockItem: mockDeleteStockItem
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

const {
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  adjustQuantity,
  deleteStockItem
} = await import('../stockItems.controller.js');

describe('stockItems.controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllStockItems', () => {
    it('should get all stock items successfully', async () => {
      const mockItems = [{ id: 'stock-1', name: 'Cable HDMI', quantity: 50 }];
      mockGetAllStockItems.mockResolvedValue(mockItems);

      await getAllStockItems(req, res);

      expect(mockGetAllStockItems).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockItems
      });
    });

    it('should return empty array when no items exist', async () => {
      mockGetAllStockItems.mockResolvedValue([]);

      await getAllStockItems(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should handle service errors', async () => {
      mockGetAllStockItems.mockRejectedValue(new Error('Database error'));

      await expect(getAllStockItems(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getStockItemById', () => {
    it('should get stock item by ID successfully', async () => {
      const mockItem = { id: 'stock-1', name: 'Cable HDMI' };
      req.params = { id: 'stock-1' };
      mockGetStockItemById.mockResolvedValue(mockItem);

      await getStockItemById(req, res);

      expect(mockGetStockItemById).toHaveBeenCalledWith('stock-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem
      });
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      mockGetStockItemById.mockRejectedValue(new Error('Stock item not found'));

      await expect(getStockItemById(req, res)).rejects.toThrow('Stock item not found');
    });
  });

  describe('createStockItem', () => {
    it('should create stock item successfully', async () => {
      req.body = { name: 'Câble USB-C', quantity: 100, minQuantity: 10 };
      const mockCreated = { id: 'stock-new', ...req.body };
      mockCreateStockItem.mockResolvedValue(mockCreated);

      await createStockItem(req, res);

      expect(mockCreateStockItem).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated
      });
    });

    it('should handle missing required fields', async () => {
      req.body = { quantity: 10 };
      mockCreateStockItem.mockRejectedValue(new Error('Name is required'));

      await expect(createStockItem(req, res)).rejects.toThrow('Name is required');
    });

    it('should handle validation errors', async () => {
      req.body = { name: 'Test', quantity: -5 };
      mockCreateStockItem.mockRejectedValue(new Error('Invalid quantity'));

      await expect(createStockItem(req, res)).rejects.toThrow('Invalid quantity');
    });
  });

  describe('updateStockItem', () => {
    it('should update stock item successfully', async () => {
      req.params = { id: 'stock-1' };
      req.body = { name: 'Câble HDMI 2.0' };
      const mockUpdated = { id: 'stock-1', name: 'Câble HDMI 2.0' };
      mockUpdateStockItem.mockResolvedValue(mockUpdated);

      await updateStockItem(req, res);

      expect(mockUpdateStockItem).toHaveBeenCalledWith('stock-1', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated
      });
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { name: 'Test' };
      mockUpdateStockItem.mockRejectedValue(new Error('Stock item not found'));

      await expect(updateStockItem(req, res)).rejects.toThrow('Stock item not found');
    });
  });

  describe('adjustQuantity', () => {
    it('should increase quantity successfully', async () => {
      req.params = { id: 'stock-1' };
      req.body = { quantity: 10 };
      const mockAdjusted = { id: 'stock-1', quantity: 60 };
      mockAdjustStockQuantity.mockResolvedValue(mockAdjusted);

      await adjustQuantity(req, res);

      expect(mockAdjustStockQuantity).toHaveBeenCalledWith('stock-1', 10);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAdjusted
      });
    });

    it('should decrease quantity successfully', async () => {
      req.params = { id: 'stock-1' };
      req.body = { quantity: -5 };
      const mockAdjusted = { id: 'stock-1', quantity: 45 };
      mockAdjustStockQuantity.mockResolvedValue(mockAdjusted);

      await adjustQuantity(req, res);

      expect(mockAdjustStockQuantity).toHaveBeenCalledWith('stock-1', -5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAdjusted
      });
    });

    it('should handle insufficient quantity error', async () => {
      req.params = { id: 'stock-1' };
      req.body = { quantity: -100 };
      mockAdjustStockQuantity.mockRejectedValue(new Error('Insufficient quantity'));

      await expect(adjustQuantity(req, res)).rejects.toThrow('Insufficient quantity');
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { quantity: 5 };
      mockAdjustStockQuantity.mockRejectedValue(new Error('Stock item not found'));

      await expect(adjustQuantity(req, res)).rejects.toThrow('Stock item not found');
    });
  });

  describe('deleteStockItem', () => {
    it('should delete stock item successfully', async () => {
      req.params = { id: 'stock-1' };
      mockDeleteStockItem.mockResolvedValue({ message: 'Article supprimé' });

      await deleteStockItem(req, res);

      expect(mockDeleteStockItem).toHaveBeenCalledWith('stock-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Article supprimé' }
      });
    });

    it('should handle item not found', async () => {
      req.params = { id: 'non-existent' };
      mockDeleteStockItem.mockRejectedValue(new Error('Stock item not found'));

      await expect(deleteStockItem(req, res)).rejects.toThrow('Stock item not found');
    });

    it('should handle item in use error', async () => {
      req.params = { id: 'stock-1' };
      mockDeleteStockItem.mockRejectedValue(new Error('Item referenced in loans'));

      await expect(deleteStockItem(req, res)).rejects.toThrow('Item referenced in loans');
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors', async () => {
      req.params = { id: 'stock-1' };
      mockGetStockItemById.mockRejectedValue(new Error('Database error'));

      await expect(getStockItemById(req, res)).rejects.toThrow('Database error');
    });

    it('should return consistent response format', async () => {
      mockGetAllStockItems.mockResolvedValue([]);

      await getAllStockItems(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it('should use 201 status for creation', async () => {
      req.body = { name: 'Test', quantity: 10 };
      mockCreateStockItem.mockResolvedValue({ id: 'new' });

      await createStockItem(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
