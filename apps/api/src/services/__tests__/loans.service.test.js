/**
 * Unit tests for loans.service.js
 *
 * Tests the complete loan workflow including:
 * - Loan creation and retrieval
 * - Adding/removing loan lines (assets and stock items)
 * - Signature uploads (pickup and return)
 * - Loan closure and deletion
 */

import { jest } from '@jest/globals';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

// Mock Prisma client before importing service
const mockPrisma = {
  loan: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  loanLine: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  assetItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  stockItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((operations) => Promise.all(operations)),
};

// Mock dependencies
jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

jest.unstable_mockModule('../../utils/saveBase64Image.js', () => ({
  saveBase64Image: jest.fn(() => Promise.resolve('mocked-filename.png'))
}));

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}));

// Import service after mocks are set up
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
  deleteReturnSignature,
} = await import('../loans.service.js');

describe('Loans Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getAllLoans', () => {
    it('should return all non-deleted loans', async () => {
      const mockLoans = [
        {
          id: 'loan1',
          status: 'OPEN',
          employeeId: 'emp1',
          employee: { id: 'emp1', firstName: 'John', lastName: 'Doe' },
          createdBy: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' },
          lines: []
        }
      ];
      mockPrisma.loan.findMany.mockResolvedValue(mockLoans);

      const result = await getAllLoans();

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          orderBy: { openedAt: 'desc' }
        })
      );
      expect(result).toEqual(mockLoans);
    });

    it('should filter loans by status', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await getAllLoans({ status: 'OPEN' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: 'OPEN' }
        })
      );
    });

    it('should filter loans by employeeId', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await getAllLoans({ employeeId: 'emp123' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, employeeId: 'emp123' }
        })
      );
    });

    it('should filter by both status and employeeId', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await getAllLoans({ status: 'CLOSED', employeeId: 'emp456' });

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: 'CLOSED', employeeId: 'emp456' }
        })
      );
    });
  });

  describe('getLoanById', () => {
    it('should return loan when it exists', async () => {
      const mockLoan = {
        id: 'loan1',
        status: 'OPEN',
        employee: { id: 'emp1', firstName: 'John' },
        lines: []
      };
      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);

      const result = await getLoanById('loan1');

      expect(mockPrisma.loan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'loan1' } })
      );
      expect(result).toEqual(mockLoan);
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(getLoanById('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(getLoanById('nonexistent')).rejects.toThrow('Prêt non trouvé');
    });
  });

  describe('createLoan', () => {
    it('should create a new loan when employee exists', async () => {
      const mockEmployee = { id: 'emp1', firstName: 'John' };
      const mockLoan = {
        id: 'loan1',
        employeeId: 'emp1',
        createdById: 'user1',
        status: 'OPEN',
        employee: mockEmployee,
        lines: []
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.loan.create.mockResolvedValue(mockLoan);

      const result = await createLoan('emp1', 'user1');

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({ where: { id: 'emp1' } });
      expect(mockPrisma.loan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            employeeId: 'emp1',
            createdById: 'user1',
            status: 'OPEN'
          }
        })
      );
      expect(result).toEqual(mockLoan);
    });

    it('should throw NotFoundError when employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(createLoan('nonexistent', 'user1')).rejects.toThrow(NotFoundError);
      await expect(createLoan('nonexistent', 'user1')).rejects.toThrow('Employé non trouvé');
    });
  });

  describe('addLoanLine', () => {
    const mockLoan = { id: 'loan1', status: 'OPEN', deletedAt: null };

    describe('Asset Items', () => {
      it('should add asset item line successfully', async () => {
        const mockAsset = { id: 'asset1', status: 'EN_STOCK' };
        const mockLoanLine = {
          id: 'line1',
          loanId: 'loan1',
          assetItemId: 'asset1',
          quantity: 1
        };

        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.assetItem.findUnique.mockResolvedValue(mockAsset);
        mockPrisma.$transaction.mockResolvedValue([mockLoanLine, {}]);

        const result = await addLoanLine('loan1', { assetItemId: 'asset1' });

        expect(mockPrisma.$transaction).toHaveBeenCalled();
        expect(result).toEqual(mockLoanLine);
      });

      it('should throw NotFoundError when asset does not exist', async () => {
        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.assetItem.findUnique.mockResolvedValue(null);

        await expect(addLoanLine('loan1', { assetItemId: 'nonexistent' }))
          .rejects.toThrow(NotFoundError);
      });

      it('should throw ValidationError when asset is not available', async () => {
        const mockAsset = { id: 'asset1', status: 'PRETE' };
        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.assetItem.findUnique.mockResolvedValue(mockAsset);

        await expect(addLoanLine('loan1', { assetItemId: 'asset1' }))
          .rejects.toThrow(ValidationError);
        await expect(addLoanLine('loan1', { assetItemId: 'asset1' }))
          .rejects.toThrow('n\'est pas disponible');
      });
    });

    describe('Stock Items', () => {
      it('should add stock item line successfully', async () => {
        const mockStock = { id: 'stock1', quantity: 10, loaned: 2 };
        const mockLoanLine = {
          id: 'line1',
          loanId: 'loan1',
          stockItemId: 'stock1',
          quantity: 3
        };

        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.stockItem.findUnique.mockResolvedValue(mockStock);
        mockPrisma.$transaction.mockResolvedValue([mockLoanLine, {}]);

        const result = await addLoanLine('loan1', { stockItemId: 'stock1', quantity: 3 });

        expect(mockPrisma.$transaction).toHaveBeenCalled();
        expect(result).toEqual(mockLoanLine);
      });

      it('should throw ValidationError when insufficient stock', async () => {
        const mockStock = { id: 'stock1', quantity: 10, loaned: 8 };
        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.stockItem.findUnique.mockResolvedValue(mockStock);

        await expect(addLoanLine('loan1', { stockItemId: 'stock1', quantity: 5 }))
          .rejects.toThrow(ValidationError);
        await expect(addLoanLine('loan1', { stockItemId: 'stock1', quantity: 5 }))
          .rejects.toThrow('Quantité insuffisante');
      });

      it('should default quantity to 1 if not provided', async () => {
        const mockStock = { id: 'stock1', quantity: 10, loaned: 0 };
        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
        mockPrisma.stockItem.findUnique.mockResolvedValue(mockStock);
        mockPrisma.$transaction.mockResolvedValue([{}, {}]);

        await addLoanLine('loan1', { stockItemId: 'stock1' });

        expect(mockPrisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      it('should throw NotFoundError when loan does not exist', async () => {
        mockPrisma.loan.findUnique.mockResolvedValue(null);

        await expect(addLoanLine('nonexistent', { assetItemId: 'asset1' }))
          .rejects.toThrow(NotFoundError);
      });

      it('should throw ValidationError when loan is closed', async () => {
        mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', status: 'CLOSED' });

        await expect(addLoanLine('loan1', { assetItemId: 'asset1' }))
          .rejects.toThrow(ValidationError);
        await expect(addLoanLine('loan1', { assetItemId: 'asset1' }))
          .rejects.toThrow('prêt fermé');
      });

      it('should throw ValidationError when loan is deleted', async () => {
        mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

        await expect(addLoanLine('loan1', { assetItemId: 'asset1' }))
          .rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when neither assetItemId nor stockItemId provided', async () => {
        mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);

        await expect(addLoanLine('loan1', {}))
          .rejects.toThrow(ValidationError);
      });
    });
  });

  describe('removeLoanLine', () => {
    const mockLoan = { id: 'loan1', status: 'OPEN', deletedAt: null };

    it('should remove asset item line successfully', async () => {
      const mockLine = {
        id: 'line1',
        loanId: 'loan1',
        assetItemId: 'asset1',
        quantity: 1
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loanLine.findUnique.mockResolvedValue(mockLine);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await removeLoanLine('loan1', 'line1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('supprimée avec succès');
    });

    it('should remove stock item line successfully', async () => {
      const mockLine = {
        id: 'line1',
        loanId: 'loan1',
        stockItemId: 'stock1',
        quantity: 3
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loanLine.findUnique.mockResolvedValue(mockLine);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await removeLoanLine('loan1', 'line1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('supprimée avec succès');
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(removeLoanLine('nonexistent', 'line1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when line does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loanLine.findUnique.mockResolvedValue(null);

      await expect(removeLoanLine('loan1', 'nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when line belongs to different loan', async () => {
      const mockLine = { id: 'line1', loanId: 'loan2' };
      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loanLine.findUnique.mockResolvedValue(mockLine);

      await expect(removeLoanLine('loan1', 'line1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when loan is closed', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', status: 'CLOSED' });

      await expect(removeLoanLine('loan1', 'line1'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('uploadPickupSignature', () => {
    const mockLoan = { id: 'loan1', deletedAt: null };

    it('should upload signature from base64 string', async () => {
      const mockUpdatedLoan = {
        ...mockLoan,
        pickupSignatureUrl: '/uploads/signatures/mocked-filename.png',
        pickupSignedAt: expect.any(Date)
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loan.update.mockResolvedValue(mockUpdatedLoan);

      const result = await uploadPickupSignature('loan1', 'data:image/png;base64,iVBOR...');

      expect(mockPrisma.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan1' },
          data: expect.objectContaining({
            pickupSignatureUrl: expect.stringContaining('/uploads/signatures/'),
            pickupSignedAt: expect.any(Date)
          })
        })
      );
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should upload signature from multer file', async () => {
      const mockFile = { filename: 'signature-123.png' };
      const mockUpdatedLoan = {
        ...mockLoan,
        pickupSignatureUrl: '/uploads/signatures/signature-123.png'
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loan.update.mockResolvedValue(mockUpdatedLoan);

      const result = await uploadPickupSignature('loan1', mockFile);

      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(uploadPickupSignature('nonexistent', 'base64string'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when no signature provided', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);

      await expect(uploadPickupSignature('loan1', null))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when loan is deleted', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

      await expect(uploadPickupSignature('loan1', 'base64'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('uploadReturnSignature', () => {
    const mockLoan = { id: 'loan1', deletedAt: null };

    it('should upload return signature successfully', async () => {
      const mockUpdatedLoan = {
        ...mockLoan,
        returnSignatureUrl: '/uploads/signatures/mocked-filename.png',
        returnSignedAt: expect.any(Date)
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loan.update.mockResolvedValue(mockUpdatedLoan);

      const result = await uploadReturnSignature('loan1', 'data:image/png;base64,iVBOR...');

      expect(mockPrisma.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan1' },
          data: expect.objectContaining({
            returnSignatureUrl: expect.stringContaining('/uploads/signatures/'),
            returnSignedAt: expect.any(Date)
          })
        })
      );
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(uploadReturnSignature('nonexistent', 'base64'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('closeLoan', () => {
    it('should close loan and restore asset statuses', async () => {
      const mockLoan = {
        id: 'loan1',
        status: 'OPEN',
        deletedAt: null,
        lines: [
          { id: 'line1', assetItemId: 'asset1', assetItem: {} },
          { id: 'line2', assetItemId: 'asset2', assetItem: {} }
        ]
      };

      const mockClosedLoan = {
        ...mockLoan,
        status: 'CLOSED',
        closedAt: expect.any(Date)
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.$transaction.mockResolvedValue([mockClosedLoan]);

      const result = await closeLoan('loan1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockClosedLoan);
    });

    it('should close loan and decrement stock loaned counter', async () => {
      const mockLoan = {
        id: 'loan1',
        status: 'OPEN',
        deletedAt: null,
        lines: [
          { id: 'line1', stockItemId: 'stock1', quantity: 3, stockItem: {} }
        ]
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await closeLoan('loan1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(closeLoan('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when loan is already closed', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', status: 'CLOSED' });

      await expect(closeLoan('loan1'))
        .rejects.toThrow(ValidationError);
      await expect(closeLoan('loan1'))
        .rejects.toThrow('déjà fermé');
    });

    it('should throw ValidationError when loan is deleted', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

      await expect(closeLoan('loan1'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteLoan', () => {
    it('should soft delete loan and restore asset statuses', async () => {
      const mockLoan = {
        id: 'loan1',
        deletedAt: null,
        lines: [
          { id: 'line1', assetItemId: 'asset1', assetItem: {} }
        ]
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.$transaction.mockResolvedValue([{}]);

      const result = await deleteLoan('loan1', 'user1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('supprimé avec succès');
    });

    it('should soft delete loan and decrement stock loaned', async () => {
      const mockLoan = {
        id: 'loan1',
        deletedAt: null,
        lines: [
          { id: 'line1', stockItemId: 'stock1', quantity: 3, stockItem: {} }
        ]
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await deleteLoan('loan1', 'user1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(deleteLoan('nonexistent', 'user1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when loan is already deleted', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

      await expect(deleteLoan('loan1', 'user1'))
        .rejects.toThrow(ValidationError);
      await expect(deleteLoan('loan1', 'user1'))
        .rejects.toThrow('déjà supprimé');
    });
  });

  describe('batchDeleteLoans', () => {
    it('should batch delete multiple loans', async () => {
      const mockLoans = [
        {
          id: 'loan1',
          deletedAt: null,
          lines: [{ assetItemId: 'asset1', assetItem: {} }]
        },
        {
          id: 'loan2',
          deletedAt: null,
          lines: [{ stockItemId: 'stock1', quantity: 2, stockItem: {} }]
        }
      ];

      mockPrisma.loan.findMany.mockResolvedValue(mockLoans);
      mockPrisma.$transaction.mockResolvedValue([{}]);

      const result = await batchDeleteLoans(['loan1', 'loan2'], 'user1');

      expect(mockPrisma.loan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['loan1', 'loan2'] }
          })
        })
      );
      expect(result.deletedCount).toBe(2);
      expect(result.message).toContain('2 prêt(s) supprimé(s)');
    });

    it('should throw ValidationError when loanIds array is empty', async () => {
      await expect(batchDeleteLoans([], 'user1'))
        .rejects.toThrow(ValidationError);
      await expect(batchDeleteLoans([], 'user1'))
        .rejects.toThrow('Au moins un prêt');
    });

    it('should throw NotFoundError when no loans found', async () => {
      mockPrisma.loan.findMany.mockResolvedValue([]);

      await expect(batchDeleteLoans(['nonexistent'], 'user1'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePickupSignature', () => {
    it('should delete pickup signature successfully', async () => {
      const mockLoan = {
        id: 'loan1',
        deletedAt: null,
        pickupSignatureUrl: '/uploads/signatures/signature.png'
      };

      const mockUpdatedLoan = {
        ...mockLoan,
        pickupSignatureUrl: null,
        pickupSignedAt: null
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loan.update.mockResolvedValue(mockUpdatedLoan);

      const result = await deletePickupSignature('loan1');

      expect(mockPrisma.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan1' },
          data: {
            pickupSignatureUrl: null,
            pickupSignedAt: null
          }
        })
      );
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(deletePickupSignature('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when loan is deleted', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

      await expect(deletePickupSignature('loan1'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteReturnSignature', () => {
    it('should delete return signature successfully', async () => {
      const mockLoan = {
        id: 'loan1',
        deletedAt: null,
        returnSignatureUrl: '/uploads/signatures/signature.png'
      };

      const mockUpdatedLoan = {
        ...mockLoan,
        returnSignatureUrl: null,
        returnSignedAt: null
      };

      mockPrisma.loan.findUnique.mockResolvedValue(mockLoan);
      mockPrisma.loan.update.mockResolvedValue(mockUpdatedLoan);

      const result = await deleteReturnSignature('loan1');

      expect(mockPrisma.loan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loan1' },
          data: {
            returnSignatureUrl: null,
            returnSignedAt: null
          }
        })
      );
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundError when loan does not exist', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue(null);

      await expect(deleteReturnSignature('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when loan is deleted', async () => {
      mockPrisma.loan.findUnique.mockResolvedValue({ id: 'loan1', deletedAt: new Date() });

      await expect(deleteReturnSignature('loan1'))
        .rejects.toThrow(ValidationError);
    });
  });
});
