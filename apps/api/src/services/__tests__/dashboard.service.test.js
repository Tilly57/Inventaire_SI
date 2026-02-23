/**
 * Unit Tests for Dashboard Service
 *
 * Tests for dashboard statistics business logic:
 * - Fetching dashboard stats from materialized view
 * - Refreshing materialized view
 * - Cache management
 * - Error handling for empty views and database errors
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma client BEFORE importing service
const mockPrisma = {
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn()
};

jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

// Mock logger
const mockLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: mockLogger
}));

// Mock cache service
const mockCacheGet = jest.fn((key, fn) => fn()); // Execute function directly
const mockCacheDel = jest.fn();
const mockCacheGenerateKey = jest.fn((entity, id) => `${entity}:${id}`);

jest.unstable_mockModule('../cache.service.js', () => ({
  getCached: mockCacheGet,
  del: mockCacheDel,
  generateKey: mockCacheGenerateKey,
  TTL: {
    DASHBOARD: 300
  }
}));

// Import service AFTER mocks are set up
const dashboardService = await import('../dashboard.service.js');

describe('Dashboard Service - getDashboardStats()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return dashboard stats from materialized view', async () => {
    const mockStats = [
      {
        total_employees: 50n,
        total_assets: 100n,
        available_assets: 75n,
        active_loans: 10n,
        low_stock_items: 5n,
        out_of_stock_items: 2n,
        last_updated: new Date('2026-01-22T12:00:00Z')
      }
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockStats);

    const result = await dashboardService.getDashboardStats();

    expect(result).toEqual({
      totalEmployees: 50,
      totalAssets: 100,
      availableAssets: 75,
      activeLoans: 10,
      lowStockItems: 5,
      outOfStockItems: 2,
      lastUpdated: new Date('2026-01-22T12:00:00Z')
    });

    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    expect(mockCacheGenerateKey).toHaveBeenCalledWith('dashboard', 'stats');
  });

  test('should convert BigInt values to Numbers correctly', async () => {
    const mockStats = [
      {
        total_employees: 999n, // BigInt
        total_assets: 1234n,
        available_assets: 567n,
        active_loans: 42n,
        low_stock_items: 15n,
        out_of_stock_items: 3n,
        last_updated: new Date()
      }
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockStats);

    const result = await dashboardService.getDashboardStats();

    // Verify all values are regular Numbers, not BigInts
    expect(typeof result.totalEmployees).toBe('number');
    expect(typeof result.totalAssets).toBe('number');
    expect(typeof result.availableAssets).toBe('number');
    expect(typeof result.activeLoans).toBe('number');
    expect(typeof result.lowStockItems).toBe('number');
    expect(typeof result.outOfStockItems).toBe('number');

    expect(result.totalEmployees).toBe(999);
    expect(result.totalAssets).toBe(1234);
  });

  test('should return default values when view is empty', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await dashboardService.getDashboardStats();

    expect(result).toEqual({
      totalEmployees: 0,
      totalAssets: 0,
      availableAssets: 0,
      activeLoans: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      lastUpdated: expect.any(Date)
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Dashboard stats view is empty, returning defaults'
    );
  });

  test('should return default values when view is null', async () => {
    mockPrisma.$queryRaw.mockResolvedValue(null);

    const result = await dashboardService.getDashboardStats();

    expect(result).toEqual({
      totalEmployees: 0,
      totalAssets: 0,
      availableAssets: 0,
      activeLoans: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      lastUpdated: expect.any(Date)
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Dashboard stats view is empty, returning defaults'
    );
  });

  test('should handle zero values correctly', async () => {
    const mockStats = [
      {
        total_employees: 0n,
        total_assets: 0n,
        available_assets: 0n,
        active_loans: 0n,
        low_stock_items: 0n,
        out_of_stock_items: 0n,
        last_updated: new Date()
      }
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockStats);

    const result = await dashboardService.getDashboardStats();

    expect(result.totalEmployees).toBe(0);
    expect(result.totalAssets).toBe(0);
    expect(result.availableAssets).toBe(0);
    expect(result.activeLoans).toBe(0);
    expect(result.lowStockItems).toBe(0);
    expect(result.outOfStockItems).toBe(0);
  });

  test('should throw error if database query fails', async () => {
    const dbError = new Error('Database connection failed');
    mockPrisma.$queryRaw.mockRejectedValue(dbError);

    await expect(dashboardService.getDashboardStats()).rejects.toThrow(
      'Database connection failed'
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching dashboard stats:',
      dbError
    );
  });

  test('should use cache with correct TTL', async () => {
    const mockStats = [
      {
        total_employees: 10n,
        total_assets: 20n,
        available_assets: 15n,
        active_loans: 3n,
        low_stock_items: 1n,
        out_of_stock_items: 0n,
        last_updated: new Date()
      }
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockStats);

    await dashboardService.getDashboardStats();

    // Verify getCached was called with key, function, and TTL
    expect(mockCacheGet).toHaveBeenCalled();
    const [cacheKey, , ttl] = mockCacheGet.mock.calls[0];
    expect(cacheKey).toBe('dashboard:stats');
    expect(ttl).toBe(300); // TTL.DASHBOARD
  });
});

describe('Dashboard Service - refreshDashboardStats()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should refresh materialized view successfully', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(undefined);

    await dashboardService.refreshDashboardStats();

    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    expect(mockCacheDel).toHaveBeenCalledWith('dashboard:stats');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Dashboard stats view refreshed successfully'
    );
  });

  test('should invalidate cache after refresh', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(undefined);

    await dashboardService.refreshDashboardStats();

    expect(mockCacheGenerateKey).toHaveBeenCalledWith('dashboard', 'stats');
    expect(mockCacheDel).toHaveBeenCalledWith('dashboard:stats');
  });

  test('should throw error if refresh fails', async () => {
    const refreshError = new Error('View refresh failed');
    mockPrisma.$executeRaw.mockRejectedValue(refreshError);

    await expect(dashboardService.refreshDashboardStats()).rejects.toThrow(
      'View refresh failed'
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error refreshing dashboard stats:',
      refreshError
    );
  });

  test('should not invalidate cache if refresh fails', async () => {
    const refreshError = new Error('View refresh failed');
    mockPrisma.$executeRaw.mockRejectedValue(refreshError);

    try {
      await dashboardService.refreshDashboardStats();
    } catch (error) {
      // Expected to throw
    }

    // Cache del should not be called when refresh fails
    expect(mockCacheDel).not.toHaveBeenCalled();
  });
});
