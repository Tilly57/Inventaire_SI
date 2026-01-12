import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout } from './helpers';

/**
 * E2E Tests: Authentication Flow
 * Tests login, logout, and route protection
 */

test.describe('Authentication Flow', () => {
  test('should display login page on initial load', async ({ page }) => {
    await page.goto('/');

    // Should show login form
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message in form
    await expect(page.locator('[class*="destructive"][class*="text-sm"]')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await loginAsAdmin(page);

    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show dashboard content (heading)
    await expect(page.locator('h1:has-text("Tableau de bord")')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsAdmin(page);

    // Logout
    await logout(page);

    // Should redirect to login page
    await expect(page).toHaveURL(/\/$|\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should protect routes - redirect to login when not authenticated', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/$|\/login/);
  });

  test('should persist authentication on page reload', async ({ page }) => {
    await loginAsAdmin(page);

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/);
  });
});