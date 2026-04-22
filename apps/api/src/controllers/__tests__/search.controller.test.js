/**
 * @fileoverview Unit tests for search.controller.js
 *
 * Tests HTTP layer behavior:
 * - Query parameter parsing
 * - Empty/short query handling
 * - Service delegation
 * - Response formatting
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGlobalSearch = jest.fn();
const mockAutocompleteEmployees = jest.fn();
const mockAutocompleteAssetItems = jest.fn();
const mockAutocompleteAssetModels = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn);

jest.unstable_mockModule('../../services/search.service.js', () => ({
  globalSearch: mockGlobalSearch,
  autocompleteEmployees: mockAutocompleteEmployees,
  autocompleteAssetItems: mockAutocompleteAssetItems,
  autocompleteAssetModels: mockAutocompleteAssetModels,
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler,
}));

const mockSendSuccess = jest.fn();

jest.unstable_mockModule('../../utils/responseHelpers.js', () => ({
  sendSuccess: mockSendSuccess,
}));

// Import controllers AFTER mocks
const {
  globalSearch,
  autocompleteEmployees,
  autocompleteAssetItems,
  autocompleteAssetModels,
} = await import('../../controllers/search.controller.js');

// Helper to create mock req/res
function createMockReqRes(query = {}) {
  return {
    req: {
      user: { id: 'user1' },
      query,
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    },
  };
}

describe('Search Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch', () => {
    it('should return empty results for short query', async () => {
      const { req, res } = createMockReqRes({ q: 'a' });

      await globalSearch(req, res);

      expect(mockGlobalSearch).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(res, {
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
    });

    it('should return empty results for missing query', async () => {
      const { req, res } = createMockReqRes({});

      await globalSearch(req, res);

      expect(mockGlobalSearch).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(res, {
        employees: [],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      });
    });

    it('should call service with valid query', async () => {
      const mockResults = {
        employees: [{ id: 'e1', firstName: 'John' }],
        assetItems: [],
        assetModels: [],
        stockItems: [],
      };
      mockGlobalSearch.mockResolvedValue(mockResults);
      const { req, res } = createMockReqRes({ q: 'laptop dell', limit: 5 });

      await globalSearch(req, res);

      expect(mockGlobalSearch).toHaveBeenCalledWith({ query: 'laptop dell', limit: 5 });
      expect(mockSendSuccess).toHaveBeenCalledWith(res, mockResults);
    });

    it('should use default limit of 10', async () => {
      mockGlobalSearch.mockResolvedValue({ employees: [], assetItems: [], assetModels: [], stockItems: [] });
      const { req, res } = createMockReqRes({ q: 'test' });

      await globalSearch(req, res);

      expect(mockGlobalSearch).toHaveBeenCalledWith({ query: 'test', limit: 10 });
    });
  });

  describe('autocompleteEmployees', () => {
    it('should return empty array for short query', async () => {
      const { req, res } = createMockReqRes({ q: 'j' });

      await autocompleteEmployees(req, res);

      expect(mockAutocompleteEmployees).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(res, []);
    });

    it('should call service with valid query', async () => {
      const mockEmployees = [{ id: 'e1', firstName: 'John', lastName: 'Doe' }];
      mockAutocompleteEmployees.mockResolvedValue(mockEmployees);
      const { req, res } = createMockReqRes({ q: 'john', limit: 5 });

      await autocompleteEmployees(req, res);

      expect(mockAutocompleteEmployees).toHaveBeenCalledWith('john', 5);
      expect(mockSendSuccess).toHaveBeenCalledWith(res, mockEmployees);
    });

    it('should use default limit of 10', async () => {
      mockAutocompleteEmployees.mockResolvedValue([]);
      const { req, res } = createMockReqRes({ q: 'john' });

      await autocompleteEmployees(req, res);

      expect(mockAutocompleteEmployees).toHaveBeenCalledWith('john', 10);
    });
  });

  describe('autocompleteAssetItems', () => {
    it('should return empty array for short query', async () => {
      const { req, res } = createMockReqRes({ q: 'L' });

      await autocompleteAssetItems(req, res);

      expect(mockAutocompleteAssetItems).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(res, []);
    });

    it('should call service with availableOnly=true by default', async () => {
      mockAutocompleteAssetItems.mockResolvedValue([]);
      const { req, res } = createMockReqRes({ q: 'LAP' });

      await autocompleteAssetItems(req, res);

      expect(mockAutocompleteAssetItems).toHaveBeenCalledWith('LAP', 10, true);
    });

    it('should parse availableOnly=false', async () => {
      mockAutocompleteAssetItems.mockResolvedValue([]);
      const { req, res } = createMockReqRes({ q: 'LAP', availableOnly: 'false' });

      await autocompleteAssetItems(req, res);

      expect(mockAutocompleteAssetItems).toHaveBeenCalledWith('LAP', 10, false);
    });

    it('should forward results from service', async () => {
      const mockItems = [{ id: 'a1', assetTag: 'LAP-001' }];
      mockAutocompleteAssetItems.mockResolvedValue(mockItems);
      const { req, res } = createMockReqRes({ q: 'LAP', limit: 5 });

      await autocompleteAssetItems(req, res);

      expect(mockSendSuccess).toHaveBeenCalledWith(res, mockItems);
    });
  });

  describe('autocompleteAssetModels', () => {
    it('should return empty array for short query', async () => {
      const { req, res } = createMockReqRes({ q: 'd' });

      await autocompleteAssetModels(req, res);

      expect(mockAutocompleteAssetModels).not.toHaveBeenCalled();
      expect(mockSendSuccess).toHaveBeenCalledWith(res, []);
    });

    it('should call service with valid query', async () => {
      const mockModels = [{ id: 'm1', brand: 'Dell', modelName: 'Latitude 5520' }];
      mockAutocompleteAssetModels.mockResolvedValue(mockModels);
      const { req, res } = createMockReqRes({ q: 'dell', limit: 5 });

      await autocompleteAssetModels(req, res);

      expect(mockAutocompleteAssetModels).toHaveBeenCalledWith('dell', 5);
      expect(mockSendSuccess).toHaveBeenCalledWith(res, mockModels);
    });
  });
});
