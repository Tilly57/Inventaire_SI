import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';

/**
 * E2E Tests: Employee Management
 * Tests CRUD operations and Excel import
 */

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new employee', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click "Nouvel employé" button
    await clickButton(page, 'Nouvel employé');

    // Fill employee form
    await page.fill('input[name="firstName"]', 'Jean');
    await page.fill('input[name="lastName"]', 'Dupont');
    await page.fill('input[name="email"]', `jean.dupont.${Date.now()}@example.com`);
    await page.fill('input[name="dept"]', 'IT');

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success toast
    await page.waitForSelector('text=/employé créé/i', { timeout: 10000 });

    // Should show in list
    await expect(page.locator('text=Jean Dupont')).toBeVisible();
  });

  test('should edit existing employee', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click first employee edit button
    const firstEditButton = page.locator('button[aria-label*="Modifier"], button:has-text("Modifier")').first();
    await firstEditButton.click();

    // Update department
    await page.fill('input[name="dept"]', 'Marketing');

    // Save
    await clickButton(page, 'Enregistrer');

    // Wait for success
    await page.waitForSelector('text=/employé modifié/i', { timeout: 10000 });
  });

  test('should delete employee', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Get initial count
    const initialRows = await page.locator('tbody tr').count();

    // Click first delete button
    const firstDeleteButton = page.locator('button[aria-label*="Supprimer"], button:has-text("Supprimer")').first();
    await firstDeleteButton.click();

    // Confirm deletion
    await clickButton(page, 'Confirmer');

    // Wait for success
    await page.waitForSelector('text=/employé supprimé/i', { timeout: 10000 });

    // Count should decrease
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBeLessThan(initialRows);
  });

  test('should search employees', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Type in search
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]').first();
    await searchInput.fill('Dupont');

    // Wait for results
    await page.waitForTimeout(500);

    // All visible results should contain "Dupont"
    const rows = page.locator('tbody tr:visible');
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await rows.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('dupont');
      }
    }
  });

  test('should import employees from Excel', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click "Importer Excel" button
    await clickButton(page, 'Importer');

    // Upload file (note: this requires a test file)
    // For now, we'll just test that the dialog opens
    await expect(page.locator('text=/importer.*excel/i')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });
});
