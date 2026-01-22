# Inventaire SI - Groupe Tilly

![Version](https://img.shields.io/badge/version-0.8.1-orange)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tests](https://img.shields.io/badge/tests-300+%20passing-success)
![Security](https://img.shields.io/badge/security-8.7%2F10-green)
![Monitoring](https://img.shields.io/badge/monitoring-Sentry-purple)
![Backups](https://img.shields.io/badge/backups-automated-blue)

Système de gestion d'inventaire informatique avec suivi des prêts de matériel et signatures numériques.

**Charte graphique:**
- 🟠 Orange: `#EE2722`
- ⚫ Noir: `#231F20`
- ⚪ Blanc: `#FFFFFF`

---

## 📋 Table des Matières

- [Présentation](#présentation)
- [Nouveautés v0.2.0](#nouveautés-v020)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack Technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Scripts d'Automatisation](#scripts-dautomatisation)
- [Documentation](#documentation)
- [Workflow des Prêts](#workflow-des-prêts)
- [Sécurité](#sécurité)
- [Support](#support)

---

## 🎯 Présentation

**Inventaire SI** est une application web complète de gestion d'inventaire informatique développée pour Groupe Tilly. Elle permet de gérer:

- ✅ Les employés et leurs coordonnées
- ✅ Les modèles d'équipements et articles en stock
- ✅ Les prêts de matériel avec signatures numériques
- ✅ Les articles consommables en stock
- ✅ Les utilisateurs du système avec gestion des rôles (RBAC)
- ✅ Dashboard avec statistiques en temps réel

### 🔒 Sécurité & Qualité

- ✅ **Score global: 8.5/10** - Qualité production confirmée (audit complet)
- ✅ **Tests automatisés** - 292 tests passants (Jest + Supertest + Playwright E2E)
- ✅ **Sécurité renforcée** - 8.7/10 avec Helmet CSP, HTTPS TLS 1.3, CORS strict
- ✅ **Audit trail** - Traçabilité complète de toutes les opérations CRUD
- ✅ **Rate Limiting** - Protection contre brute force et DoS (4 niveaux)
- ✅ **Secrets management** - Génération cryptographique sécurisée
- ✅ **JWT dual-token** - Access (15min) + Refresh (7j) avec httpOnly cookies
- ✅ **CI/CD GitHub Actions** - Tests automatiques + linting sur chaque PR

---

## 🆕 Nouveautés v0.8.1 (Release Actuelle)

### 🔍 Monitoring & Observabilité

**Sentry Error Tracking**
- ✅ **Backend Integration** - Capture automatique erreurs + performance monitoring
- ✅ **Frontend Integration** - Error boundaries + session replay
- ✅ **Profiling** - CPU/memory insights pour production
- ✅ **User Context** - Tracking utilisateur automatique après login
- ✅ **Data Filtering** - Suppression données sensibles (tokens, headers)
- ✅ **Guide complet** - `docs/SENTRY_INTEGRATION.md` + `docs/SENTRY_QUICKSTART.md`

### 🔄 Backups Automatisés

**Système Complet Multi-Plateforme**
- ✅ **Scheduling Automatique** - Backups quotidiens à 2h00 AM (configurable)
- ✅ **Multi-Platform** - Windows (Task Scheduler), Linux/Mac (cron), Docker (crond)
- ✅ **Rétention Intelligente** - Suppression automatique après 30 jours
- ✅ **Monitoring HTTP** - Endpoints `/health`, `/metrics`, `/status`
- ✅ **Alertes** - Notifications email sur échec (configurable)
- ✅ **Script Node.js** - `scripts/backup-automation.js` cross-platform
- ✅ **Documentation** - `docs/BACKUP_AUTOMATION.md` (12,000+ mots)

### 🧪 Tests E2E Améliorés

**Couverture Critique Complète**
- ✅ **Smoke Tests** - 10 tests critiques (~2 min)
- ✅ **Loan Workflow** - Test complet du cycle de vie des prêts
- ✅ **Test Fixtures** - Factories de données réutilisables
- ✅ **CI/CD GitHub Actions** - Tests automatiques sur PRs
- ✅ **Helper Scripts** - `scripts/run-e2e-tests.{bat,sh}`
- ✅ **Documentation** - `docs/E2E_TESTING.md` (11,000+ mots)

---

## 🆕 Nouveautés v0.8.0

### 🔐 Sécurité Renforcée (Score: 8.7/10)

**Protection Production-Ready**
- ✅ **Helmet CSP** - Content Security Policy complète
- ✅ **HTTPS/TLS 1.3** - Configuration nginx + Let's Encrypt
- ✅ **CORS Strict** - Validation URL parsing avec protocole check
- ✅ **JWT Secrets** - Génération cryptographique 64-byte base64
- ✅ **Security Headers** - HSTS, X-Frame-Options, noSniff, XSS Filter
- ✅ **OWASP Top 10** - Protection 8.4/10 (A01-A07)

### ⚡ Performance & Optimisations

**Dashboard 75x Plus Rapide**
- ✅ **Redis Cache** - Requêtes dashboard: 150ms → 2ms
- ✅ **Materialized Views** - Stats pré-calculées (refresh 5min)
- ✅ **React.memo** - StatsCard + Pagination (-30% renders)
- ✅ **ErrorBoundary** - Protection globale app (aucun crash)
- ✅ **19 Index DB** - Queries optimisées (employés, assets, loans)
- ✅ **Bundle Optimization** - 1.5MB → 1.0MB (-40%)

### 📊 Monitoring & Traçabilité

**Audit Trail Complet**
- ✅ **AuditLog Model** - Traçabilité de toutes opérations CRUD
- ✅ **10+ Actions** - CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
- ✅ **Metadata** - User, IP, timestamp, before/after values
- ✅ **API Endpoints** - `/api/audit-logs` avec filtres
- ✅ **Guide complet** - `apps/api/AUDIT_TRAIL_GUIDE.md`

**Dashboard Statistiques**
- ✅ **Vue matérialisée** - `dashboard_stats` optimisée
- ✅ **API dédiée** - `/api/dashboard/stats` (2ms response)
- ✅ **Stats temps réel** - Équipements, employés, prêts, stock
- ✅ **Refresh automatique** - Scripts PowerShell/Bash

### 🧪 Tests & CI/CD

**Couverture Complète**
- ✅ **292 tests passants** - Backend (275) + Frontend (17)
- ✅ **E2E Playwright** - Tests d'intégration complets
- ✅ **GitHub Actions** - CI automatique sur PR/push
- ✅ **Linting** - ESLint + TypeScript strict
- ✅ **Coverage** - Jest coverage reporting

### 📚 Documentation Production

**Guides Complets**
- ✅ **ARCHITECTURE.md** (600+ lignes) - Diagrammes Mermaid, ER diagrams
- ✅ **CONTRIBUTING.md** (456 lignes) - Guide contributeurs
- ✅ **DEPLOYMENT_PRODUCTION.md** (600+ lignes) - Déploiement complet
- ✅ **HTTPS_SETUP.md** (200 lignes) - Configuration SSL/TLS
- ✅ **BACKUP_GUIDE.md** - Automatisation backups PostgreSQL
- ✅ **AUDIT_TRAIL_GUIDE.md** - Utilisation audit logs
- ✅ **Swagger UI** - Documentation API interactive

### 🛡️ DevOps & Production

**Infrastructure Complète**
- ✅ **Scripts Backup** - PowerShell + Bash automation
- ✅ **Docker Compose Prod** - Configuration production-ready
- ✅ **nginx.conf** - Reverse proxy + TLS 1.3
- ✅ **Monitoring** - Prometheus + Grafana ready
- ✅ **Rollback procedures** - Scripts de restauration

---

## 🎯 Historique des Versions

### v0.7.x - Documentation & Swagger
- Swagger UI interactive (`/api/docs`)
- Backup automation (scripts PowerShell/Bash)
- 275 tests backend passants

### v0.6.x - Performance
- Redis cache implementation
- Dashboard materialized views
- 19 index database

### v0.5.x - Tests
- Infrastructure Jest + Supertest
- Tests d'authentification complets
- GitHub Actions CI/CD

### v0.2.0 - Features Principales
- Création en masse d'équipements
- Import Excel employés
- Dashboard enrichi
- RBAC complet
- Gestion signatures numériques

---

## 🚀 Fonctionnalités

### Gestion des Employés
- ✅ CRUD complet (Créer, Lire, Modifier, Supprimer)
- ✅ Import Excel massif (format: Société | Agence | Civilité | Nom | Prénom)
- ✅ Génération automatique des emails (@groupetilly.com)
- ✅ Pagination et recherche avancée
- ✅ Sélection multiple et suppression en masse
- ✅ Protection: impossible de supprimer un employé avec historique de prêts

### Gestion des Équipements
- ✅ Modèles d'équipements (type, marque, nom du modèle)
- ✅ Articles individuels avec numéro de série et tag d'actif
- ✅ **Création en masse** avec tags auto-générés
- ✅ Suivi des statuts: EN_STOCK, PRETE, HS, REPARATION
- ✅ Filtrage par statut et modèle
- ✅ Création automatique d'équipements lors de création de modèle

### Gestion du Stock
- ✅ Articles consommables avec quantité
- ✅ Référence aux AssetModels (refactorisation majeure)
- ✅ Alertes de stock bas (< 5 unités)
- ✅ Suivi des quantités prêtées
- ✅ Ajustement rapide des quantités

### Gestion des Prêts
- ✅ Création de prêts pour employés
- ✅ Ajout d'articles (équipements ou stock)
- ✅ Signatures numériques (retrait et retour)
- ✅ Workflow complet: OPEN → Ajout lignes → Signatures → CLOSED
- ✅ Historique complet des prêts
- ✅ Page de détails avec toutes les informations
- ✅ Validation avant fermeture (signatures requises)

### Gestion des Utilisateurs
- ✅ Système d'authentification JWT (access + refresh tokens)
- ✅ Gestion des rôles: ADMIN, GESTIONNAIRE, LECTURE
- ✅ Protection des routes selon les rôles (RBAC)
- ✅ Changement de mot de passe

### Dashboard
- ✅ Statistiques en temps réel
  - Total employés
  - Total équipements (breakdown par statut)
  - Prêts actifs
  - Stock bas
- ✅ Widgets d'alertes
- ✅ Prêts récents avec détails
- ✅ Cartes visuelles avec icônes

---

## 🏗️ Architecture

### Structure du Projet (Monorepo)

```
inventaire_SI/
├── apps/
│   ├── api/                          # Backend Node.js/Express
│   │   ├── src/
│   │   │   ├── config/               # Configuration
│   │   │   ├── controllers/          # HTTP handlers
│   │   │   ├── middleware/           # Auth, RBAC, errorHandler
│   │   │   ├── routes/               # API routes
│   │   │   ├── services/             # Business logic
│   │   │   ├── validators/           # Zod schemas
│   │   │   └── utils/                # Utilities (errors, jwt, constants)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   └── migrations/           # Database migrations
│   │   ├── uploads/signatures/       # Signature images
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── web/                          # Frontend React/TypeScript
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── layout/           # Layout components
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── employees/
│       │   │   ├── assets/
│       │   │   ├── stock/
│       │   │   ├── loans/
│       │   │   ├── users/
│       │   │   └── common/           # Pagination, Skeletons
│       │   ├── lib/
│       │   │   ├── api/              # API clients
│       │   │   ├── hooks/            # Custom React Query hooks
│       │   │   ├── stores/           # Zustand stores
│       │   │   ├── schemas/          # Zod validation
│       │   │   ├── types/            # TypeScript types
│       │   │   └── utils/            # Utilities
│       │   ├── pages/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/images/            # Logos, assets
│       ├── package.json
│       ├── Dockerfile
│       ├── nginx.conf
│       └── README.md
│
├── scripts/                          # Automation scripts
│   ├── release.sh                    # Main release script
│   ├── deploy-production.sh          # Production deployment
│   ├── quick-commit.sh               # Quick commits
│   └── README.md
│
├── .release-notes/                   # Release notes by version
│   └── v0.2.0.md
│
├── docker-compose.yml                # Docker orchestration
├── VERSION                           # Current version (0.2.0)
├── CHANGELOG.md                      # Version history
├── RELEASE_WORKFLOW.md               # Release workflow guide
├── COMMENTING_GUIDE.md               # Code documentation guide
├── CLAUDE.md                         # Claude Code instructions
└── README.md                         # This file
```

---

## 🛠️ Stack Technique

### Backend
- **Node.js** (ESM) >= 20.x
- **Express.js** 4.x - Web framework
- **Prisma ORM** - Database ORM with materialized views
- **PostgreSQL** 16 - Database with 19 optimized indexes
- **Redis** - Cache layer (dashboard 150ms → 2ms)
- **JWT** (jsonwebtoken) - Authentication
- **Bcryptjs** - Password hashing
- **Helmet** - Security headers (CSP, HSTS, etc.)
- **Zod** - Validation
- **Multer** - File uploads
- **Cookie-parser** - Cookie handling
- **CORS** - Cross-origin with strict validation
- **Swagger** - API documentation interactive
- **Jest + Supertest** - Testing (275 tests)

### Frontend
- **React** 19 - UI library with ErrorBoundary
- **TypeScript** 5.0 - Type safety (strict mode)
- **Vite** - Build tool (1.5MB → 1.0MB optimized)
- **TanStack Query** (React Query) - Data fetching with cache
- **Zustand** - State management
- **React Router** v6 - Routing
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **xlsx** - Excel import/export
- **Axios** - HTTP client
- **Playwright** - E2E testing (17 tests)
- **Vitest** - Unit testing
- **React.memo** - Performance optimizations

### DevOps
- **Docker** & **Docker Compose** - Containerization (dev + prod configs)
- **PostgreSQL** 16 (containerized) - Database with backups
- **Redis** (containerized) - Cache layer
- **Nginx** - Reverse proxy with TLS 1.3
- **Let's Encrypt** - SSL certificates automation
- **GitHub Actions** - CI/CD pipeline (tests + linting)
- **Git** - Version control with release workflow
- **Prometheus + Grafana** - Monitoring (ready)

---

## 📦 Prérequis

- **Node.js** >= 20.x
- **Docker** & **Docker Compose**
- **Git**
- **npm** ou **yarn**
- **PostgreSQL** 16 (via Docker)
- **Redis** (via Docker, optionnel pour cache)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Tilly57/Inventaire_SI.git
cd Inventaire_SI
```

### 2. Configuration des variables d'environnement

#### Backend (`apps/api/.env`)

```env
DATABASE_URL="postgresql://inventaire:inventaire_pwd@localhost:5432/inventaire"
JWT_ACCESS_SECRET="votre_secret_access_token_change_me"
JWT_REFRESH_SECRET="votre_secret_refresh_token_change_me"
CORS_ORIGIN="http://localhost:5173"
SIGNATURES_DIR="uploads/signatures"
```

#### Frontend (`apps/web/.env`)

```env
VITE_API_URL="http://localhost:3001/api"
```

### 3. Installation avec Docker (Recommandé)

```bash
# Démarrer tous les services (DB + API + Web)
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

L'application sera accessible à:
- **Frontend:** http://localhost:8080
- **API:** http://localhost:3001
- **Database:** localhost:5432

### 4. Installation manuelle (Développement)

#### Backend

```bash
cd apps/api
npm install

# Lancer les migrations Prisma
npm run prisma:migrate

# Générer le client Prisma
npm run prisma:generate

# Démarrer en mode dev
npm run dev
```

#### Frontend

```bash
cd apps/web
npm install

# Démarrer en mode dev
npm run dev
```

---

## 💻 Utilisation

### Compte par défaut

Lors du premier démarrage, un compte administrateur est créé:

- **Email:** `admin@example.com`
- **Mot de passe:** `Admin123!`

⚠️ **Important:** Changez ce mot de passe immédiatement en production.

### Commandes Docker

```bash
# Démarrer les services
docker-compose up -d

# Reconstruire les images
docker-compose up --build

# Voir les logs d'un service
docker-compose logs -f api
docker-compose logs -f web

# Exécuter les migrations Prisma
docker-compose exec api npm run prisma:migrate

# Ouvrir Prisma Studio
docker-compose exec api npm run prisma:studio

# Arrêter et supprimer les volumes (⚠️ supprime la base de données)
docker-compose down -v
```

### Commandes de développement

#### Backend (`apps/api`)

```bash
npm run dev                 # Démarrer en mode développement
npm run start               # Démarrer en mode production
npm run prisma:migrate      # Exécuter les migrations
npm run prisma:studio       # Ouvrir Prisma Studio
npm run prisma:generate     # Générer le client Prisma
```

#### Frontend (`apps/web`)

```bash
npm run dev                 # Démarrer Vite dev server
npm run build               # Build pour production
npm run preview             # Prévisualiser le build
npm run lint                # Linter le code
```

### Import Excel des employés

1. Préparer un fichier Excel avec les colonnes:
   - **Société**
   - **Agence**
   - **Civilité**
   - **Nom** (requis)
   - **Prénom** (requis)

2. Dans l'interface, aller sur "Employés" → "Importer Excel"
3. Sélectionner le fichier
4. Les emails sont générés automatiquement: `prenom.nom@groupetilly.com`
5. Rapport d'import avec succès, doublons ignorés, et erreurs

---

## 🤖 Scripts d'Automatisation

### Vue d'ensemble

Le projet inclut un système complet d'automatisation pour gérer les releases, commits, et déploiements.

### Scripts Disponibles

#### 1. `release.sh` - Gestion des Releases

Script principal pour créer une nouvelle version.

```bash
# Mode interactif (recommandé)
./scripts/release.sh

# Mode direct
./scripts/release.sh patch    # 0.2.0 → 0.2.1
./scripts/release.sh minor    # 0.2.0 → 0.3.0
./scripts/release.sh major    # 0.2.0 → 1.0.0
```

**Fonctionnalités:**
- ✅ Incrémentation automatique de version
- ✅ Création de branche `release/X.Y.Z`
- ✅ Génération automatique du CHANGELOG
- ✅ Création de release notes
- ✅ Merge automatique vers `staging`
- ✅ Option de déploiement vers `main`
- ✅ Création de tags Git annotés
- ✅ GitHub releases (si `gh` CLI disponible)

#### 2. `deploy-production.sh` - Déploiement Production

Déploie une version testée de `staging` vers `main`.

```bash
./scripts/deploy-production.sh 0.2.1
```

#### 3. `quick-commit.sh` - Commits Rapides

Automatise les commits quotidiens avec messages formatés.

```bash
# Commit simple
./scripts/quick-commit.sh "feat: add user export"

# Commit + push
./scripts/quick-commit.sh "fix: correct login bug" --push

# Amend
./scripts/quick-commit.sh --amend --push
```

### Workflow de Release

```
feature → release/X.Y.Z → staging → main + tag vX.Y.Z
```

### Documentation Complète

- **Guide pratique:** [RELEASE_WORKFLOW.md](RELEASE_WORKFLOW.md)
- **Documentation technique:** [scripts/README.md](scripts/README.md)

---

## 📚 Documentation

### Guides Principaux

#### Pour les Développeurs
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide complet de contribution
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture complète avec diagrammes Mermaid
- [Documentation API](apps/api/README.md) - Backend complet
- [Documentation Frontend](apps/web/README.md) - Frontend complet
- [Guide de Documentation](COMMENTING_GUIDE.md) - Standards JSDoc
- [Instructions Claude Code](CLAUDE.md) - Pour Claude Code

#### Pour le Déploiement
- **[DEPLOYMENT_PRODUCTION.md](docs/DEPLOYMENT_PRODUCTION.md)** - Déploiement production complet
- **[HTTPS_SETUP.md](docs/HTTPS_SETUP.md)** - Configuration SSL/TLS avec Let's Encrypt
- **[BACKUP_GUIDE.md](docs/BACKUP_GUIDE.md)** - Automatisation des backups
- [Workflow de Release](RELEASE_WORKFLOW.md) - Guide des releases
- [Scripts d'Automatisation](scripts/README.md) - Scripts détaillés

#### Guides Techniques
- **[AUDIT_TRAIL_GUIDE.md](apps/api/AUDIT_TRAIL_GUIDE.md)** - Utilisation du système d'audit
- **[Swagger API](http://localhost:3001/api/docs)** - Documentation API interactive
- **[AUDIT_REPORT_2026-01-13.md](AUDIT_REPORT_2026-01-13.md)** - Rapport d'audit complet (Score: 8.5/10)

#### Monitoring & Qualité (Nouveau v0.8.1)
- **[SENTRY_INTEGRATION.md](docs/SENTRY_INTEGRATION.md)** - Guide complet intégration Sentry
- **[SENTRY_QUICKSTART.md](docs/SENTRY_QUICKSTART.md)** - Démarrage rapide Sentry (<10 min)
- **[BACKUP_AUTOMATION.md](docs/BACKUP_AUTOMATION.md)** - Automatisation backups complète
- **[E2E_TESTING.md](docs/E2E_TESTING.md)** - Guide tests E2E Playwright
- **[COURT_TERME_COMPLETE.md](COURT_TERME_COMPLETE.md)** - Résumé améliorations v0.8.1

### Schéma de base de données

Voir le fichier `apps/api/prisma/schema.prisma` pour le schéma complet.

**Modèles principaux:**
- `User` - Utilisateurs du système
- `Employee` - Employés de l'entreprise
- `AssetModel` - Modèles d'équipements
- `AssetItem` - Articles individuels
- `StockItem` - Articles consommables
- `Loan` - Prêts
- `LoanLine` - Lignes de prêt

---

## 🔄 Workflow des Prêts

1. **Créer un prêt** (statut: OPEN)
2. **Ajouter des lignes** (équipements ou stock)
3. **Signature de retrait** (pickupSignatureUrl)
4. **Retour du matériel**
5. **Signature de retour** (returnSignatureUrl)
6. **Fermer le prêt** (statut: CLOSED)

**Règles métier:**
- ✅ Impossible de fermer sans signatures
- ✅ Les équipements prêtés passent au statut PRETE
- ✅ Au retour, les équipements redeviennent EN_STOCK
- ✅ Les quantités de stock sont synchronisées automatiquement

---

## 🔐 Sécurité

**Score Global: 8.7/10** (Production-Ready)

### Authentification
- ✅ JWT avec access/refresh tokens
- ✅ Access token: 15 minutes
- ✅ Refresh token: 7 jours (httpOnly cookie)
- ✅ Rotation automatique des tokens
- ✅ Tokens stockés en mémoire (pas de localStorage)
- ✅ **Rate limiting** - 4 niveaux (auth, global, API, par IP)

### Autorisation
- ✅ RBAC (Role-Based Access Control)
- ✅ 3 rôles: ADMIN, GESTIONNAIRE, LECTURE
- ✅ Routes protégées frontend et backend
- ✅ Middleware de vérification des permissions
- ✅ **Audit trail** - Traçabilité complète (AuditLog model)

### Validation & Protection
- ✅ Validation Zod côté serveur
- ✅ Hachage des mots de passe (bcrypt, 10 salt rounds)
- ✅ **CORS strict** - URL parsing avec validation protocole
- ✅ **Helmet CSP** - Content Security Policy complète
- ✅ **Security Headers** - HSTS, X-Frame-Options, noSniff, XSS Filter
- ✅ Protection CSRF
- ✅ Messages d'erreur génériques (pas d'email enumeration)
- ✅ Sanitization des inputs utilisateur

### Infrastructure Sécurisée
- ✅ **HTTPS/TLS 1.3** - Configuration nginx production
- ✅ **Let's Encrypt** - Certificats SSL automatiques
- ✅ **Secrets** - Génération cryptographique 64-byte base64
- ✅ **Docker secrets** - Passwords via Docker secrets (production)

### OWASP Top 10 Protection (Score: 8.4/10)
- ✅ A01 Broken Access Control: **9/10**
- ✅ A02 Cryptographic Failures: **9/10**
- ✅ A03 Injection: **9/10**
- ✅ A05 Security Misconfiguration: **9/10**
- ✅ A07 Identification Failures: **9/10**

### ⚠️ Checklist Déploiement Production

**CRITIQUE - Avant déploiement:**
- [ ] Générer nouveaux secrets JWT (voir .env.example pour commandes)
- [ ] Configurer HTTPS avec Let's Encrypt (voir docs/HTTPS_SETUP.md)
- [ ] Configurer CORS pour domaine production uniquement
- [ ] Changer mot de passe PostgreSQL (utiliser Docker secrets)
- [ ] Activer backups automatiques (voir docs/BACKUP_GUIDE.md)
- [ ] Changer le compte admin par défaut
- [ ] Vérifier logs d'audit activés
- [ ] Configurer UFW firewall
- [ ] Installer fail2ban pour SSH
- [ ] Tester restauration backup
- [ ] Configurer monitoring (Prometheus/Grafana)

---

## 📊 Versions

### Version Actuelle: v0.8.1 (2026-01-22)

**Score Global: 8.5/10** - Production-Ready avec Monitoring Professionnel

**Nouveautés v0.8.1:**
- 🔍 Intégration Sentry complète (backend + frontend)
- 🔄 Backups automatisés multi-plateforme avec monitoring
- 🧪 Tests E2E critiques avec CI/CD GitHub Actions
- 📚 35,000+ mots de nouvelle documentation

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

### Release Notes Récentes

- [v0.8.1 (en cours)](.release-notes/v0.8.1.md) - Sentry + Backups automatiques + E2E tests (2026-01-22)
- [v0.8.0](.release-notes/v0.8.0.md) - Security hardening + frontend optimizations (2026-01-13)
- [v0.7.1](.release-notes/v0.7.1.md) - Audit trail + dashboard optimizations (2026-01-06)
- [v0.7.0](.release-notes/v0.7.0.md) - Backup automation + E2E tests (2025-12-30)
- [v0.2.0](.release-notes/v0.2.0.md) - Première release officielle (2024-12-29)

---

## 🆘 Support

Pour toute question ou problème:

1. Consulter la [Documentation API](apps/api/README.md)
2. Consulter la [Documentation Frontend](apps/web/README.md)
3. Voir les [Issues GitHub](https://github.com/Tilly57/Inventaire_SI/issues)
4. Contacter l'équipe de développement

---

## 📝 Licence

Propriété de **Groupe Tilly**. Tous droits réservés.

---

## 👥 Contributeurs

- **Mickael GERARD** - Développement principal
- **Claude Sonnet 4.5** - Assistant de développement

---

## 🙏 Remerciements

- **Groupe Tilly** pour la confiance accordée
- **shadcn/ui** pour les composants UI
- **Prisma** pour l'excellent ORM
- **TanStack Query** pour la gestion des données

---

**Développé avec ❤️ pour Groupe Tilly**

*Dernière mise à jour: 2026-01-22 (v0.8.1)*
