# Tests End-to-End (E2E)

Ce répertoire contient les tests E2E de l'application Inventaire SI utilisant Playwright.

## 📋 Vue d'ensemble

**Total : 10 suites de tests** couvrant les parcours utilisateurs critiques :

1. **01-auth.spec.ts** - Authentification (login, logout, protection routes)
2. **02-employees.spec.ts** - Gestion employés (CRUD, recherche, import Excel)
3. **03-equipment.spec.ts** - Gestion équipements (modèles, articles, bulk creation)
4. **04-loans.spec.ts** - Workflow prêts complet (création → signatures → fermeture)
5. **05-stock.spec.ts** - Gestion stock (création, ajustement quantités, alertes)
6. **06-users.spec.ts** - Gestion utilisateurs (CRUD, rôles RBAC)
7. **07-export.spec.ts** - Export Excel (employés, équipements, prêts)
8. **08-routes-protection.spec.ts** - Protection routes & RBAC (ADMIN, GESTIONNAIRE, LECTURE)
9. **09-dashboard.spec.ts** - Dashboard (statistiques, widgets, navigation)
10. **10-navigation.spec.ts** - Navigation globale (sidebar, responsive, menu)

## 🚀 Lancer les tests

### Prérequis

1. **Installer les navigateurs Playwright** (première fois uniquement) :
   ```bash
   npm run playwright:install
   ```

2. **Démarrer le backend** (dans un terminal séparé) :
   ```bash
   cd ../api
   npm run dev
   ```

3. **Démarrer le frontend** (dans un autre terminal) :
   ```bash
   npm run dev
   ```

### Commandes

```bash
# Lancer tous les tests E2E (headless)
npm run test:e2e

# Lancer avec l'interface UI Playwright
npm run test:e2e:ui

# Lancer en mode visible (headed)
npm run test:e2e:headed

# Déboguer un test spécifique
npm run test:e2e:debug

# Lancer un fichier de test spécifique
npx playwright test e2e/01-auth.spec.ts

# Lancer les tests en parallèle (plus rapide)
npx playwright test --workers=4

# Générer un rapport HTML
npx playwright show-report
```

## 🔧 Configuration

La configuration Playwright est dans `playwright.config.ts` :

- **testDir** : `./e2e`
- **baseURL** : `http://localhost:5175`
- **Navigateurs** : Chromium (Firefox et WebKit disponibles)
- **Retries** : 2 fois en CI, 0 en local
- **Timeout** : 30s par test
- **Traces** : Collectées lors du premier retry
- **Screenshots/Vidéos** : Capturées uniquement en cas d'échec

## 📝 Structure des tests

Chaque fichier de test suit cette structure :

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.click('button:has-text("Action")');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## 🛠️ Helpers disponibles

Le fichier `helpers.ts` fournit des fonctions utilitaires :

### Authentification
```typescript
await loginAsAdmin(page);
await loginAsGestionnaire(page);
await loginAsLecteur(page);
await logout(page);
```

### Navigation
```typescript
await navigateTo(page, '/employees');
```

### Interactions
```typescript
await clickButton(page, 'Créer');
await fillField(page, 'Prénom', 'John');
await selectOption(page, 'Rôle', 'ADMIN');
```

### Attentes
```typescript
await waitForToast(page, 'Employé créé avec succès');
```

## 🎯 Bonnes pratiques

### 1. Utiliser des sélecteurs robustes

```typescript
// ✅ BON - Sélecteurs par rôle ou texte
await page.click('button:has-text("Créer")');
await page.getByRole('button', { name: /créer/i });

// ❌ MAUVAIS - Sélecteurs CSS fragiles
await page.click('.btn-primary.create-btn');
```

### 2. Attendre les états

```typescript
// ✅ BON - Attendre que l'élément soit visible
await expect(page.locator('text=Success')).toBeVisible();

// ❌ MAUVAIS - Attendre avec timeout fixe
await page.waitForTimeout(2000);
```

### 3. Isoler les tests

```typescript
// ✅ BON - Chaque test crée ses propres données
test('should create employee', async ({ page }) => {
  const uniqueEmail = `user.${Date.now()}@example.com`;
  // ...
});

// ❌ MAUVAIS - Dépendre de données existantes
test('should edit first employee', async ({ page }) => {
  // Assume qu'il existe déjà un employé
});
```

### 4. Nettoyer après les tests

```typescript
test.afterEach(async ({ page }) => {
  // Supprimer les données de test créées
  // ou utiliser des transactions DB
});
```

## 🔍 Debugging

### Visualiser les tests

```bash
# Lancer avec UI Playwright (recommandé)
npm run test:e2e:ui
```

### Mode debug

```bash
# Déboguer un test spécifique
npx playwright test e2e/01-auth.spec.ts --debug

# Déboguer à partir d'une ligne spécifique
npx playwright test e2e/01-auth.spec.ts:15 --debug
```

### Traces

Les traces sont automatiquement capturées lors des retries. Pour les visualiser :

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots et Vidéos

Les screenshots et vidéos sont automatiquement capturés en cas d'échec :

- **Screenshots** : `test-results/*/test-failed-1.png`
- **Vidéos** : `test-results/*/video.webm`

## 📊 CI/CD

Les tests E2E sont exécutés automatiquement dans GitHub Actions :

1. **Déclenchement** : Push sur `main`, `staging`, ou PR
2. **Workflow** : `.github/workflows/ci.yml`
3. **Job** : `e2e-tests`
4. **Durée** : ~5-10 minutes
5. **Artifacts** : Playwright report et test results (30 jours de rétention)

### Voir les résultats en CI

1. Aller sur l'onglet **Actions** du repo GitHub
2. Cliquer sur le workflow run
3. Télécharger les artifacts :
   - `playwright-report` : Rapport HTML complet
   - `e2e-test-results` : Traces, screenshots, vidéos

## 🐛 Problèmes courants

### Les tests échouent localement mais passent en CI

- Vérifier que le backend est démarré (`npm run dev` dans `apps/api`)
- Vérifier que le frontend est sur le bon port (5175)
- Nettoyer le cache : `rm -rf node_modules/.cache`

### Timeouts

```typescript
// Augmenter le timeout pour un test spécifique
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 secondes
  // ...
});
```

### Sélecteurs introuvables

```bash
# Utiliser l'inspecteur Playwright pour trouver le bon sélecteur
npx playwright test --debug
```

### Base de données

Les tests E2E utilisent une base de données de test seedée automatiquement.

Si vous rencontrez des problèmes :

```bash
# Réinitialiser la DB de test
cd apps/api
npx prisma migrate reset --skip-seed
node src/seeds/seed-users.js
```

## 📚 Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Sélecteurs](https://playwright.dev/docs/selectors)

## 📈 Couverture

**Objectif** : Couvrir 100% des parcours utilisateurs critiques

**Actuel** : 10 suites de tests couvrant :
- ✅ Authentification & autorisation
- ✅ CRUD complet (employés, équipements, stock, prêts, utilisateurs)
- ✅ Workflows métier (prêts avec signatures)
- ✅ Import/Export Excel
- ✅ RBAC (3 rôles)
- ✅ Navigation & responsive

**À ajouter** :
- [ ] Tests de performance (load testing)
- [ ] Tests d'accessibilité (WCAG)
- [ ] Tests multi-navigateurs (Firefox, WebKit)
