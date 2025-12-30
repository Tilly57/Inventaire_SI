/**
 * Check for soft-deleted loans
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeletedLoans() {
  console.log('🔍 Checking for soft-deleted loans...\n');

  try {
    const allLoans = await prisma.loan.findMany({
      include: {
        employee: true
      }
    });

    const deletedLoans = allLoans.filter(loan => loan.deletedAt !== null);
    const activeLoans = allLoans.filter(loan => loan.deletedAt === null);

    console.log(`Total loans: ${allLoans.length}`);
    console.log(`Active loans: ${activeLoans.length}`);
    console.log(`Soft-deleted loans: ${deletedLoans.length}\n`);

    if (deletedLoans.length > 0) {
      console.log('🗑️  Soft-deleted loans:\n');
      deletedLoans.forEach(loan => {
        console.log(`   ${loan.employee.firstName} ${loan.employee.lastName}`);
        console.log(`      ID: ${loan.id}`);
        console.log(`      Status: ${loan.status}`);
        console.log(`      Deleted at: ${loan.deletedAt}`);
        console.log();
      });
    }

    // Check employees with only deleted loans
    const employees = await prisma.employee.findMany({
      include: {
        loans: true
      }
    });

    const problematicEmployees = employees.filter(emp => {
      const activeLoans = emp.loans.filter(l => l.deletedAt === null);
      const deletedLoans = emp.loans.filter(l => l.deletedAt !== null);
      return activeLoans.length === 0 && deletedLoans.length > 0;
    });

    if (problematicEmployees.length > 0) {
      console.log('⚠️  Employees with ONLY soft-deleted loans (would be blocked from deletion):\n');
      problematicEmployees.forEach(emp => {
        const deletedCount = emp.loans.filter(l => l.deletedAt !== null).length;
        console.log(`   ${emp.firstName} ${emp.lastName} (${emp.email})`);
        console.log(`      ${deletedCount} soft-deleted loan(s)`);
        console.log();
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDeletedLoans()
  .catch(console.error);
