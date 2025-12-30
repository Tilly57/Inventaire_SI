import prisma from './src/config/database.js';

async function checkSerialNumbers() {
  try {
    const items = await prisma.assetItem.findMany({
      include: { assetModel: true },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    console.log('Recent AssetItems (with serial numbers):');
    items.forEach(item => {
      console.log({
        tag: item.assetTag,
        serial: item.serialNumber || 'NO SERIAL',
        model: `${item.assetModel.brand} ${item.assetModel.modelName}`,
        updated: item.updatedAt
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSerialNumbers();
