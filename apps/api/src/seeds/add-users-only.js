/**
 * Script to ONLY add test users to the database
 * This script does NOT delete any existing data
 */
import 'dotenv/config';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants.js';
import logger from '../config/logger.js';

async function main() {
  logger.info('👥 Adding test users to database...');

  const testUsers = [
    {
      email: 'admin@inventaire.local',
      password: 'Admin123!',
      role: 'ADMIN'
    },
    {
      email: 'gestionnaire1@inventaire.local',
      password: 'Gest123!',
      role: 'GESTIONNAIRE'
    },
    {
      email: 'gestionnaire2@inventaire.local',
      password: 'Gest123!',
      role: 'GESTIONNAIRE'
    },
    {
      email: 'lecture@inventaire.local',
      password: 'Lect123!',
      role: 'LECTURE'
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const userData of testUsers) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      logger.info(`⏭️  User ${userData.email} already exists, skipping...`);
      skipped++;
      continue;
    }

    // Create the user
    const passwordHash = await bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        role: userData.role
      }
    });

    logger.info(`✅ Created user: ${userData.email} (${userData.role})`);
    created++;
  }

  logger.info('\n🎉 Test users setup completed!');
  logger.info(`   Created: ${created} users`);
  logger.info(`   Skipped: ${skipped} users (already exist)`);

  if (created > 0) {
    logger.info('\n🔑 Login credentials for new users:');
    if (created > 0) {
      testUsers.forEach(user => {
        logger.info(`   ${user.role}: ${user.email} / ${user.password}`);
      });
    }
  }
}

main()
  .catch((e) => {
    logger.error('❌ Error adding users:', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
