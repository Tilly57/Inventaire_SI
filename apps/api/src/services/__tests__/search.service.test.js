/**
 * Unit tests for search.service.js
 *
 * Tests the search functionality including:
 * - Global full-text search across multiple entities
 * - Autocomplete for employees, asset items, and asset models
 * - Input validation and edge cases
 * - Error handling
 */

import { jest } from '@jest/globals';

// Mock Prisma client before importing service
const mockPrisma = {
  $queryRaw: jest.fn(),
  employee: {
    findMany: jest.fn(),
  },
  assetItem: {
    findMany: jest.fn(),
  },
  assetModel: {
    findMany: jest.fn(),
  },
};

jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma,
}));

// Mock logger with createContextLogger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: mockLogger,
  createContextLogger: jest.fn(() => mockLogger),
}));

// Import service after mocks are set up
const {
  globalSearch,
  autocompleteEmployees,
  autocompleteAssetItems,
  autocompleteAssetModels,
} = await import('../search.service.js');

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch', () => {
    it('should return empty results when query is empty', async () => {
      const result = await globalSearch({ query: '' });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return empty results when query is null', async () => {
      const result = await globalSearch({ query: null });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return empty results when query is undefined', async () => {
      const result = await globalSearch({ query: undefined });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
    });

    it('should return empty results when query is too short (less than 2 chars)', async () => {
      const result = await globalSearch({ query: 'a' });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should return empty results when query is only whitespace', async () => {
      const result = await globalSearch({ query: '   ' });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
    });

    it('should execute parallel searches and return grouped results', async () => {
      const mockEmployees = [
        { id: 'emp1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', dept: 'IT', rank: 0.5 },
      ];
      const mockAssetItems = [
        { id: 'asset1', assetTag: 'LAP-001', serial: 'SN123', status: 'EN_STOCK', notes: null, type: 'Laptop', brand: 'Dell', modelName: 'XPS 15', rank: 0.8 },
      ];
      const mockAssetModels = [
        { id: 'model1', type: 'Laptop', brand: 'Dell', modelName: 'XPS 15', rank: 0.6 },
      ];
      const mockStockItems = [
        { id: 'stock1', quantity: 10, loaned: 2, notes: null, type: 'Cable', brand: 'Generic', modelName: 'USB-C', rank: 0.4 },
      ];

      // $queryRaw is called 4 times in parallel (Promise.all)
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockEmployees)
        .mockResolvedValueOnce(mockAssetItems)
        .mockResolvedValueOnce(mockAssetModels)
        .mockResolvedValueOnce(mockStockItems);

      const result = await globalSearch({ query: 'dell laptop' });

      expect(result).toEqual({
        employees: mockEmployees,
        assetItems: mockAssetItems,
        assetModels: mockAssetModels,
        stockItems: mockStockItems,
      });
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should use default limit of 10', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await globalSearch({ query: 'test' });

      // All 4 queries should have been called
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should cap limit at 50', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Even with limit 100, should cap at 50
      await globalSearch({ query: 'test', limit: 100 });

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should trim the search query', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await globalSearch({ query: '  dell  ' });

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should throw error and log when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.$queryRaw.mockRejectedValue(dbError);

      await expect(globalSearch({ query: 'test query' })).rejects.toThrow('Database connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Global search error',
        expect.objectContaining({
          error: 'Database connection failed',
        })
      );
    });

    it('should return empty arrays when no matches found', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await globalSearch({ query: 'nonexistent' });

      expect(result).toEqual({
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
    });
  });

  describe('autocompleteEmployees', () => {
    it('should return matching employees', async () => {
      const mockEmployees = [
        { id: 'emp1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', dept: 'IT' },
        { id: 'emp2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', dept: 'HR' },
      ];
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await autocompleteEmployees('doe');

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'doe', mode: 'insensitive' } },
              { lastName: { contains: 'doe', mode: 'insensitive' } },
              { email: { contains: 'doe', mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dept: true,
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          take: 10,
        })
      );
      expect(result).toEqual(mockEmployees);
    });

    it('should return empty array when query is too short', async () => {
      const result = await autocompleteEmployees('a');

      expect(result).toEqual([]);
      expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when query is null', async () => {
      const result = await autocompleteEmployees(null);

      expect(result).toEqual([]);
      expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when query is empty', async () => {
      const result = await autocompleteEmployees('');

      expect(result).toEqual([]);
      expect(mockPrisma.employee.findMany).not.toHaveBeenCalled();
    });

    it('should cap limit at 20', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await autocompleteEmployees('test', 50);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should use custom limit when under 20', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await autocompleteEmployees('test', 5);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('autocompleteAssetItems', () => {
    it('should return matching asset items with available only filter by default', async () => {
      const mockItems = [
        {
          id: 'asset1',
          assetTag: 'LAP-001',
          serial: 'SN123',
          status: 'EN_STOCK',
          assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
        },
      ];
      mockPrisma.assetItem.findMany.mockResolvedValue(mockItems);

      const result = await autocompleteAssetItems('LAP');

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { assetTag: { contains: 'LAP', mode: 'insensitive' } },
                  { serial: { contains: 'LAP', mode: 'insensitive' } },
                ],
              },
              { status: 'EN_STOCK' },
            ],
          },
          include: {
            assetModel: {
              select: {
                type: true,
                brand: true,
                modelName: true,
              },
            },
          },
          orderBy: { assetTag: 'asc' },
          take: 10,
        })
      );
      expect(result).toEqual(mockItems);
    });

    it('should include all statuses when availableOnly is false', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await autocompleteAssetItems('LAP', 10, false);

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { assetTag: { contains: 'LAP', mode: 'insensitive' } },
                  { serial: { contains: 'LAP', mode: 'insensitive' } },
                ],
              },
            ],
          },
        })
      );
    });

    it('should return empty array when query is too short', async () => {
      const result = await autocompleteAssetItems('L');

      expect(result).toEqual([]);
      expect(mockPrisma.assetItem.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when query is null', async () => {
      const result = await autocompleteAssetItems(null);

      expect(result).toEqual([]);
      expect(mockPrisma.assetItem.findMany).not.toHaveBeenCalled();
    });

    it('should cap limit at 20', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await autocompleteAssetItems('LAP', 100);

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });
  });

  describe('autocompleteAssetModels', () => {
    it('should return matching asset models', async () => {
      const mockModels = [
        { id: 'model1', type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
      ];
      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);

      const result = await autocompleteAssetModels('Dell');

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { type: { contains: 'Dell', mode: 'insensitive' } },
              { brand: { contains: 'Dell', mode: 'insensitive' } },
              { modelName: { contains: 'Dell', mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            type: true,
            brand: true,
            modelName: true,
          },
          orderBy: [{ type: 'asc' }, { brand: 'asc' }],
          take: 10,
        })
      );
      expect(result).toEqual(mockModels);
    });

    it('should return empty array when query is too short', async () => {
      const result = await autocompleteAssetModels('D');

      expect(result).toEqual([]);
      expect(mockPrisma.assetModel.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when query is null', async () => {
      const result = await autocompleteAssetModels(null);

      expect(result).toEqual([]);
      expect(mockPrisma.assetModel.findMany).not.toHaveBeenCalled();
    });

    it('should return empty array when query is empty string', async () => {
      const result = await autocompleteAssetModels('');

      expect(result).toEqual([]);
      expect(mockPrisma.assetModel.findMany).not.toHaveBeenCalled();
    });

    it('should cap limit at 20', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await autocompleteAssetModels('Dell', 50);

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });

    it('should use custom limit when under 20', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await autocompleteAssetModels('Dell', 3);

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });
  });
});
