/**
 * Check which Employees can be deleted
 *
 * Shows which employees have loans and cannot be deleted.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployeeDeletability() {
  console.log('🔍 Checking Employee deletability...\n');

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

    console.log(`Found ${employees.length} employees\n`);

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
      console.log('❌ CANNOT DELETE (has loan history):\n');
      cannotDelete.forEach(({ employee, activeLoans, closedLoans }) => {
        console.log(`   ${employee.firstName} ${employee.lastName} (${employee.email})`);
        if (activeLoans > 0) {
          console.log(`      - ${activeLoans} active loan(s) (OPEN)`);
        }
        if (closedLoans > 0) {
          console.log(`      - ${closedLoans} closed loan(s) (CLOSED)`);
        }
        console.log();
      });
    }

    if (canDelete.length > 0) {
      console.log('✅ CAN DELETE (no loan history):\n');
      canDelete.forEach(employee => {
        console.log(`   ${employee.firstName} ${employee.lastName} (${employee.email})`);
      });
      console.log();
    }

    console.log('📊 Summary:');
    console.log(`   ✅ Can delete: ${canDelete.length} employee(s)`);
    console.log(`   ❌ Cannot delete: ${cannotDelete.length} employee(s)`);

  } catch (error) {
    console.error('❌ Error checking employees:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeDeletability()
  .catch(console.error);
