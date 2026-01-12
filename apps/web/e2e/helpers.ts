import { Page, expect } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.fill('input[name="email"]', 'admin@inventaire.local');
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
  await page.fill('input[name="email"]', 'gestionnaire1@inventaire.local');
  await page.fill('input[name="password"]', 'Gest123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Login as lecteur user
 */
export async function loginAsLecteur(page: Page) {
  await page.goto('/');
  await page.fill('input[name="email"]', 'lecture@inventaire.local');
  await page.fill('input[name="password"]', 'Lect123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Click on user menu button to open dropdown (shadcn/ui DropdownMenu)
  // Look for button in the header that contains user info (email or username)
  // The button should be in the rightmost part of the header
  const userMenuButton = page.locator('header button').filter({ hasText: /@/ }).or(
    page.locator('header button').last()
  );

  await userMenuButton.first().click();

  // Wait a bit for dropdown animation
  await page.waitForTimeout(300);

  // Click on "Déconnexion" in the dropdown menu
  // It's a DropdownMenuItem (rendered as div with role="menuitem")
  await page.locator('[role="menuitem"]:has-text("Déconnexion")').click();

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
  // Try getByRole first (more robust)
  try {
    await page.getByRole('button', { name: new RegExp(text, 'i') }).first().click({ timeout: 10000 });
  } catch {
    // Fallback to has-text selector
    await page.locator(`button:has-text("${text}")`).first().click({ timeout: 10000 });
  }
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
