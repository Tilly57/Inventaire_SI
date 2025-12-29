/**
 * Check which AssetModels can be deleted
 *
 * Shows which models have items currently loaned and cannot be deleted.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModelsDeletability() {
  console.log('🔍 Checking AssetModel deletability...\n');

  try {
    const models = await prisma.assetModel.findMany({
      include: {
        items: true,
        stockItems: true
      }
    });

    console.log(`Found ${models.length} AssetModels\n`);

    const cannotDelete = [];
    const canDelete = [];

    for (const model of models) {
      const loanedAssetItems = model.items.filter(item => item.status === 'PRETE');
      const loanedStockItems = model.stockItems.filter(stock => stock.loaned > 0);

      const totalLoanedStock = loanedStockItems.reduce((sum, s) => sum + s.loaned, 0);

      if (loanedAssetItems.length > 0 || totalLoanedStock > 0) {
        cannotDelete.push({
          model,
          loanedAssetItems: loanedAssetItems.length,
          loanedStockItems: totalLoanedStock
        });
      } else {
        canDelete.push(model);
      }
    }

    if (cannotDelete.length > 0) {
      console.log('❌ CANNOT DELETE (items currently loaned):\n');
      cannotDelete.forEach(({ model, loanedAssetItems, loanedStockItems }) => {
        console.log(`   ${model.brand} ${model.modelName} (${model.type})`);
        if (loanedAssetItems > 0) {
          console.log(`      - ${loanedAssetItems} AssetItem(s) with status PRETE`);
        }
        if (loanedStockItems > 0) {
          console.log(`      - ${loanedStockItems} StockItem(s) loaned`);
        }
        console.log();
      });
    }

    if (canDelete.length > 0) {
      console.log('✅ CAN DELETE (no items loaned):\n');
      canDelete.forEach(model => {
        const totalAssetItems = model.items.length;
        const totalStockQuantity = model.stockItems.reduce((sum, s) => sum + s.quantity, 0);

        console.log(`   ${model.brand} ${model.modelName} (${model.type})`);
        if (totalAssetItems > 0) {
          console.log(`      - Will delete ${totalAssetItems} AssetItem(s)`);
        }
        if (totalStockQuantity > 0) {
          console.log(`      - Will delete ${totalStockQuantity} StockItem(s)`);
        }
      });
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Can delete: ${canDelete.length} model(s)`);
    console.log(`   ❌ Cannot delete: ${cannotDelete.length} model(s)`);

  } catch (error) {
    console.error('❌ Error checking models:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkModelsDeletability()
  .catch(console.error);
