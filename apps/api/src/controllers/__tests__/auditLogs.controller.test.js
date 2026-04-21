/**
 * @fileoverview Unit tests for auditLogs.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling for audit log queries
 * - Query parameter parsing and filtering
 * - Limit clamping (1-100, default 50)
 * - Route-based vs query-based record lookup
 * - Error handling
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAuditLogs = jest.fn();
const mockGetUserAuditLogs = jest.fn();
const mockGetRecentAuditLogs = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../utils/auditLog.js', () => ({
  getAuditLogs: mockGetAuditLogs,
  getUserAuditLogs: mockGetUserAuditLogs,
  getRecentAuditLogs: mockGetRecentAuditLogs,
  createAuditLog: jest.fn(),
  getIpAddress: jest.fn(),
  getUserAgent: jest.fn(),
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

// Import controllers AFTER mocks
const { getAuditLogs, getRecordAuditLogs } = await import('../auditLogs.controller.js');

describe('auditLogs.controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    const mockLogs = [
      {
        id: 'log1',
        userId: 'user1',
        action: 'CREATE',
        tableName: 'Employee',
        recordId: 'emp1',
        oldValues: null,
        newValues: { firstName: 'John' },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        user: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
      },
      {
        id: 'log2',
        userId: 'user1',
        action: 'UPDATE',
        tableName: 'Employee',
        recordId: 'emp1',
        oldValues: { firstName: 'John' },
        newValues: { firstName: 'Johnny' },
        createdAt: new Date('2024-01-16T14:00:00Z'),
        user: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
      },
    ];

    describe('filter by tableName and recordId', () => {
      it('should get logs for a specific record when tableName and recordId are provided', async () => {
        req.query = { tableName: 'Employee', recordId: 'emp1' };
        mockGetAuditLogs.mockResolvedValue(mockLogs);

        await getAuditLogs(req, res);

        expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 50);
        expect(mockGetUserAuditLogs).not.toHaveBeenCalled();
        expect(mockGetRecentAuditLogs).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockLogs,
        });
      });

      it('should use custom limit when provided', async () => {
        req.query = { tableName: 'Employee', recordId: 'emp1', limit: '25' };
        mockGetAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 25);
      });
    });

    describe('filter by userId', () => {
      it('should get logs for a specific user when userId is provided', async () => {
        req.query = { userId: 'user1' };
        mockGetUserAuditLogs.mockResolvedValue(mockLogs);

        await getAuditLogs(req, res);

        expect(mockGetUserAuditLogs).toHaveBeenCalledWith('user1', 50);
        expect(mockGetAuditLogs).not.toHaveBeenCalled();
        expect(mockGetRecentAuditLogs).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockLogs,
        });
      });

      it('should use custom limit for user logs', async () => {
        req.query = { userId: 'user1', limit: '10' };
        mockGetUserAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetUserAuditLogs).toHaveBeenCalledWith('user1', 10);
      });
    });

    describe('no filters (recent logs)', () => {
      it('should get recent logs when no filters are provided', async () => {
        req.query = {};
        mockGetRecentAuditLogs.mockResolvedValue(mockLogs);

        await getAuditLogs(req, res);

        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(50);
        expect(mockGetAuditLogs).not.toHaveBeenCalled();
        expect(mockGetUserAuditLogs).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockLogs,
        });
      });

      it('should use custom limit for recent logs', async () => {
        req.query = { limit: '30' };
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(30);
      });
    });

    describe('filter priority', () => {
      it('should prioritize tableName+recordId over userId', async () => {
        req.query = { tableName: 'Employee', recordId: 'emp1', userId: 'user1' };
        mockGetAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 50);
        expect(mockGetUserAuditLogs).not.toHaveBeenCalled();
      });

      it('should fall through to userId when only tableName is provided (no recordId)', async () => {
        req.query = { tableName: 'Employee', userId: 'user1' };
        mockGetUserAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetUserAuditLogs).toHaveBeenCalledWith('user1', 50);
        expect(mockGetAuditLogs).not.toHaveBeenCalled();
      });
    });

    describe('limit clamping', () => {
      it('should default to 50 when limit is not provided', async () => {
        req.query = {};
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(50);
      });

      it('should cap limit at 100', async () => {
        req.query = { limit: '200' };
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(100);
      });

      it('should fallback to 50 when limit is 0 (falsy)', async () => {
        req.query = { limit: '0' };
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        // parseInt('0') is 0, which is falsy, so || 50 kicks in
        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(50);
      });

      it('should handle negative limit by clamping to 1', async () => {
        req.query = { limit: '-10' };
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        // parseInt('-10') is -10, which is truthy, so Math.max(-10, 1) = 1
        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(1);
      });

      it('should default to 50 when limit is NaN', async () => {
        req.query = { limit: 'abc' };
        mockGetRecentAuditLogs.mockResolvedValue([]);

        await getAuditLogs(req, res);

        // parseInt('abc') is NaN, so || 50 kicks in, then clamped
        expect(mockGetRecentAuditLogs).toHaveBeenCalledWith(50);
      });
    });

    describe('error handling', () => {
      it('should propagate database errors', async () => {
        req.query = {};
        const error = new Error('Database connection failed');
        mockGetRecentAuditLogs.mockRejectedValue(error);

        await expect(getAuditLogs(req, res)).rejects.toThrow('Database connection failed');
        expect(res.json).not.toHaveBeenCalled();
      });

      it('should propagate errors from getAuditLogs', async () => {
        req.query = { tableName: 'Employee', recordId: 'emp1' };
        const error = new Error('Failed to fetch audit logs');
        mockGetAuditLogs.mockRejectedValue(error);

        await expect(getAuditLogs(req, res)).rejects.toThrow('Failed to fetch audit logs');
      });

      it('should propagate errors from getUserAuditLogs', async () => {
        req.query = { userId: 'user1' };
        const error = new Error('Failed to fetch user audit logs');
        mockGetUserAuditLogs.mockRejectedValue(error);

        await expect(getAuditLogs(req, res)).rejects.toThrow('Failed to fetch user audit logs');
      });
    });
  });

  describe('getRecordAuditLogs', () => {
    const mockLogs = [
      {
        id: 'log1',
        action: 'CREATE',
        tableName: 'Loan',
        recordId: 'loan1',
        user: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
      },
    ];

    it('should get audit logs for a specific record via route params', async () => {
      req.params = { tableName: 'Loan', recordId: 'loan1' };
      req.query = {};
      mockGetAuditLogs.mockResolvedValue(mockLogs);

      await getRecordAuditLogs(req, res);

      expect(mockGetAuditLogs).toHaveBeenCalledWith('Loan', 'loan1', 50);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLogs,
      });
    });

    it('should use custom limit from query params', async () => {
      req.params = { tableName: 'Loan', recordId: 'loan1' };
      req.query = { limit: '10' };
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      expect(mockGetAuditLogs).toHaveBeenCalledWith('Loan', 'loan1', 10);
    });

    it('should cap limit at 100', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp1' };
      req.query = { limit: '500' };
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 100);
    });

    it('should fallback to 50 when limit is 0 (falsy)', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp1' };
      req.query = { limit: '0' };
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      // parseInt('0') is 0, which is falsy, so || 50 kicks in
      expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 50);
    });

    it('should default to 50 when limit is not provided', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp1' };
      req.query = {};
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      expect(mockGetAuditLogs).toHaveBeenCalledWith('Employee', 'emp1', 50);
    });

    it('should handle empty results', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp-nonexistent' };
      req.query = {};
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should propagate errors', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp1' };
      req.query = {};
      const error = new Error('Database error');
      mockGetAuditLogs.mockRejectedValue(error);

      await expect(getRecordAuditLogs(req, res)).rejects.toThrow('Database error');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('HTTP layer behavior', () => {
    it('should return consistent response format for getAuditLogs', async () => {
      req.query = {};
      mockGetRecentAuditLogs.mockResolvedValue([]);

      await getAuditLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it('should return consistent response format for getRecordAuditLogs', async () => {
      req.params = { tableName: 'Employee', recordId: 'emp1' };
      req.query = {};
      mockGetAuditLogs.mockResolvedValue([]);

      await getRecordAuditLogs(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it('should handle async errors gracefully with asyncHandler', async () => {
      req.query = {};
      const error = new Error('Unexpected error');
      mockGetRecentAuditLogs.mockRejectedValue(error);

      await expect(getAuditLogs(req, res)).rejects.toThrow('Unexpected error');
    });
  });
});
