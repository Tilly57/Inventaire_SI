/**
 * Fix AssetItem statuses
 *
 * This script finds AssetItems with status 'PRETE' that are not
 * in any active (OPEN) loan and resets them to 'EN_STOCK'.
 */
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

async function fixAssetItemStatuses() {
  logger.info('🔧 Fixing AssetItem statuses...\n');

  try {
    // Get all AssetItems with status PRETE
    const loanedItems = await prisma.assetItem.findMany({
      where: {
        status: 'PRETE'
      },
      include: {
        assetModel: true
      }
    });

    logger.info(`Found ${loanedItems.length} AssetItems with status PRETE\n`);

    let fixedCount = 0;

    for (const item of loanedItems) {
      // Check if item is actually in an active loan
      const activeLoanLine = await prisma.loanLine.findFirst({
        where: {
          assetItemId: item.id,
          loan: {
            status: 'OPEN',  // Only active loans
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

      if (!activeLoanLine) {
        // Item is marked as PRETE but not in any active loan
        logger.warn(`⚠️  ${item.assetTag} - ${item.assetModel.brand} ${item.assetModel.modelName}`);
        logger.info(`   Status: PRETE but not in any active loan`);

        // Reset status to EN_STOCK
        await prisma.assetItem.update({
          where: { id: item.id },
          data: { status: 'EN_STOCK' }
        });

        logger.info(`   ✅ Status reset to EN_STOCK\n`);
        fixedCount++;
      } else {
        logger.info(`✓ ${item.assetTag} - Correctly in active loan (${activeLoanLine.loan.employee.firstName} ${activeLoanLine.loan.employee.lastName})`);
      }
    }

    logger.info(`\n✅ Fixed ${fixedCount} AssetItem(s)`);

    // Show summary
    const summary = await prisma.assetItem.groupBy({
      by: ['status'],
      _count: true
    });

    logger.info('\n📊 Summary of AssetItem statuses:');
    summary.forEach(s => {
      logger.info(`   ${s.status}: ${s._count} items`);
    });

  } catch (error) {
    logger.error('❌ Error fixing AssetItem statuses:', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAssetItemStatuses()
  .catch((error) => logger.error('Error:', { error }));
