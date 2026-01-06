import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton, navigateTo } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * E2E Tests: Excel Export
 * Tests export functionality for employees, equipment, and loans
 */

test.describe('Excel Export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should export employees to Excel', async ({ page }) => {
    await navigateTo(page, '/employees');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await clickButton(page, 'Exporter');

    // Wait for download
    const download = await downloadPromise;

    // Verify file name contains "employees"
    const fileName = download.suggestedFilename();
    expect(fileName.toLowerCase()).toContain('employe');
    expect(fileName).toMatch(/\.xlsx?$/);

    // Save file temporarily to verify it's valid
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    // Verify file exists and has content
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should export asset items to Excel', async ({ page }) => {
    await navigateTo(page, '/asset-items');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await clickButton(page, 'Exporter');

    const download = await downloadPromise;
    const fileName = download.suggestedFilename();

    expect(fileName.toLowerCase()).toContain('equipement');
    expect(fileName).toMatch(/\.xlsx?$/);

    const filePath = await download.path();
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should export loans to Excel', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await clickButton(page, 'Exporter');

    const download = await downloadPromise;
    const fileName = download.suggestedFilename();

    expect(fileName.toLowerCase()).toContain('pret');
    expect(fileName).toMatch(/\.xlsx?$/);

    const filePath = await download.path();
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should export filtered data', async ({ page }) => {
    await navigateTo(page, '/loans');

    // Apply filter (e.g., only OPEN loans)
    await page.click('button:has-text("OPEN"), select[name="status"]');
    await page.waitForTimeout(500);

    // Export filtered data
    const downloadPromise = page.waitForEvent('download');
    await clickButton(page, 'Exporter');

    const download = await downloadPromise;
    const filePath = await download.path();

    // File should exist and contain data
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(0);
  });
});
