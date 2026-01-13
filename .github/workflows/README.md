# GitHub Actions Workflows - CI/CD

Ce dossier contient les workflows GitHub Actions pour l'intégration continue et le déploiement continu.

## 📋 Workflows disponibles

### 1. `ci.yml` - Tests & Quality Checks

**Déclencheurs:**
- Pull Requests vers `main`, `staging`, ou `release/**`
- Push sur `main` ou `staging`

**Jobs:**

#### Lint & Format (non-bloquant)
- ESLint pour vérifier la qualité du code
- Vérification du formatage

#### API Tests
- Tests API avec PostgreSQL
- Migrations de base de données
- Exécution de la suite de tests

#### Build Check (bloquant)
- Validation du schéma Prisma
- Génération du client Prisma
- Vérification de la compilation

#### Security Audit (non-bloquant)
- Audit npm des vulnérabilités
- Niveau: moderate et au-dessus

#### CI Summary
- Agrège les résultats de tous les jobs
- Bloque le merge si le build échoue

## 🚀 Configuration requise

### Secrets GitHub

Aucun secret requis pour le CI de base. Les secrets de test sont hardcodés dans le workflow (non-production).

### Variables d'environnement

Le workflow utilise:
- `NODE_ENV=test`
- `DATABASE_URL` (PostgreSQL service)
- `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` (secrets de test)

## ✅ Statuts des checks

### Checks bloquants (❌ = merge impossible)
- ✅ **Build Check** - Doit passer

### Checks non-bloquants (⚠️ = review recommandée)
- ⚠️ **Lint** - Peut échouer
- ⚠️ **Tests** - Peut échouer
- ⚠️ **Security Audit** - Peut échouer

## 📊 Workflow d'un PR typique

1. **Développeur crée PR** vers `staging`
2. **GitHub Actions lance CI**:
   - Lint (warning si échec)
   - Tests API (warning si échec)  
   - Build check (block si échec)
   - Security audit (warning si échec)
3. **Si build passe**: PR peut être mergé
4. **Si build échoue**: PR bloqué jusqu'à correction

## 🔧 Configuration locale

Pour reproduire les tests en local:

```bash
# Linter
cd apps/api
npm run lint

# Tests
npm test

# Build check
npx prisma validate
npx prisma generate

# Security
npm audit --audit-level=moderate
```

## 📝 Bonnes pratiques

### Avant de créer un PR
1. Exécuter les tests localement
2. Corriger les erreurs de lint
3. Valider le schéma Prisma
4. Vérifier qu'il n'y a pas de vulnérabilités critiques

### Après création du PR
1. Attendre les résultats du CI (2-5min)
2. Corriger les erreurs bloquantes (build)
3. Review les warnings (lint, tests, security)
4. Demander une review de code

### Merge du PR
1. Tous les checks bloquants doivent passer
2. Au moins 1 review approuvée (recommandé)
3. Pas de conflits avec la branche cible

## 🐛 Debugging CI

### Le build échoue
```bash
# Vérifier le schéma Prisma
cd apps/api
npx prisma validate

# Régénérer le client
npx prisma generate
```

### Les tests échouent
```bash
# Exécuter les tests localement
cd apps/api
npm test

# Avec PostgreSQL Docker
docker-compose up -d postgres
npm test
```

### Lint échoue
```bash
# Fix automatique
cd apps/api
npm run lint:fix
```

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Service Containers](https://docs.github.com/en/actions/using-containerized-services)

## 🔄 Évolutions futures

- [ ] Ajout de tests E2E avec Playwright
- [ ] Déploiement automatique sur staging
- [ ] Notifications Slack pour les échecs
- [ ] Coverage badges dans README
- [ ] Performance benchmarks
- [ ] Visual regression testing
- [ ] Automatic dependency updates (Dependabot)

---

**Dernière mise à jour:** 2026-01-13
**Version:** Phase 3.10
