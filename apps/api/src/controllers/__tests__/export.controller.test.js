/**
 * @fileoverview Unit tests for export.controller.js
 *
 * Tests HTTP layer behavior:
 * - Content-Type and Content-Disposition headers
 * - Query parameter forwarding to service
 * - Error propagation to Express error middleware via asyncHandler
 * - Filename generation with timestamp
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockExportEmployees = jest.fn();
const mockExportAssetModels = jest.fn();
const mockExportAssetItems = jest.fn();
const mockExportStockItems = jest.fn();
const mockExportLoans = jest.fn();
const mockExportDashboard = jest.fn();

jest.unstable_mockModule('../../services/export.service.js', () => ({
  exportEmployees: mockExportEmployees,
  exportAssetModels: mockExportAssetModels,
  exportAssetItems: mockExportAssetItems,
  exportStockItems: mockExportStockItems,
  exportLoans: mockExportLoans,
  exportDashboard: mockExportDashboard,
}));

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: mockLogger,
}));

// Import controllers AFTER mocks
const {
  exportEmployeesController,
  exportAssetModelsController,
  exportAssetItemsController,
  exportStockItemsController,
  exportLoansController,
  exportDashboardController,
} = await import('../../controllers/export.controller.js');

// Helper to create mock req/res/next
function createMockReqRes(query = {}) {
  return {
    req: {
      user: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
      query,
    },
    res: {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    },
    next: jest.fn(),
  };
}

// asyncHandler wraps errors and forwards them to next(err).
// We await the returned promise so the catch chain settles before assertions.
async function invoke(controller, req, res, next) {
  await controller(req, res, next);
}

describe('Export Controller', () => {
  const mockBuffer = Buffer.from('mock-xlsx-data');
  const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportEmployeesController', () => {
    it('should export employees with correct headers', async () => {
      mockExportEmployees.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({ search: 'john', dept: 'IT' });

      await invoke(exportEmployeesController, req, res, next);

      expect(mockExportEmployees).toHaveBeenCalledWith({ search: 'john', dept: 'IT' });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', XLSX_CONTENT_TYPE);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="Employes_\d{4}-\d{2}-\d{2}\.xlsx"$/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
      expect(next).not.toHaveBeenCalled();
    });

    it('should export employees without filters', async () => {
      mockExportEmployees.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes();

      await invoke(exportEmployeesController, req, res, next);

      expect(mockExportEmployees).toHaveBeenCalledWith({ search: undefined, dept: undefined });
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should forward errors to next() on service failure', async () => {
      const err = new Error('DB error');
      mockExportEmployees.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportEmployeesController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('exportAssetModelsController', () => {
    it('should export asset models with filters', async () => {
      mockExportAssetModels.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({ type: 'Laptop', brand: 'Dell' });

      await invoke(exportAssetModelsController, req, res, next);

      expect(mockExportAssetModels).toHaveBeenCalledWith({ type: 'Laptop', brand: 'Dell' });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Modeles_Equipements_/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should forward errors to next() on failure', async () => {
      const err = new Error('fail');
      mockExportAssetModels.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportAssetModelsController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('exportAssetItemsController', () => {
    it('should export asset items with status filter', async () => {
      mockExportAssetItems.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({ status: 'EN_STOCK', type: 'Laptop', assetModelId: 'cm1' });

      await invoke(exportAssetItemsController, req, res, next);

      expect(mockExportAssetItems).toHaveBeenCalledWith({
        status: 'EN_STOCK',
        type: 'Laptop',
        assetModelId: 'cm1',
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Equipements_/)
      );
    });

    it('should forward errors to next() on failure', async () => {
      const err = new Error('fail');
      mockExportAssetItems.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportAssetItemsController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('exportStockItemsController', () => {
    it('should export stock items', async () => {
      mockExportStockItems.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({ lowStock: 'false' });

      await invoke(exportStockItemsController, req, res, next);

      expect(mockExportStockItems).toHaveBeenCalledWith({ lowStock: false });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Stock_\d{4}/)
      );
    });

    it('should export low stock items with different filename', async () => {
      mockExportStockItems.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({ lowStock: 'true' });

      await invoke(exportStockItemsController, req, res, next);

      expect(mockExportStockItems).toHaveBeenCalledWith({ lowStock: true });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Stock_Bas_/)
      );
    });

    it('should forward errors to next() on failure', async () => {
      const err = new Error('fail');
      mockExportStockItems.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportStockItemsController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('exportLoansController', () => {
    it('should export loans with date range', async () => {
      mockExportLoans.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes({
        status: 'OPEN',
        employeeId: 'emp1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      await invoke(exportLoansController, req, res, next);

      expect(mockExportLoans).toHaveBeenCalledWith({
        status: 'OPEN',
        employeeId: 'emp1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Prets_/)
      );
    });

    it('should forward errors to next() on failure', async () => {
      const err = new Error('fail');
      mockExportLoans.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportLoansController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('exportDashboardController', () => {
    it('should export dashboard with correct filename', async () => {
      mockExportDashboard.mockResolvedValue(mockBuffer);
      const { req, res, next } = createMockReqRes();

      await invoke(exportDashboardController, req, res, next);

      expect(mockExportDashboard).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Dashboard_Complet_/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should forward errors to next() on failure', async () => {
      const err = new Error('fail');
      mockExportDashboard.mockRejectedValue(err);
      const { req, res, next } = createMockReqRes();

      await invoke(exportDashboardController, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
