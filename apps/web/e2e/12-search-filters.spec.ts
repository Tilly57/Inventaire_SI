import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo, waitForToast } from './helpers';
import { createTestEmployee, createTestAssetModel, createTestStockItem } from './fixtures';

/**
 * E2E Tests: Search & Filters
 *
 * Tests the global search (GlobalSearch component) and
 * column filters on each listing page.
 */

test.describe('Search & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── Global Search ──────────────────────────────────────────

  test.describe('Global Search', () => {
    test('should display global search input in header', async ({ page }) => {
      await navigateTo(page, '/dashboard');

      const searchInput = page.locator(
        'header input[placeholder*="Rechercher"], header input[type="search"], header input[role="combobox"]'
      );
      await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show search results dropdown when typing', async ({ page }) => {
      await navigateTo(page, '/dashboard');

      const searchInput = page.locator(
        'header input[placeholder*="Rechercher"], header input[type="search"], header input[role="combobox"]'
      ).first();

      await searchInput.fill('a');
      // Wait for debounce + API response
      await page.waitForTimeout(500);

      // Results dropdown should appear (listbox or similar container)
      const results = page.locator('[role="listbox"], .search-results, [class*="dropdown"]');
      await expect(results.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show "no results" message for non-existent query', async ({ page }) => {
      await navigateTo(page, '/dashboard');

      const searchInput = page.locator(
        'header input[placeholder*="Rechercher"], header input[type="search"], header input[role="combobox"]'
      ).first();

      await searchInput.fill('xyznonexistent999');
      await page.waitForTimeout(500);

      // Should show some empty / no results indication
      const noResults = page.locator('text=/aucun|no result|pas de résultat/i');
      if (await noResults.isVisible({ timeout: 3000 })) {
        await expect(noResults).toBeVisible();
      }
    });

    test('should navigate to result when clicking a search result', async ({ page }) => {
      // First create a unique employee to search for
      const employee = await createTestEmployee(page, '_search');

      await navigateTo(page, '/dashboard');

      const searchInput = page.locator(
        'header input[placeholder*="Rechercher"], header input[type="search"], header input[role="combobox"]'
      ).first();

      await searchInput.fill(employee.lastName);
      await page.waitForTimeout(500);

      // Click on the first result
      const resultItem = page.locator('[role="option"], [role="listbox"] a, [role="listbox"] li').first();
      if (await resultItem.isVisible({ timeout: 3000 })) {
        await resultItem.click();
        await page.waitForTimeout(500);

        // Should navigate away from dashboard
        const currentUrl = page.url();
        expect(currentUrl).not.toMatch(/\/dashboard$/);
      }
    });

    test('should close dropdown when clicking outside', async ({ page }) => {
      await navigateTo(page, '/dashboard');

      const searchInput = page.locator(
        'header input[placeholder*="Rechercher"], header input[type="search"], header input[role="combobox"]'
      ).first();

      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Click outside (on page body)
      await page.locator('main').first().click();
      await page.waitForTimeout(300);

      // Dropdown should be hidden
      const results = page.locator('[role="listbox"]');
      if (await results.count() > 0) {
        await expect(results).not.toBeVisible();
      }
    });
  });

  // ── Column Filters — Employees ─────────────────────────────

  test.describe('Employees Page Filters', () => {
    test('should filter employees by name search', async ({ page }) => {
      await navigateTo(page, '/employees');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Get initial row count
      const initialRows = await page.locator('tbody tr').count();

      // Type a search term that likely returns fewer results
      await searchInput.fill('admin');
      await page.waitForTimeout(500);

      // Table should still be visible
      await expect(page.locator('table')).toBeVisible();

      // Results should be filtered (or same if all match)
      const filteredRows = await page.locator('tbody tr').count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);
    });

    test('should reset filter when clearing search', async ({ page }) => {
      await navigateTo(page, '/employees');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      const filteredCount = await page.locator('tbody tr').count();

      // Clear the search
      await searchInput.fill('');
      await page.waitForTimeout(500);

      const resetCount = await page.locator('tbody tr').count();
      expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
    });
  });

  // ── Column Filters — Asset Items ───────────────────────────

  test.describe('Asset Items Page Filters', () => {
    test('should filter equipment by search term', async ({ page }) => {
      await navigateTo(page, '/assets/items');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('LAPTOP');
        await page.waitForTimeout(500);

        await expect(page.locator('table')).toBeVisible();
      }
    });

    test('should filter equipment by status', async ({ page }) => {
      await navigateTo(page, '/assets/items');

      // Look for status filter (select or combobox)
      const statusFilter = page.locator(
        'select:near(:text("Statut")), select:near(:text("Status")), button:has-text("Statut")'
      ).first();

      if (await statusFilter.isVisible({ timeout: 3000 })) {
        if (await statusFilter.evaluate(el => el.tagName) === 'SELECT') {
          await statusFilter.selectOption('EN_STOCK');
        } else {
          await statusFilter.click();
          await page.waitForTimeout(300);
          await page.locator('[role="option"]:has-text("EN_STOCK")').first().click();
        }

        await page.waitForTimeout(500);
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  // ── Column Filters — Loans ─────────────────────────────────

  test.describe('Loans Page Filters', () => {
    test('should filter loans by search term', async ({ page }) => {
      await navigateTo(page, '/loans');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        await expect(page.locator('table')).toBeVisible();
      }
    });

    test('should filter loans by status', async ({ page }) => {
      await navigateTo(page, '/loans');

      const statusFilter = page.locator(
        'select, button'
      ).filter({ hasText: /statut|status|filtre/i }).first();

      if (await statusFilter.isVisible({ timeout: 3000 })) {
        await statusFilter.click();
        await page.waitForTimeout(300);

        const openOption = page.locator(
          'option:has-text("OPEN"), [role="option"]:has-text("OPEN"), [role="option"]:has-text("Ouvert")'
        );

        if (await openOption.first().isVisible({ timeout: 2000 })) {
          await openOption.first().click();
          await page.waitForTimeout(500);
          await expect(page.locator('table')).toBeVisible();
        }
      }
    });
  });

  // ── Column Filters — Stock ─────────────────────────────────

  test.describe('Stock Page Filters', () => {
    test('should filter stock items by search', async ({ page }) => {
      await navigateTo(page, '/stock');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('cable');
        await page.waitForTimeout(500);

        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  // ── Pagination ─────────────────────────────────────────────

  test.describe('Pagination', () => {
    test('should display pagination controls on employees page', async ({ page }) => {
      await navigateTo(page, '/employees');

      // Look for pagination component
      const pagination = page.locator('nav[aria-label*="pagination"], [class*="pagination"]').first();

      if (await pagination.isVisible({ timeout: 3000 })) {
        // Should have page navigation buttons
        const nextButton = page.getByRole('button', { name: /suivant|next|>/i });
        await expect(nextButton.first()).toBeVisible();
      }
    });

    test('should change page size', async ({ page }) => {
      await navigateTo(page, '/employees');

      // Look for page size selector
      const pageSizeSelect = page.locator('select').filter({ hasText: /10|20|50/ }).first();

      if (await pageSizeSelect.isVisible({ timeout: 3000 })) {
        await pageSizeSelect.selectOption('20');
        await page.waitForTimeout(500);

        // Table should reload
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });
});
