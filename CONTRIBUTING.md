# Guide de contribution - Inventaire SI

Merci de votre intérêt pour contribuer à Inventaire SI ! Ce document vous guidera à travers le processus de contribution.

---

## 📋 Table des matières

1. [Code de conduite](#code-de-conduite)
2. [Comment contribuer](#comment-contribuer)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Standards de code](#standards-de-code)
5. [Processus de Pull Request](#processus-de-pull-request)
6. [Tests](#tests)
7. [Documentation](#documentation)
8. [Commit Messages](#commit-messages)

---

## 🤝 Code de conduite

### Nos engagements

Nous nous engageons à faire de la participation à ce projet une expérience sans harcèlement pour tous, indépendamment de :
- L'âge, la taille corporelle, le handicap
- L'origine ethnique, l'identité et expression de genre
- Le niveau d'expérience, l'éducation, le statut socio-économique
- La nationalité, l'apparence personnelle, la race, la religion

### Nos standards

**Comportements encouragés :**
- Utiliser un langage accueillant et inclusif
- Respecter les points de vue et expériences différents
- Accepter gracieusement les critiques constructives
- Se concentrer sur ce qui est mieux pour la communauté

**Comportements inacceptables :**
- Langage ou imagerie sexualisés
- Trolling, insultes ou commentaires dégradants
- Harcèlement public ou privé
- Publication d'informations privées sans permission

---

## 💡 Comment contribuer

### Types de contributions

Nous acceptons les contributions suivantes :

1. **🐛 Corrections de bugs**
   - Rapporter des bugs via GitHub Issues
   - Proposer des corrections via Pull Request

2. **✨ Nouvelles fonctionnalités**
   - Discuter d'abord via GitHub Issues
   - Créer une proposition de design si nécessaire

3. **📚 Documentation**
   - Améliorer le README, guides, JSDoc
   - Ajouter des exemples, tutoriels

4. **🧪 Tests**
   - Ajouter des tests unitaires
   - Améliorer la couverture de tests
   - Ajouter des tests E2E

5. **⚡ Performance**
   - Optimisations de code
   - Réduction de bundle size
   - Amélioration de temps de réponse

### Avant de commencer

1. **Vérifier les issues existantes** - Quelqu'un travaille peut-être déjà dessus
2. **Créer une issue** - Décrivez votre intention de contribution
3. **Attendre validation** - Assurez-vous que la contribution sera acceptée
4. **Fork et branch** - Créez une branche pour votre travail

---

## 🛠️ Configuration de l'environnement

### Prérequis

- **Node.js** 20.x ou supérieur
- **Docker** & **Docker Compose**
- **Git** 2.x ou supérieur
- **PostgreSQL** 16 (via Docker)

### Installation

```bash
# 1. Forker le repository sur GitHub
# 2. Cloner votre fork
git clone https://github.com/VOTRE_USERNAME/Inventaire_SI.git
cd Inventaire_SI

# 3. Ajouter le repository upstream
git remote add upstream https://github.com/Tilly57/Inventaire_SI.git

# 4. Installer les dépendances backend
cd apps/api
npm install

# 5. Installer les dépendances frontend
cd ../web
npm install

# 6. Configurer les variables d'environnement
cd ../api
cp .env.example .env
# Éditer .env avec vos valeurs

# 7. Démarrer les services
cd ../..
docker-compose up -d

# 8. Appliquer les migrations
cd apps/api
npx prisma migrate deploy

# 9. (Optionnel) Seed la base de données
npm run seed
```

### Vérification de l'installation

```bash
# Backend
cd apps/api
npm test

# Frontend
cd apps/web
npm test
npm run test:e2e

# Linter
npm run lint
```

---

## 📏 Standards de code

### Backend (Node.js/Express)

**Style de code :**
- ESM modules (`import`/`export`)
- JSDoc sur toutes les fonctions publiques
- Async/await pour les opérations asynchrones
- Error handling avec try/catch

**Exemple :**
```javascript
/**
 * Get employee by ID
 * @param {string} id - Employee ID (CUID)
 * @returns {Promise<Employee>} Employee object
 * @throws {NotFoundError} If employee not found
 */
export async function getEmployeeById(id) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employee;
  } catch (error) {
    logger.error('Error fetching employee', { id, error });
    throw error;
  }
}
```

**Conventions :**
- Fichiers : `camelCase.js`
- Classes : `PascalCase`
- Fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`
- Indentation : 2 espaces

### Frontend (React/TypeScript)

**Style de code :**
- TypeScript strict mode
- Functional components avec hooks
- Props typing avec interfaces
- React.memo pour optimisation

**Exemple :**
```typescript
import { memo } from 'react';

interface UserCardProps {
  name: string;
  email: string;
  role: UserRole;
  onEdit?: (userId: string) => void;
}

export const UserCard = memo(function UserCard({
  name,
  email,
  role,
  onEdit
}: UserCardProps) {
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
      <span>{role}</span>
    </div>
  );
});
```

**Conventions :**
- Fichiers : `PascalCase.tsx` (composants), `camelCase.ts` (utils)
- Composants : `PascalCase`
- Hooks : `use + PascalCase`
- Props : `ComponentNameProps`
- Indentation : 2 espaces

### Base de données (Prisma)

**Migrations :**
```bash
# Créer une migration
npx prisma migrate dev --name add_user_avatar

# Appliquer en production
npx prisma migrate deploy
```

**Conventions :**
- Noms de tables : `PascalCase` (singulier)
- Noms de colonnes : `camelCase`
- Relations : explicites avec `@relation`

---

## 🔀 Processus de Pull Request

### 1. Créer une branche

```bash
# Synchroniser avec upstream
git checkout main
git pull upstream main

# Créer une branche feature
git checkout -b feature/add-user-avatar

# OU pour un bugfix
git checkout -b fix/login-redirect-bug
```

**Convention de nommage des branches :**
- `feature/description` - Nouvelles fonctionnalités
- `fix/description` - Corrections de bugs
- `docs/description` - Documentation
- `perf/description` - Optimisations performance
- `refactor/description` - Refactoring
- `test/description` - Tests

### 2. Développer

```bash
# Faire vos modifications
# Tester localement
npm test

# Commit régulièrement
git add .
git commit -m "feat: add user avatar upload"
```

### 3. Tester

**Backend :**
```bash
cd apps/api
npm test                  # Tests unitaires
npm run test:integration  # Tests d'intégration
npm run lint              # Linter
```

**Frontend :**
```bash
cd apps/web
npm test                  # Tests unitaires
npm run test:e2e          # Tests E2E Playwright
npm run lint              # Linter
npm run build             # Vérifier le build
```

### 4. Créer le Pull Request

```bash
# Pousser votre branche
git push origin feature/add-user-avatar
```

Ensuite sur GitHub :
1. Cliquer sur "Compare & pull request"
2. Remplir le template de PR
3. Assigner des reviewers
4. Ajouter des labels appropriés

### Template de Pull Request

```markdown
## Description
[Décrivez brièvement les changements]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests effectués
- [ ] Tests unitaires passent
- [ ] Tests E2E passent
- [ ] Tests manuels réalisés
- [ ] Build réussit

## Checklist
- [ ] Code suit les standards du projet
- [ ] JSDoc/commentaires ajoutés
- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de conflits avec main
```

### 5. Review et merge

- **Au moins 1 review approuvé** requis
- **Tous les tests CI passent**
- **Pas de conflits**
- **Discussions résolues**

---

## 🧪 Tests

### Tests Backend

**Créer un test unitaire :**
```javascript
// apps/api/src/services/__tests__/employee.service.test.js
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createEmployee } from '../employee.service.js';

describe('Employee Service', () => {
  describe('createEmployee', () => {
    it('should create employee with valid data', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const employee = await createEmployee(data);

      expect(employee).toHaveProperty('id');
      expect(employee.firstName).toBe('John');
    });

    it('should throw error with invalid email', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
      };

      await expect(createEmployee(data)).rejects.toThrow();
    });
  });
});
```

**Lancer les tests :**
```bash
cd apps/api
npm test                    # Tous les tests
npm test employee.service   # Tests spécifiques
npm test -- --coverage      # Avec coverage
```

### Tests Frontend

**Créer un test composant :**
```typescript
// apps/web/src/components/__tests__/UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from '../UserCard';

describe('UserCard', () => {
  it('renders user information', () => {
    render(
      <UserCard
        name="John Doe"
        email="john@example.com"
        role="ADMIN"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

**Créer un test E2E :**
```typescript
// apps/web/e2e/user-management.spec.ts
import { test, expect } from '@playwright/test';

test('should create new user', async ({ page }) => {
  await page.goto('/users');
  await page.click('button:has-text("Ajouter")');

  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Doe');
  await page.fill('input[name="email"]', 'john@example.com');

  await page.click('button[type="submit"]');

  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

---

## 📚 Documentation

### JSDoc (Backend)

**Fonction :**
```javascript
/**
 * Create a new employee
 *
 * @param {Object} data - Employee data
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email address
 * @param {string} [data.phone] - Phone number (optional)
 * @returns {Promise<Employee>} Created employee
 * @throws {ValidationError} If data is invalid
 * @throws {DuplicateError} If email already exists
 *
 * @example
 * const employee = await createEmployee({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com'
 * });
 */
```

### TSDoc (Frontend)

```typescript
/**
 * User card component displaying user information
 *
 * @param props - Component props
 * @param props.name - User full name
 * @param props.email - User email address
 * @param props.role - User role (ADMIN, GESTIONNAIRE, LECTURE)
 * @param props.onEdit - Optional callback when edit button clicked
 *
 * @example
 * ```tsx
 * <UserCard
 *   name="John Doe"
 *   email="john@example.com"
 *   role="ADMIN"
 *   onEdit={(id) => console.log('Edit', id)}
 * />
 * ```
 */
```

### README et guides

- **README.md** - Vue d'ensemble du projet
- **docs/** - Documentation détaillée
- **CLAUDE.md** - Instructions pour Claude Code
- **CHANGELOG.md** - Historique des versions

---

## 📝 Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation uniquement
- `style` - Formatage (pas de changement de code)
- `refactor` - Refactoring
- `perf` - Amélioration de performance
- `test` - Ajout/modification de tests
- `chore` - Maintenance (deps, config, etc.)
- `ci` - CI/CD

### Scope

- `api` - Backend
- `web` - Frontend
- `db` - Base de données
- `docker` - Docker/infrastructure
- `docs` - Documentation

### Exemples

```bash
feat(api): add user avatar upload endpoint

- Add multer middleware for file upload
- Create avatar storage in uploads/avatars
- Update user schema with avatarUrl field
- Add validation for image types (jpg, png)

Closes #123
```

```bash
fix(web): correct login redirect loop

Users were stuck in redirect loop when session expired.
Added proper token expiration check before redirect.

Fixes #456
```

```bash
perf(api): optimize dashboard query with materialized view

Dashboard stats query was taking 150ms.
Created materialized view that updates every 5 minutes.
Query now takes 2ms (75x improvement).

Related to #789
```

---

## 🚀 Workflow Git

### Branches principales

- **main** - Code en production (stable)
- **staging** - Code en pré-production (testing)
- **release/X.Y.Z** - Préparation de release

### Workflow standard

```bash
# 1. Sync avec upstream
git checkout main
git pull upstream main

# 2. Créer feature branch
git checkout -b feature/my-feature

# 3. Développer et committer
git add .
git commit -m "feat(api): add my feature"

# 4. Pousser vers votre fork
git push origin feature/my-feature

# 5. Créer PR sur GitHub

# 6. Après merge, nettoyer
git checkout main
git pull upstream main
git branch -d feature/my-feature
```

---

## ❓ Questions & Support

### Canaux de communication

- **GitHub Issues** - Bugs et feature requests
- **GitHub Discussions** - Questions générales
- **Pull Requests** - Code reviews

### Obtenir de l'aide

1. **Chercher dans les issues existantes**
2. **Consulter la documentation**
3. **Créer une nouvelle issue** avec:
   - Description claire du problème
   - Steps to reproduce
   - Versions (Node.js, OS, etc.)
   - Logs d'erreur si applicable

---

## 🎉 Reconnaissance

Tous les contributeurs seront ajoutés au fichier CONTRIBUTORS.md et mentionnés dans les release notes.

Merci de contribuer à Inventaire SI ! 🙏

---

**Dernière mise à jour:** 2026-01-13
**Version:** 0.8.0
