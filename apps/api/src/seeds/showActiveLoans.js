/**
 * Show all active loans
 *
 * Lists all OPEN loans with their items.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showActiveLoans() {
  console.log('📋 Active Loans (status: OPEN)\n');

  try {
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: 'OPEN',
        deletedAt: null
      },
      include: {
        employee: true,
        lines: {
          include: {
            assetItem: {
              include: {
                assetModel: true
              }
            },
            stockItem: {
              include: {
                assetModel: true
              }
            }
          }
        }
      }
    });

    if (activeLoans.length === 0) {
      console.log('✅ No active loans found!\n');
      return;
    }

    console.log(`Found ${activeLoans.length} active loan(s)\n`);

    activeLoans.forEach((loan, index) => {
      console.log(`\n📦 Loan #${index + 1} (ID: ${loan.id})`);
      console.log(`   Employee: ${loan.employee.firstName} ${loan.employee.lastName}`);
      console.log(`   Created: ${new Date(loan.createdAt).toLocaleDateString()}`);
      console.log(`   Status: ${loan.status}`);
      console.log(`   Items:`);

      loan.lines.forEach(line => {
        if (line.assetItem) {
          console.log(`      - ${line.assetItem.assetTag}: ${line.assetItem.assetModel.brand} ${line.assetItem.assetModel.modelName}`);
        } else if (line.stockItem) {
          console.log(`      - ${line.quantity}x ${line.stockItem.assetModel.brand} ${line.stockItem.assetModel.modelName}`);
        }
      });

      console.log(`\n   ➡️  To close this loan, use the UI or run:`);
      console.log(`      PATCH http://localhost:3001/api/loans/${loan.id}/close`);
    });

    console.log('\n\n💡 Instructions:');
    console.log('   1. Go to the Loans page in the web interface');
    console.log('   2. Close each active loan (add return signature if needed)');
    console.log('   3. After all loans are closed, you can delete the AssetModels');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

showActiveLoans()
  .catch(console.error);
