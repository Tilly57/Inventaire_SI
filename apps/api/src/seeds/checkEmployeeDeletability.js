/**
 * Check which Employees can be deleted
 *
 * Shows which employees have loans and cannot be deleted.
 */
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

async function checkEmployeeDeletability() {
  logger.info('🔍 Checking Employee deletability...\n');

  try {
    const employees = await prisma.employee.findMany({
      include: {
        loans: {
          where: {
            deletedAt: null  // Exclude soft-deleted loans
          }
        },
        _count: {
          select: { loans: true }
        }
      }
    });

    logger.info(`Found ${employees.length} employees\n`);

    const cannotDelete = [];
    const canDelete = [];

    for (const employee of employees) {
      const activeLoans = employee.loans.filter(loan => loan.status === 'OPEN');
      const closedLoans = employee.loans.filter(loan => loan.status === 'CLOSED');

      if (employee.loans.length > 0) {
        cannotDelete.push({
          employee,
          activeLoans: activeLoans.length,
          closedLoans: closedLoans.length
        });
      } else {
        canDelete.push(employee);
      }
    }

    if (cannotDelete.length > 0) {
      logger.info('❌ CANNOT DELETE (has loan history):\n');
      cannotDelete.forEach(({ employee, activeLoans, closedLoans }) => {
        logger.info(`   ${employee.firstName} ${employee.lastName} (${employee.email})`);
        if (activeLoans > 0) {
          logger.info(`      - ${activeLoans} active loan(s) (OPEN)`);
        }
        if (closedLoans > 0) {
          logger.info(`      - ${closedLoans} closed loan(s) (CLOSED)`);
        }
        logger.info('');
      });
    }

    if (canDelete.length > 0) {
      logger.info('✅ CAN DELETE (no loan history):\n');
      canDelete.forEach(employee => {
        logger.info(`   ${employee.firstName} ${employee.lastName} (${employee.email})`);
      });
      logger.info('');
    }

    logger.info('📊 Summary:');
    logger.info(`   ✅ Can delete: ${canDelete.length} employee(s)`);
    logger.info(`   ❌ Cannot delete: ${cannotDelete.length} employee(s)`);

  } catch (error) {
    logger.error('❌ Error checking employees:', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeDeletability()
  .catch((error) => logger.error('Error:', { error }));
