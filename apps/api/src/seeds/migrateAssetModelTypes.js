/**
 * Migration script to convert AssetModel types from English to French
 *
 * This script updates existing AssetModel records to use French type names
 * instead of English enum values (LAPTOP → Ordinateur portable, etc.)
 *
 * Usage: node apps/api/src/seeds/migrateAssetModelTypes.js
 */
import 'dotenv/config';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

// Mapping from English enum values to French names
const TYPE_MAPPING = {
  'LAPTOP': 'Ordinateur portable',
  'DESKTOP': 'Ordinateur fixe',
  'MONITOR': 'Écran',
  'KEYBOARD': 'Clavier',
  'MOUSE': 'Souris',
  'HEADSET': 'Casque audio',
  'WEBCAM': 'Webcam',
  'DOCK': 'Station d\'accueil',
  'CABLE': 'Câble',
  'ADAPTER': 'Adaptateur',
  'OTHER': 'Autre'
};

async function main() {
  logger.info('🔄 Starting AssetModel type migration...');
  logger.info('Converting English types to French names\n');

  // Get all AssetModels
  const assetModels = await prisma.assetModel.findMany();
  logger.info(`Found ${assetModels.length} asset models to process`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const model of assetModels) {
    const oldType = model.type;
    const newType = TYPE_MAPPING[oldType];

    // If type is already in French or not in mapping, skip
    if (!newType || oldType === newType) {
      logger.info(`⏭️  Skipping: ${model.brand} ${model.modelName} (type: ${oldType}) - Already correct or not in mapping`);
      skippedCount++;
      continue;
    }

    try {
      await prisma.assetModel.update({
        where: { id: model.id },
        data: { type: newType }
      });

      logger.info(`✅ Converted: ${model.brand} ${model.modelName}`);
      logger.info(`   ${oldType} → ${newType}`);
      successCount++;
    } catch (error) {
      logger.error(`❌ Error updating ${model.brand} ${model.modelName}:`, { message: error.message });
      errorCount++;
    }
  }

  logger.info('\n📊 Migration Summary:');
  logger.info(`   ✅ Successfully converted: ${successCount}`);
  logger.info(`   ⏭️  Skipped (already correct): ${skippedCount}`);
  logger.info(`   ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    logger.info('\n🎉 Migration completed successfully!');
  } else {
    logger.warn('\n⚠️  Migration completed with errors. Please review the error messages above.');
  }
}

main()
  .catch((e) => {
    logger.error('❌ Fatal error during migration:', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
