/**
 * @fileoverview Test fixtures and data factories for E2E tests
 *
 * Provides reusable test data creation and cleanup utilities
 */

import { Page } from '@playwright/test';
import { clickButton, navigateTo } from './helpers';

/**
 * Create a test employee
 * Returns employee data for use in other tests
 */
export async function createTestEmployee(page: Page, suffix: string = '') {
  const timestamp = Date.now();
  const employeeData = {
    firstName: `Test${suffix}`,
    lastName: `Employee${suffix}`,
    email: `test.employee${suffix}.${timestamp}@test.local`,
    dept: `Department ${timestamp}`,
  };

  await navigateTo(page, '/employees');
  await clickButton(page, 'Nouvel employé');

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor();

  // Fill form (scoped to dialog)
  await dialog.locator('input[name="firstName"]').fill(employeeData.firstName);
  await dialog.locator('input[name="lastName"]').fill(employeeData.lastName);
  await dialog.locator('input[name="email"]').fill(employeeData.email);
  await dialog.locator('input[name="dept"]').fill(employeeData.dept);

  // Submit
  await dialog.getByRole('button', { name: /créer/i }).click();

  // Wait for dialog to close — confirms API success
  await dialog.waitFor({ state: 'detached', timeout: 10000 });

  return employeeData;
}

/**
 * Create a test asset model
 * Returns model data for use in other tests
 */
export async function createTestAssetModel(page: Page, suffix: string = '') {
  const timestamp = Date.now();
  const modelData = {
    type: 'Ordinateur portable',
    brand: `TestBrand${suffix}`,
    modelName: `Model ${timestamp}`,
  };

  await navigateTo(page, '/assets/models');
  await clickButton(page, 'Nouveau modèle');

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor();

  // Select type via Radix Select
  await dialog.locator('button[role="combobox"]').first().click();
  await page.locator('[role="option"]').filter({ hasText: modelData.type }).click();

  await dialog.locator('input[name="brand"]').fill(modelData.brand);
  await dialog.locator('input[name="modelName"]').fill(modelData.modelName);

  // Submit
  await dialog.getByRole('button', { name: /créer/i }).click();

  // Wait for dialog to close — confirms API success
  await dialog.waitFor({ state: 'detached', timeout: 10000 });

  return modelData;
}

/**
 * Create a test asset item via API
 * The UI button may be disabled, so we use the API directly
 */
export async function createTestAssetItem(page: Page, suffix: string = '') {
  const timestamp = Date.now();
  const itemData = {
    assetTag: `TAG${timestamp}${suffix}`,
    serial: `SN${timestamp}${suffix}`,
  };

  // Get auth token from localStorage
  const token = await page.evaluate(() => {
    // Try common storage patterns for auth tokens
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return parsed?.state?.accessToken || null;
      } catch { return null; }
    }
    return localStorage.getItem('accessToken') || null;
  });

  // API base URL — in CI: http://localhost:3001/api, in prod: /api via proxy
  const apiBaseUrl = process.env.VITE_API_URL || 'http://localhost:3001/api';

  // Use request context (cookies) instead of Authorization header for CSRF compat
  // First, get a model ID to associate with
  const modelsResponse = await page.request.get(`${apiBaseUrl}/asset-models?limit=1`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  const modelsData = await modelsResponse.json();
  const modelId = modelsData?.data?.[0]?.id || modelsData?.[0]?.id;

  if (!modelId) {
    throw new Error('No asset model found — create one first');
  }

  // Create asset item via API
  const createResponse = await page.request.post(`${apiBaseUrl}/asset-items`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    data: {
      assetModelId: modelId,
      assetTag: itemData.assetTag,
      serialNumber: itemData.serial,
      status: 'EN_STOCK',
    },
  });

  if (!createResponse.ok()) {
    const err = await createResponse.text();
    throw new Error(`Failed to create asset item: ${createResponse.status()} ${err}`);
  }

  return itemData;
}

/**
 * Create a test stock item
 */
export async function createTestStockItem(page: Page, suffix: string = '') {
  const timestamp = Date.now();
  const stockData = {
    name: `Test Stock Item ${timestamp}${suffix}`,
    description: `Test stock item created at ${new Date().toISOString()}`,
    quantity: '10',
    minQuantity: '2',
    location: `Storage ${timestamp}`,
  };

  await navigateTo(page, '/stock');
  await clickButton(page, 'Nouvel article');

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor();

  // Fill form (scoped to dialog)
  await dialog.locator('input[name="name"]').fill(stockData.name);
  await dialog.locator('textarea[name="description"]').fill(stockData.description);
  await dialog.locator('input[name="quantity"]').fill(stockData.quantity);
  await dialog.locator('input[name="minQuantity"]').fill(stockData.minQuantity);
  await dialog.locator('input[name="location"]').fill(stockData.location);

  // Submit
  await dialog.getByRole('button', { name: /créer/i }).click();

  // Wait for dialog to close — confirms API success
  await dialog.waitFor({ state: 'detached', timeout: 10000 });

  return stockData;
}

/**
 * Create a test loan (without items)
 * Returns loan ID from URL
 */
export async function createTestLoan(page: Page, employeeEmail?: string): Promise<string> {
  await navigateTo(page, '/loans');
  await clickButton(page, 'Nouveau prêt');

  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor();

  // Select employee via Radix Select (scoped to dialog)
  await dialog.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(300);

  if (employeeEmail) {
    await page.locator(`[role="option"]:has-text("${employeeEmail}")`).first().click();
  } else {
    await page.locator('[role="option"]').first().click();
  }

  // Submit
  await clickButton(page, 'Créer');

  // Wait for redirect to loan details
  await page.waitForURL(/\/loans\/[a-z0-9]+/, { timeout: 15000 });

  // Extract loan ID from URL
  const url = page.url();
  const loanId = url.split('/').pop() || '';

  return loanId;
}

/**
 * Delete test employee by email
 */
export async function deleteTestEmployee(page: Page, email: string) {
  await navigateTo(page, '/employees');

  // Search for employee
  const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(email);
    await page.waitForTimeout(500);
  }

  // Find row with email and click delete button
  const row = page.locator(`tr:has-text("${email}")`).first();
  if (await row.isVisible()) {
    const deleteButton = row.locator('button[title*="Supprimer"], button:has-text("Supprimer")').first();
    await deleteButton.click();

    // Confirm deletion
    await page.waitForTimeout(300);
    await clickButton(page, 'Confirmer');

    // Wait for success
    await waitForToast(page);
  }
}

/**
 * Delete test asset item by asset tag
 */
export async function deleteTestAssetItem(page: Page, assetTag: string) {
  await navigateTo(page, '/assets/items');

  // Search for asset
  const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(assetTag);
    await page.waitForTimeout(500);
  }

  // Find row and delete
  const row = page.locator(`tr:has-text("${assetTag}")`).first();
  if (await row.isVisible()) {
    const deleteButton = row.locator('button[title*="Supprimer"], button:has-text("Supprimer")').first();
    await deleteButton.click();

    // Confirm
    await page.waitForTimeout(300);
    await clickButton(page, 'Confirmer');

    // Wait for success
    await waitForToast(page);
  }
}

/**
 * Clean up all test data (employees, assets, etc.)
 * Use this in test teardown
 */
export async function cleanupTestData(page: Page, createdData: {
  employees?: string[];
  assetItems?: string[];
  loans?: string[];
}) {
  // Delete employees
  if (createdData.employees) {
    for (const email of createdData.employees) {
      try {
        await deleteTestEmployee(page, email);
      } catch (error) {
        console.log(`Failed to delete employee ${email}:`, error);
      }
    }
  }

  // Delete asset items
  if (createdData.assetItems) {
    for (const assetTag of createdData.assetItems) {
      try {
        await deleteTestAssetItem(page, assetTag);
      } catch (error) {
        console.log(`Failed to delete asset ${assetTag}:`, error);
      }
    }
  }

  // Loans are soft deleted automatically, no need to clean up
}
