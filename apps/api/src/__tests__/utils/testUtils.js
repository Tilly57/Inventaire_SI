/**
 * Test Utilities
 *
 * Helper functions for setting up and tearing down test data
 */

import prisma from '../../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Clean all database tables before/after tests
 */
export async function cleanDatabase() {
  // Delete in order to respect foreign key constraints
  await prisma.loanLine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.assetItem.deleteMany();
  await prisma.assetModel.deleteMany();
  await prisma.equipmentType.deleteMany(); // Clean equipment types
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect Prisma client
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Create a test user
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created user
 */
export async function createTestUser(overrides = {}) {
  const hashedPassword = await bcrypt.hash('password123', 10);

  return prisma.user.create({
    data: {
      email: overrides.email || 'test@example.com',
      passwordHash: overrides.passwordHash || hashedPassword,
      role: overrides.role || 'GESTIONNAIRE',
      ...overrides,
    },
  });
}

/**
 * Create a test admin user
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created admin user
 */
export async function createTestAdmin(overrides = {}) {
  return createTestUser({
    email: 'admin@example.com',
    role: 'ADMIN',
    ...overrides,
  });
}

/**
 * Create a test employee
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created employee
 */
export async function createTestEmployee(overrides = {}) {
  // Generate unique email to avoid conflicts in tests
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  return prisma.employee.create({
    data: {
      firstName: overrides.firstName || 'John',
      lastName: overrides.lastName || 'Doe',
      email: overrides.email || `john.doe.${timestamp}.${random}@example.com`,
      dept: overrides.dept || 'IT',
      ...overrides,
    },
  });
}

/**
 * Create a test asset model
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created asset model
 */
export async function createTestAssetModel(overrides = {}) {
  return prisma.assetModel.create({
    data: {
      type: overrides.type || 'LAPTOP',
      brand: overrides.brand || 'Dell',
      modelName: overrides.modelName || 'Latitude 5420',
      ...overrides,
    },
  });
}

/**
 * Create a test asset item
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created asset item
 */
export async function createTestAssetItem(overrides = {}) {
  let assetModelId = overrides.assetModelId;

  // Create model if not provided
  if (!assetModelId) {
    const model = await createTestAssetModel();
    assetModelId = model.id;
  }

  // Generate unique serial and tag to avoid conflicts in tests
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  return prisma.assetItem.create({
    data: {
      assetModelId,
      serial: overrides.serial || `SN${timestamp}${random}`,
      assetTag: overrides.assetTag || `TAG${timestamp}${random}`,
      status: overrides.status || 'EN_STOCK',
      ...overrides,
    },
  });
}

/**
 * Create a test stock item
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created stock item
 */
export async function createTestStockItem(overrides = {}) {
  let assetModelId = overrides.assetModelId;

  // Create model if not provided
  if (!assetModelId) {
    const model = await createTestAssetModel({
      type: 'CABLE',
      brand: 'Generic',
      modelName: 'USB-C Cable',
    });
    assetModelId = model.id;
  }

  return prisma.stockItem.create({
    data: {
      assetModelId,
      quantity: overrides.quantity || 10,
      loaned: overrides.loaned || 0,
      ...overrides,
    },
  });
}

/**
 * Create a test loan
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created loan
 */
export async function createTestLoan(overrides = {}) {
  let employeeId = overrides.employeeId;
  let createdById = overrides.createdById;

  // Create employee if not provided
  if (!employeeId) {
    const employee = await createTestEmployee();
    employeeId = employee.id;
  }

  // Create user if not provided
  if (!createdById) {
    const user = await createTestUser();
    createdById = user.id;
  }

  return prisma.loan.create({
    data: {
      employeeId,
      createdById,
      status: overrides.status || 'OPEN',
      openedAt: overrides.openedAt || new Date(),
      ...overrides,
    },
  });
}

/**
 * Create a test loan line
 *
 * @param {Object} overrides - Fields to override
 * @returns {Promise<Object>} Created loan line
 */
export async function createTestLoanLine(overrides = {}) {
  let loanId = overrides.loanId;

  // Create loan if not provided
  if (!loanId) {
    const loan = await createTestLoan();
    loanId = loan.id;
  }

  const data = { loanId };

  // Add either assetItem or stockItem
  if (overrides.assetItemId) {
    data.assetItemId = overrides.assetItemId;
  } else if (overrides.stockItemId) {
    data.stockItemId = overrides.stockItemId;
    data.quantity = overrides.quantity || 1;
  } else {
    // Create a default asset item
    const assetItem = await createTestAssetItem();
    data.assetItemId = assetItem.id;
  }

  return prisma.loanLine.create({ data });
}

/**
 * Get Prisma client for direct database access in tests
 *
 * @returns {PrismaClient}
 */
export function getPrismaClient() {
  return prisma;
}

export default {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestAdmin,
  createTestEmployee,
  createTestAssetModel,
  createTestAssetItem,
  createTestStockItem,
  createTestLoan,
  createTestLoanLine,
  getPrismaClient,
};
