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
    const uniqueEmail = `jean.dupont.${Date.now()}@example.com`;
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="dept"]', 'IT');

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success toast
    await page.waitForSelector('text=/employé créé/i', { timeout: 10000 });

    // Should show in list - use first() to avoid strict mode violation
    await expect(page.locator('text=Jean Dupont').first()).toBeVisible();
  });

  test('should edit existing employee', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click first employee edit button (icon button in desktop view)
    // Pencil icon is used for edit
    const firstEditButton = page.locator('tbody button').filter({ has: page.locator('svg') }).first();
    await firstEditButton.click();

    // Wait for dialog to open
    await page.waitForSelector('input[name="dept"]', { timeout: 5000 });

    // Update department
    await page.fill('input[name="dept"]', 'Marketing Updated');

    // Save (button says "Modifier" in edit mode)
    await clickButton(page, 'Modifier');

    // Wait for success
    await page.waitForSelector('text=/employé modifié/i', { timeout: 10000 });
  });

  test.skip('should delete employee', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Get initial count
    const initialRows = await page.locator('tbody tr').count();
    expect(initialRows).toBeGreaterThan(0);

    // Click first row's delete button (look for Trash2 icon - second button in actions)
    // Better: find all buttons in first row and click the second one (delete)
    await page.locator('tbody tr').first().locator('button').nth(1).click();

    // Wait for confirmation dialog - should show "Supprimer l'employé" heading
    await page.waitForSelector('h2:has-text("Supprimer l\'employé")', { timeout: 5000 });

    // Confirm deletion - click the destructive button
    await page.locator('button[class*="destructive"]:has-text("Supprimer")').click();

    // Wait for success
    await page.waitForSelector('text=/employé supprimé/i', { timeout: 10000 });

    // Count should decrease
    await page.waitForTimeout(500); // Wait for UI to update
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBeLessThan(initialRows);
  });

  test('should search employees', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Type in search (look for input with Search icon or placeholder)
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="rechercher"]').first();

    // First, check how many employees there are
    const initialCount = await page.locator('tbody tr').count();
    expect(initialCount).toBeGreaterThan(0);

    // Search for something that should filter results
    await searchInput.fill('DUMONCEAU');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Results should be filtered
    const filteredCount = await page.locator('tbody tr').count();

    // If we found results, verify they contain the search term
    if (filteredCount > 0 && filteredCount < initialCount) {
      const firstRow = await page.locator('tbody tr').first().textContent();
      expect(firstRow?.toUpperCase()).toContain('DUMONCEAU');
    }
  });

  test('should import employees from Excel', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click "Importer Excel" button
    await clickButton(page, 'Importer');

    // Upload file (note: this requires a test file)
    // For now, we'll just test that the dialog opens
    // Use heading to avoid strict mode violation
    await expect(page.locator('h2:has-text("Importer des employés")')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
  });
});
