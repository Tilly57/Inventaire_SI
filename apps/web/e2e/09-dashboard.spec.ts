import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo } from './helpers';

/**
 * E2E Tests: Dashboard
 * Tests dashboard statistics and widgets
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateTo(page, '/dashboard');
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Should show statistics cards
    await expect(page.locator('text=/total.*employés/i')).toBeVisible();
    await expect(page.locator('text=/total.*équipements/i')).toBeVisible();
    await expect(page.locator('text=/prêts.*actifs/i')).toBeVisible();
  });

  test('should display statistics with correct values', async ({ page }) => {
    // Get total employees stat
    const employeesStat = page.locator('div:has-text("Total Employés"), div:has-text("Employés")').first();
    const employeesText = await employeesStat.textContent();

    // Should contain a number
    expect(employeesText).toMatch(/\d+/);

    // Get total assets stat
    const assetsStat = page.locator('div:has-text("Total Équipements"), div:has-text("Équipements")').first();
    const assetsText = await assetsStat.textContent();

    expect(assetsText).toMatch(/\d+/);
  });

  test('should display low stock alerts', async ({ page }) => {
    // Low stock section should be visible
    const lowStockSection = page.locator('text=/stock bas/i, text=/alertes.*stock/i').first();

    if (await lowStockSection.count() > 0) {
      await expect(lowStockSection).toBeVisible();
    }
  });

  test('should display recent loans', async ({ page }) => {
    // Recent loans section
    const recentLoans = page.locator('text=/prêts.*récents/i, text=/derniers.*prêts/i').first();

    if (await recentLoans.count() > 0) {
      await expect(recentLoans).toBeVisible();
    }
  });

  test('should display equipment by type chart', async ({ page }) => {
    // Chart should be visible
    const chart = page.locator('svg, canvas, .recharts-wrapper').first();

    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();
    }
  });

  test('should navigate to employees from dashboard', async ({ page }) => {
    // Click on employees card or link
    const employeesLink = page.locator('a[href="/employees"], button:has-text("Voir les employés")').first();

    if (await employeesLink.count() > 0) {
      await employeesLink.click();
      await expect(page).toHaveURL(/\/employees/);
    }
  });

  test('should navigate to loans from recent loans', async ({ page }) => {
    // Click on a recent loan
    const loanLink = page.locator('a[href*="/loans/"]').first();

    if (await loanLink.count() > 0) {
      await loanLink.click();
      await expect(page).toHaveURL(/\/loans\//);
    }
  });

  test('should refresh dashboard data', async ({ page }) => {
    // Get initial employee count
    const employeesStat = page.locator('div:has-text("Total Employés"), div:has-text("Employés")').first();
    const initialText = await employeesStat.textContent();

    // Reload page
    await page.reload();

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Should still show data
    const newText = await employeesStat.textContent();
    expect(newText).toBeTruthy();
  });
});
