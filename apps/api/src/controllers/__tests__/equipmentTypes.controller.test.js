/**
 * @fileoverview Unit tests for equipmentTypes.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - CRUD operations
 * - French success messages
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllEquipmentTypes = jest.fn();
const mockGetEquipmentTypeById = jest.fn();
const mockCreateEquipmentType = jest.fn();
const mockUpdateEquipmentType = jest.fn();
const mockDeleteEquipmentType = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn);

jest.unstable_mockModule('../../services/equipmentTypes.service.js', () => ({
  getAllEquipmentTypes: mockGetAllEquipmentTypes,
  getEquipmentTypeById: mockGetEquipmentTypeById,
  createEquipmentType: mockCreateEquipmentType,
  updateEquipmentType: mockUpdateEquipmentType,
  deleteEquipmentType: mockDeleteEquipmentType
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

const {
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType
} = await import('../equipmentTypes.controller.js');

describe('equipmentTypes.controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllTypes', () => {
    it('should get all equipment types successfully', async () => {
      const mockTypes = [
        { id: 'type-1', name: 'Ordinateur Portable', description: 'Laptops' },
        { id: 'type-2', name: 'Moniteur', description: 'Écrans' }
      ];
      mockGetAllEquipmentTypes.mockResolvedValue(mockTypes);

      await getAllTypes(req, res);

      expect(mockGetAllEquipmentTypes).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTypes
      });
    });

    it('should return empty array when no types exist', async () => {
      mockGetAllEquipmentTypes.mockResolvedValue([]);

      await getAllTypes(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should handle service errors', async () => {
      mockGetAllEquipmentTypes.mockRejectedValue(new Error('Database error'));

      await expect(getAllTypes(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getTypeById', () => {
    it('should get equipment type by ID successfully', async () => {
      const mockType = { id: 'type-1', name: 'Ordinateur Portable' };
      req.params = { id: 'type-1' };
      mockGetEquipmentTypeById.mockResolvedValue(mockType);

      await getTypeById(req, res);

      expect(mockGetEquipmentTypeById).toHaveBeenCalledWith('type-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockType
      });
    });

    it('should handle type not found', async () => {
      req.params = { id: 'non-existent' };
      mockGetEquipmentTypeById.mockRejectedValue(new Error('Equipment type not found'));

      await expect(getTypeById(req, res)).rejects.toThrow('Equipment type not found');
    });
  });

  describe('createType', () => {
    it('should create equipment type successfully', async () => {
      req.body = { name: 'Souris', description: 'Souris informatiques' };
      const mockCreated = { id: 'type-new', ...req.body };
      mockCreateEquipmentType.mockResolvedValue(mockCreated);

      await createType(req, res);

      expect(mockCreateEquipmentType).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreated,
        message: "Type d'équipement créé avec succès"
      });
    });

    it('should create type with minimal fields', async () => {
      req.body = { name: 'Clavier' };
      const mockCreated = { id: 'type-new', name: 'Clavier', description: null };
      mockCreateEquipmentType.mockResolvedValue(mockCreated);

      await createType(req, res);

      expect(mockCreateEquipmentType).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle missing name', async () => {
      req.body = { description: 'Test' };
      mockCreateEquipmentType.mockRejectedValue(new Error('Name is required'));

      await expect(createType(req, res)).rejects.toThrow('Name is required');
    });

    it('should handle duplicate name', async () => {
      req.body = { name: 'Ordinateur Portable' };
      mockCreateEquipmentType.mockRejectedValue(new Error('Name already exists'));

      await expect(createType(req, res)).rejects.toThrow('Name already exists');
    });

    it('should include French success message', async () => {
      req.body = { name: 'Test' };
      mockCreateEquipmentType.mockResolvedValue({ id: 'new' });

      await createType(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe("Type d'équipement créé avec succès");
    });
  });

  describe('updateType', () => {
    it('should update equipment type successfully', async () => {
      req.params = { id: 'type-1' };
      req.body = { name: 'Ordinateur Portable Pro', description: 'Laptops professionnels' };
      const mockUpdated = { id: 'type-1', ...req.body };
      mockUpdateEquipmentType.mockResolvedValue(mockUpdated);

      await updateType(req, res);

      expect(mockUpdateEquipmentType).toHaveBeenCalledWith('type-1', req.body);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated,
        message: "Type d'équipement modifié avec succès"
      });
    });

    it('should update only name', async () => {
      req.params = { id: 'type-1' };
      req.body = { name: 'Nouveau nom' };
      mockUpdateEquipmentType.mockResolvedValue({ id: 'type-1', name: 'Nouveau nom' });

      await updateType(req, res);

      expect(mockUpdateEquipmentType).toHaveBeenCalledWith('type-1', req.body);
    });

    it('should update only description', async () => {
      req.params = { id: 'type-1' };
      req.body = { description: 'Nouvelle description' };
      mockUpdateEquipmentType.mockResolvedValue({ id: 'type-1', description: 'Nouvelle description' });

      await updateType(req, res);

      expect(mockUpdateEquipmentType).toHaveBeenCalledWith('type-1', req.body);
    });

    it('should handle type not found', async () => {
      req.params = { id: 'non-existent' };
      req.body = { name: 'Test' };
      mockUpdateEquipmentType.mockRejectedValue(new Error('Equipment type not found'));

      await expect(updateType(req, res)).rejects.toThrow('Equipment type not found');
    });

    it('should handle duplicate name', async () => {
      req.params = { id: 'type-1' };
      req.body = { name: 'Existing Name' };
      mockUpdateEquipmentType.mockRejectedValue(new Error('Name already exists'));

      await expect(updateType(req, res)).rejects.toThrow('Name already exists');
    });

    it('should include French success message', async () => {
      req.params = { id: 'type-1' };
      req.body = { name: 'Test' };
      mockUpdateEquipmentType.mockResolvedValue({ id: 'type-1' });

      await updateType(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe("Type d'équipement modifié avec succès");
    });
  });

  describe('deleteType', () => {
    it('should delete equipment type successfully', async () => {
      req.params = { id: 'type-1' };
      mockDeleteEquipmentType.mockResolvedValue(undefined);

      await deleteType(req, res);

      expect(mockDeleteEquipmentType).toHaveBeenCalledWith('type-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Type d'équipement supprimé avec succès"
      });
    });

    it('should handle type not found', async () => {
      req.params = { id: 'non-existent' };
      mockDeleteEquipmentType.mockRejectedValue(new Error('Equipment type not found'));

      await expect(deleteType(req, res)).rejects.toThrow('Equipment type not found');
    });

    it('should handle type in use', async () => {
      req.params = { id: 'type-1' };
      mockDeleteEquipmentType.mockRejectedValue(new Error('Type has associated models'));

      await expect(deleteType(req, res)).rejects.toThrow('Type has associated models');
    });

    it('should include French success message', async () => {
      req.params = { id: 'type-1' };
      mockDeleteEquipmentType.mockResolvedValue(undefined);

      await deleteType(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe("Type d'équipement supprimé avec succès");
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors', async () => {
      req.params = { id: 'type-1' };
      mockGetEquipmentTypeById.mockRejectedValue(new Error('Database error'));

      await expect(getTypeById(req, res)).rejects.toThrow('Database error');
    });

    it('should return consistent response format', async () => {
      mockGetAllEquipmentTypes.mockResolvedValue([]);

      await getAllTypes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it('should use 201 status for creation', async () => {
      req.body = { name: 'Test' };
      mockCreateEquipmentType.mockResolvedValue({ id: 'new' });

      await createType(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should include French messages in all CUD operations', async () => {
      // Create
      req.body = { name: 'Test' };
      mockCreateEquipmentType.mockResolvedValue({ id: 'test' });
      await createType(req, res);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');

      jest.clearAllMocks();

      // Update
      req.params = { id: 'test' };
      req.body = { name: 'Updated' };
      mockUpdateEquipmentType.mockResolvedValue({ id: 'test' });
      await updateType(req, res);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');

      jest.clearAllMocks();

      // Delete
      req.params = { id: 'test' };
      mockDeleteEquipmentType.mockResolvedValue(undefined);
      await deleteType(req, res);
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });
  });
});
