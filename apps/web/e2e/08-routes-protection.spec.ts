import { test, expect } from '@playwright/test';
import { loginAsGestionnaire, loginAsLecteur, navigateTo } from './helpers';

/**
 * E2E Tests: Routes Protection & RBAC
 * Tests route protection and role-based access control
 */

test.describe('Routes Protection & RBAC', () => {
  const protectedRoutes = [
    '/dashboard',
    '/employees',
    '/asset-models',
    '/asset-items',
    '/stock-items',
    '/loans',
    '/users',
  ];

  test('should redirect to login when accessing protected routes without auth', async ({ page }) => {
    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login
      await expect(page).toHaveURL(/\/$|\/login/);

      // Should show login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    }
  });

  test('LECTEUR should not be able to create resources', async ({ page }) => {
    await loginAsLecteur(page);

    // Navigate to employees
    await navigateTo(page, '/employees');

    // "Nouvel employé" button should be disabled or hidden
    const createButton = page.locator('button:has-text("Nouvel employé")');

    if (await createButton.count() > 0) {
      await expect(createButton).toBeDisabled();
    } else {
      // Button is hidden for LECTURE role
      expect(await createButton.count()).toBe(0);
    }
  });

  test('LECTEUR should not be able to edit resources', async ({ page }) => {
    await loginAsLecteur(page);

    await navigateTo(page, '/employees');

    // Edit buttons should be disabled or hidden
    const editButtons = page.locator('button:has-text("Modifier")');

    if (await editButtons.count() > 0) {
      const firstButton = editButtons.first();
      await expect(firstButton).toBeDisabled();
    }
  });

  test('LECTEUR should not be able to delete resources', async ({ page }) => {
    await loginAsLecteur(page);

    await navigateTo(page, '/employees');

    // Delete buttons should be disabled or hidden
    const deleteButtons = page.locator('button:has-text("Supprimer")');

    if (await deleteButtons.count() > 0) {
      const firstButton = deleteButtons.first();
      await expect(firstButton).toBeDisabled();
    }
  });

  test('LECTEUR should not access users management', async ({ page }) => {
    await loginAsLecteur(page);

    // Try to access /users
    await page.goto('/users');

    // Should be redirected or show error
    // Either redirected to dashboard or shows 403
    const url = page.url();
    const hasError = await page.locator('text=/403|non autorisé|accès refusé/i').count() > 0;

    expect(url.includes('/users') === false || hasError).toBeTruthy();
  });

  test('GESTIONNAIRE should be able to create and edit resources', async ({ page }) => {
    await loginAsGestionnaire(page);

    await navigateTo(page, '/employees');

    // Should have create button
    const createButton = page.locator('button:has-text("Nouvel employé")');
    await expect(createButton).toBeEnabled();

    // Should have edit buttons
    const editButtons = page.locator('button:has-text("Modifier")');
    if (await editButtons.count() > 0) {
      await expect(editButtons.first()).toBeEnabled();
    }
  });

  test('GESTIONNAIRE should not access users management', async ({ page }) => {
    await loginAsGestionnaire(page);

    // Try to access /users
    await page.goto('/users');

    // Should be redirected or show error
    const url = page.url();
    const hasError = await page.locator('text=/403|non autorisé|accès refusé/i').count() > 0;

    expect(url.includes('/users') === false || hasError).toBeTruthy();
  });

  test('should handle token expiration gracefully', async ({ page }) => {
    await loginAsGestionnaire(page);

    // Clear localStorage to simulate token expiration
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to navigate to protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/$|\/login/);
  });
});
