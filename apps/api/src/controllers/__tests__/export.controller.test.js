/**
 * @fileoverview Unit tests for export.controller.js
 *
 * Tests HTTP layer behavior:
 * - Content-Type and Content-Disposition headers
 * - Query parameter forwarding to service
 * - Error handling (500 responses)
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

// Helper to create mock req/res
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
  };
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
      const { req, res } = createMockReqRes({ search: 'john', dept: 'IT' });

      await exportEmployeesController(req, res);

      expect(mockExportEmployees).toHaveBeenCalledWith({ search: 'john', dept: 'IT' });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', XLSX_CONTENT_TYPE);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/^attachment; filename="Employes_\d{4}-\d{2}-\d{2}\.xlsx"$/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export employees without filters', async () => {
      mockExportEmployees.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes();

      await exportEmployeesController(req, res);

      expect(mockExportEmployees).toHaveBeenCalledWith({ search: undefined, dept: undefined });
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should return 500 on service error', async () => {
      mockExportEmployees.mockRejectedValue(new Error('DB error'));
      const { req, res } = createMockReqRes();

      await exportEmployeesController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Erreur lors de l'export des employés",
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('exportAssetModelsController', () => {
    it('should export asset models with filters', async () => {
      mockExportAssetModels.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes({ type: 'Laptop', brand: 'Dell' });

      await exportAssetModelsController(req, res);

      expect(mockExportAssetModels).toHaveBeenCalledWith({ type: 'Laptop', brand: 'Dell' });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Modeles_Equipements_/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should return 500 on error', async () => {
      mockExportAssetModels.mockRejectedValue(new Error('fail'));
      const { req, res } = createMockReqRes();

      await exportAssetModelsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportAssetItemsController', () => {
    it('should export asset items with status filter', async () => {
      mockExportAssetItems.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes({ status: 'EN_STOCK', type: 'Laptop', assetModelId: 'cm1' });

      await exportAssetItemsController(req, res);

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

    it('should return 500 on error', async () => {
      mockExportAssetItems.mockRejectedValue(new Error('fail'));
      const { req, res } = createMockReqRes();

      await exportAssetItemsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportStockItemsController', () => {
    it('should export stock items', async () => {
      mockExportStockItems.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes({ lowStock: 'false' });

      await exportStockItemsController(req, res);

      expect(mockExportStockItems).toHaveBeenCalledWith({ lowStock: false });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Stock_\d{4}/)
      );
    });

    it('should export low stock items with different filename', async () => {
      mockExportStockItems.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes({ lowStock: 'true' });

      await exportStockItemsController(req, res);

      expect(mockExportStockItems).toHaveBeenCalledWith({ lowStock: true });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Stock_Bas_/)
      );
    });

    it('should return 500 on error', async () => {
      mockExportStockItems.mockRejectedValue(new Error('fail'));
      const { req, res } = createMockReqRes();

      await exportStockItemsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportLoansController', () => {
    it('should export loans with date range', async () => {
      mockExportLoans.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes({
        status: 'OPEN',
        employeeId: 'emp1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      await exportLoansController(req, res);

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

    it('should return 500 on error', async () => {
      mockExportLoans.mockRejectedValue(new Error('fail'));
      const { req, res } = createMockReqRes();

      await exportLoansController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('exportDashboardController', () => {
    it('should export dashboard with correct filename', async () => {
      mockExportDashboard.mockResolvedValue(mockBuffer);
      const { req, res } = createMockReqRes();

      await exportDashboardController(req, res);

      expect(mockExportDashboard).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/Dashboard_Complet_/)
      );
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should return 500 on error', async () => {
      mockExportDashboard.mockRejectedValue(new Error('fail'));
      const { req, res } = createMockReqRes();

      await exportDashboardController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Erreur lors de l'export du dashboard",
      });
    });
  });
});
