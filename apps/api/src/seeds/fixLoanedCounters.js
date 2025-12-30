/**
 * Fix loaned counters for StockItems
 *
 * This script recalculates the 'loaned' counter for all StockItems
 * by counting the quantity in active (OPEN) loans.
 */
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

async function fixLoanedCounters() {
  logger.info('🔧 Fixing loaned counters for StockItems...\n');

  try {
    // Get all StockItems
    const stockItems = await prisma.stockItem.findMany({
      include: {
        assetModel: true
      }
    });

    logger.info(`Found ${stockItems.length} StockItems\n`);

    for (const stockItem of stockItems) {
      // Calculate actual loaned quantity from OPEN loans
      const loanLines = await prisma.loanLine.findMany({
        where: {
          stockItemId: stockItem.id,
          loan: {
            status: 'OPEN',  // Only count open loans
            deletedAt: null  // Exclude soft-deleted loans
          }
        },
        include: {
          loan: {
            select: {
              id: true,
              status: true,
              employee: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      const actualLoaned = loanLines.reduce((sum, line) => sum + line.quantity, 0);
      const currentLoaned = stockItem.loaned || 0;

      if (actualLoaned !== currentLoaned) {
        logger.warn(`⚠️  ${stockItem.assetModel.brand} ${stockItem.assetModel.modelName}`);
        logger.info(`   Current loaned: ${currentLoaned}, Actual loaned: ${actualLoaned}`);

        if (loanLines.length > 0) {
          logger.info(`   Active loans:`);
          loanLines.forEach(line => {
            logger.info(`   - ${line.loan.employee.firstName} ${line.loan.employee.lastName}: ${line.quantity} items`);
          });
        }

        // Update to correct value
        await prisma.stockItem.update({
          where: { id: stockItem.id },
          data: { loaned: actualLoaned }
        });

        logger.info(`   ✅ Updated loaned counter to ${actualLoaned}\n`);
      }
    }

    logger.info('✅ All loaned counters have been fixed!');
    logger.info('\n📊 Summary:');

    // Show final state
    const finalStockItems = await prisma.stockItem.findMany({
      include: {
        assetModel: true
      }
    });

    for (const item of finalStockItems) {
      if (item.loaned > 0) {
        logger.info(`   ${item.assetModel.brand} ${item.assetModel.modelName}: ${item.loaned} loaned out of ${item.quantity}`);
      }
    }

  } catch (error) {
    logger.error('❌ Error fixing loaned counters:', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixLoanedCounters()
  .catch((error) => logger.error('Error:', { error }));
