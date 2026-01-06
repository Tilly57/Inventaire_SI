import 'dotenv/config';
import prisma from './src/config/database.js';

async function checkDatabase() {
  const counts = {
    users: await prisma.user.count(),
    employees: await prisma.employee.count(),
    equipmentTypes: await prisma.equipmentType.count(),
    assetModels: await prisma.assetModel.count(),
    assetItems: await prisma.assetItem.count(),
    stockItems: await prisma.stockItem.count(),
    loans: await prisma.loan.count()
  };

  console.log('\n📊 Database contents:');
  console.log(JSON.stringify(counts, null, 2));

  // Show recent asset models
  const recentModels = await prisma.assetModel.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, brand: true, modelName: true }
  });

  console.log('\n📦 Recent asset models:');
  console.log(JSON.stringify(recentModels, null, 2));

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
