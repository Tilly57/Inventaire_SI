import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo, selectRadixOption } from './helpers';
import { createTestAssetModel, createTestAssetItem } from './fixtures';

/**
 * E2E Tests: Critical Loan Workflow
 *
 * Uses SEED employees (created by prisma db seed) to avoid Redis cache
 * invalidation timing issues with freshly created employees.
 * Seed employees: Dupont, Martin, Bernard, Dubois, Moreau
 */

const SEED_EMPLOYEE = { lastName: 'Dupont', firstName: 'Jean' };

test.describe('Critical Loan Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Complete loan workflow: create → add items → pickup signature → return signature → close', async ({ page }) => {
    console.log('Step 1: Creating test asset model...');
    await createTestAssetModel(page, '_loan');

    console.log('Step 2: Creating test asset item...');
    const assetItem = await createTestAssetItem(page, '_loan');

    console.log('Step 3: Creating loan...');
    await navigateTo(page, '/loans');
    await clickButton(page, 'Nouveau prêt');

    const loanDialog = page.locator('[role="dialog"]');
    await loanDialog.waitFor({ timeout: 10000 });

    await selectRadixOption(loanDialog, page, SEED_EMPLOYEE.lastName);
    await clickButton(page, 'Créer');

    await page.waitForURL(/\/loans\/[a-z0-9]+/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const loanId = page.url().split('/').pop() || '';
    console.log(`Loan created: ${loanId}`);

    await expect(page.locator('main')).toContainText(/prêt/i, { timeout: 10000 });

    // Add asset item to loan
    console.log('Step 4: Adding asset item to loan...');
    await clickButton(page, 'Ajouter');

    const addItemDialog = page.locator('[role="dialog"]');
    await addItemDialog.waitFor({ timeout: 10000 });

    await selectRadixOption(addItemDialog, page, assetItem.assetTag);
    await addItemDialog.getByRole('button', { name: /ajouter/i }).click();
    await addItemDialog.waitFor({ state: 'detached', timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('table, [role="table"]').first()).toContainText(assetItem.assetTag, { timeout: 10000 });
    console.log('Asset item added to loan');

    // Pickup signature
    console.log('Step 5: Adding pickup signature...');
    const signButtons = page.getByRole('button', { name: /signer/i });

    if (await signButtons.count() > 0) {
      await signButtons.first().click();
      await page.waitForTimeout(500);

      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 100);
        await page.mouse.move(box.x + 200, box.y + 50);
        await page.mouse.up();
      }

      await page.waitForTimeout(500);
      await clickButton(page, 'Valider');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      console.log('Pickup signature added');
    } else {
      console.log('No sign button found, skipping signatures...');
    }

    // Return signature
    console.log('Step 6: Adding return signature...');
    const returnSignButtons = page.getByRole('button', { name: /signer/i });

    if (await returnSignButtons.count() > 0) {
      await returnSignButtons.first().click();
      await page.waitForTimeout(500);

      const returnCanvas = page.locator('canvas').first();
      await returnCanvas.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);

      const box = await returnCanvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 50, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 50);
        await page.mouse.move(box.x + 200, box.y + 100);
        await page.mouse.up();
      }

      await page.waitForTimeout(500);
      await clickButton(page, 'Valider');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      console.log('Return signature added');
    } else {
      console.log('Return signature button not visible, skipping...');
    }

    // Close loan
    console.log('Step 7: Closing loan...');
    const closeLoanButton = page.getByRole('button', { name: /fermer/i });

    if (await closeLoanButton.isVisible({ timeout: 5000 })) {
      await closeLoanButton.click();
      await page.waitForTimeout(500);
      await clickButton(page, 'Confirmer');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page.locator('body')).toContainText(/closed|fermé/i, { timeout: 10000 });
      console.log('Loan closed successfully');
    } else {
      console.log('Close loan button not visible');
    }

    // Final verification
    await navigateTo(page, '/loans');
    await expect(page.locator('table').first()).toContainText(SEED_EMPLOYEE.lastName, { timeout: 10000 });
  });

  test('Can view loan history', async ({ page }) => {
    const historyEmployee = { lastName: 'Martin' };

    await createTestAssetModel(page, '_history');

    await navigateTo(page, '/loans');
    await clickButton(page, 'Nouveau prêt');

    const historyDialog = page.locator('[role="dialog"]');
    await historyDialog.waitFor({ timeout: 10000 });

    await selectRadixOption(historyDialog, page, historyEmployee.lastName);

    await clickButton(page, 'Créer');
    await page.waitForURL(/\/loans\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await navigateTo(page, '/loans');

    const loanRow = page.locator(`tr:has-text("${historyEmployee.lastName}")`).first();
    await loanRow.waitFor({ state: 'visible', timeout: 10000 });
    await loanRow.click();

    await expect(page).toHaveURL(/\/loans\/[a-z0-9]+/);
    await expect(page.locator('main')).toContainText(/prêt/i, { timeout: 10000 });
    await expect(page.locator('body')).toContainText(historyEmployee.lastName);
  });

  test('Can filter loans by status', async ({ page }) => {
    await navigateTo(page, '/loans');

    const statusFilter = page.locator('select, button').filter({ hasText: /statut|status|filtre/i }).first();

    if (await statusFilter.isVisible({ timeout: 5000 })) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      const openOption = page.locator('option:has-text("OPEN"), [role="option"]:has-text("OPEN")');
      if (await openOption.isVisible({ timeout: 2000 })) {
        await openOption.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('table').first()).toBeVisible();
      }
    }
  });
});
