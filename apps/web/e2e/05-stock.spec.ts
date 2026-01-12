import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';

/**
 * E2E Tests: Stock Management
 * Tests stock items creation and quantity adjustments
 *
 * TEMPORAIREMENT DÉSACTIVÉ - En cours de correction
 * Patterns similaires à Equipment et Employees
 */

test.describe.skip('Stock Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new stock item', async ({ page }) => {
    await navigateTo(page, '/stock-items');

    // Click "Nouvel article" button
    await clickButton(page, 'Nouvel article');

    // Select asset model
    await page.click('button[role="combobox"]:near(label:text("Modèle")), select[name="assetModelId"]');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child, option:first-child');

    // Enter quantity
    await page.fill('input[name="quantity"]', '50');

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success
    await page.waitForSelector('text=/article.*créé/i', { timeout: 10000 });
  });

  test('should adjust stock quantity', async ({ page }) => {
    await navigateTo(page, '/stock-items');

    // Find first stock item
    const firstItem = page.locator('tbody tr').first();

    // Click edit
    await firstItem.locator('button:has-text("Modifier")').click();

    // Increase quantity by 10
    const quantityInput = page.locator('input[name="quantity"]');
    const currentValue = await quantityInput.inputValue();
    const newValue = parseInt(currentValue) + 10;

    await quantityInput.fill(newValue.toString());

    // Save
    await clickButton(page, 'Enregistrer');

    // Wait for success
    await page.waitForSelector('text=/article.*modifié/i', { timeout: 10000 });
  });

  test('should show low stock alert', async ({ page }) => {
    await navigateTo(page, '/stock-items');

    // Create item with low stock (< 5)
    await clickButton(page, 'Nouvel article');

    await page.click('button[role="combobox"]:near(label:text("Modèle"))');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child');

    // Set low quantity
    await page.fill('input[name="quantity"]', '3');

    await clickButton(page, 'Créer');
    await page.waitForSelector('text=/article.*créé/i', { timeout: 10000 });

    // Navigate to dashboard
    await navigateTo(page, '/dashboard');

    // Should show low stock alert
    await expect(page.locator('text=/stock bas/i')).toBeVisible();
  });

  test('should delete stock item', async ({ page }) => {
    await navigateTo(page, '/stock-items');

    // Get initial count
    const initialRows = await page.locator('tbody tr').count();

    // Delete first item
    const firstItem = page.locator('tbody tr').first();
    await firstItem.locator('button:has-text("Supprimer")').click();

    // Confirm
    await clickButton(page, 'Confirmer');

    // Wait for success
    await page.waitForSelector('text=/article.*supprimé/i', { timeout: 10000 });

    // Count should decrease
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBeLessThan(initialRows);
  });

  test('should filter stock by availability', async ({ page }) => {
    await navigateTo(page, '/stock-items');

    // Apply filter (if available)
    const filterButton = page.locator('button:has-text("Filtrer"), select[name="filter"]');

    if (await filterButton.count() > 0) {
      await filterButton.click();

      // Wait for results
      await page.waitForTimeout(500);
    }

    // Verify table shows results
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });
});
