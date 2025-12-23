/**
 * Employees service - Business logic for employee management
 */
import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Get all employees
 */
export async function getAllEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { loans: true }
      }
    }
  });

  return employees;
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id) {
  const employee = await prisma.employee.findUnique({
    where: { id },
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

  if (!employee) {
    throw new NotFoundError('Employé non trouvé');
  }

  return employee;
}

/**
 * Create new employee
 */
export async function createEmployee(data) {
  // Check if email already exists
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
 * Update employee
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
 * Delete employee
 */
export async function deleteEmployee(id) {
  // Check if employee exists
  const existingEmployee = await prisma.employee.findUnique({
    where: { id },
    include: {
      loans: {
        where: { status: 'OPEN' }
      }
    }
  });

  if (!existingEmployee) {
    throw new NotFoundError('Employé non trouvé');
  }

  // Check if employee has active loans
  if (existingEmployee.loans.length > 0) {
    throw new ValidationError('Impossible de supprimer un employé avec des prêts actifs');
  }

  await prisma.employee.delete({ where: { id } });

  return { message: 'Employé supprimé avec succès' };
}
