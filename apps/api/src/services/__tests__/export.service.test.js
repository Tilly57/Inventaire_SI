/**
 * Unit tests for export.service.js
 *
 * Tests the Excel export functionality including:
 * - Employee export with filters
 * - Asset model export with filters
 * - Asset item export with filters
 * - Stock item export with filters
 * - Loan export with filters
 * - Dashboard multi-sheet export
 * - Date formatting
 * - Column width configuration
 */

import { jest } from '@jest/globals';

// Mock XLSX before importing service
const mockJsonToSheet = jest.fn(() => ({}));
const mockBookNew = jest.fn(() => ({ SheetNames: [], Sheets: {} }));
const mockBookAppendSheet = jest.fn();
const mockWrite = jest.fn(() => Buffer.from('mock-xlsx-data'));

jest.unstable_mockModule('xlsx', () => ({
  default: {
    utils: {
      json_to_sheet: mockJsonToSheet,
      book_new: mockBookNew,
      book_append_sheet: mockBookAppendSheet,
    },
    write: mockWrite,
  },
}));

// Mock Prisma client
const mockPrisma = {
  employee: {
    findMany: jest.fn(),
  },
  assetModel: {
    findMany: jest.fn(),
  },
  assetItem: {
    findMany: jest.fn(),
  },
  stockItem: {
    findMany: jest.fn(),
  },
  loan: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma,
}));

// Import service after mocks are set up
const {
  exportEmployees,
  exportAssetModels,
  exportAssetItems,
  exportStockItems,
  exportLoans,
  exportDashboard,
} = await import('../export.service.js');

describe('Export Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish default mock implementations
    mockJsonToSheet.mockReturnValue({});
    mockBookNew.mockReturnValue({ SheetNames: [], Sheets: {} });
    mockWrite.mockReturnValue(Buffer.from('mock-xlsx-data'));
  });

  describe('exportEmployees', () => {
    it('should export all employees without filters', async () => {
      const mockEmployees = [
        {
          lastName: 'Doe',
          firstName: 'John',
          email: 'john@test.com',
          dept: 'IT',
          createdAt: new Date('2024-01-15'),
        },
        {
          lastName: 'Smith',
          firstName: 'Jane',
          email: 'jane@test.com',
          dept: null,
          createdAt: new Date('2024-02-20'),
        },
      ];
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await exportEmployees();

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          select: {
            lastName: true,
            firstName: true,
            email: true,
            dept: true,
            createdAt: true,
          },
        })
      );
      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          Nom: 'Doe',
          'Pr\u00e9nom': 'John',
          Email: 'john@test.com',
          'D\u00e9partement': 'IT',
        }),
        expect.objectContaining({
          Nom: 'Smith',
          'Pr\u00e9nom': 'Jane',
          Email: 'jane@test.com',
          'D\u00e9partement': 'N/A',
        }),
      ]);
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Employ\u00e9s'
      );
      expect(mockWrite).toHaveBeenCalledWith(expect.anything(), {
        type: 'buffer',
        bookType: 'xlsx',
      });
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should apply search filter', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await exportEmployees({ search: 'john' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply department filter', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await exportEmployees({ dept: 'IT' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            dept: { contains: 'IT', mode: 'insensitive' },
          },
        })
      );
    });

    it('should apply both search and department filters', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await exportEmployees({ search: 'doe', dept: 'HR' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            dept: { contains: 'HR', mode: 'insensitive' },
          }),
        })
      );
    });

    it('should handle empty employee list', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      const result = await exportEmployees();

      expect(mockJsonToSheet).toHaveBeenCalledWith([]);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportAssetModels', () => {
    it('should export all asset models without filters', async () => {
      const mockModels = [
        {
          type: 'Laptop',
          brand: 'Dell',
          modelName: 'XPS 15',
          createdAt: new Date('2024-01-15'),
          _count: { assetItems: 5 },
        },
      ];
      mockPrisma.assetModel.findMany.mockResolvedValue(mockModels);

      const result = await exportAssetModels();

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: [{ type: 'asc' }, { brand: 'asc' }],
        })
      );
      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          Type: 'Laptop',
          Marque: 'Dell',
          'Mod\u00e8le': 'XPS 15',
          'Nombre articles': 5,
        }),
      ]);
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Mod\u00e8les'
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should apply type filter', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await exportAssetModels({ type: 'Laptop' });

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: { contains: 'Laptop', mode: 'insensitive' },
          },
        })
      );
    });

    it('should apply brand filter', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await exportAssetModels({ brand: 'Dell' });

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            brand: { contains: 'Dell', mode: 'insensitive' },
          },
        })
      );
    });

    it('should apply both type and brand filters', async () => {
      mockPrisma.assetModel.findMany.mockResolvedValue([]);

      await exportAssetModels({ type: 'Laptop', brand: 'Dell' });

      expect(mockPrisma.assetModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: { contains: 'Laptop', mode: 'insensitive' },
            brand: { contains: 'Dell', mode: 'insensitive' },
          },
        })
      );
    });
  });

  describe('exportAssetItems', () => {
    it('should export all asset items without filters', async () => {
      const mockItems = [
        {
          assetTag: 'LAP-001',
          serial: 'SN123',
          status: 'EN_STOCK',
          notes: 'Good condition',
          createdAt: new Date('2024-01-15'),
          assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
        },
      ];
      mockPrisma.assetItem.findMany.mockResolvedValue(mockItems);

      const result = await exportAssetItems();

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { assetTag: 'asc' },
          include: {
            assetModel: {
              select: { type: true, brand: true, modelName: true },
            },
          },
        })
      );
      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          'Tag Asset': 'LAP-001',
          'Num\u00e9ro s\u00e9rie': 'SN123',
          Type: 'Laptop',
          Marque: 'Dell',
          'Mod\u00e8le': 'XPS 15',
          Statut: 'En stock',
          Notes: 'Good condition',
        }),
      ]);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should apply status filter', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await exportAssetItems({ status: 'PRETE' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PRETE' },
        })
      );
    });

    it('should apply type filter via assetModel relation', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await exportAssetItems({ type: 'Laptop' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            assetModel: {
              type: { contains: 'Laptop', mode: 'insensitive' },
            },
          },
        })
      );
    });

    it('should apply assetModelId filter', async () => {
      mockPrisma.assetItem.findMany.mockResolvedValue([]);

      await exportAssetItems({ assetModelId: 'model-123' });

      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assetModelId: 'model-123' },
        })
      );
    });

    it('should display N/A for missing serial number', async () => {
      const mockItems = [
        {
          assetTag: 'LAP-001',
          serial: null,
          status: 'EN_STOCK',
          notes: null,
          createdAt: new Date('2024-01-15'),
          assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
        },
      ];
      mockPrisma.assetItem.findMany.mockResolvedValue(mockItems);

      await exportAssetItems();

      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          'Num\u00e9ro s\u00e9rie': 'N/A',
          Notes: '',
        }),
      ]);
    });

    it('should translate all status labels correctly', async () => {
      const mockItems = [
        { assetTag: 'A1', serial: null, status: 'EN_STOCK', notes: null, createdAt: new Date(), assetModel: { type: 'T', brand: 'B', modelName: 'M' } },
        { assetTag: 'A2', serial: null, status: 'PRETE', notes: null, createdAt: new Date(), assetModel: { type: 'T', brand: 'B', modelName: 'M' } },
        { assetTag: 'A3', serial: null, status: 'HS', notes: null, createdAt: new Date(), assetModel: { type: 'T', brand: 'B', modelName: 'M' } },
        { assetTag: 'A4', serial: null, status: 'REPARATION', notes: null, createdAt: new Date(), assetModel: { type: 'T', brand: 'B', modelName: 'M' } },
      ];
      mockPrisma.assetItem.findMany.mockResolvedValue(mockItems);

      await exportAssetItems();

      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({ Statut: 'En stock' }),
        expect.objectContaining({ Statut: 'Pr\u00eat\u00e9' }),
        expect.objectContaining({ Statut: 'Hors service' }),
        expect.objectContaining({ Statut: 'En r\u00e9paration' }),
      ]);
    });
  });

  describe('exportStockItems', () => {
    it('should export all stock items without filters', async () => {
      const mockItems = [
        {
          quantity: 10,
          loaned: 3,
          createdAt: new Date('2024-01-15'),
          assetModel: { type: 'Cable', brand: 'Generic', modelName: 'USB-C' },
        },
      ];
      mockPrisma.stockItem.findMany.mockResolvedValue(mockItems);

      const result = await exportStockItems();

      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { quantity: 'asc' },
        })
      );
      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          Type: 'Cable',
          Marque: 'Generic',
          'Mod\u00e8le': 'USB-C',
          'Quantit\u00e9 disponible': 10,
          'Quantit\u00e9 pr\u00eat\u00e9e': 3,
          'Quantit\u00e9 totale': 13,
        }),
      ]);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should apply lowStock filter', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([]);

      await exportStockItems({ lowStock: true });

      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { quantity: { lt: 5 } },
        })
      );
    });

    it('should not apply lowStock filter when false', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([]);

      await exportStockItems({ lowStock: false });

      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('exportLoans', () => {
    it('should export all loans without filters', async () => {
      const mockLoans = [
        {
          id: 'abcdefgh12345',
          status: 'OPEN',
          openedAt: new Date('2024-01-15'),
          closedAt: null,
          employee: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          lines: [
            {
              quantity: 1,
              assetItem: {
                assetTag: 'LAP-001',
                assetModel: { type: 'Laptop' },
              },
              stockItem: null,
            },
          ],
        },
      ];
      mockPrisma.loan.findMany.mockResolvedValue(mockLoans);

      const result = await exportLoans();

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { openedAt: 'desc' },
        })
      );
      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          'ID Pr\u00eat': 'abcdefgh',
          'Employ\u00e9': 'John Doe',
          Email: 'john@test.com',
          'Articles pr\u00eat\u00e9s': 'Laptop LAP-001',
          'Nombre articles': 1,
          Statut: 'Ouvert',
          'Date fermeture': 'N/A',
        }),
      ]);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should apply status filter', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportLoans({ status: 'CLOSED' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'CLOSED' },
        })
      );
    });

    it('should apply employeeId filter', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportLoans({ employeeId: 'emp-001' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 'emp-001' },
        })
      );
    });

    it('should apply date range filter', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportLoans({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            openedAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          },
        })
      );
    });

    it('should not apply date filter when only startDate is provided', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportLoans({ startDate: '2024-01-01' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should format stock item loan lines correctly', async () => {
      const mockLoans = [
        {
          id: 'abcdefgh12345',
          status: 'OPEN',
          openedAt: new Date('2024-01-15'),
          closedAt: null,
          employee: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          lines: [
            {
              quantity: 5,
              assetItem: null,
              stockItem: {
                assetModel: { modelName: 'USB-C Cable' },
              },
            },
          ],
        },
      ];
      mockPrisma.loan.findMany.mockResolvedValue(mockLoans);

      await exportLoans();

      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          'Articles pr\u00eat\u00e9s': 'USB-C Cable (x5)',
        }),
      ]);
    });

    it('should format closed loan with closedAt date', async () => {
      const mockLoans = [
        {
          id: 'abcdefgh12345',
          status: 'CLOSED',
          openedAt: new Date('2024-01-15'),
          closedAt: new Date('2024-02-20'),
          employee: { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
          lines: [],
        },
      ];
      mockPrisma.loan.findMany.mockResolvedValue(mockLoans);

      await exportLoans();

      expect(mockJsonToSheet).toHaveBeenCalledWith([
        expect.objectContaining({
          Statut: 'Ferm\u00e9',
          'Date fermeture': expect.any(String),
        }),
      ]);
      // Date fermeture should NOT be 'N/A' since closedAt is set
      const callArgs = mockJsonToSheet.mock.calls[0][0];
      expect(callArgs[0]['Date fermeture']).not.toBe('N/A');
    });
  });

  describe('exportDashboard', () => {
    it('should create multi-sheet workbook with all data', async () => {
      // Mock stats query
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          total_employees: 50,
          total_assets: 100,
          available_assets: 75,
          active_loans: 10,
          low_stock_items: 5,
          out_of_stock_items: 2,
          last_updated: new Date('2024-01-15'),
        },
      ]);

      // Mock employees
      mockPrisma.employee.findMany.mockResolvedValue([
        { lastName: 'Doe', firstName: 'John', email: 'john@test.com', dept: 'IT' },
      ]);

      // Mock asset items (called twice: all items + EN_STOCK only)
      mockPrisma.assetItem.findMany
        .mockResolvedValueOnce([
          {
            assetTag: 'LAP-001',
            status: 'EN_STOCK',
            assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
          },
        ])
        .mockResolvedValueOnce([
          {
            assetTag: 'LAP-001',
            assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' },
          },
        ]);

      // Mock loans
      mockPrisma.loan.findMany.mockResolvedValue([
        {
          id: 'abcdefgh12345',
          openedAt: new Date('2024-01-15'),
          employee: { firstName: 'John', lastName: 'Doe' },
          _count: { lines: 2 },
        },
      ]);

      const result = await exportDashboard();

      // Should create 5 sheets: Vue d'ensemble, Employes, Equipements, Stock, Prets Actifs
      expect(mockBookAppendSheet).toHaveBeenCalledTimes(5);
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Vue d'ensemble"
      );
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Employ\u00e9s'
      );
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        '\u00c9quipements'
      );
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Stock'
      );
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Pr\u00eats Actifs'
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle empty stats gracefully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{}]);
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.assetItem.findMany.mockResolvedValue([]);
      mockPrisma.loan.findMany.mockResolvedValue([]);

      const result = await exportDashboard();

      // Should still produce a workbook with 5 sheets
      expect(mockBookAppendSheet).toHaveBeenCalledTimes(5);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should query open loans only for active loans sheet', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{}]);
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.assetItem.findMany.mockResolvedValue([]);
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportDashboard();

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
        })
      );
    });

    it('should query EN_STOCK items for stock sheet', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{}]);
      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.assetItem.findMany.mockResolvedValue([]);
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await exportDashboard();

      // Second call to assetItem.findMany should be for EN_STOCK
      expect(mockPrisma.assetItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'EN_STOCK' },
        })
      );
    });
  });
});
