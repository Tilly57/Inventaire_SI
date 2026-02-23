# End-to-End Testing Guide - Inventaire SI

Complete guide for E2E testing with Playwright, covering critical paths, CI/CD integration, and best practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
  - [Local Development](#local-development)
  - [CI/CD](#cicd)
- [Writing Tests](#writing-tests)
- [Test Data Management](#test-data-management)
- [Debugging](#debugging)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Inventaire SI application uses **Playwright** for end-to-end testing. Tests are organized by feature and criticality:

### Test Categories

| Test File | Description | Priority | Run Time |
|-----------|-------------|----------|----------|
| `00-smoke.spec.ts` | Critical path smoke tests | 🔴 CRITICAL | ~2 min |
| `01-auth.spec.ts` | Authentication flow | 🔴 CRITICAL | ~1 min |
| `11-critical-loan-workflow.spec.ts` | Complete loan lifecycle | 🔴 CRITICAL | ~3 min |
| `02-employees.spec.ts` | Employee management | 🟡 HIGH | ~2 min |
| `03-equipment.spec.ts` | Equipment management | 🟡 HIGH | ~3 min |
| `04-loans.spec.ts` | Loan operations (disabled) | 🟡 HIGH | - |
| `05-stock.spec.ts` | Stock management | 🟢 MEDIUM | ~2 min |
| `06-users.spec.ts` | User management | 🟢 MEDIUM | ~2 min |
| `07-export.spec.ts` | Data export | 🟢 MEDIUM | ~1 min |
| `08-routes-protection.spec.ts` | Route protection | 🔴 CRITICAL | ~1 min |
| `09-dashboard.spec.ts` | Dashboard functionality | 🟢 MEDIUM | ~1 min |
| `10-navigation.spec.ts` | Navigation flow | 🟢 MEDIUM | ~1 min |

### Critical Paths Tested

1. **Authentication** - Login, logout, session persistence
2. **Loan Workflow** - Create → Add items → Signatures → Close
3. **Asset Management** - Create models, create items, track status
4. **Employee Management** - CRUD operations
5. **Route Protection** - Unauthorized access prevention
6. **Data Export** - Excel export functionality

## Test Structure

### Directory Layout

```
apps/web/
├── e2e/
│   ├── 00-smoke.spec.ts              # Smoke tests (critical paths)
│   ├── 01-auth.spec.ts               # Authentication
│   ├── 02-employees.spec.ts          # Employees
│   ├── 03-equipment.spec.ts          # Equipment
│   ├── 04-loans.spec.ts              # Loans (disabled)
│   ├── 05-stock.spec.ts              # Stock
│   ├── 06-users.spec.ts              # Users
│   ├── 07-export.spec.ts             # Export
│   ├── 08-routes-protection.spec.ts  # Security
│   ├── 09-dashboard.spec.ts          # Dashboard
│   ├── 10-navigation.spec.ts         # Navigation
│   ├── 11-critical-loan-workflow.spec.ts  # Critical loan workflow
│   ├── helpers.ts                    # Test utilities
│   └── fixtures.ts                   # Test data factories
├── playwright.config.ts              # Playwright configuration
├── playwright-report/                # HTML test reports
└── test-results/                     # Videos, screenshots, traces
```

### Helper Functions

Located in `e2e/helpers.ts`:

```typescript
// Authentication
loginAsAdmin(page)
loginAsGestionnaire(page)
loginAsLecteur(page)
logout(page)

// Navigation
navigateTo(page, path)

// Interactions
clickButton(page, text)
fillField(page, label, value)
selectOption(page, label, option)

// Assertions
waitForToast(page, message?)
```

### Test Fixtures

Located in `e2e/fixtures.ts`:

```typescript
// Create test data
createTestEmployee(page, suffix?)
createTestAssetModel(page, suffix?)
createTestAssetItem(page, suffix?)
createTestStockItem(page, suffix?)
createTestLoan(page, employeeEmail?)

// Cleanup
deleteTestEmployee(page, email)
deleteTestAssetItem(page, assetTag)
cleanupTestData(page, createdData)
```

## Running Tests

### Local Development

**Prerequisites:**
- Docker Desktop running
- Database and Redis containers running
- Node.js 18+ installed

**Quick Commands:**

```bash
# Run all tests
npm run test:e2e

# Run smoke tests only (fast)
npm run test:e2e -- 00-smoke.spec.ts

# Run critical tests only
npm run test:e2e -- 00-smoke.spec.ts 11-critical-loan-workflow.spec.ts

# Run specific test file
npm run test:e2e -- 01-auth.spec.ts

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

**Using Helper Scripts:**

**Windows:**
```batch
# Run all tests
scripts\run-e2e-tests.bat

# Run smoke tests only
scripts\run-e2e-tests.bat smoke

# Run critical tests only
scripts\run-e2e-tests.bat critical

# Run specific test
scripts\run-e2e-tests.bat 01-auth.spec.ts
```

**Linux/Mac:**
```bash
# Make executable
chmod +x scripts/run-e2e-tests.sh

# Run all tests
./scripts/run-e2e-tests.sh

# Run smoke tests only
./scripts/run-e2e-tests.sh smoke

# Run critical tests only
./scripts/run-e2e-tests.sh critical

# Run specific test
./scripts/run-e2e-tests.sh 01-auth.spec.ts
```

### CI/CD

Tests run automatically on:
- **Pull Requests** to `main` or `develop`
- **Pushes** to `main`
- **Nightly** at 2:00 AM
- **Manual trigger** via GitHub Actions

**GitHub Actions Workflow:**
`.github/workflows/e2e-tests.yml`

**CI Configuration:**
- Runs on Ubuntu latest
- Uses PostgreSQL 16 service container
- Uses Redis 7 service container
- Installs Chromium browser
- Runs smoke tests first (fail fast)
- Runs all tests
- Uploads test reports and videos
- Comments results on PR

**Required Environment:**
```yaml
DATABASE_URL: postgresql://inventaire:password@localhost:5432/inventaire_test
REDIS_URL: redis://localhost:6379
JWT_ACCESS_SECRET: test_secret_minimum_32_characters
JWT_REFRESH_SECRET: test_secret_minimum_32_characters
CORS_ORIGIN: http://localhost:5175
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin, clickButton } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should perform action', async ({ page }) => {
    // Arrange
    await page.goto('/feature');

    // Act
    await clickButton(page, 'Action Button');

    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Using Fixtures for Test Data

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';
import { createTestEmployee, cleanupTestData } from './fixtures';

test.describe('Feature with Test Data', () => {
  let testData = { employees: [], assetItems: [] };

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up created test data
    await cleanupTestData(page, testData);
  });

  test('should use test employee', async ({ page }) => {
    // Create test employee
    const employee = await createTestEmployee(page, '_test');
    testData.employees.push(employee.email);

    // Use employee in test
    // ...

    // Cleanup happens automatically in afterEach
  });
});
```

### Waiting for Elements

```typescript
// Wait for element to be visible
await expect(page.locator('.element')).toBeVisible();

// Wait for text content
await expect(page.locator('body')).toContainText('Expected Text');

// Wait for URL change
await page.waitForURL(/\/expected-path/);

// Wait for network idle
await page.waitForLoadState('networkidle');

// Custom timeout
await expect(page.locator('.slow-element')).toBeVisible({ timeout: 15000 });
```

### Handling Dialogs and Modals

```typescript
// Click button that opens dialog
await clickButton(page, 'Open Dialog');

// Wait for dialog animation
await page.waitForTimeout(300);

// Fill form in dialog
await page.fill('input[name="field"]', 'value');

// Submit dialog
await clickButton(page, 'Submit');

// Wait for dialog to close and action to complete
await page.waitForTimeout(1000);
```

### Handling Select Dropdowns (Shadcn/UI)

```typescript
// For standard <select> elements
await page.selectOption('select[name="field"]', 'value');

// For Shadcn/UI combobox (button + dropdown)
const combobox = page.locator('button[role="combobox"]').first();
await combobox.click();
await page.waitForTimeout(300);
await page.locator('[role="option"]:has-text("Option Text")').click();

// Generic approach (handles both)
const select = page.locator('select[name="field"], button[role="combobox"]').first();

if (await select.evaluate(el => el.tagName) === 'SELECT') {
  await select.selectOption('value');
} else {
  await select.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
}
```

## Test Data Management

### Creating Test Data

```typescript
// Always use unique identifiers
const timestamp = Date.now();
const uniqueEmail = `test.user.${timestamp}@test.local`;
const uniqueTag = `TAG${timestamp}`;
```

### Cleanup Strategy

1. **Track created data** in test variables
2. **Clean up in afterEach** hook
3. **Use soft deletes** where available
4. **Handle cleanup failures gracefully**

```typescript
test.describe('Feature Tests', () => {
  let createdData = {
    employees: [] as string[],
    assetItems: [] as string[],
  };

  test.afterEach(async ({ page }) => {
    try {
      await cleanupTestData(page, createdData);
    } catch (error) {
      console.log('Cleanup failed:', error);
      // Don't fail test due to cleanup errors
    }
  });
});
```

### Seeded Test Data

The database is seeded with default users:

| Email | Password | Role |
|-------|----------|------|
| `admin@inventaire.local` | `Admin123!` | ADMIN |
| `gestionnaire1@inventaire.local` | `Gest123!` | GESTIONNAIRE |
| `lecture@inventaire.local` | `Lect123!` | LECTURE |

Use these for login tests. Do NOT delete these users.

## Debugging

### Visual Debugging

**UI Mode (Recommended):**
```bash
npm run test:e2e:ui
```

Features:
- Visual test runner
- Time travel debugging
- Watch mode
- Pick locators

**Headed Mode:**
```bash
npm run test:e2e:headed
```

Runs browser with head for visual inspection.

**Debug Mode:**
```bash
npm run test:e2e:debug
```

Pauses on first test, allows stepping through.

### Trace Viewer

Traces are automatically collected on first retry.

```bash
# View trace for failed test
npx playwright show-trace test-results/path-to-trace.zip
```

Features:
- Action log
- Screenshots
- Network requests
- Console logs
- DOM snapshots

### Screenshots and Videos

**Screenshots:**
- Taken automatically on failure
- Saved to `test-results/`

**Videos:**
- Recorded on failure only (by default)
- Saved to `test-results/`

### Console Logs

Add logging to tests:

```typescript
test('debug test', async ({ page }) => {
  console.log('Starting test...');

  const element = page.locator('.element');
  console.log('Element found:', await element.count());

  const text = await page.locator('body').textContent();
  console.log('Page text:', text?.substring(0, 500));
});
```

### Debugging Selectors

```typescript
// Print all matching elements
const elements = await page.locator('.selector').all();
console.log('Found', elements.length, 'elements');

// Print element attributes
const element = page.locator('.element').first();
console.log('HTML:', await element.innerHTML());
console.log('Text:', await element.textContent());
console.log('Visible:', await element.isVisible());
```

## Best Practices

### 1. Independent Tests

- Each test should be **independent**
- Don't rely on other tests running first
- Create necessary test data in each test
- Clean up after each test

```typescript
// ❌ BAD - Depends on previous test
test('should view employee', async ({ page }) => {
  // Assumes employee from previous test exists
});

// ✅ GOOD - Creates own data
test('should view employee', async ({ page }) => {
  const employee = await createTestEmployee(page);
  // Now test viewing this employee
});
```

### 2. Stable Selectors

Use stable, semantic selectors:

```typescript
// ✅ GOOD - Semantic selectors
page.getByRole('button', { name: /submit/i })
page.getByLabel('Email')
page.getByPlaceholder('Search...')

// ⚠️ OK - Data attributes
page.locator('[data-testid="submit-button"]')

// ❌ AVOID - CSS classes (can change)
page.locator('.btn-primary')
page.locator('div > div > button')
```

### 3. Explicit Waits

Always wait for elements before interacting:

```typescript
// ✅ GOOD - Wait for visibility
await expect(page.locator('.element')).toBeVisible();
await page.locator('.element').click();

// ❌ BAD - No waiting (flaky)
await page.locator('.element').click();
```

### 4. Meaningful Test Names

```typescript
// ✅ GOOD - Descriptive
test('should create loan with employee and asset item', async ({ page }) => {});

// ❌ BAD - Vague
test('test loan', async ({ page }) => {});
```

### 5. Grouping Related Tests

```typescript
test.describe('Loan Management', () => {
  test.describe('Creation', () => {
    test('should create loan', ...);
    test('should require employee', ...);
  });

  test.describe('Modification', () => {
    test('should add items', ...);
    test('should remove items', ...);
  });
});
```

### 6. Use Helpers and Fixtures

Don't repeat code:

```typescript
// ✅ GOOD - Use helper
await loginAsAdmin(page);

// ❌ BAD - Repeat login code
await page.goto('/');
await page.fill('input[name="email"]', 'admin@inventaire.local');
await page.fill('input[name="password"]', 'Admin123!');
await page.click('button[type="submit"]');
```

### 7. Test Critical Paths First

Run smoke tests before full suite:

```bash
# Fast feedback on critical paths
npm run test:e2e -- 00-smoke.spec.ts

# Then run full suite
npm run test:e2e
```

### 8. Handle Flaky Tests

If a test is flaky:

1. **Add explicit waits**
   ```typescript
   await page.waitForTimeout(500);
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

2. **Check for race conditions**
   - Are you clicking before element is ready?
   - Are you asserting before data loads?

3. **Use test retries (last resort)**
   ```typescript
   test.describe.configure({ retries: 2 });
   ```

4. **Skip if unfixable** (document why)
   ```typescript
   test.skip('flaky test - needs investigation', async ({ page }) => {
     // TODO: Fix flakiness
   });
   ```

## Troubleshooting

### "Element not found"

**Cause:** Selector doesn't match any element

**Solutions:**
1. Check selector is correct
   ```typescript
   // Debug: print all text on page
   console.log(await page.locator('body').textContent());
   ```

2. Wait for element
   ```typescript
   await page.waitForSelector('.element', { timeout: 10000 });
   ```

3. Check element is not in shadow DOM
4. Use Playwright Inspector to pick selector
   ```bash
   npm run test:e2e:debug
   ```

### "Timeout while waiting"

**Cause:** Element/condition not met within timeout

**Solutions:**
1. Increase timeout
   ```typescript
   await expect(element).toBeVisible({ timeout: 30000 });
   ```

2. Check if element ever appears
3. Verify network requests complete
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

4. Check for JavaScript errors
   ```typescript
   page.on('console', msg => console.log('Browser:', msg.text()));
   page.on('pageerror', err => console.log('Error:', err));
   ```

### "Tests pass locally but fail in CI"

**Common causes:**
1. **Timing differences** - CI is slower
   - Solution: Add more generous timeouts
   ```typescript
   const timeout = process.env.CI ? 30000 : 10000;
   await expect(element).toBeVisible({ timeout });
   ```

2. **Missing test data** - Database not seeded
   - Solution: Ensure seed script runs in CI

3. **Race conditions** - Tests run in parallel
   - Solution: Disable parallelism
   ```typescript
   // playwright.config.ts
   workers: process.env.CI ? 1 : undefined
   ```

4. **Environment differences**
   - Check BASE_URL is correct
   - Check environment variables are set

### "Browser doesn't start"

**Cause:** Playwright browsers not installed

**Solution:**
```bash
npx playwright install --with-deps chromium
```

### "API not responding"

**Cause:** Backend server not running

**Solutions:**
1. Start backend manually
   ```bash
   cd apps/api
   npm run dev
   ```

2. Check Docker containers
   ```bash
   docker ps
   docker-compose up -d db redis
   ```

3. Check API health
   ```bash
   curl http://localhost:3001/api/health/readiness
   ```

### "Database connection failed"

**Solutions:**
1. Check PostgreSQL is running
   ```bash
   docker ps | grep postgres
   ```

2. Check DATABASE_URL is correct
3. Run migrations
   ```bash
   cd apps/api
   npx prisma migrate deploy
   ```

4. Seed database
   ```bash
   npx prisma db seed
   ```

## Summary

The E2E test suite provides:

✅ **Critical path coverage** via smoke tests
✅ **Complete workflow testing** for loans
✅ **Automated CI/CD integration**
✅ **Test data factories** for reproducible tests
✅ **Visual debugging** with UI mode
✅ **Comprehensive reporting** with videos and traces

**Next steps:**
1. Run smoke tests locally to verify setup
2. Review existing tests to understand patterns
3. Add tests for new features before implementation
4. Monitor test results in CI/CD
5. Keep tests fast and reliable

---

For questions or issues, check:
- **Playwright Docs:** https://playwright.dev/
- **Test files:** `apps/web/e2e/`
- **CI workflow:** `.github/workflows/e2e-tests.yml`
- **Helper scripts:** `scripts/run-e2e-tests.{bat,sh}`
