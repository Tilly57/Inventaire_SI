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

/**
 * Get all employees with loan count
 *
 * Employees are returned in reverse chronological order (newest first).
 * Includes a count of all loans (active and closed) for each employee.
 *
 * @returns {Promise<Array>} Array of employee objects with loan counts
 *
 * @example
 * const employees = await getAllEmployees();
 * // employees[0]._count.loans = 5
 */
export async function getAllEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { loans: true }  // Count of all loans for this employee
      }
    }
  });

  return employees;
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
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      loans: {
        orderBy: { openedAt: 'desc' },
        take: 10  // Only fetch 10 most recent loans
      },
      _count: {
        select: { loans: true }
      }
    }
  });

  if (!employee) {
    throw new NotFoundError('Employé non trouvé');
  }

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
 * @returns {Promise<Object>} Created employee object
 * @throws {ConflictError} If email already exists
 *
 * @example
 * const employee = await createEmployee({
 *   firstName: 'Jean',
 *   lastName: 'Dupont',
 *   email: 'jean.dupont@groupetilly.com',
 *   dept: 'Woippy'
 * });
 */
export async function createEmployee(data) {
  // Validate email uniqueness if provided
  if (data.email) {
    const existingEmployee = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existingEmployee) {
      throw new ConflictError('Un employé avec cet email existe déjà');
    }
  }

  const employee = await prisma.employee.create({
    data
  });

  return employee;
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
 * @returns {Promise<Object>} Updated employee object
 * @throws {NotFoundError} If employee doesn't exist
 * @throws {ConflictError} If new email already exists
 *
 * @example
 * const updated = await updateEmployee('empId123', { dept: 'Paris' });
 */
export async function updateEmployee(id, data) {
  // Check if employee exists
  const existingEmployee = await prisma.employee.findUnique({ where: { id } });
  if (!existingEmployee) {
    throw new NotFoundError('Employé non trouvé');
  }

  // If email is being changed, check for conflicts
  if (data.email && data.email !== existingEmployee.email) {
    const emailConflict = await prisma.employee.findUnique({ where: { email: data.email } });
    if (emailConflict) {
      throw new ConflictError('Un employé avec cet email existe déjà');
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data
  });

  return employee;
}

/**
 * Delete an employee
 *
 * IMPORTANT: Employees with ANY loan history (active or closed) cannot be deleted.
 * This preserves data integrity and audit trail.
 *
 * @param {string} id - Employee ID to delete
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If employee doesn't exist
 * @throws {ValidationError} If employee has any loans
 *
 * @example
 * await deleteEmployee('empId123');
 */
export async function deleteEmployee(id) {
  // Check if employee exists and fetch all loans
  const existingEmployee = await prisma.employee.findUnique({
    where: { id },
    include: {
      loans: true,  // Include ALL loans (active and closed)
      _count: {
        select: { loans: true }
      }
    }
  });

  if (!existingEmployee) {
    throw new NotFoundError('Employé non trouvé');
  }

  // Business rule: Cannot delete employees with ANY loan history
  // This preserves audit trail and prevents data integrity issues
  if (existingEmployee._count.loans > 0) {
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

  await prisma.employee.delete({ where: { id } });

  return { message: 'Employé supprimé avec succès' };
}
