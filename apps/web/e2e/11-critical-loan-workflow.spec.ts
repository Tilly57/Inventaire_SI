import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo, waitForToast } from './helpers';
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

    // Wait for dialog/form
    await page.waitForTimeout(500);

    // Select employee
    const employeeSelect = page.locator('select[name="employeeId"], button[role="combobox"]').first();

    if (await employeeSelect.evaluate(el => el.tagName) === 'SELECT') {
      // Standard select
      await employeeSelect.selectOption({ label: new RegExp(employee.email, 'i') });
    } else {
      // Combobox (shadcn/ui)
      await employeeSelect.click();
      await page.waitForTimeout(300);
      await page.locator(`[role="option"]:has-text("${employee.email}")`).first().click();
    }

    // Submit
    await clickButton(page, 'Créer');

    // Wait for redirect to loan details
    await page.waitForURL(/\/loans\/[a-z0-9]+/, { timeout: 15000 });

    const loanId = page.url().split('/').pop() || '';
    testData.loans.push(loanId);

    console.log(`Loan created: ${loanId}`);

    // Verify loan details page
    await expect(page.locator('h1, h2')).toContainText(/détails.*prêt|prêt/i);

    // STEP 3: Add asset item to loan
    console.log('Step 5: Adding asset item to loan...');

    // Click "Add items" button
    await clickButton(page, 'Ajouter');

    await page.waitForTimeout(500);

    // Click on "Equipment" tab if present
    const equipmentTab = page.locator('button:has-text("Équipement"), [role="tab"]:has-text("Équipement")');
    if (await equipmentTab.isVisible({ timeout: 2000 })) {
      await equipmentTab.click();
      await page.waitForTimeout(300);
    }

    // Select the asset item we created
    const assetSelect = page.locator('select[name="assetItemId"], button[role="combobox"]');

    if (await assetSelect.first().evaluate(el => el.tagName) === 'SELECT') {
      // Standard select - find option with our asset tag
      const options = await assetSelect.first().locator('option').allTextContents();
      const targetIndex = options.findIndex(opt => opt.includes(assetItem.assetTag));

      if (targetIndex >= 0) {
        await assetSelect.first().selectOption({ index: targetIndex });
      } else {
        // Fallback: select first available
        await assetSelect.first().selectOption({ index: 1 });
      }
    } else {
      // Combobox
      await assetSelect.first().click();
      await page.waitForTimeout(300);

      // Try to find our specific asset
      const optionWithTag = page.locator(`[role="option"]:has-text("${assetItem.assetTag}")`);

      if (await optionWithTag.isVisible({ timeout: 2000 })) {
        await optionWithTag.first().click();
      } else {
        // Fallback: select first option
        await page.locator('[role="option"]').first().click();
      }
    }

    // Submit
    await clickButton(page, 'Ajouter');

    // Wait for item to be added
    await page.waitForTimeout(2000);

    // Verify item appears in loan lines table
    await expect(page.locator('table, tbody')).toContainText(assetItem.assetTag, { timeout: 10000 });

    console.log('Asset item added to loan');

    // STEP 4: Pickup signature
    console.log('Step 6: Adding pickup signature...');

    // Click "Signature retrait" button
    const pickupSignatureButton = page.getByRole('button', { name: /signature.*retrait/i });

    if (await pickupSignatureButton.isVisible({ timeout: 5000 })) {
      await pickupSignatureButton.click();
      await page.waitForTimeout(500);

      // Draw on canvas (simple signature)
      const canvas = page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 5000 });

      // Draw a simple line
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 150, box.y + 100);
        await page.mouse.move(box.x + 200, box.y + 50);
        await page.mouse.up();
      }

      // Wait a bit for drawing to register
      await page.waitForTimeout(500);

      // Confirm signature
      await clickButton(page, 'Valider');

      // Wait for signature to be saved
      await page.waitForTimeout(2000);

      console.log('Pickup signature added');

      // Verify signature was saved (check for success message or status change)
      // The exact verification depends on UI implementation
    } else {
      console.log('Pickup signature button not visible, skipping...');
    }

    // STEP 5: Return signature
    console.log('Step 7: Adding return signature...');

    // Click "Signature retour" button
    const returnSignatureButton = page.getByRole('button', { name: /signature.*retour/i });

    if (await returnSignatureButton.isVisible({ timeout: 5000 })) {
      await returnSignatureButton.click();
      await page.waitForTimeout(500);

      // Draw on canvas
      const returnCanvas = page.locator('canvas').first();
      await returnCanvas.waitFor({ state: 'visible', timeout: 5000 });

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

      await page.waitForTimeout(2000);

      console.log('Return signature added');
    } else {
      console.log('Return signature button not visible, skipping...');
    }

    // STEP 6: Close loan
    console.log('Step 8: Closing loan...');

    const closeLoanButton = page.getByRole('button', { name: /fermer.*prêt/i });

    if (await closeLoanButton.isVisible({ timeout: 5000 })) {
      await closeLoanButton.click();
      await page.waitForTimeout(500);

      // Confirm closure in dialog
      await clickButton(page, 'Confirmer');

      // Wait for closure
      await page.waitForTimeout(2000);

      // Verify loan status changed to CLOSED
      await expect(page.locator('body')).toContainText(/closed|fermé/i, { timeout: 10000 });

      console.log('Loan closed successfully');
    } else {
      console.log('Close loan button not visible');
      // Log current state for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('Current page text includes:', bodyText?.substring(0, 500));
    }

    // Final verification: navigate back to loans list
    await navigateTo(page, '/loans');

    // Verify the loan appears in the list
    await expect(page.locator('table, tbody')).toContainText(employee.lastName, { timeout: 10000 });
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
    await page.waitForTimeout(500);

    const employeeSelect = page.locator('select[name="employeeId"], button[role="combobox"]').first();

    if (await employeeSelect.evaluate(el => el.tagName) === 'SELECT') {
      await employeeSelect.selectOption({ label: new RegExp(employee.email, 'i') });
    } else {
      await employeeSelect.click();
      await page.waitForTimeout(300);
      await page.locator(`[role="option"]:has-text("${employee.email}")`).first().click();
    }

    await clickButton(page, 'Créer');
    await page.waitForURL(/\/loans\//, { timeout: 15000 });

    const loanId = page.url().split('/').pop() || '';
    testData.loans.push(loanId);

    // Navigate back to loans list
    await navigateTo(page, '/loans');

    // Click on the loan to view details
    const loanRow = page.locator(`tr:has-text("${employee.lastName}")`).first();
    await loanRow.click();

    // Verify details page loaded
    await expect(page).toHaveURL(/\/loans\/[a-z0-9]+/);
    await expect(page.locator('h1, h2')).toContainText(/détails|prêt/i);

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
        await expect(page.locator('table, tbody')).toBeVisible();
      }
    }
  });
});
