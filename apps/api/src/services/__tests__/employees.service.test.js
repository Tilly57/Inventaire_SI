/**
 * Unit tests for employees.service.js
 * Tests the employee management service including:
 * - Employee CRUD operations
 * - Email uniqueness validation
 * - Loan history tracking
 * - Deletion constraints (prevents deletion if employee has loans)
 * - Bulk creation with duplicate handling
 */

import { jest } from '@jest/globals';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';

// Mock Prisma client before importing service
const mockPrisma = {
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  loan: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  loanLine: {
    deleteMany: jest.fn(),
  },
};

// Set up mocks before importing service
jest.unstable_mockModule('../../config/database.js', () => ({
  default: mockPrisma
}));

// Import service after mocks are set up
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  bulkCreateEmployees,
  updateEmployee,
  deleteEmployee,
} = await import('../employees.service.js');

describe('Employees Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEmployees', () => {
    it('should return all employees with loan counts', async () => {
      const mockEmployees = [
        {
          id: 'emp1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
          dept: 'Woippy',
          _count: { loans: 3 }
        },
        {
          id: 'emp2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie@example.com',
          dept: 'Paris',
          _count: { loans: 0 }
        }
      ];

      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const result = await getAllEmployees();

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { loans: true }
          }
        }
      });
      expect(result).toEqual(mockEmployees);
      expect(result[0]._count.loans).toBe(3);
    });

    it('should return empty array when no employees exist', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      const result = await getAllEmployees();

      expect(result).toEqual([]);
    });

    it('should order employees by createdAt descending', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);

      await getAllEmployees();

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' }
        })
      );
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee with recent loans', async () => {
      const mockEmployee = {
        id: 'emp1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean@example.com',
        loans: [
          { id: 'loan1', status: 'OPEN', openedAt: new Date() },
          { id: 'loan2', status: 'CLOSED', openedAt: new Date() }
        ],
        _count: { loans: 5 }
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await getEmployeeById('emp1');

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp1' },
        include: {
          loans: {
            orderBy: { openedAt: 'desc' },
            take: 10
          },
          _count: {
            select: { loans: true }
          }
        }
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundError if employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(getEmployeeById('nonexistent'))
        .rejects.toThrow(NotFoundError);
      await expect(getEmployeeById('nonexistent'))
        .rejects.toThrow('Employé non trouvé');
    });

    it('should limit loans to 10 most recent', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({
        id: 'emp1',
        loans: [],
        _count: { loans: 0 }
      });

      await getEmployeeById('emp1');

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            loans: expect.objectContaining({
              take: 10
            })
          })
        })
      );
    });
  });

  describe('createEmployee', () => {
    const mockEmployeeData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      dept: 'Woippy'
    };

    it('should create a new employee successfully', async () => {
      const mockCreatedEmployee = {
        id: 'emp1',
        ...mockEmployeeData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.employee.findUnique.mockResolvedValue(null); // No existing employee
      mockPrisma.employee.create.mockResolvedValue(mockCreatedEmployee);

      const result = await createEmployee(mockEmployeeData);

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmployeeData.email }
      });
      expect(mockPrisma.employee.create).toHaveBeenCalledWith({
        data: mockEmployeeData
      });
      expect(result).toEqual(mockCreatedEmployee);
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingEmployee = {
        id: 'emp1',
        email: mockEmployeeData.email
      };

      mockPrisma.employee.findUnique.mockResolvedValue(existingEmployee);

      await expect(createEmployee(mockEmployeeData))
        .rejects.toThrow(ConflictError);
      await expect(createEmployee(mockEmployeeData))
        .rejects.toThrow('Un employé avec cet email existe déjà');

      expect(mockPrisma.employee.create).not.toHaveBeenCalled();
    });

    it('should create employee without email validation if email not provided', async () => {
      const dataWithoutEmail = {
        firstName: 'Jean',
        lastName: 'Dupont',
        dept: 'Woippy'
      };

      const mockCreatedEmployee = {
        id: 'emp2',
        ...dataWithoutEmail,
        email: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.employee.create.mockResolvedValue(mockCreatedEmployee);

      const result = await createEmployee(dataWithoutEmail);

      expect(mockPrisma.employee.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.employee.create).toHaveBeenCalledWith({
        data: dataWithoutEmail
      });
      expect(result).toEqual(mockCreatedEmployee);
    });
  });

  describe('bulkCreateEmployees', () => {
    it('should create multiple employees successfully', async () => {
      const employees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
        { firstName: 'Marie', lastName: 'Martin', email: 'marie@example.com' }
      ];

      mockPrisma.employee.findMany.mockResolvedValue([]); // No existing emails
      mockPrisma.employee.create.mockResolvedValue({});

      const result = await bulkCreateEmployees(employees);

      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.employee.create).toHaveBeenCalledTimes(2);
    });

    it('should skip employees with duplicate emails', async () => {
      const employees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
        { firstName: 'Marie', lastName: 'Martin', email: 'marie@example.com' }
      ];

      // jean@example.com already exists
      mockPrisma.employee.findMany.mockResolvedValue([
        { email: 'jean@example.com' }
      ]);
      mockPrisma.employee.create.mockResolvedValue({});

      const result = await bulkCreateEmployees(employees);

      expect(result.created).toBe(1); // Only Marie created
      expect(result.skipped).toBe(1); // Jean skipped
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.employee.create).toHaveBeenCalledTimes(1);
    });

    it('should handle errors and track them', async () => {
      const employees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
        { firstName: 'Marie', lastName: 'Martin', email: 'marie@example.com' }
      ];

      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.create
        .mockResolvedValueOnce({}) // First succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Second fails

      const result = await bulkCreateEmployees(employees);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        row: 2,
        data: employees[1],
        error: 'Database error'
      });
    });

    it('should prevent duplicates within the same batch', async () => {
      const employees = [
        { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
        { firstName: 'Jean2', lastName: 'Dupont2', email: 'JEAN@example.com' } // Same email, different case
      ];

      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.create.mockResolvedValue({});

      const result = await bulkCreateEmployees(employees);

      expect(result.created).toBe(1); // Only first created
      expect(result.skipped).toBe(1); // Second skipped (duplicate in batch)
    });

    it('should handle employees without emails', async () => {
      const employees = [
        { firstName: 'Jean', lastName: 'Dupont' }, // No email
        { firstName: 'Marie', lastName: 'Martin', email: 'marie@example.com' }
      ];

      mockPrisma.employee.findMany.mockResolvedValue([]);
      mockPrisma.employee.create.mockResolvedValue({});

      const result = await bulkCreateEmployees(employees);

      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
    });
  });

  describe('updateEmployee', () => {
    const mockEmployeeId = 'emp1';
    const mockExistingEmployee = {
      id: mockEmployeeId,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      dept: 'Woippy'
    };

    it('should update employee successfully', async () => {
      const updateData = { dept: 'Paris' };
      const mockUpdatedEmployee = {
        ...mockExistingEmployee,
        ...updateData
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockExistingEmployee);
      mockPrisma.employee.update.mockResolvedValue(mockUpdatedEmployee);

      const result = await updateEmployee(mockEmployeeId, updateData);

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: mockEmployeeId }
      });
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: mockEmployeeId },
        data: updateData
      });
      expect(result).toEqual(mockUpdatedEmployee);
    });

    it('should throw NotFoundError if employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(updateEmployee('nonexistent', { dept: 'Paris' }))
        .rejects.toThrow(NotFoundError);
      await expect(updateEmployee('nonexistent', { dept: 'Paris' }))
        .rejects.toThrow('Employé non trouvé');

      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });

    it('should update email if new email is unique', async () => {
      const updateData = { email: 'newemail@example.com' };

      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockExistingEmployee) // First call: check employee exists
        .mockResolvedValueOnce(null); // Second call: check email not taken
      mockPrisma.employee.update.mockResolvedValue({
        ...mockExistingEmployee,
        ...updateData
      });

      const result = await updateEmployee(mockEmployeeId, updateData);

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.employee.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: updateData.email }
      });
      expect(result.email).toBe(updateData.email);
    });

    it('should throw ConflictError if new email already exists', async () => {
      const updateData = { email: 'existing@example.com' };
      const conflictingEmployee = {
        id: 'emp2',
        email: 'existing@example.com'
      };

      mockPrisma.employee.findUnique
        .mockResolvedValueOnce(mockExistingEmployee) // Check employee exists
        .mockResolvedValueOnce(conflictingEmployee); // Email conflict

      await expect(updateEmployee(mockEmployeeId, updateData))
        .rejects.toThrow('Un employé avec cet email existe déjà');

      expect(mockPrisma.employee.update).not.toHaveBeenCalled();
    });

    it('should allow updating same email (no change)', async () => {
      const updateData = {
        email: mockExistingEmployee.email, // Same email
        dept: 'Paris'
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockExistingEmployee);
      mockPrisma.employee.update.mockResolvedValue({
        ...mockExistingEmployee,
        dept: 'Paris'
      });

      const result = await updateEmployee(mockEmployeeId, updateData);

      // Should not check for email conflict since it's the same email
      expect(mockPrisma.employee.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.employee.update).toHaveBeenCalled();
      expect(result.dept).toBe('Paris');
    });
  });

  describe('deleteEmployee', () => {
    const mockEmployeeId = 'emp1';

    it('should delete employee successfully when no loans exist', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        firstName: 'Jean',
        lastName: 'Dupont',
        loans: [] // No loans
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.loan.findMany.mockResolvedValue([]); // No soft-deleted loans
      mockPrisma.employee.delete.mockResolvedValue(mockEmployee);

      const result = await deleteEmployee(mockEmployeeId);

      expect(mockPrisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id: mockEmployeeId },
        include: {
          loans: {
            where: {
              deletedAt: null
            }
          }
        }
      });
      expect(mockPrisma.employee.delete).toHaveBeenCalledWith({
        where: { id: mockEmployeeId }
      });
      expect(result).toEqual({ message: 'Employé supprimé avec succès' });
    });

    it('should throw NotFoundError if employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(deleteEmployee('nonexistent'))
        .rejects.toThrow(NotFoundError);
      await expect(deleteEmployee('nonexistent'))
        .rejects.toThrow('Employé non trouvé');

      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if employee has active loans', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        loans: [
          { id: 'loan1', status: 'OPEN', deletedAt: null },
          { id: 'loan2', status: 'OPEN', deletedAt: null }
        ]
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow(ValidationError);
      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow('2 prêt(s) actif(s)');

      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if employee has closed loans', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        loans: [
          { id: 'loan1', status: 'CLOSED', deletedAt: null }
        ]
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow(ValidationError);
      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow('1 prêt(s) dans l\'historique');

      expect(mockPrisma.employee.delete).not.toHaveBeenCalled();
    });

    it('should throw ValidationError with mixed active and closed loans', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        loans: [
          { id: 'loan1', status: 'OPEN', deletedAt: null },
          { id: 'loan2', status: 'CLOSED', deletedAt: null },
          { id: 'loan3', status: 'CLOSED', deletedAt: null }
        ]
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow(ValidationError);
      await expect(deleteEmployee(mockEmployeeId))
        .rejects.toThrow('1 prêt(s) actif(s) et 2 prêt(s) fermé(s)');
    });

    it('should delete soft-deleted loans in cascade before deleting employee', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        loans: [] // No active loans
      };

      const softDeletedLoans = [
        { id: 'loan1' },
        { id: 'loan2' }
      ];

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.loan.findMany.mockResolvedValue(softDeletedLoans);
      mockPrisma.loanLine.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.loan.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.employee.delete.mockResolvedValue(mockEmployee);

      const result = await deleteEmployee(mockEmployeeId);

      // Should delete LoanLines first
      expect(mockPrisma.loanLine.deleteMany).toHaveBeenCalledWith({
        where: {
          loanId: { in: ['loan1', 'loan2'] }
        }
      });

      // Then delete Loans
      expect(mockPrisma.loan.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['loan1', 'loan2'] }
        }
      });

      // Finally delete Employee
      expect(mockPrisma.employee.delete).toHaveBeenCalledWith({
        where: { id: mockEmployeeId }
      });

      expect(result).toEqual({ message: 'Employé supprimé avec succès' });
    });

    it('should only count non-deleted loans when checking deletion constraint', async () => {
      const mockEmployee = {
        id: mockEmployeeId,
        loans: [] // Only non-deleted loans (soft-deleted excluded by query)
      };

      // Has soft-deleted loans but they don't prevent deletion
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.loan.findMany.mockResolvedValue([
        { id: 'soft-deleted-loan', deletedAt: new Date() }
      ]);
      mockPrisma.loanLine.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.loan.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.employee.delete.mockResolvedValue(mockEmployee);

      const result = await deleteEmployee(mockEmployeeId);

      expect(result).toEqual({ message: 'Employé supprimé avec succès' });
    });
  });
});
