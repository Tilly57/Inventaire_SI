/**
 * Show all active loans
 *
 * Lists all OPEN loans with their items.
 */
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

async function showActiveLoans() {
  logger.info('📋 Active Loans (status: OPEN)\n');

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
      logger.info('✅ No active loans found!\n');
      return;
    }

    logger.info(`Found ${activeLoans.length} active loan(s)\n`);

    activeLoans.forEach((loan, index) => {
      logger.info(`\n📦 Loan #${index + 1} (ID: ${loan.id})`);
      logger.info(`   Employee: ${loan.employee.firstName} ${loan.employee.lastName}`);
      logger.info(`   Created: ${new Date(loan.createdAt).toLocaleDateString()}`);
      logger.info(`   Status: ${loan.status}`);
      logger.info(`   Items:`);

      loan.lines.forEach(line => {
        if (line.assetItem) {
          logger.info(`      - ${line.assetItem.assetTag}: ${line.assetItem.assetModel.brand} ${line.assetItem.assetModel.modelName}`);
        } else if (line.stockItem) {
          logger.info(`      - ${line.quantity}x ${line.stockItem.assetModel.brand} ${line.stockItem.assetModel.modelName}`);
        }
      });

      logger.info(`\n   ➡️  To close this loan, use the UI or run:`);
      logger.info(`      PATCH http://localhost:3001/api/loans/${loan.id}/close`);
    });

    logger.info('\n\n💡 Instructions:');
    logger.info('   1. Go to the Loans page in the web interface');
    logger.info('   2. Close each active loan (add return signature if needed)');
    logger.info('   3. After all loans are closed, you can delete the AssetModels');

  } catch (error) {
    logger.error('❌ Error:', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

showActiveLoans()
  .catch((error) => logger.error('Error:', { error }));
