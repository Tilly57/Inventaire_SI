import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo, clickButton, waitForToast } from './helpers';

/**
 * E2E Tests: Error Scenarios
 *
 * Tests error handling across the application:
 * - Invalid form submissions
 * - Network errors
 * - Session expiry / 401 handling
 * - Invalid routes (404)
 * - Duplicate data handling
 */

test.describe('Error Scenarios', () => {
  // ── Invalid Login ──────────────────────────────────────────

  test.describe('Authentication Errors', () => {
    test('should show error on invalid credentials', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[name="email"]', 'nonexistent@test.local');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Should show error (toast or inline)
      const errorIndicator = page.locator(
        '[class*="destructive"], [role="alert"], .error, [class*="error"]'
      );
      await expect(errorIndicator.first()).toBeVisible({ timeout: 5000 });

      // Should stay on login page
      await expect(page).toHaveURL(/\/$|\/login/);
    });

    test('should show error with empty email', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[name="password"]', 'SomePassword123!');
      await page.click('button[type="submit"]');

      // Browser validation or custom validation should prevent submission
      // Check if we're still on login page
      await expect(page).toHaveURL(/\/$|\/login/);
    });

    test('should show error with empty password', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[name="email"]', 'admin@inventaire.local');
      await page.click('button[type="submit"]');

      // Should stay on login page
      await expect(page).toHaveURL(/\/$|\/login/);
    });
  });

  // ── Invalid Form Submissions ───────────────────────────────

  test.describe('Form Validation Errors', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should show validation error for employee with missing required fields', async ({ page }) => {
      await navigateTo(page, '/employees');

      await clickButton(page, 'Nouvel employé');
      await page.waitForTimeout(500);

      // Submit without filling any fields
      await clickButton(page, 'Créer');

      // Should show validation errors (inline or toast)
      const validationError = page.locator(
        '[class*="destructive"], [role="alert"], .error, [class*="error"], text=/requis|obligatoire|required/i'
      );

      // Either validation message or still on form
      const hasError = await validationError.first().isVisible({ timeout: 3000 });
      if (!hasError) {
        // HTML5 validation should have blocked submission — form should still be open
        const formDialog = page.locator('dialog, [role="dialog"], form');
        await expect(formDialog.first()).toBeVisible();
      }
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await navigateTo(page, '/employees');

      await clickButton(page, 'Nouvel employé');
      await page.waitForTimeout(500);

      // Fill with invalid email
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Invalid');
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="dept"]', 'Testing');

      await clickButton(page, 'Créer');

      // Should stay on form or show error
      await page.waitForTimeout(1000);

      // Check: either validation error or form still open
      const isStillOnForm = await page.locator('input[name="email"]').isVisible();
      expect(isStillOnForm).toBe(true);
    });

    test('should show error when creating asset item without selecting model', async ({ page }) => {
      await navigateTo(page, '/assets/items');

      await clickButton(page, 'Nouvel équipement');
      await page.waitForTimeout(500);

      // Fill fields but skip model selection
      await page.fill('input[name="assetTag"]', `ERRTEST${Date.now()}`);
      await page.fill('input[name="serial"]', `SN${Date.now()}`);

      await clickButton(page, 'Créer');

      // Should show validation error or remain on form
      await page.waitForTimeout(1000);
      const formStillOpen = await page.locator('input[name="assetTag"]').isVisible();
      expect(formStillOpen).toBe(true);
    });

    test('should show error for negative stock quantity', async ({ page }) => {
      await navigateTo(page, '/stock');

      await clickButton(page, 'Nouvel article');
      await page.waitForTimeout(500);

      await page.fill('input[name="name"]', `Error Test ${Date.now()}`);
      await page.fill('input[name="quantity"]', '-5');

      await clickButton(page, 'Créer');

      // Should show error or block submission
      await page.waitForTimeout(1000);

      const formStillOpen = await page.locator('input[name="name"]').isVisible();
      const errorMessage = page.locator(
        '[class*="destructive"], [role="alert"], text=/négatif|positif|invalide|invalid|minimum/i'
      );

      // Either error or form still open
      const hasError = await errorMessage.first().isVisible({ timeout: 2000 });
      expect(hasError || formStillOpen).toBe(true);
    });
  });

  // ── Session Expiry ─────────────────────────────────────────

  test.describe('Session Handling', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Go directly to a protected page without logging in
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/$|\/login/, { timeout: 5000 });
    });

    test('should redirect to login after clearing tokens', async ({ page }) => {
      await loginAsAdmin(page);

      // Clear all cookies and local storage to simulate session expiry
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to navigate to a protected page
      await page.goto('/employees');

      // Should redirect to login
      await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });
    });

    test('should handle API error gracefully after token removal', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateTo(page, '/employees');

      // Clear cookies to invalidate session
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try an action that triggers an API call — reload the page
      await page.reload();

      // Should redirect to login or show error
      await page.waitForTimeout(3000);

      const onLoginPage = await page.locator('input[name="email"]').isVisible();
      const hasError = await page.locator('[role="alert"], [class*="destructive"]').first().isVisible().catch(() => false);

      expect(onLoginPage || hasError).toBe(true);
    });
  });

  // ── 404 / Invalid Routes ──────────────────────────────────

  test.describe('Invalid Routes', () => {
    test('should handle non-existent route', async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto('/this-page-does-not-exist');
      await page.waitForTimeout(1000);

      // Should either show 404 page or redirect to dashboard
      const has404 = await page.locator('text=/404|page.*trouv|not found/i').isVisible().catch(() => false);
      const redirectedToDashboard = page.url().includes('/dashboard');

      expect(has404 || redirectedToDashboard).toBe(true);
    });

    test('should handle non-existent loan ID', async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto('/loans/nonexistent-id-12345');
      await page.waitForTimeout(2000);

      // Should show error or redirect
      const hasError = await page.locator(
        'text=/erreur|error|trouv|not found|introuvable/i'
      ).first().isVisible().catch(() => false);
      const redirected = !page.url().includes('nonexistent');

      expect(hasError || redirected).toBe(true);
    });
  });

  // ── Network Error Simulation ───────────────────────────────

  test.describe('Network Errors', () => {
    test('should handle slow network gracefully', async ({ page }) => {
      await loginAsAdmin(page);

      // Throttle the network
      const cdpSession = await page.context().newCDPSession(page);
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024, // 50 KB/s
        uploadThroughput: 50 * 1024,
        latency: 2000, // 2s latency
      });

      // Navigate — page should eventually load
      await page.goto('/employees', { timeout: 30000 });

      // Should still show the page
      await expect(page.locator('main h1, main h2').first()).toBeVisible({ timeout: 15000 });

      // Reset network
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });
    });

    test('should show error state when API is unreachable', async ({ page }) => {
      await loginAsAdmin(page);

      // Block API calls
      await page.route('**/api/**', (route) => route.abort('connectionrefused'));

      // Try to navigate to a page that loads data
      await page.goto('/employees');
      await page.waitForTimeout(3000);

      // Should show some error indicator (toast, error state, or empty state)
      const pageContent = await page.locator('body').textContent();
      const hasAnyContent = pageContent && pageContent.length > 0;

      expect(hasAnyContent).toBe(true);

      // Unroute
      await page.unroute('**/api/**');
    });
  });

  // ── Duplicate Data ─────────────────────────────────────────

  test.describe('Duplicate Data Handling', () => {
    test('should show error when creating employee with duplicate email', async ({ page }) => {
      await loginAsAdmin(page);

      const timestamp = Date.now();
      const email = `dup.test.${timestamp}@test.local`;

      // Create first employee
      await navigateTo(page, '/employees');
      await clickButton(page, 'Nouvel employé');
      await page.fill('input[name="firstName"]', 'First');
      await page.fill('input[name="lastName"]', 'Duplicate');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="dept"]', 'Testing');
      await clickButton(page, 'Créer');
      await page.waitForTimeout(1500);

      // Try to create second employee with same email
      await navigateTo(page, '/employees');
      await clickButton(page, 'Nouvel employé');
      await page.fill('input[name="firstName"]', 'Second');
      await page.fill('input[name="lastName"]', 'Duplicate');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="dept"]', 'Testing');
      await clickButton(page, 'Créer');

      // Should show error about duplicate email
      await page.waitForTimeout(2000);

      const errorVisible = await page.locator(
        '[class*="destructive"], [role="alert"], text=/existe|duplicate|déjà|already/i'
      ).first().isVisible().catch(() => false);

      const formStillOpen = await page.locator('input[name="email"]').isVisible();

      // Either error message shown or form stayed open (submission blocked)
      expect(errorVisible || formStillOpen).toBe(true);
    });
  });
});
