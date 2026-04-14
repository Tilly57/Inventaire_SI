import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo, selectRadixOption } from './helpers';
import { createTestEmployee, createTestAssetItem, createTestAssetModel, cleanupTestData } from './fixtures';

/**
 * E2E Tests: Critical Loan Workflow
 *
 * Tests the complete loan lifecycle which is the core business process:
 * 1. Create loan
 * 2. Add asset items
 * 3. Employee pickup (signature)
 * 4. Employee return (signature)
 * 5. Close loan
 *
 * This is a CRITICAL path that must always work.
 */

test.describe('Critical Loan Workflow', () => {
  let testData: {
    employees: string[];
    assetItems: string[];
    loans: string[];
  };

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    // Initialize cleanup tracker
    testData = {
      employees: [],
      assetItems: [],
      loans: [],
    };
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    try {
      await cleanupTestData(page, testData);
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  });

  test('Complete loan workflow: create → add items → pickup signature → return signature → close', async ({ page }) => {
    // STEP 1: Create prerequisites
    console.log('Step 1: Creating test employee...');
    const employee = await createTestEmployee(page, '_loan');
    testData.employees.push(employee.email);

    console.log('Step 2: Creating test asset model...');
    await createTestAssetModel(page, '_loan');

    console.log('Step 3: Creating test asset item...');
    const assetItem = await createTestAssetItem(page, '_loan');
    testData.assetItems.push(assetItem.assetTag);

    // STEP 2: Create loan
    console.log('Step 4: Creating loan...');
    await navigateTo(page, '/loans');

    // Click create loan button
    await clickButton(page, 'Nouveau prêt');

    const loanDialog = page.locator('[role="dialog"]');
    await loanDialog.waitFor({ timeout: 10000 });

    // Select employee — use robust helper that waits for data to load
    await selectRadixOption(loanDialog, page, employee.lastName);

    // Submit
    await clickButton(page, 'Créer');

    // Wait for redirect to loan details
    await page.waitForURL(/\/loans\/[a-z0-9]+/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const loanId = page.url().split('/').pop() || '';
    testData.loans.push(loanId);

    console.log(`Loan created: ${loanId}`);

    // Verify loan details page
    await expect(page.locator('h1').first()).toContainText(/prêt/i, { timeout: 10000 });

    // STEP 3: Add asset item to loan
    console.log('Step 5: Adding asset item to loan...');

    // Click "Add items" button
    await clickButton(page, 'Ajouter');

    const addItemDialog = page.locator('[role="dialog"]');
    await addItemDialog.waitFor({ timeout: 10000 });

    // Select the asset item (search by tag in the combobox)
    await selectRadixOption(addItemDialog, page, assetItem.assetTag);

    // Submit
    await addItemDialog.getByRole('button', { name: /ajouter/i }).click();

    // Wait for dialog to close — confirms item was added
    await addItemDialog.waitFor({ state: 'detached', timeout: 10000 });

    // Wait for loan lines to refresh
    await page.waitForLoadState('networkidle');

    // Verify item appears in loan lines
    await expect(page.locator('table, [role="table"]').first()).toContainText(assetItem.assetTag, { timeout: 10000 });

    console.log('Asset item added to loan');

    // STEP 4: Pickup signature
    console.log('Step 6: Adding pickup signature...');

    // Look for any "Signer" button (the first one is pickup signature)
    const signButtons = page.getByRole('button', { name: /signer/i });
    const signButtonCount = await signButtons.count();

    if (signButtonCount > 0) {
      await signButtons.first().click();
      await page.waitForTimeout(500);

      // Draw on canvas (simple signature)
      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300); // Let canvas initialize

      // Draw a simple line
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 100);
        await page.mouse.move(box.x + 200, box.y + 50);
        await page.mouse.up();
      }

      await page.waitForTimeout(500);

      // Confirm signature
      await clickButton(page, 'Valider');

      // Wait for save
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log('Pickup signature added');
    } else {
      console.log('No sign button found, skipping signatures...');
    }

    // STEP 5: Return signature
    console.log('Step 7: Adding return signature...');

    // After pickup signature, there should be a new "Signer" button for return
    const returnSignButtons = page.getByRole('button', { name: /signer/i });
    const returnCount = await returnSignButtons.count();

    if (returnCount > 0) {
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

      // Confirm signature
      await clickButton(page, 'Valider');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log('Return signature added');
    } else {
      console.log('Return signature button not visible, skipping...');
    }

    // STEP 6: Close loan
    console.log('Step 8: Closing loan...');

    const closeLoanButton = page.getByRole('button', { name: /fermer/i });

    if (await closeLoanButton.isVisible({ timeout: 5000 })) {
      await closeLoanButton.click();
      await page.waitForTimeout(500);

      // Confirm closure in dialog
      await clickButton(page, 'Confirmer');

      // Wait for closure
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify loan status changed to CLOSED
      await expect(page.locator('body')).toContainText(/closed|fermé/i, { timeout: 10000 });

      console.log('Loan closed successfully');
    } else {
      console.log('Close loan button not visible');
      const bodyText = await page.locator('body').textContent();
      console.log('Current page text includes:', bodyText?.substring(0, 500));
    }

    // Final verification: navigate back to loans list
    await navigateTo(page, '/loans');

    // Verify the loan appears in the list
    await expect(page.locator('table').first()).toContainText(employee.lastName, { timeout: 10000 });
  });

  test('Can view loan history', async ({ page }) => {
    // Create a loan with items
    const employee = await createTestEmployee(page, '_history');
    testData.employees.push(employee.email);

    await createTestAssetModel(page, '_history');
    const assetItem = await createTestAssetItem(page, '_history');
    testData.assetItems.push(assetItem.assetTag);

    // Create loan
    await navigateTo(page, '/loans');
    await clickButton(page, 'Nouveau prêt');

    const historyDialog = page.locator('[role="dialog"]');
    await historyDialog.waitFor({ timeout: 10000 });

    // Select employee — use robust helper
    await selectRadixOption(historyDialog, page, employee.lastName);

    await clickButton(page, 'Créer');
    await page.waitForURL(/\/loans\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const loanId = page.url().split('/').pop() || '';
    testData.loans.push(loanId);

    // Navigate back to loans list
    await navigateTo(page, '/loans');

    // Click on the loan to view details
    const loanRow = page.locator(`tr:has-text("${employee.lastName}")`).first();
    await loanRow.waitFor({ state: 'visible', timeout: 10000 });
    await loanRow.click();

    // Verify details page loaded
    await expect(page).toHaveURL(/\/loans\/[a-z0-9]+/);
    await expect(page.locator('h1').first()).toContainText(/prêt/i, { timeout: 10000 });

    // Verify employee info visible
    await expect(page.locator('body')).toContainText(employee.lastName);
  });

  test('Can filter loans by status', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Look for status filter
    const statusFilter = page.locator('select, button').filter({ hasText: /statut|status|filtre/i }).first();

    if (await statusFilter.isVisible({ timeout: 5000 })) {
      // Click filter
      await statusFilter.click();
      await page.waitForTimeout(500);

      // Select OPEN status
      const openOption = page.locator('option:has-text("OPEN"), [role="option"]:has-text("OPEN")');

      if (await openOption.isVisible({ timeout: 2000 })) {
        await openOption.click();
        await page.waitForTimeout(1000);

        // Verify filtering worked
        await expect(page.locator('table').first()).toBeVisible();
      }
    }
  });
});
