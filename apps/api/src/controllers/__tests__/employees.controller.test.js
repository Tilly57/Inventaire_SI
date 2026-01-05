/**
 * @fileoverview Unit tests for employees.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - Query parameter handling
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllEmployees = jest.fn();
const mockGetEmployeeById = jest.fn();
const mockCreateEmployee = jest.fn();
const mockBulkCreateEmployees = jest.fn();
const mockUpdateEmployee = jest.fn();
const mockDeleteEmployee = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../services/employees.service.js', () => ({
  getAllEmployees: mockGetAllEmployees,
  getEmployeeById: mockGetEmployeeById,
  createEmployee: mockCreateEmployee,
  bulkCreateEmployees: mockBulkCreateEmployees,
  updateEmployee: mockUpdateEmployee,
  deleteEmployee: mockDeleteEmployee
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

// Import controllers AFTER mocks
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  bulkCreateEmployees,
  updateEmployee,
  deleteEmployee
} = await import('../employees.controller.js');

describe('employees.controller', () => {
  let req, res;

  beforeEach(() => {
    // Mock Express request object
    req = {
      params: {},
      query: {},
      body: {},
      user: {}
    };

    // Mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('getAllEmployees', () => {
    const mockEmployees = [
      {
        id: 'emp-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        department: 'IT',
        phone: '+33612345678',
        _count: { loans: 3 },
        createdAt: new Date('2024-01-15T10:00:00Z')
      }
    ];

    it('should get all employees successfully', async () => {
      mockGetAllEmployees.mockResolvedValue(mockEmployees);

      await getAllEmployees(req, res);

      expect(mockGetAllEmployees).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmployees
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return empty array when no employees exist', async () => {
      mockGetAllEmployees.mockResolvedValue([]);

      await getAllEmployees(req, res);

      expect(mockGetAllEmployees).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockGetAllEmployees.mockRejectedValue(error);

      await expect(getAllEmployees(req, res)).rejects.toThrow('Database connection failed');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getEmployeeById', () => {
    const mockEmployee = {
      id: 'emp-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      department: 'IT',
      createdAt: new Date('2024-01-10T08:00:00Z')
    };

    it('should get employee by ID successfully', async () => {
      req.params = { id: 'emp-123' };
      mockGetEmployeeById.mockResolvedValue(mockEmployee);

      await getEmployeeById(req, res);

      expect(mockGetEmployeeById).toHaveBeenCalledWith('emp-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmployee
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle employee not found error', async () => {
      req.params = { id: 'non-existent' };
      const error = new Error('Employee not found');
      mockGetEmployeeById.mockRejectedValue(error);

      await expect(getEmployeeById(req, res)).rejects.toThrow('Employee not found');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors gracefully with asyncHandler', async () => {
      req.params = { id: 'emp-123' };
      const error = new Error('Database connection failed');
      mockGetEmployeeById.mockRejectedValue(error);

      await expect(getEmployeeById(req, res)).rejects.toThrow('Database connection failed');
    });

    it('should return consistent response format for success', async () => {
      const mockEmployee = {
        id: 'emp-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        loans: []
      };
      mockGetAllEmployees.mockResolvedValue([mockEmployee]);

      await getAllEmployees(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });
});
