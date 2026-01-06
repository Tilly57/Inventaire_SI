import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';

/**
 * E2E Tests: User Management
 * Tests CRUD operations and role management
 */

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create new user with GESTIONNAIRE role', async ({ page }) => {
    await navigateTo(page, '/users');

    // Click "Nouvel utilisateur" button
    await clickButton(page, 'Nouvel utilisateur');

    // Fill form
    const email = `user.${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');

    // Select role GESTIONNAIRE
    await page.click('select[name="role"], button[role="combobox"]:near(label:text("Rôle"))');
    await page.click('option[value="GESTIONNAIRE"], div[role="option"]:has-text("GESTIONNAIRE")');

    // Submit
    await clickButton(page, 'Créer');

    // Wait for success
    await page.waitForSelector('text=/utilisateur créé/i', { timeout: 10000 });

    // Should show in list
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });

  test('should create user with LECTURE role', async ({ page }) => {
    await navigateTo(page, '/users');

    await clickButton(page, 'Nouvel utilisateur');

    const email = `lecteur.${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');

    // Select LECTURE role
    await page.click('select[name="role"], button[role="combobox"]:near(label:text("Rôle"))');
    await page.click('option[value="LECTURE"], div[role="option"]:has-text("LECTURE")');

    await clickButton(page, 'Créer');
    await page.waitForSelector('text=/utilisateur créé/i', { timeout: 10000 });

    // Verify role is displayed
    const userRow = page.locator(`tr:has-text("${email}")`);
    await expect(userRow.locator('text=LECTURE')).toBeVisible();
  });

  test('should change user role', async ({ page }) => {
    await navigateTo(page, '/users');

    // Find a GESTIONNAIRE user
    const gestionnaireRow = page.locator('tr:has(span:text("GESTIONNAIRE"))').first();

    // Click edit
    await gestionnaireRow.locator('button:has-text("Modifier")').click();

    // Change role to LECTURE
    await page.click('select[name="role"], button[role="combobox"]');
    await page.click('option[value="LECTURE"], div[role="option"]:has-text("LECTURE")');

    // Save
    await clickButton(page, 'Enregistrer');

    // Wait for success
    await page.waitForSelector('text=/utilisateur modifié/i', { timeout: 10000 });
  });

  test('should change user password', async ({ page }) => {
    await navigateTo(page, '/users');

    // Click on first user's "Changer mot de passe" button
    const firstUser = page.locator('tbody tr').first();
    await firstUser.locator('button:has-text("Mot de passe"), button[aria-label*="mot de passe"]').click();

    // Enter new password
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    // Save
    await clickButton(page, 'Enregistrer');

    // Wait for success
    await page.waitForSelector('text=/mot de passe modifié/i', { timeout: 10000 });
  });

  test('should delete user', async ({ page }) => {
    await navigateTo(page, '/users');

    // Create a user first
    await clickButton(page, 'Nouvel utilisateur');
    const email = `todelete.${Date.now()}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('select[name="role"]');
    await page.click('option[value="LECTURE"]');
    await clickButton(page, 'Créer');
    await page.waitForSelector('text=/utilisateur créé/i', { timeout: 10000 });

    // Find and delete it
    const userRow = page.locator(`tr:has-text("${email}")`);
    await userRow.locator('button:has-text("Supprimer")').click();

    // Confirm
    await clickButton(page, 'Confirmer');

    // Wait for success
    await page.waitForSelector('text=/utilisateur supprimé/i', { timeout: 10000 });

    // Should not be in list
    await expect(page.locator(`text="${email}"`)).not.toBeVisible();
  });

  test('should not delete admin if it is the last admin', async ({ page }) => {
    await navigateTo(page, '/users');

    // Try to delete admin user
    const adminRow = page.locator('tr:has(span:text("ADMIN"))').first();
    const deleteButton = adminRow.locator('button:has-text("Supprimer")');

    // Button might be disabled or show error
    if (await deleteButton.isEnabled()) {
      await deleteButton.click();
      await clickButton(page, 'Confirmer');

      // Should show error
      await page.waitForSelector('text=/impossible.*supprimer.*admin/i', { timeout: 10000 });
    }
  });
});
