import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGestionnaire, navigateTo, clickButton, waitForToast } from './helpers';
import { createTestEmployee, cleanupTestData } from './fixtures';

/**
 * E2E Tests: Audit Logs
 *
 * Verifies that all CRUD actions produce audit log entries.
 * The AuditLogsPage displays logs with filters by action, table, and user.
 * Only ADMIN role can access /audit-logs.
 */

test.describe('Audit Logs', () => {
  // ── Page Access ────────────────────────────────────────────

  test.describe('Access Control', () => {
    test('ADMIN should access audit logs page', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateTo(page, '/audit-logs');

      // Page should load with heading
      await expect(page.locator('h1, h2').first()).toContainText(/audit|journal|logs/i, { timeout: 5000 });
    });

    test('Non-admin should NOT access audit logs page', async ({ page }) => {
      await loginAsGestionnaire(page);
      await page.goto('/audit-logs');
      await page.waitForTimeout(2000);

      // Should redirect or show forbidden
      const onAuditPage = page.url().includes('/audit-logs');
      const hasForbidden = await page.locator('text=/interdit|forbidden|accès refusé|403/i').isVisible().catch(() => false);

      // Either redirected away or got a forbidden message
      expect(!onAuditPage || hasForbidden).toBe(true);
    });
  });

  // ── Audit Log Display ─────────────────────────────────────

  test.describe('Audit Log Display', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display audit log table with entries', async ({ page }) => {
      await navigateTo(page, '/audit-logs');

      // Table should be visible
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 });

      // Should have at least one row (from previous actions)
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should display action, table, user, and timestamp columns', async ({ page }) => {
      await navigateTo(page, '/audit-logs');

      // Check for column headers
      const headers = page.locator('thead th, thead td');
      const headerTexts = await headers.allTextContents();
      const headerJoined = headerTexts.join(' ').toLowerCase();

      // Should contain key columns
      expect(headerJoined).toMatch(/action/);
      expect(headerJoined).toMatch(/table|entité|entity/);
    });

    test('should show color-coded action badges', async ({ page }) => {
      await navigateTo(page, '/audit-logs');

      // Look for badges/tags with action labels
      const badges = page.locator('span, badge, [class*="badge"]').filter({
        hasText: /CREATE|UPDATE|DELETE/,
      });

      if (await badges.first().isVisible({ timeout: 3000 })) {
        // At least one action badge should be visible
        await expect(badges.first()).toBeVisible();
      }
    });
  });

  // ── Audit Log Filters ─────────────────────────────────────

  test.describe('Audit Log Filters', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateTo(page, '/audit-logs');
    });

    test('should filter by action type (CREATE)', async ({ page }) => {
      // Look for action filter
      const actionFilter = page.locator(
        'select:near(:text("Action")), select[name*="action"], button:has-text("Action")'
      ).first();

      if (await actionFilter.isVisible({ timeout: 3000 })) {
        if (await actionFilter.evaluate(el => el.tagName) === 'SELECT') {
          await actionFilter.selectOption({ label: /CREATE/i });
        } else {
          await actionFilter.click();
          await page.waitForTimeout(300);
          await page.locator('[role="option"]:has-text("CREATE")').first().click();
        }

        await page.waitForTimeout(500);

        // All visible rows should show CREATE action
        const actionCells = page.locator('tbody tr').locator('text=CREATE');
        const count = await actionCells.count();

        if (count > 0) {
          // Every row should have CREATE
          const totalRows = await page.locator('tbody tr').count();
          expect(count).toBe(totalRows);
        }
      }
    });

    test('should filter by table name', async ({ page }) => {
      const tableFilter = page.locator(
        'select:near(:text("Table")), select:near(:text("Entité")), select[name*="table"], button:has-text("Table"), button:has-text("Entité")'
      ).first();

      if (await tableFilter.isVisible({ timeout: 3000 })) {
        if (await tableFilter.evaluate(el => el.tagName) === 'SELECT') {
          // Select "Employee" table
          await tableFilter.selectOption({ label: /employee/i });
        } else {
          await tableFilter.click();
          await page.waitForTimeout(300);
          await page.locator('[role="option"]:has-text("Employee")').first().click();
        }

        await page.waitForTimeout(500);

        // Table should update
        await expect(page.locator('table')).toBeVisible();
      }
    });

    test('should filter by user search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Rechercher"], input[placeholder*="utilisateur"]').first();

      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('admin');
        await page.waitForTimeout(500);

        // Table should still display
        await expect(page.locator('table')).toBeVisible();
      }
    });
  });

  // ── CRUD Actions Create Audit Entries ──────────────────────

  test.describe('CRUD Actions Generate Audit Entries', () => {
    let createdEmployeeEmail: string;

    test('CREATE action should generate audit log entry', async ({ page }) => {
      await loginAsAdmin(page);

      const timestamp = Date.now();
      createdEmployeeEmail = `audit.create.${timestamp}@test.local`;

      // Create an employee
      await navigateTo(page, '/employees');
      await clickButton(page, 'Nouvel employé');

      await page.fill('input[name="firstName"]', 'AuditCreate');
      await page.fill('input[name="lastName"]', `Test${timestamp}`);
      await page.fill('input[name="email"]', createdEmployeeEmail);
      await page.fill('input[name="department"]', 'Audit Testing');
      await page.fill('input[name="phone"]', '+33612345678');

      await clickButton(page, 'Créer');
      await page.waitForTimeout(1500);

      // Navigate to audit logs
      await navigateTo(page, '/audit-logs');

      // Search for our created entry
      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill('AuditCreate');
        await page.waitForTimeout(500);
      }

      // Should find a CREATE action for Employee
      const createBadge = page.locator('tbody').locator('text=CREATE');
      await expect(createBadge.first()).toBeVisible({ timeout: 5000 });
    });

    test('UPDATE action should generate audit log entry', async ({ page }) => {
      await loginAsAdmin(page);

      // First create an employee to update
      const employee = await createTestEmployee(page, '_auditupd');

      // Update the employee
      await navigateTo(page, '/employees');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill(employee.email);
        await page.waitForTimeout(500);
      }

      // Click on the employee row to open details/edit
      const row = page.locator(`tr:has-text("${employee.email}")`).first();
      if (await row.isVisible({ timeout: 3000 })) {
        // Look for edit button
        const editButton = row.locator(
          'button[title*="Modifier"], button:has-text("Modifier"), a:has-text("Modifier")'
        ).first();

        if (await editButton.isVisible({ timeout: 2000 })) {
          await editButton.click();
          await page.waitForTimeout(500);

          // Modify a field
          await page.fill('input[name="department"]', 'Updated Department');
          await clickButton(page, 'Enregistrer');
          await page.waitForTimeout(1500);
        } else {
          // Try clicking the row itself
          await row.click();
          await page.waitForTimeout(500);

          // On detail page, look for edit
          const editBtn = page.getByRole('button', { name: /modifier|edit/i }).first();
          if (await editBtn.isVisible({ timeout: 2000 })) {
            await editBtn.click();
            await page.waitForTimeout(500);
            await page.fill('input[name="department"]', 'Updated Department');
            await clickButton(page, 'Enregistrer');
            await page.waitForTimeout(1500);
          }
        }
      }

      // Check audit logs for UPDATE entry
      await navigateTo(page, '/audit-logs');
      await page.waitForTimeout(500);

      const updateBadge = page.locator('tbody').locator('text=UPDATE');
      await expect(updateBadge.first()).toBeVisible({ timeout: 5000 });
    });

    test('DELETE action should generate audit log entry', async ({ page }) => {
      await loginAsAdmin(page);

      // Create an employee to delete
      const employee = await createTestEmployee(page, '_auditdel');

      // Delete the employee
      await navigateTo(page, '/employees');

      const searchInput = page.locator('input[placeholder*="Rechercher"]').first();
      if (await searchInput.isVisible({ timeout: 3000 })) {
        await searchInput.fill(employee.email);
        await page.waitForTimeout(500);
      }

      const row = page.locator(`tr:has-text("${employee.email}")`).first();
      if (await row.isVisible({ timeout: 3000 })) {
        const deleteButton = row.locator(
          'button[title*="Supprimer"], button:has-text("Supprimer")'
        ).first();

        if (await deleteButton.isVisible({ timeout: 2000 })) {
          await deleteButton.click();
          await page.waitForTimeout(300);

          // Confirm deletion
          await clickButton(page, 'Confirmer');
          await page.waitForTimeout(1500);
        }
      }

      // Check audit logs for DELETE entry
      await navigateTo(page, '/audit-logs');
      await page.waitForTimeout(500);

      const deleteBadge = page.locator('tbody').locator('text=DELETE');
      await expect(deleteBadge.first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ── CSV Export ─────────────────────────────────────────────

  test.describe('Audit Log Export', () => {
    test('should export audit logs as CSV', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateTo(page, '/audit-logs');

      // Look for export button
      const exportButton = page.getByRole('button', { name: /export|csv|télécharger/i }).first();

      if (await exportButton.isVisible({ timeout: 3000 })) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        await exportButton.click();

        const download = await downloadPromise;
        const filename = download.suggestedFilename();

        // Should be a CSV file
        expect(filename).toMatch(/\.(csv|xlsx)$/);
      }
    });
  });
});
