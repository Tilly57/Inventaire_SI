/**
 * @fileoverview Unit tests for loans.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - Query parameter filtering
 * - File upload handling
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockGetAllLoans = jest.fn();
const mockGetLoanById = jest.fn();
const mockCreateLoan = jest.fn();
const mockAddLoanLine = jest.fn();
const mockRemoveLoanLine = jest.fn();
const mockUploadPickupSignature = jest.fn();
const mockUploadReturnSignature = jest.fn();
const mockCloseLoan = jest.fn();
const mockDeleteLoan = jest.fn();
const mockBatchDeleteLoans = jest.fn();
const mockDeletePickupSignature = jest.fn();
const mockDeleteReturnSignature = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../services/loans.service.js', () => ({
  getAllLoans: mockGetAllLoans,
  getLoanById: mockGetLoanById,
  createLoan: mockCreateLoan,
  addLoanLine: mockAddLoanLine,
  removeLoanLine: mockRemoveLoanLine,
  uploadPickupSignature: mockUploadPickupSignature,
  uploadReturnSignature: mockUploadReturnSignature,
  closeLoan: mockCloseLoan,
  deleteLoan: mockDeleteLoan,
  batchDeleteLoans: mockBatchDeleteLoans,
  deletePickupSignature: mockDeletePickupSignature,
  deleteReturnSignature: mockDeleteReturnSignature
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

// Import controllers AFTER mocks
const {
  getAllLoans,
  getLoanById,
  createLoan,
  addLoanLine,
  removeLoanLine,
  uploadPickupSignature,
  uploadReturnSignature,
  closeLoan,
  deleteLoan,
  batchDeleteLoans,
  deletePickupSignature,
  deleteReturnSignature
} = await import('../loans.controller.js');

describe('loans.controller', () => {
  let req, res;

  beforeEach(() => {
    // Mock Express request object
    req = {
      params: {},
      query: {},
      body: {},
      user: {},
      file: null
    };

    // Mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('getAllLoans', () => {
    const mockLoans = [
      {
        id: 'loan-123',
        status: 'OPEN',
        employee: { id: 'emp-001', firstName: 'John', lastName: 'Doe' },
        lines: [
          { id: 'line-001', assetItem: { assetTag: 'LAP-001', status: 'PRETE' } }
        ],
        pickupSignatureUrl: '/uploads/signatures/pickup-123.png',
        returnSignatureUrl: null,
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 'loan-456',
        status: 'CLOSED',
        employee: { id: 'emp-002', firstName: 'Jane', lastName: 'Smith' },
        lines: [],
        pickupSignatureUrl: '/uploads/signatures/pickup-456.png',
        returnSignatureUrl: '/uploads/signatures/return-456.png',
        closedAt: new Date('2024-01-20T14:00:00Z')
      }
    ];

    it('should get all loans without filters', async () => {
      mockGetAllLoans.mockResolvedValue(mockLoans);

      await getAllLoans(req, res);

      expect(mockGetAllLoans).toHaveBeenCalledWith({ status: undefined, employeeId: undefined });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoans
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should get loans filtered by status', async () => {
      req.query = { status: 'OPEN' };
      const openLoans = [mockLoans[0]];
      mockGetAllLoans.mockResolvedValue(openLoans);

      await getAllLoans(req, res);

      expect(mockGetAllLoans).toHaveBeenCalledWith({ status: 'OPEN', employeeId: undefined });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: openLoans
      });
    });

    it('should get loans filtered by employeeId', async () => {
      req.query = { employeeId: 'emp-001' };
      const employeeLoans = [mockLoans[0]];
      mockGetAllLoans.mockResolvedValue(employeeLoans);

      await getAllLoans(req, res);

      expect(mockGetAllLoans).toHaveBeenCalledWith({ status: undefined, employeeId: 'emp-001' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: employeeLoans
      });
    });

    it('should get loans filtered by both status and employeeId', async () => {
      req.query = { status: 'OPEN', employeeId: 'emp-001' };
      mockGetAllLoans.mockResolvedValue([mockLoans[0]]);

      await getAllLoans(req, res);

      expect(mockGetAllLoans).toHaveBeenCalledWith({ status: 'OPEN', employeeId: 'emp-001' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [mockLoans[0]]
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockGetAllLoans.mockRejectedValue(error);

      await expect(getAllLoans(req, res)).rejects.toThrow('Database connection failed');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getLoanById', () => {
    const mockLoan = {
      id: 'loan-123',
      status: 'OPEN',
      employee: { id: 'emp-001', firstName: 'John', lastName: 'Doe' },
      lines: [
        {
          id: 'line-001',
          assetItem: {
            id: 'asset-001',
            assetTag: 'LAP-001',
            status: 'PRETE',
            assetModel: { type: 'Laptop', brand: 'Dell', modelName: 'XPS 15' }
          }
        }
      ],
      pickupSignatureUrl: '/uploads/signatures/pickup-123.png',
      pickupSignedAt: new Date('2024-01-15T10:00:00Z'),
      returnSignatureUrl: null,
      returnSignedAt: null,
      closedAt: null
    };

    it('should get loan by ID successfully', async () => {
      req.params = { id: 'loan-123' };
      mockGetLoanById.mockResolvedValue(mockLoan);

      await getLoanById(req, res);

      expect(mockGetLoanById).toHaveBeenCalledWith('loan-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoan
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      const error = new Error('Loan not found');
      mockGetLoanById.mockRejectedValue(error);

      await expect(getLoanById(req, res)).rejects.toThrow('Loan not found');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('createLoan', () => {
    const mockCreatedLoan = {
      id: 'loan-new',
      status: 'OPEN',
      employeeId: 'emp-001',
      createdById: 'user-123',
      lines: [],
      createdAt: new Date('2024-01-15T10:00:00Z')
    };

    it('should create a new loan successfully', async () => {
      req.body = { employeeId: 'emp-001' };
      req.user = { userId: 'user-123' };
      mockCreateLoan.mockResolvedValue(mockCreatedLoan);

      await createLoan(req, res);

      expect(mockCreateLoan).toHaveBeenCalledWith('emp-001', 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedLoan
      });
    });

    it('should handle employee not found error', async () => {
      req.body = { employeeId: 'non-existent' };
      req.user = { userId: 'user-123' };
      const error = new Error('Employee not found');
      mockCreateLoan.mockRejectedValue(error);

      await expect(createLoan(req, res)).rejects.toThrow('Employee not found');
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle missing employeeId', async () => {
      req.body = {};
      req.user = { userId: 'user-123' };
      const error = new Error('Employee ID is required');
      mockCreateLoan.mockRejectedValue(error);

      await expect(createLoan(req, res)).rejects.toThrow('Employee ID is required');
    });
  });

  describe('addLoanLine', () => {
    const mockLoanLine = {
      id: 'line-new',
      loanId: 'loan-123',
      assetItemId: 'asset-001',
      assetItem: {
        id: 'asset-001',
        assetTag: 'LAP-001',
        status: 'PRETE'
      }
    };

    it('should add loan line successfully with asset item', async () => {
      req.params = { id: 'loan-123' };
      req.body = { assetItemId: 'asset-001' };
      mockAddLoanLine.mockResolvedValue(mockLoanLine);

      await addLoanLine(req, res);

      expect(mockAddLoanLine).toHaveBeenCalledWith('loan-123', { assetItemId: 'asset-001' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoanLine
      });
    });

    it('should add loan line with stock item and quantity', async () => {
      req.params = { id: 'loan-123' };
      req.body = { stockItemId: 'stock-001', quantity: 5 };
      const stockLoanLine = {
        id: 'line-stock',
        loanId: 'loan-123',
        stockItemId: 'stock-001',
        quantity: 5
      };
      mockAddLoanLine.mockResolvedValue(stockLoanLine);

      await addLoanLine(req, res);

      expect(mockAddLoanLine).toHaveBeenCalledWith('loan-123', { stockItemId: 'stock-001', quantity: 5 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: stockLoanLine
      });
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      req.body = { assetItemId: 'asset-001' };
      const error = new Error('Loan not found');
      mockAddLoanLine.mockRejectedValue(error);

      await expect(addLoanLine(req, res)).rejects.toThrow('Loan not found');
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle asset already borrowed error', async () => {
      req.params = { id: 'loan-123' };
      req.body = { assetItemId: 'asset-001' };
      const error = new Error('Asset already borrowed');
      mockAddLoanLine.mockRejectedValue(error);

      await expect(addLoanLine(req, res)).rejects.toThrow('Asset already borrowed');
    });
  });

  describe('removeLoanLine', () => {
    const mockResult = {
      message: 'Ligne de prêt supprimée avec succès'
    };

    it('should remove loan line successfully', async () => {
      req.params = { id: 'loan-123', lineId: 'line-001' };
      mockRemoveLoanLine.mockResolvedValue(mockResult);

      await removeLoanLine(req, res);

      expect(mockRemoveLoanLine).toHaveBeenCalledWith('loan-123', 'line-001');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle loan line not found error', async () => {
      req.params = { id: 'loan-123', lineId: 'non-existent' };
      const error = new Error('Loan line not found');
      mockRemoveLoanLine.mockRejectedValue(error);

      await expect(removeLoanLine(req, res)).rejects.toThrow('Loan line not found');
    });
  });

  describe('uploadPickupSignature', () => {
    const mockLoanWithSignature = {
      id: 'loan-123',
      pickupSignatureUrl: '/uploads/signatures/1234567890-signature.png',
      pickupSignedAt: new Date('2024-01-15T10:30:00Z')
    };

    it('should upload pickup signature with file successfully', async () => {
      req.params = { id: 'loan-123' };
      req.file = {
        filename: '1234567890-signature.png',
        path: '/uploads/signatures/1234567890-signature.png'
      };
      mockUploadPickupSignature.mockResolvedValue(mockLoanWithSignature);

      await uploadPickupSignature(req, res);

      expect(mockUploadPickupSignature).toHaveBeenCalledWith('loan-123', req.file);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoanWithSignature
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should upload pickup signature with base64 successfully', async () => {
      req.params = { id: 'loan-123' };
      req.body = { signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...' };
      mockUploadPickupSignature.mockResolvedValue(mockLoanWithSignature);

      await uploadPickupSignature(req, res);

      expect(mockUploadPickupSignature).toHaveBeenCalledWith('loan-123', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoanWithSignature
      });
    });

    it('should return 400 when no signature provided', async () => {
      req.params = { id: 'loan-123' };
      req.file = null;
      req.body = {};

      await uploadPickupSignature(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Aucune signature fournie'
      });
      expect(mockUploadPickupSignature).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      req.file = { filename: 'signature.png' };
      const error = new Error('Loan not found');
      mockUploadPickupSignature.mockRejectedValue(error);

      await expect(uploadPickupSignature(req, res)).rejects.toThrow('Loan not found');
    });
  });

  describe('uploadReturnSignature', () => {
    const mockLoanWithSignature = {
      id: 'loan-123',
      returnSignatureUrl: '/uploads/signatures/1234567891-signature.png',
      returnSignedAt: new Date('2024-01-16T14:00:00Z')
    };

    it('should upload return signature with file successfully', async () => {
      req.params = { id: 'loan-123' };
      req.file = {
        filename: '1234567891-signature.png',
        path: '/uploads/signatures/1234567891-signature.png'
      };
      mockUploadReturnSignature.mockResolvedValue(mockLoanWithSignature);

      await uploadReturnSignature(req, res);

      expect(mockUploadReturnSignature).toHaveBeenCalledWith('loan-123', req.file);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoanWithSignature
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should upload return signature with base64 successfully', async () => {
      req.params = { id: 'loan-123' };
      req.body = { signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...' };
      mockUploadReturnSignature.mockResolvedValue(mockLoanWithSignature);

      await uploadReturnSignature(req, res);

      expect(mockUploadReturnSignature).toHaveBeenCalledWith('loan-123', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoanWithSignature
      });
    });

    it('should return 400 when no signature provided', async () => {
      req.params = { id: 'loan-123' };
      req.file = null;
      req.body = {};

      await uploadReturnSignature(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Aucune signature fournie'
      });
      expect(mockUploadReturnSignature).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      req.file = { filename: 'signature.png' };
      const error = new Error('Loan not found');
      mockUploadReturnSignature.mockRejectedValue(error);

      await expect(uploadReturnSignature(req, res)).rejects.toThrow('Loan not found');
    });
  });

  describe('closeLoan', () => {
    const mockClosedLoan = {
      id: 'loan-123',
      status: 'CLOSED',
      closedAt: new Date('2024-01-16T14:30:00Z'),
      lines: [
        { assetItem: { status: 'EN_STOCK' } }
      ]
    };

    it('should close loan successfully', async () => {
      req.params = { id: 'loan-123' };
      mockCloseLoan.mockResolvedValue(mockClosedLoan);

      await closeLoan(req, res);

      expect(mockCloseLoan).toHaveBeenCalledWith('loan-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClosedLoan
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle missing signatures error', async () => {
      req.params = { id: 'loan-123' };
      const error = new Error('Both pickup and return signatures are required to close loan');
      mockCloseLoan.mockRejectedValue(error);

      await expect(closeLoan(req, res)).rejects.toThrow('Both pickup and return signatures are required to close loan');
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      const error = new Error('Loan not found');
      mockCloseLoan.mockRejectedValue(error);

      await expect(closeLoan(req, res)).rejects.toThrow('Loan not found');
    });

    it('should handle loan already closed error', async () => {
      req.params = { id: 'loan-123' };
      const error = new Error('Loan is already closed');
      mockCloseLoan.mockRejectedValue(error);

      await expect(closeLoan(req, res)).rejects.toThrow('Loan is already closed');
    });
  });

  describe('deleteLoan', () => {
    const mockResult = {
      message: 'Prêt supprimé avec succès'
    };

    it('should delete loan successfully', async () => {
      req.params = { id: 'loan-123' };
      req.user = { id: 'user-123' };
      mockDeleteLoan.mockResolvedValue(mockResult);

      await deleteLoan(req, res);

      expect(mockDeleteLoan).toHaveBeenCalledWith('loan-123', 'user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      req.user = { id: 'user-123' };
      const error = new Error('Loan not found');
      mockDeleteLoan.mockRejectedValue(error);

      await expect(deleteLoan(req, res)).rejects.toThrow('Loan not found');
    });

    it('should handle cannot delete loan with signatures error', async () => {
      req.params = { id: 'loan-123' };
      req.user = { id: 'user-123' };
      const error = new Error('Cannot delete loan with signatures');
      mockDeleteLoan.mockRejectedValue(error);

      await expect(deleteLoan(req, res)).rejects.toThrow('Cannot delete loan with signatures');
    });
  });

  describe('batchDeleteLoans', () => {
    const mockResult = {
      deletedCount: 5,
      message: '5 prêt(s) supprimé(s) avec succès'
    };

    it('should batch delete loans successfully', async () => {
      req.body = { loanIds: ['loan-1', 'loan-2', 'loan-3', 'loan-4', 'loan-5'] };
      req.user = { id: 'user-123' };
      mockBatchDeleteLoans.mockResolvedValue(mockResult);

      await batchDeleteLoans(req, res);

      expect(mockBatchDeleteLoans).toHaveBeenCalledWith(
        ['loan-1', 'loan-2', 'loan-3', 'loan-4', 'loan-5'],
        'user-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle empty loanIds array', async () => {
      req.body = { loanIds: [] };
      req.user = { id: 'user-123' };
      const error = new Error('loanIds array cannot be empty');
      mockBatchDeleteLoans.mockRejectedValue(error);

      await expect(batchDeleteLoans(req, res)).rejects.toThrow('loanIds array cannot be empty');
    });

    it('should handle invalid loan IDs', async () => {
      req.body = { loanIds: ['invalid-id'] };
      req.user = { id: 'user-123' };
      const error = new Error('No loans found with provided IDs');
      mockBatchDeleteLoans.mockRejectedValue(error);

      await expect(batchDeleteLoans(req, res)).rejects.toThrow('No loans found with provided IDs');
    });
  });

  describe('deletePickupSignature', () => {
    const mockLoan = {
      id: 'loan-123',
      pickupSignatureUrl: null,
      pickupSignedAt: null
    };

    it('should delete pickup signature successfully', async () => {
      req.params = { id: 'loan-123' };
      mockDeletePickupSignature.mockResolvedValue(mockLoan);

      await deletePickupSignature(req, res);

      expect(mockDeletePickupSignature).toHaveBeenCalledWith('loan-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoan
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      const error = new Error('Loan not found');
      mockDeletePickupSignature.mockRejectedValue(error);

      await expect(deletePickupSignature(req, res)).rejects.toThrow('Loan not found');
    });
  });

  describe('deleteReturnSignature', () => {
    const mockLoan = {
      id: 'loan-123',
      returnSignatureUrl: null,
      returnSignedAt: null
    };

    it('should delete return signature successfully', async () => {
      req.params = { id: 'loan-123' };
      mockDeleteReturnSignature.mockResolvedValue(mockLoan);

      await deleteReturnSignature(req, res);

      expect(mockDeleteReturnSignature).toHaveBeenCalledWith('loan-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoan
      });
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle loan not found error', async () => {
      req.params = { id: 'non-existent' };
      const error = new Error('Loan not found');
      mockDeleteReturnSignature.mockRejectedValue(error);

      await expect(deleteReturnSignature(req, res)).rejects.toThrow('Loan not found');
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors gracefully with asyncHandler', async () => {
      req.params = { id: 'loan-123' };
      const error = new Error('Database connection failed');
      mockGetLoanById.mockRejectedValue(error);

      // asyncHandler wraps the function, so it should propagate errors
      await expect(getLoanById(req, res)).rejects.toThrow('Database connection failed');
    });

    it('should return consistent response format for success', async () => {
      req.params = { id: 'loan-123' };
      const mockLoan = { id: 'loan-123', status: 'OPEN' };
      mockGetLoanById.mockResolvedValue(mockLoan);

      await getLoanById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should use 201 status for resource creation', async () => {
      req.body = { employeeId: 'emp-001' };
      req.user = { userId: 'user-123' };
      mockCreateLoan.mockResolvedValue({ id: 'loan-new' });

      await createLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should use 201 status for adding loan lines', async () => {
      req.params = { id: 'loan-123' };
      req.body = { assetItemId: 'asset-001' };
      mockAddLoanLine.mockResolvedValue({ id: 'line-new' });

      await addLoanLine(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle query parameters correctly', async () => {
      req.query = { status: 'OPEN', employeeId: 'emp-001' };
      mockGetAllLoans.mockResolvedValue([]);

      await getAllLoans(req, res);

      expect(mockGetAllLoans).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OPEN',
          employeeId: 'emp-001'
        })
      );
    });

    it('should handle missing req.file gracefully', async () => {
      req.params = { id: 'loan-123' };
      req.file = null;
      req.body = {};

      await uploadPickupSignature(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });
  });
});
