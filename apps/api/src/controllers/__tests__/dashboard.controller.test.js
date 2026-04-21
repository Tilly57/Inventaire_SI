/**
 * @fileoverview Unit tests for dashboard.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling for dashboard stats
 * - Manual stats refresh endpoint
 * - Status codes and response format
 * - Error handling
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetDashboardStats = jest.fn();
const mockRefreshDashboardStats = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../services/dashboard.service.js', () => ({
  getDashboardStats: mockGetDashboardStats,
  refreshDashboardStats: mockRefreshDashboardStats,
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

// Import controllers AFTER mocks
const { getStats, refreshStats } = await import('../dashboard.controller.js');

describe('dashboard.controller', () => {
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

  describe('getStats', () => {
    const mockStats = {
      totalEmployees: 50,
      totalAssets: 100,
      availableAssets: 75,
      activeLoans: 10,
      lowStockItems: 5,
      outOfStockItems: 2,
      lastUpdated: new Date('2026-01-22T12:00:00Z'),
    };

    it('should return dashboard stats successfully', async () => {
      mockGetDashboardStats.mockResolvedValue(mockStats);

      await getStats(req, res);

      expect(mockGetDashboardStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should return default stats when view is empty', async () => {
      const defaultStats = {
        totalEmployees: 0,
        totalAssets: 0,
        availableAssets: 0,
        activeLoans: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        lastUpdated: expect.any(Date),
      };
      mockGetDashboardStats.mockResolvedValue(defaultStats);

      await getStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: defaultStats,
      });
    });

    it('should handle database error', async () => {
      const error = new Error('Database connection failed');
      mockGetDashboardStats.mockRejectedValue(error);

      await expect(getStats(req, res)).rejects.toThrow('Database connection failed');
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should not set explicit status code (defaults to 200)', async () => {
      mockGetDashboardStats.mockResolvedValue(mockStats);

      await getStats(req, res);

      // The controller uses res.json() directly without res.status()
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('refreshStats', () => {
    const mockStats = {
      totalEmployees: 55,
      totalAssets: 110,
      availableAssets: 80,
      activeLoans: 12,
      lowStockItems: 3,
      outOfStockItems: 1,
      lastUpdated: new Date('2026-01-22T12:05:00Z'),
    };

    it('should refresh stats and return updated data', async () => {
      mockRefreshDashboardStats.mockResolvedValue(undefined);
      mockGetDashboardStats.mockResolvedValue(mockStats);

      await refreshStats(req, res);

      expect(mockRefreshDashboardStats).toHaveBeenCalled();
      expect(mockGetDashboardStats).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Dashboard statistics refreshed successfully',
        data: mockStats,
      });
    });

    it('should call refreshDashboardStats before getDashboardStats', async () => {
      const callOrder = [];
      mockRefreshDashboardStats.mockImplementation(() => {
        callOrder.push('refresh');
        return Promise.resolve();
      });
      mockGetDashboardStats.mockImplementation(() => {
        callOrder.push('getStats');
        return Promise.resolve({});
      });

      await refreshStats(req, res);

      expect(callOrder).toEqual(['refresh', 'getStats']);
    });

    it('should handle refresh error', async () => {
      const error = new Error('View refresh failed');
      mockRefreshDashboardStats.mockRejectedValue(error);

      await expect(refreshStats(req, res)).rejects.toThrow('View refresh failed');
      expect(mockGetDashboardStats).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle getDashboardStats error after successful refresh', async () => {
      mockRefreshDashboardStats.mockResolvedValue(undefined);
      const error = new Error('Failed to fetch stats after refresh');
      mockGetDashboardStats.mockRejectedValue(error);

      await expect(refreshStats(req, res)).rejects.toThrow('Failed to fetch stats after refresh');
      expect(mockRefreshDashboardStats).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should include success message in response', async () => {
      mockRefreshDashboardStats.mockResolvedValue(undefined);
      mockGetDashboardStats.mockResolvedValue({});

      await refreshStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Dashboard statistics refreshed successfully',
        })
      );
    });
  });

  describe('HTTP layer behavior', () => {
    it('should return consistent response format for getStats', async () => {
      mockGetDashboardStats.mockResolvedValue({ totalEmployees: 0 });

      await getStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
        })
      );
    });

    it('should return consistent response format for refreshStats', async () => {
      mockRefreshDashboardStats.mockResolvedValue(undefined);
      mockGetDashboardStats.mockResolvedValue({ totalEmployees: 0 });

      await refreshStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object),
          message: expect.any(String),
        })
      );
    });
  });
});
