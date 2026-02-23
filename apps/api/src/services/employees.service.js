/**
 * @fileoverview Employees service - Business logic for employee management
 *
 * This service handles:
 * - Employee CRUD operations
 * - Email uniqueness validation
 * - Loan history tracking
 * - Deletion constraints (prevents deletion if employee has loans)
 */

import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { findOneOrFail, validateUniqueFields } from '../utils/prismaHelpers.js';
import { logCreate, logUpdate, logDelete } from '../utils/auditHelpers.js';
import { executePaginatedQuery, buildOrderBy, validateSortParams } from '../utils/pagination.js';

const EMPLOYEE_SORT_FIELDS = ['lastName', 'firstName', 'email', 'dept', 'createdAt'];
import { getCached, invalidateEntity, generateKey, TTL } from './cache.service.js';

/**
 * Get all employees with loan count
 *
 * Employees are returned in reverse chronological order (newest first).
 * Includes a count of all loans (active and closed) for each employee.
 * Cached for 10 minutes (TTL.EMPLOYEES) - Phase 3.2
 *
 * @returns {Promise<Array>} Array of employee objects with loan counts
 *
 * @example
 * const employees = await getAllEmployees();
 * // employees[0]._count.loans = 5
 */
export async function getAllEmployees() {
  const cacheKey = generateKey('employees', 'all');

  return getCached(
    cacheKey,
    async () => {
      const employees = await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { loans: true }  // Count of all loans for this employee
          }
        }
      });

      return employees;
    },
    TTL.EMPLOYEES
  );
}

/**
 * Get all employees with pagination and optional filters
 *
 * PERFORMANCE OPTIMIZED: Uses pagination to avoid loading all records at once.
 * Cached with filters in key - Phase 3.2
 *
 * @param {Object} options - Query options
 * @param {string} [options.search] - Search in first name, last name, email, or dept
 * @param {string} [options.dept] - Filter by department
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=20] - Items per page
 * @param {string} [options.sortBy='createdAt'] - Field to sort by
 * @param {string} [options.sortOrder='desc'] - Sort order
 * @returns {Promise<Object>} Paginated response with data and metadata
 */
export async function getAllEmployeesPaginated(options = {}) {
  const {
    search,
    dept,
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Generate cache key with filters
  const cacheKey = generateKey('employees', `list:p${page}:s${pageSize}:${search || ''}:${dept || ''}:${sortBy}:${sortOrder}`);

  return getCached(
    cacheKey,
    async () => {
      const where = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { dept: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (dept) {
        where.dept = { contains: dept, mode: 'insensitive' };
      }

      const validated = validateSortParams(sortBy, sortOrder, EMPLOYEE_SORT_FIELDS);
      const orderBy = buildOrderBy(validated.sortBy, validated.sortOrder);

      const result = await executePaginatedQuery(prisma.employee, {
        where,
        orderBy,
        include: {
          _count: {
            select: { loans: true }
          }
        },
        page,
        pageSize
      });

      return result;
    },
    TTL.EMPLOYEES
  );
}

/**
 * Get a single employee by ID with loan history
 *
 * Returns employee details along with their 10 most recent loans
 * and total loan count.
 *
 * @param {string} id - Employee ID (CUID format)
 * @returns {Promise<Object>} Employee object with recent loans
 * @throws {NotFoundError} If employee doesn't exist
 *
 * @example
 * const employee = await getEmployeeById('clijrn9ht0000...');
 */
export async function getEmployeeById(id) {
  const employee = await findOneOrFail('employee', { id }, {
    include: {
      loans: {
        orderBy: { openedAt: 'desc' },
        take: 10  // Only fetch 10 most recent loans
      },
      _count: {
        select: { loans: true }
      }
    },
    errorMessage: 'Employé non trouvé'
  });

  return employee;
}

/**
 * Create a new employee
 *
 * Validates email uniqueness before creation.
 *
 * @param {Object} data - Employee data
 * @param {string} data.firstName - Employee first name
 * @param {string} data.lastName - Employee last name
 * @param {string} data.email - Employee email (must be unique)
 * @param {string} [data.dept] - Department or agency (optional)
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Created employee object
 * @throws {ConflictError} If email already exists
 *
 * @example
 * const employee = await createEmployee({
 *   firstName: 'Jean',
 *   lastName: 'Dupont',
 *   email: 'jean.dupont@groupetilly.com',
 *   dept: 'Woippy'
 * }, req);
 */
export async function createEmployee(data, req) {
  // Validate email uniqueness if provided
  if (data.email) {
    await validateUniqueFields('employee', { email: data.email }, {
      errorMessages: { email: 'Un employé avec cet email existe déjà' }
    });
  }

  const employee = await prisma.employee.create({
    data
  });

  // Audit trail
  await logCreate('Employee', employee.id, req, employee);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('employees');

  return employee;
}

/**
 * Bulk create employees
 *
 * Creates multiple employees in a single transaction.
 * Skips employees with duplicate emails.
 *
 * @param {Array<Object>} employees - Array of employee data
 * @returns {Promise<Object>} Result with created, skipped, and error counts
 *
 * @example
 * const result = await bulkCreateEmployees([
 *   { firstName: 'Jean', lastName: 'Dupont', email: 'jean@example.com' },
 *   { firstName: 'Marie', lastName: 'Martin', email: 'marie@example.com' }
 * ]);
 * // result: { created: 2, skipped: 0, errors: [] }
 */
export async function bulkCreateEmployees(employees) {
  const result = {
    created: 0,
    skipped: 0,
    errors: []
  };

  // Get all existing emails in one query
  const existingEmployees = await prisma.employee.findMany({
    where: {
      email: {
        in: employees.map(emp => emp.email).filter(Boolean)
      }
    },
    select: { email: true }
  });

  const existingEmails = new Set(existingEmployees.map(emp => emp.email.toLowerCase()));

  // Process each employee
  for (let i = 0; i < employees.length; i++) {
    const data = employees[i];

    try {
      // Skip if email already exists
      if (data.email && existingEmails.has(data.email.toLowerCase())) {
        result.skipped++;
        continue;
      }

      // Create employee
      await prisma.employee.create({ data });
      result.created++;

      // Add to existing emails set to avoid duplicates within this batch
      if (data.email) {
        existingEmails.add(data.email.toLowerCase());
      }
    } catch (error) {
      result.errors.push({
        row: i + 1,
        data: data,
        error: error.message
      });
    }
  }

  // Invalidate cache if any employees were created - Phase 3.2
  if (result.created > 0) {
    await invalidateEntity('employees');
  }

  return result;
}

/**
 * Update an existing employee
 *
 * Validates email uniqueness if email is being changed.
 *
 * @param {string} id - Employee ID to update
 * @param {Object} data - Updated employee data
 * @param {string} [data.firstName] - Updated first name
 * @param {string} [data.lastName] - Updated last name
 * @param {string} [data.email] - Updated email (must be unique)
 * @param {string} [data.dept] - Updated department
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated employee object
 * @throws {NotFoundError} If employee doesn't exist
 * @throws {ConflictError} If new email already exists
 *
 * @example
 * const updated = await updateEmployee('empId123', { dept: 'Paris' }, req);
 */
export async function updateEmployee(id, data, req) {
  // Check if employee exists
  const existingEmployee = await findOneOrFail('employee', { id }, {
    errorMessage: 'Employé non trouvé'
  });

  // If email is being changed, check for conflicts
  if (data.email && data.email !== existingEmployee.email) {
    await validateUniqueFields('employee', { email: data.email }, {
      excludeId: id,
      errorMessages: { email: 'Un employé avec cet email existe déjà' }
    });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data
  });

  // Audit trail
  await logUpdate('Employee', id, req, existingEmployee, employee);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('employees');

  return employee;
}

/**
 * Delete an employee
 *
 * IMPORTANT: Employees with ANY loan history (active or closed) cannot be deleted.
 * This preserves data integrity and audit trail.
 *
 * @param {string} id - Employee ID to delete
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If employee doesn't exist
 * @throws {ValidationError} If employee has any loans
 *
 * @example
 * await deleteEmployee('empId123', req);
 */
export async function deleteEmployee(id, req) {
  // Check if employee exists and fetch active loans (exclude soft-deleted)
  const existingEmployee = await prisma.employee.findUnique({
    where: { id },
    include: {
      loans: {
        where: {
          deletedAt: null  // Only count non-deleted loans
        }
      }
    }
  });

  if (!existingEmployee) {
    throw new NotFoundError('Employé non trouvé');
  }

  // Business rule: Cannot delete employees with ANY active loan history
  // Soft-deleted loans are excluded from this check
  if (existingEmployee.loans.length > 0) {
    const activeLoans = existingEmployee.loans.filter(loan => loan.status === 'OPEN').length;
    const closedLoans = existingEmployee.loans.filter(loan => loan.status === 'CLOSED').length;

    // Provide detailed error message explaining why deletion failed
    if (activeLoans > 0 && closedLoans > 0) {
      throw new ValidationError(
        `Impossible de supprimer cet employé car il a ${activeLoans} prêt(s) actif(s) et ${closedLoans} prêt(s) fermé(s) dans l'historique.`
      );
    } else if (activeLoans > 0) {
      throw new ValidationError(
        `Impossible de supprimer cet employé car il a ${activeLoans} prêt(s) actif(s).`
      );
    } else {
      throw new ValidationError(
        `Impossible de supprimer cet employé car il a ${closedLoans} prêt(s) dans l'historique. Les employés avec un historique de prêts ne peuvent pas être supprimés.`
      );
    }
  }

  // Delete all soft-deleted loans for this employee
  // Must delete in cascade: LoanLines -> Loans -> Employee
  // This is necessary because foreign key constraints prevent deletion
  const softDeletedLoans = await prisma.loan.findMany({
    where: {
      employeeId: id,
      deletedAt: { not: null }
    },
    select: { id: true }
  });

  // Use transaction to ensure atomicity - Phase 3.1
  // All deletions must succeed together (LoanLines -> Loans -> Employee)
  await prisma.$transaction(async (tx) => {
    if (softDeletedLoans.length > 0) {
      const loanIds = softDeletedLoans.map(loan => loan.id);

      // First, delete all LoanLines for these soft-deleted loans
      await tx.loanLine.deleteMany({
        where: {
          loanId: { in: loanIds }
        }
      });

      // Then, delete the soft-deleted loans themselves
      await tx.loan.deleteMany({
        where: {
          id: { in: loanIds }
        }
      });
    }

    // Finally, delete the employee
    await tx.employee.delete({ where: { id } });
  });

  // Audit trail
  await logDelete('Employee', id, req, existingEmployee);

  // Invalidate cache - Phase 3.2
  await invalidateEntity('employees');

  return { message: 'Employé supprimé avec succès' };
}
