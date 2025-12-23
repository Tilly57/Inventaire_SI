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
  // Check if employee exists and has any loans
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

  // Check if employee has any loans (active or closed)
  if (existingEmployee._count.loans > 0) {
    const activeLoans = existingEmployee.loans.filter(loan => loan.status === 'OPEN').length;
    const closedLoans = existingEmployee.loans.filter(loan => loan.status === 'CLOSED').length;

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
