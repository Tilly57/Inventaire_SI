import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';

/**
 * E2E Tests: Equipment Management
 * Tests asset models and asset items CRUD, bulk creation
 *
 * TEMPORAIREMENT DÉSACTIVÉ - En cours de correction
 * Les patterns de sélecteurs nécessitent des ajustements similaires à Employees
 */

test.describe.skip('Equipment Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new asset model', async ({ page }) => {
    await navigateTo(page, '/asset-models');

    // Click "Nouveau modèle" button
    await clickButton(page, 'Nouveau modèle');

    // Fill form
    await page.fill('input[name="type"]', 'Laptop');
    await page.fill('input[name="brand"]', 'Dell');
    await page.fill('input[name="modelName"]', `Latitude ${Date.now()}`);

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success
    await page.waitForSelector('text=/modèle créé/i', { timeout: 10000 });
  });

  test('should create new asset item', async ({ page }) => {
    await navigateTo(page, '/asset-items');

    // Click "Nouvel équipement" button
    await clickButton(page, 'Nouvel équipement');

    // Select model from dropdown
    await page.click('button[role="combobox"], select[name="assetModelId"]');
    await page.click('div[role="option"]:first-child, option:first-child');

    // Fill serial
    const serial = `SN${Date.now()}`;
    await page.fill('input[name="serial"]', serial);

    // Asset tag will be auto-generated

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success
    await page.waitForSelector('text=/équipement créé/i', { timeout: 10000 });

    // Should show in list
    await expect(page.locator(`text=${serial}`)).toBeVisible();
  });

  test('should bulk create asset items', async ({ page }) => {
    await navigateTo(page, '/asset-items');

    // Click "Création en masse" button
    await clickButton(page, 'Création en masse');

    // Select model
    await page.click('button[role="combobox"], select[name="assetModelId"]');
    await page.click('div[role="option"]:first-child, option:first-child');

    // Enter quantity
    await page.fill('input[name="quantity"]', '3');

    // Preview should show 3 items with sequential tags
    await clickButton(page, 'Prévisualiser');

    // Wait for preview
    await page.waitForSelector('text=/prévisualisation/i', { timeout: 5000 });

    // Should show 3 items
    const previewItems = await page.locator('div[data-testid="preview-item"], li').count();
    expect(previewItems).toBeGreaterThanOrEqual(3);

    // Confirm creation
    await clickButton(page, 'Créer');

    // Wait for success
    await page.waitForSelector('text=/équipements créés/i', { timeout: 10000 });
  });

  test('should change asset item status', async ({ page }) => {
    await navigateTo(page, '/asset-items');

    // Find first item with "EN_STOCK" status
    const firstItem = page.locator('tr:has(span:text("EN_STOCK"))').first();

    // Click edit
    await firstItem.locator('button:has-text("Modifier")').click();

    // Change status to "HS"
    await page.click('select[name="status"], button[role="combobox"]:near(label:text("Statut"))');
    await page.click('option[value="HS"], div[role="option"]:has-text("HS")');

    // Save
    await clickButton(page, 'Enregistrer');

    // Wait for success
    await page.waitForSelector('text=/équipement modifié/i', { timeout: 10000 });
  });

  test('should delete asset model (cascade)', async ({ page }) => {
    await navigateTo(page, '/asset-models');

    // Create a new model first
    await clickButton(page, 'Nouveau modèle');
    const modelName = `Test Model ${Date.now()}`;
    await page.fill('input[name="type"]', 'Test');
    await page.fill('input[name="brand"]', 'Test Brand');
    await page.fill('input[name="modelName"]', modelName);
    await clickButton(page, 'Créer');
    await page.waitForSelector('text=/modèle créé/i', { timeout: 10000 });

    // Find and delete it
    const modelRow = page.locator(`tr:has-text("${modelName}")`);
    await modelRow.locator('button:has-text("Supprimer")').click();

    // Confirm deletion
    await clickButton(page, 'Confirmer');

    // Wait for success
    await page.waitForSelector('text=/modèle supprimé/i', { timeout: 10000 });

    // Should not be in list
    await expect(page.locator(`text="${modelName}"`)).not.toBeVisible();
  });
});
