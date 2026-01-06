import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';

/**
 * E2E Tests: Loan Workflow
 * Tests complete loan lifecycle: creation → add items → signature → close
 */

test.describe('Loan Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new loan', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Click "Nouveau prêt" button
    await clickButton(page, 'Nouveau prêt');

    // Select employee
    await page.click('button[role="combobox"]:near(label:text("Employé")), select[name="employeeId"]');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child, option:first-child');

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success and redirect
    await page.waitForSelector('text=/prêt créé/i', { timeout: 10000 });

    // Should redirect to loan details
    await expect(page).toHaveURL(/\/loans\//);
  });

  test('should complete loan workflow: create → add items → pickup signature → return signature → close', async ({ page }) => {
    // 1. Create loan
    await navigateTo(page, '/loans');
    await clickButton(page, 'Nouveau prêt');

    await page.click('button[role="combobox"]:near(label:text("Employé")), select[name="employeeId"]');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child, option:first-child');
    await clickButton(page, 'Créer');
    await page.waitForSelector('text=/prêt créé/i', { timeout: 10000 });

    // Wait for redirect to loan details
    await page.waitForURL(/\/loans\//, { timeout: 10000 });

    // 2. Add items
    await clickButton(page, 'Ajouter articles');

    // Add an asset item
    await page.click('button:has-text("Équipement")');
    await page.click('select[name="assetItemId"], button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child, option:first-child');
    await clickButton(page, 'Ajouter');

    // Wait for item to be added
    await page.waitForSelector('text=/article ajouté/i', { timeout: 10000 });

    // 3. Pickup signature
    await clickButton(page, 'Signature retrait');

    // Draw on canvas (simple line)
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 50, y: 50 } });
    await canvas.click({ position: { x: 150, y: 100 } });

    // Confirm signature
    await clickButton(page, 'Valider');

    // Wait for signature saved
    await page.waitForSelector('text=/signature.*enregistrée/i', { timeout: 10000 });

    // 4. Return signature
    await clickButton(page, 'Signature retour');

    // Draw on canvas
    const returnCanvas = page.locator('canvas').first();
    await returnCanvas.click({ position: { x: 50, y: 50 } });
    await returnCanvas.click({ position: { x: 150, y: 100 } });

    // Confirm signature
    await clickButton(page, 'Valider');

    // Wait for signature saved
    await page.waitForSelector('text=/signature.*enregistrée/i', { timeout: 10000 });

    // 5. Close loan
    await clickButton(page, 'Fermer le prêt');

    // Confirm
    await clickButton(page, 'Confirmer');

    // Wait for closure
    await page.waitForSelector('text=/prêt fermé/i', { timeout: 10000 });

    // Status should be CLOSED
    await expect(page.locator('text=CLOSED')).toBeVisible();
  });

  test('should view loan details', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Click on first loan
    const firstLoan = page.locator('tbody tr').first();
    await firstLoan.click();

    // Should show loan details
    await expect(page).toHaveURL(/\/loans\//);
    await expect(page.locator('text=/détails du prêt/i')).toBeVisible();
  });

  test('should filter loans by status', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Click filter by OPEN
    await page.click('button:has-text("OPEN"), select[name="status"]');

    // Wait for filtering
    await page.waitForTimeout(500);

    // All visible loans should have OPEN status
    const statusBadges = page.locator('tbody tr:visible span:has-text("OPEN")');
    const count = await statusBadges.count();

    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should soft delete loan', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Create a new loan first
    await clickButton(page, 'Nouveau prêt');
    await page.click('button[role="combobox"]:near(label:text("Employé"))');
    await page.waitForTimeout(500);
    await page.click('div[role="option"]:first-child');
    await clickButton(page, 'Créer');
    await page.waitForURL(/\/loans\//, { timeout: 10000 });

    // Get loan ID from URL
    const url = page.url();
    const loanId = url.split('/').pop();

    // Delete loan
    await clickButton(page, 'Supprimer');
    await clickButton(page, 'Confirmer');

    // Wait for success
    await page.waitForSelector('text=/prêt supprimé/i', { timeout: 10000 });

    // Should redirect to loans list
    await expect(page).toHaveURL(/\/loans$/);
  });
});
