# Inventaire SI - Groupe Tilly

![Version](https://img.shields.io/badge/version-0.2.0-orange)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

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

### 🔒 Sécurité & Qualité (Nouveau!)

- ✅ **Tests automatisés** - Infrastructure Jest + Supertest configurée (11 tests auth passent)
- ✅ **Rate Limiting** - Protection contre brute force et DoS (4 niveaux)
- ✅ **Secrets management** - Aucun secret hardcodé, .env sécurisés
- ✅ **JWT dual-token** - Access (15min) + Refresh (7j) avec httpOnly cookies

---

## 🆕 Nouveautés v0.2.0

### 🤖 Automatisation & DevOps

**Système complet de release workflow**
- Scripts d'automatisation: `release.sh`, `deploy-production.sh`, `quick-commit.sh`
- Versioning sémantique (MAJOR.MINOR.PATCH)
- Génération automatique de CHANGELOG et release notes
- Workflow: `release/X.Y.Z → staging → main + tag`

### 📚 Documentation (95%)

- **38/40 fichiers documentés** avec JSDoc complet
- Backend: 7 services, 3 middlewares, 3 controllers, 3 utils
- Frontend: 8 API clients, 8 hooks, 4 composants, 2 config
- Guides complets: `COMMENTING_GUIDE.md`, `RELEASE_WORKFLOW.md`, `scripts/README.md`

### ✨ Nouvelles Fonctionnalités

**Création en Masse d'Équipements**
- Création de multiples AssetItems en une opération
- Génération automatique de tags séquentiels (KB-001, KB-002, etc.)
- Preview en temps réel avec détection de conflits
- Validation atomique (tout ou rien)

**Import Excel Employés Amélioré**
- Import massif avec sanitization des noms français
- Génération auto d'emails: `prenom.nom@groupetilly.com`
- Détection de doublons
- Rapport détaillé (succès, ignorés, erreurs)

**Dashboard Enrichi**
- Stats en temps réel (équipements, employés, prêts)
- Alertes de stock bas configurables
- Prêts récents avec détails
- Cartes visuelles avec skeleton loaders

**Gestion du Stock Avancée**
- Refactorisation: StockItems référencent AssetModels
- Suivi des quantités prêtées (`loaned` field)
- Synchronisation automatique lors des prêts/retours

### 🎨 Interface Utilisateur

- Charte graphique Groupe Tilly complète
- Pagination universelle sur toutes les listes
- Sélection multiple avec checkboxes
- Navigation mobile responsive
- Logo personnalisé (header, login, favicon)

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
- **Node.js** (ESM) >= 18.x
- **Express.js** 4.x - Web framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** 16 - Database
- **JWT** (jsonwebtoken) - Authentication
- **Bcryptjs** - Password hashing
- **Zod** - Validation
- **Multer** - File uploads
- **Cookie-parser** - Cookie handling
- **CORS** - Cross-origin requests

### Frontend
- **React** 18 - UI library
- **TypeScript** 5.0 - Type safety
- **Vite** - Build tool
- **TanStack Query** (React Query) - Data fetching
- **Zustand** - State management
- **React Router** v6 - Routing
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **xlsx** - Excel import
- **Axios** - HTTP client

### DevOps
- **Docker** & **Docker Compose** - Containerization
- **PostgreSQL** (containerized) - Database
- **Nginx** - Production web server
- **Git** - Version control

---

## 📦 Prérequis

- **Node.js** >= 18.x
- **Docker** & **Docker Compose**
- **Git**
- **npm** ou **yarn**

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

- [Documentation API](apps/api/README.md) - Backend complet
- [Documentation Frontend](apps/web/README.md) - Frontend complet
- [Guide de Documentation](COMMENTING_GUIDE.md) - Standards JSDoc
- [Workflow de Release](RELEASE_WORKFLOW.md) - Guide des releases
- [Scripts d'Automatisation](scripts/README.md) - Scripts détaillés
- [Instructions Claude Code](CLAUDE.md) - Pour Claude Code

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

### Authentification
- ✅ JWT avec access/refresh tokens
- ✅ Access token: 15 minutes
- ✅ Refresh token: 7 jours (httpOnly cookie)
- ✅ Rotation automatique des tokens
- ✅ Tokens stockés en mémoire (pas de localStorage)

### Autorisation
- ✅ RBAC (Role-Based Access Control)
- ✅ 3 rôles: ADMIN, GESTIONNAIRE, LECTURE
- ✅ Routes protégées frontend et backend
- ✅ Middleware de vérification des permissions

### Validation & Protection
- ✅ Validation Zod côté serveur
- ✅ Hachage des mots de passe (bcrypt, 10 salt rounds)
- ✅ CORS configuré
- ✅ Protection CSRF
- ✅ Messages d'erreur génériques (pas d'email enumeration)
- ✅ Sanitization des inputs utilisateur

### ⚠️ Production

**IMPORTANT - Avant déploiement:**
- [ ] Changer tous les secrets JWT
- [ ] Utiliser des mots de passe forts pour PostgreSQL
- [ ] Configurer HTTPS (Let's Encrypt recommandé)
- [ ] Activer les logs d'audit
- [ ] Configurer les backups automatiques
- [ ] Restreindre CORS aux domaines autorisés
- [ ] Changer le compte admin par défaut

---

## 📊 Versions

### Version Actuelle: v0.2.0

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet des versions.

### Release Notes

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

*Dernière mise à jour: 2024-12-29*
