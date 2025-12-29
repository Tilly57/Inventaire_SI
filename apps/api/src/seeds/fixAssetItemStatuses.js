/**
 * Fix AssetItem statuses
 *
 * This script finds AssetItems with status 'PRETE' that are not
 * in any active (OPEN) loan and resets them to 'EN_STOCK'.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAssetItemStatuses() {
  console.log('🔧 Fixing AssetItem statuses...\n');

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

    console.log(`Found ${loanedItems.length} AssetItems with status PRETE\n`);

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
        console.log(`⚠️  ${item.assetTag} - ${item.assetModel.brand} ${item.assetModel.modelName}`);
        console.log(`   Status: PRETE but not in any active loan`);

        // Reset status to EN_STOCK
        await prisma.assetItem.update({
          where: { id: item.id },
          data: { status: 'EN_STOCK' }
        });

        console.log(`   ✅ Status reset to EN_STOCK\n`);
        fixedCount++;
      } else {
        console.log(`✓ ${item.assetTag} - Correctly in active loan (${activeLoanLine.loan.employee.firstName} ${activeLoanLine.loan.employee.lastName})`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} AssetItem(s)`);

    // Show summary
    const summary = await prisma.assetItem.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\n📊 Summary of AssetItem statuses:');
    summary.forEach(s => {
      console.log(`   ${s.status}: ${s._count} items`);
    });

  } catch (error) {
    console.error('❌ Error fixing AssetItem statuses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAssetItemStatuses()
  .catch(console.error);
