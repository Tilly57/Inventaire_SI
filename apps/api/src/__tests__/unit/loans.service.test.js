/**
 * Unit Tests for Loans Service
 *
 * Tests for loan management business logic
 */

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import * as loansService from '../../services/loans.service.js';
import {
  cleanDatabase,
  disconnectDatabase,
  createTestUser,
  createTestEmployee,
  createTestAssetItem,
  createTestStockItem,
  createTestLoan,
  getPrismaClient,
} from '../utils/testUtils.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

const prisma = getPrismaClient();

describe('Loans Service - createLoan()', () => {
  let user;
  let employee;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    employee = await createTestEmployee();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should create loan with asset item', async () => {
    const assetItem = await createTestAssetItem({ status: 'EN_STOCK' });

    // Create loan
    const loan = await loansService.createLoan(employee.id, user.id);

    // Add asset item to loan
    await loansService.addLoanLine(loan.id, {
      assetItemId: assetItem.id,
    });

    // Fetch updated loan
    const updatedLoan = await loansService.getLoanById(loan.id);

    expect(updatedLoan).toBeDefined();
    expect(updatedLoan.employeeId).toBe(employee.id);
    expect(updatedLoan.status).toBe('OPEN');
    expect(updatedLoan.lines).toHaveLength(1);
    expect(updatedLoan.lines[0].assetItemId).toBe(assetItem.id);
  });

  test('should create loan with stock item', async () => {
    const stockItem = await createTestStockItem({ quantity: 10, loaned: 0 });

    // Create loan
    const loan = await loansService.createLoan(employee.id, user.id);

    // Add stock item to loan
    await loansService.addLoanLine(loan.id, {
      stockItemId: stockItem.id,
      quantity: 2,
    });

    // Fetch updated loan
    const updatedLoan = await loansService.getLoanById(loan.id);

    expect(updatedLoan).toBeDefined();
    expect(updatedLoan.lines).toHaveLength(1);
    expect(updatedLoan.lines[0].stockItemId).toBe(stockItem.id);
    expect(updatedLoan.lines[0].quantity).toBe(2);
  });

  test('should update asset status to PRETE', async () => {
    const assetItem = await createTestAssetItem({ status: 'EN_STOCK' });

    // Create loan and add asset item
    const loan = await loansService.createLoan(employee.id, user.id);
    await loansService.addLoanLine(loan.id, { assetItemId: assetItem.id });

    // Check asset status was updated
    const updatedAsset = await prisma.assetItem.findUnique({
      where: { id: assetItem.id },
    });
    expect(updatedAsset.status).toBe('PRETE');
  });

  test('should update stock loaned quantity', async () => {
    const stockItem = await createTestStockItem({ quantity: 10, loaned: 0 });

    // Create loan and add stock item
    const loan = await loansService.createLoan(employee.id, user.id);
    await loansService.addLoanLine(loan.id, { stockItemId: stockItem.id, quantity: 3 });

    // Check stock loaned was updated
    const updatedStock = await prisma.stockItem.findUnique({
      where: { id: stockItem.id },
    });
    expect(updatedStock.loaned).toBe(3);
    expect(updatedStock.quantity).toBe(10); // Quantity unchanged
  });

  test('should throw ValidationError if asset already loaned', async () => {
    const assetItem = await createTestAssetItem({ status: 'PRETE' });

    // Create loan and try to add already loaned asset
    const loan = await loansService.createLoan(employee.id, user.id);

    await expect(
      loansService.addLoanLine(loan.id, { assetItemId: assetItem.id })
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError if insufficient stock', async () => {
    const stockItem = await createTestStockItem({ quantity: 5, loaned: 3 });

    // Create loan and try to add more stock than available (only 2 available)
    const loan = await loansService.createLoan(employee.id, user.id);

    await expect(
      loansService.addLoanLine(loan.id, { stockItemId: stockItem.id, quantity: 5 })
    ).rejects.toThrow(ValidationError);
  });
});

describe('Loans Service - closeLoan()', () => {
  let user;
  let loan;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    loan = await createTestLoan({ status: 'OPEN', createdById: user.id });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should close loan successfully', async () => {
    const closedLoan = await loansService.closeLoan(loan.id);

    expect(closedLoan).toBeDefined();
    expect(closedLoan.status).toBe('CLOSED');
    expect(closedLoan.closedAt).toBeDefined();
    expect(closedLoan.closedAt).toBeInstanceOf(Date);
  });

  test('should throw ValidationError if loan already closed', async () => {
    await loansService.closeLoan(loan.id);

    await expect(loansService.closeLoan(loan.id)).rejects.toThrow(ValidationError);
  });

  test('should throw NotFoundError if loan does not exist', async () => {
    await expect(loansService.closeLoan('nonexistent-id')).rejects.toThrow(
      NotFoundError
    );
  });

  test('should revert asset status to EN_STOCK', async () => {
    const assetItem = await createTestAssetItem({ status: 'PRETE' });

    const loanWithAsset = await createTestLoan({ status: 'OPEN', createdById: user.id });
    await prisma.loanLine.create({
      data: {
        loanId: loanWithAsset.id,
        assetItemId: assetItem.id,
      },
    });

    await loansService.closeLoan(loanWithAsset.id);

    const updatedAsset = await prisma.assetItem.findUnique({
      where: { id: assetItem.id },
    });
    expect(updatedAsset.status).toBe('EN_STOCK');
  });

  test('should restore stock quantities', async () => {
    const stockItem = await createTestStockItem({ quantity: 10, loaned: 3 });

    const loanWithStock = await createTestLoan({ status: 'OPEN', createdById: user.id });
    await prisma.loanLine.create({
      data: {
        loanId: loanWithStock.id,
        stockItemId: stockItem.id,
        quantity: 3,
      },
    });

    await loansService.closeLoan(loanWithStock.id);

    const updatedStock = await prisma.stockItem.findUnique({
      where: { id: stockItem.id },
    });
    expect(updatedStock.loaned).toBe(0);
    expect(updatedStock.quantity).toBe(10);
  });
});

describe('Loans Service - deleteLoan()', () => {
  let user;
  let loan;

  beforeEach(async () => {
    await cleanDatabase();
    user = await createTestUser();
    loan = await createTestLoan({ status: 'OPEN', createdById: user.id });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should soft delete loan', async () => {
    await loansService.deleteLoan(loan.id, user.id);

    const deletedLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
    });

    expect(deletedLoan).toBeDefined();
    expect(deletedLoan.deletedAt).toBeDefined();
    expect(deletedLoan.deletedById).toBe(user.id);
  });

  test('should revert asset status on deletion', async () => {
    const assetItem = await createTestAssetItem({ status: 'PRETE' });

    await prisma.loanLine.create({
      data: {
        loanId: loan.id,
        assetItemId: assetItem.id,
      },
    });

    await loansService.deleteLoan(loan.id, user.id);

    const updatedAsset = await prisma.assetItem.findUnique({
      where: { id: assetItem.id },
    });
    expect(updatedAsset.status).toBe('EN_STOCK');
  });

  test('should restore stock on deletion', async () => {
    const stockItem = await createTestStockItem({ quantity: 10, loaned: 3 });

    await prisma.loanLine.create({
      data: {
        loanId: loan.id,
        stockItemId: stockItem.id,
        quantity: 3,
      },
    });

    await loansService.deleteLoan(loan.id, user.id);

    const updatedStock = await prisma.stockItem.findUnique({
      where: { id: stockItem.id },
    });
    expect(updatedStock.quantity).toBe(10); // Quantity unchanged
    expect(updatedStock.loaned).toBe(0); // 3 - 3
  });
});
