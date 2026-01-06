import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Login as gestionnaire user
 */
export async function loginAsGestionnaire(page: Page) {
  await page.goto('/');
  await page.fill('input[name="email"]', 'gestionnaire@example.com');
  await page.fill('input[name="password"]', 'Gestionnaire123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Login as lecteur user
 */
export async function loginAsLecteur(page: Page) {
  await page.goto('/');
  await page.fill('input[name="email"]', 'lecteur@example.com');
  await page.fill('input[name="password"]', 'Lecteur123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click on user menu
  await page.click('[data-testid="user-menu"]', { timeout: 5000 }).catch(() => {
    // Fallback: try to find logout button directly
  });

  // Click logout
  await page.click('button:has-text("Déconnexion")', { timeout: 5000 });

  // Wait for redirect to login
  await expect(page).toHaveURL(/\/$|\/login/);
}

/**
 * Navigate to a specific page
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  const toastSelector = '[data-testid="toast"], .toast, [role="alert"]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });

  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Click button with text (case insensitive)
 */
export async function clickButton(page: Page, text: string) {
  await page.click(`button:has-text("${text}")`, { timeout: 5000 });
}

/**
 * Fill form field by label
 */
export async function fillField(page: Page, label: string, value: string) {
  const input = page.locator(`input:near(:text("${label}"))`).first();
  await input.fill(value);
}

/**
 * Select option from dropdown by label
 */
export async function selectOption(page: Page, label: string, option: string) {
  const select = page.locator(`select:near(:text("${label}"))`).first();
  await select.selectOption(option);
}
