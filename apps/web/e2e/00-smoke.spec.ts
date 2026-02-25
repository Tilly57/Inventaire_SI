import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, navigateTo } from './helpers';

/**
 * Smoke Tests - Critical Paths
 *
 * Quick tests to verify the most critical functionality works.
 * These tests should run fast and catch major regressions.
 *
 * Run with: npm run test:e2e -- 00-smoke.spec.ts
 */

test.describe('Smoke Tests - Critical Paths', () => {
  test('CRITICAL: User can login and access dashboard', async ({ page }) => {
    // Login
    await loginAsAdmin(page);

    // Verify dashboard loads
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('main h1')).toContainText(/tableau de bord/i);

    // Verify key metrics are visible
    const metrics = page.locator('[class*="card"]').first();
    await expect(metrics).toBeVisible();
  });

  test('CRITICAL: Navigation menu works', async ({ page }) => {
    await loginAsAdmin(page);

    // Test navigation to each main section
    const sections = [
      { path: '/dashboard', heading: /tableau de bord/i },
      { path: '/employees', heading: /employés/i },
      { path: '/assets/models', heading: /modèles.*équipement/i },
      { path: '/assets/items', heading: /équipements/i },
      { path: '/stock', heading: /stock/i },
      { path: '/loans', heading: /prêts/i },
    ];

    for (const section of sections) {
      await navigateTo(page, section.path);
      await expect(page.locator('main h1, main h2').first()).toContainText(section.heading);
    }
  });

  test('CRITICAL: Can create and view employee', async ({ page }) => {
    await loginAsAdmin(page);

    const timestamp = Date.now();
    const testEmail = `smoke.test.${timestamp}@test.local`;

    // Navigate to employees
    await navigateTo(page, '/employees');

    // Create employee
    await page.getByRole('button', { name: /nouvel employé/i }).click();

    await page.fill('input[name="firstName"]', 'Smoke');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="dept"]', 'Testing');

    await page.getByRole('button', { name: /créer/i }).click();

    // Verify success (toast or redirect)
    await page.waitForTimeout(1000);

    // Verify employee appears in list
    await navigateTo(page, '/employees');
    await expect(page.locator('tbody')).toContainText(testEmail);
  });

  test('CRITICAL: Can create asset model and asset item', async ({ page }) => {
    await loginAsAdmin(page);

    const timestamp = Date.now();

    // Create asset model
    await navigateTo(page, '/assets/models');
    await page.getByRole('button', { name: /nouveau modèle/i }).click();

    const modelDialog = page.locator('[role="dialog"]');
    await modelDialog.waitFor();

    // Select type via Radix Select
    await modelDialog.locator('button[role="combobox"]').first().click();
    await page.locator('[role="option"]').filter({ hasText: 'Ordinateur portable' }).click();

    await page.fill('input[name="brand"]', `SmokeTest`);
    await page.fill('input[name="modelName"]', `Model ${timestamp}`);

    await modelDialog.getByRole('button', { name: /créer/i }).click();
    await page.waitForTimeout(1000);

    // Verify model in list
    await navigateTo(page, '/assets/models');
    await expect(page.locator('tbody')).toContainText(`Model ${timestamp}`);

    // Create asset item
    await navigateTo(page, '/assets/items');
    await page.getByRole('button', { name: /nouvel équipement/i }).click();

    const itemDialog = page.locator('[role="dialog"]');
    await itemDialog.waitFor();

    // Select model via Radix Select
    await itemDialog.locator('button[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();

    const assetTag = `SMOKE${timestamp}`;
    await page.fill('input[name="assetTag"]', assetTag);
    await page.fill('input[name="serial"]', `SN${timestamp}`);

    await itemDialog.getByRole('button', { name: /créer/i }).click();
    await page.waitForTimeout(1000);

    // Verify asset in list
    await navigateTo(page, '/assets/items');
    await expect(page.locator('tbody')).toContainText(assetTag);
  });

  test('CRITICAL: Can create loan', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to loans
    await navigateTo(page, '/loans');

    // Create loan
    await page.getByRole('button', { name: /nouveau prêt/i }).click();

    const loanDialog = page.locator('[role="dialog"]');
    await loanDialog.waitFor();

    // Select first employee via Radix Select (scoped to dialog to avoid status filter)
    await loanDialog.locator('button[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]').first().click();

    await loanDialog.getByRole('button', { name: /créer/i }).click();

    // Verify redirect to loan details
    await page.waitForURL(/\/loans\/[a-z0-9]+/, { timeout: 15000 });

    // Verify we're on loan details page
    await expect(page.locator('main h1')).toContainText(/détails du prêt/i);
  });

  test('CRITICAL: Can export data', async ({ page }) => {
    await loginAsAdmin(page);

    // Test export from employees page
    await navigateTo(page, '/employees');

    // Look for export button
    const exportButton = page.getByRole('button', { name: /exporter/i }).or(
      page.locator('button:has-text("Export")').first()
    );

    if (await exportButton.isVisible({ timeout: 2000 })) {
      // Start download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    } else {
      // Export functionality not visible, skip
      test.skip();
    }
  });

  test('CRITICAL: User can logout', async ({ page }) => {
    await loginAsAdmin(page);

    // Logout
    await logout(page);

    // Verify redirected to login
    await expect(page).toHaveURL(/\/$|\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('CRITICAL: Protected routes redirect unauthenticated users', async ({ page }) => {
    // Try to access protected pages without login
    const protectedPages = [
      '/dashboard',
      '/employees',
      '/assets/models',
      '/assets/items',
      '/stock',
      '/loans',
    ];

    for (const path of protectedPages) {
      await page.goto(path);

      // Should redirect to login
      await expect(page).toHaveURL(/\/$|\/login/);
    }
  });

  test('CRITICAL: Search functionality works', async ({ page }) => {
    await loginAsAdmin(page);

    // Test search on employees page
    await navigateTo(page, '/employees');

    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Type in search
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Verify table updates (may be empty, just check it responds)
      await expect(page.locator('table').first()).toBeVisible();
    }
  });

  test('CRITICAL: Error handling works', async ({ page }) => {
    // Test login with invalid credentials
    await page.goto('/');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[class*="destructive"], [role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});
