/**
 * Seed script to populate database with test data
 */
import 'dotenv/config';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await prisma.loanLine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.assetItem.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.assetModel.deleteMany();
  await prisma.equipmentType.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Admin123!', BCRYPT_SALT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@inventaire.local',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const gestionnaire1 = await prisma.user.create({
    data: {
      email: 'gestionnaire1@inventaire.local',
      passwordHash: await bcrypt.hash('Gest123!', BCRYPT_SALT_ROUNDS),
      role: 'GESTIONNAIRE'
    }
  });

  const gestionnaire2 = await prisma.user.create({
    data: {
      email: 'gestionnaire2@inventaire.local',
      passwordHash: await bcrypt.hash('Gest123!', BCRYPT_SALT_ROUNDS),
      role: 'GESTIONNAIRE'
    }
  });

  const lectureUser = await prisma.user.create({
    data: {
      email: 'lecture@inventaire.local',
      passwordHash: await bcrypt.hash('Lect123!', BCRYPT_SALT_ROUNDS),
      role: 'LECTURE'
    }
  });

  console.log(`✅ Created ${4} users`);

  // Create equipment types
  console.log('Creating equipment types...');
  const equipmentTypes = await Promise.all([
    prisma.equipmentType.create({ data: { name: 'Ordinateur portable' } }),
    prisma.equipmentType.create({ data: { name: 'Ordinateur fixe' } }),
    prisma.equipmentType.create({ data: { name: 'Écran' } }),
    prisma.equipmentType.create({ data: { name: 'Clavier' } }),
    prisma.equipmentType.create({ data: { name: 'Souris' } }),
    prisma.equipmentType.create({ data: { name: 'Casque audio' } }),
    prisma.equipmentType.create({ data: { name: 'Webcam' } }),
    prisma.equipmentType.create({ data: { name: 'Station d\'accueil' } }),
    prisma.equipmentType.create({ data: { name: 'Câble' } }),
    prisma.equipmentType.create({ data: { name: 'Adaptateur' } }),
    prisma.equipmentType.create({ data: { name: 'Autre' } })
  ]);
  console.log(`✅ Created ${equipmentTypes.length} equipment types`);

  // Create employees
  console.log('Creating employees...');
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        dept: 'IT'
      }
    }),
    prisma.employee.create({
      data: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        dept: 'RH'
      }
    }),
    prisma.employee.create({
      data: {
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'pierre.bernard@example.com',
        dept: 'Comptabilité'
      }
    }),
    prisma.employee.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Dubois',
        email: 'sophie.dubois@example.com',
        dept: 'Marketing'
      }
    }),
    prisma.employee.create({
      data: {
        firstName: 'Luc',
        lastName: 'Moreau',
        email: 'luc.moreau@example.com',
        dept: 'Ventes'
      }
    })
  ]);

  console.log(`✅ Created ${employees.length} employees`);

  // Create asset models
  console.log('Creating asset models...');
  const laptopModel = await prisma.assetModel.create({
    data: {
      type: 'Ordinateur Portable',
      brand: 'Dell',
      modelName: 'Latitude 7420'
    }
  });

  const monitorModel = await prisma.assetModel.create({
    data: {
      type: 'Écran',
      brand: 'Samsung',
      modelName: 'S24C450'
    }
  });

  const keyboardModel = await prisma.assetModel.create({
    data: {
      type: 'Clavier',
      brand: 'Logitech',
      modelName: 'K780'
    }
  });

  const cableModel = await prisma.assetModel.create({
    data: {
      type: 'Câble',
      brand: 'Générique',
      modelName: 'HDMI 2m'
    }
  });

  const mouseModel = await prisma.assetModel.create({
    data: {
      type: 'Souris',
      brand: 'Logitech',
      modelName: 'Sans fil'
    }
  });

  const adapterModel = await prisma.assetModel.create({
    data: {
      type: 'Adaptateur',
      brand: 'Générique',
      modelName: 'USB-C vers HDMI'
    }
  });

  console.log(`✅ Created ${6} asset models`);

  // Create asset items
  console.log('Creating asset items...');
  const assetItems = [];

  for (let i = 1; i <= 4; i++) {
    assetItems.push(
      await prisma.assetItem.create({
        data: {
          assetModelId: laptopModel.id,
          assetTag: `LAP-${String(i).padStart(4, '0')}`,
          serial: `DELL${String(1000 + i)}`,
          status: 'EN_STOCK',
          notes: `Laptop Dell Latitude ${i}`
        }
      })
    );
  }

  for (let i = 1; i <= 4; i++) {
    assetItems.push(
      await prisma.assetItem.create({
        data: {
          assetModelId: monitorModel.id,
          assetTag: `MON-${String(i).padStart(4, '0')}`,
          serial: `SAMS${String(2000 + i)}`,
          status: 'EN_STOCK',
          notes: `Écran Samsung ${i}`
        }
      })
    );
  }

  for (let i = 1; i <= 2; i++) {
    assetItems.push(
      await prisma.assetItem.create({
        data: {
          assetModelId: keyboardModel.id,
          assetTag: `KEY-${String(i).padStart(4, '0')}`,
          serial: `LOGI${String(3000 + i)}`,
          status: 'EN_STOCK'
        }
      })
    );
  }

  console.log(`✅ Created ${assetItems.length} asset items`);

  // Create stock items
  console.log('Creating stock items...');
  const cableHDMI = await prisma.stockItem.create({
    data: {
      assetModelId: cableModel.id,
      quantity: 50,
      loaned: 0,
      notes: 'Câbles HDMI standard 2 mètres'
    }
  });

  const mouseWireless = await prisma.stockItem.create({
    data: {
      assetModelId: mouseModel.id,
      quantity: 30,
      loaned: 0,
      notes: 'Souris sans fil USB'
    }
  });

  const usbAdapter = await prisma.stockItem.create({
    data: {
      assetModelId: adapterModel.id,
      quantity: 20,
      loaned: 0,
      notes: 'Adaptateurs pour MacBook'
    }
  });

  console.log(`✅ Created ${3} stock items`);

  // Create open loan
  console.log('Creating open loan...');
  const openLoan = await prisma.loan.create({
    data: {
      employeeId: employees[0].id,
      createdById: gestionnaire1.id,
      status: 'OPEN',
      lines: {
        create: [
          {
            assetItemId: assetItems[0].id,
            quantity: 1
          },
          {
            assetItemId: assetItems[4].id,
            quantity: 1
          },
          {
            stockItemId: cableHDMI.id,
            quantity: 2
          }
        ]
      }
    }
  });

  // Update asset items to PRETE status
  await prisma.assetItem.update({
    where: { id: assetItems[0].id },
    data: { status: 'PRETE' }
  });
  await prisma.assetItem.update({
    where: { id: assetItems[4].id },
    data: { status: 'PRETE' }
  });

  // Update stock loaned quantity
  await prisma.stockItem.update({
    where: { id: cableHDMI.id },
    data: { loaned: 2 }
  });

  console.log(`✅ Created open loan with ${3} lines`);

  // Create closed loan
  console.log('Creating closed loan...');
  const closedLoan = await prisma.loan.create({
    data: {
      employeeId: employees[1].id,
      createdById: gestionnaire2.id,
      status: 'CLOSED',
      openedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      pickupSignatureUrl: '/uploads/signatures/sample-pickup.png',
      returnSignatureUrl: '/uploads/signatures/sample-return.png',
      pickupSignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      returnSignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            assetItemId: assetItems[1].id,
            quantity: 1
          },
          {
            stockItemId: mouseWireless.id,
            quantity: 1
          }
        ]
      }
    }
  });

  // Update stock loaned quantity for closed loan (will be 0 since it's closed, but let's track it was loaned)
  await prisma.stockItem.update({
    where: { id: mouseWireless.id },
    data: { loaned: 0 }
  });

  console.log(`✅ Created closed loan with ${2} lines`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   Users: 4 (1 ADMIN, 2 GESTIONNAIRE, 1 LECTURE)`);
  console.log(`   Employees: ${employees.length}`);
  console.log(`   Equipment Types: ${equipmentTypes.length}`);
  console.log(`   Asset Models: 6`);
  console.log(`   Asset Items: ${assetItems.length} (2 currently loaned)`);
  console.log(`   Stock Items: 3`);
  console.log(`   Loans: 2 (1 OPEN, 1 CLOSED)`);
  console.log('\n🔑 Login credentials:');
  console.log(`   Admin: admin@inventaire.local / Admin123!`);
  console.log(`   Gestionnaire: gestionnaire1@inventaire.local / Gest123!`);
  console.log(`   Lecture: lecture@inventaire.local / Lect123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
