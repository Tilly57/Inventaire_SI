/**
 * Employees service - Business logic for employee management
 */
import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';

/**
 * Get all employees with pagination and search
 */
export async function getAllEmployees(page = 1, limit = 20, search = '') {
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ]
  } : {};

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { loans: true }
        }
      }
    }),
    prisma.employee.count({ where })
  ]);

  return {
    employees,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
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
