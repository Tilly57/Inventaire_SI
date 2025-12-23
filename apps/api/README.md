# API Backend - Inventaire SI

API REST Node.js/Express avec Prisma ORM pour le système de gestion d'inventaire informatique.

## Table des matières

- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Schéma de base de données](#schéma-de-base-de-données)
- [Authentification](#authentification)
- [Gestion des erreurs](#gestion-des-erreurs)

## Technologies

- **Runtime:** Node.js 18+ (ESM modules)
- **Framework:** Express.js
- **ORM:** Prisma
- **Base de données:** PostgreSQL 16
- **Authentification:** JWT (access + refresh tokens)
- **Validation:** Zod
- **Sécurité:** bcryptjs, CORS, helmet
- **Upload fichiers:** Multer

## Structure du projet

```
apps/api/
├── src/
│   ├── config/
│   │   ├── db.js              # Configuration Prisma
│   │   └── jwt.js             # Configuration JWT
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── employees.controller.js
│   │   ├── assetModels.controller.js
│   │   ├── assetItems.controller.js
│   │   ├── stockItems.controller.js
│   │   ├── loans.controller.js
│   │   └── dashboard.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Vérification JWT
│   │   ├── rbac.middleware.js     # Contrôle des rôles
│   │   ├── error.middleware.js    # Gestion d'erreurs
│   │   └── validation.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── employees.routes.js
│   │   ├── assetModels.routes.js
│   │   ├── assetItems.routes.js
│   │   ├── stockItems.routes.js
│   │   ├── loans.routes.js
│   │   └── dashboard.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── users.service.js
│   │   ├── employees.service.js
│   │   ├── assetModels.service.js
│   │   ├── assetItems.service.js
│   │   ├── stockItems.service.js
│   │   └── loans.service.js
│   ├── schemas/
│   │   └── validation.schemas.js  # Schémas Zod
│   ├── utils/
│   │   ├── errors.js              # Classes d'erreurs personnalisées
│   │   └── responses.js           # Formats de réponses
│   └── index.js                   # Point d'entrée
├── prisma/
│   ├── schema.prisma              # Schéma de la base de données
│   └── migrations/                # Migrations Prisma
├── uploads/
│   └── signatures/                # Signatures numériques
├── .env                           # Variables d'environnement
├── package.json
├── Dockerfile
└── README.md                      # Ce fichier
```

## Installation

### Développement local

```bash
cd apps/api

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Exécuter les migrations Prisma
npm run prisma:migrate

# Générer le client Prisma
npm run prisma:generate

# Démarrer en mode développement
npm run dev
```

### Docker

```bash
# Depuis la racine du projet
docker-compose up api
```

## Configuration

### Variables d'environnement (.env)

```env
# Database
DATABASE_URL="postgresql://inventaire:inventaire_pwd@localhost:5432/inventaire"

# JWT Secrets
JWT_ACCESS_SECRET="votre_secret_access_token_tres_long_et_securise"
JWT_REFRESH_SECRET="votre_secret_refresh_token_tres_long_et_securise"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Uploads
SIGNATURES_DIR="uploads/signatures"

# Server
PORT=3001
NODE_ENV="development"
```

**⚠️ Important:** En production, générez des secrets JWT forts et uniques.

## API Endpoints

### Authentification

#### POST /api/auth/register
Créer un nouveau compte utilisateur (ADMIN uniquement)

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@groupetilly.com",
  "password": "Password123!",
  "role": "GESTIONNAIRE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid123",
      "username": "john_doe",
      "email": "john@groupetilly.com",
      "role": "GESTIONNAIRE"
    }
  }
}
```

#### POST /api/auth/login
Se connecter et obtenir les tokens

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid123",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Note:** Le refresh token est envoyé dans un cookie httpOnly.

#### POST /api/auth/refresh
Rafraîchir l'access token

**Headers:**
```
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/logout
Se déconnecter (invalide le refresh token)

### Employés

#### GET /api/employees
Liste tous les employés (avec pagination)

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 1000)
- `search` (recherche par nom/prénom/email)

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 108,
      "pages": 6
    }
  }
}
```

#### GET /api/employees/:id
Récupérer un employé par ID

#### POST /api/employees
Créer un employé

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@groupetilly.com",
  "dept": "Woippy"
}
```

#### PUT /api/employees/:id
Modifier un employé

#### DELETE /api/employees/:id
Supprimer un employé (impossible s'il a des prêts)

### Modèles d'équipements

#### GET /api/asset-models
Liste tous les modèles d'équipements

#### POST /api/asset-models
Créer un modèle

**Body:**
```json
{
  "type": "LAPTOP",
  "brand": "Dell",
  "modelName": "Latitude 5420"
}
```

**Types disponibles:** LAPTOP, DESKTOP, MONITOR, PHONE, TABLET, PRINTER, OTHER

### Articles d'équipement

#### GET /api/asset-items
Liste tous les articles

**Query params:**
- `status` (EN_STOCK, PRETE, HS, REPARATION)
- `modelId`

#### POST /api/asset-items
Créer un article

**Body:**
```json
{
  "modelId": "cuid123",
  "serialNumber": "SN123456",
  "assetTag": "GT-LAP-001",
  "status": "EN_STOCK"
}
```

#### PATCH /api/asset-items/:id/status
Changer le statut d'un article

**Body:**
```json
{
  "status": "HS"
}
```

### Articles de stock

#### GET /api/stock-items
Liste tous les articles de stock

#### POST /api/stock-items
Créer un article de stock

**Body:**
```json
{
  "name": "Câble HDMI",
  "description": "Câble HDMI 2.0 - 2m",
  "quantity": 50
}
```

#### PATCH /api/stock-items/:id/adjust
Ajuster la quantité

**Body:**
```json
{
  "adjustment": -5  // Nombre positif ou négatif
}
```

### Prêts

#### GET /api/loans
Liste tous les prêts

**Query params:**
- `status` (OPEN, CLOSED)
- `employeeId`

#### GET /api/loans/:id
Récupérer un prêt avec ses lignes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "employee": {...},
    "status": "OPEN",
    "lines": [
      {
        "id": "cuid456",
        "assetItem": {...},
        "stockItem": null,
        "quantity": 1
      }
    ],
    "pickupSignatureUrl": "/uploads/signatures/pickup-123.png",
    "returnSignatureUrl": null,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### POST /api/loans
Créer un prêt

**Body:**
```json
{
  "employeeId": "cuid123"
}
```

#### POST /api/loans/:id/lines
Ajouter une ligne au prêt

**Body (équipement):**
```json
{
  "assetItemId": "cuid456",
  "quantity": 1
}
```

**Body (stock):**
```json
{
  "stockItemId": "cuid789",
  "quantity": 3
}
```

#### DELETE /api/loans/:id/lines/:lineId
Supprimer une ligne du prêt

#### POST /api/loans/:id/pickup-signature
Upload de la signature de retrait

**Form data:**
- `signature`: fichier image (PNG, JPG)

#### POST /api/loans/:id/return-signature
Upload de la signature de retour

#### PATCH /api/loans/:id/close
Fermer le prêt (statut → CLOSED)

#### DELETE /api/loans/:id
Supprimer un prêt (uniquement si OPEN et sans lignes)

### Dashboard

#### GET /api/dashboard/stats
Statistiques globales

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEmployees": 108,
    "totalAssets": 245,
    "activeLoans": 12,
    "loanedAssets": 34
  }
}
```

## Schéma de base de données

### Modèles principaux

**User**
- id (CUID)
- username (unique)
- email (unique)
- password (hashed)
- role (ADMIN | GESTIONNAIRE | LECTURE)
- refreshToken

**Employee**
- id (CUID)
- firstName
- lastName
- email (unique)
- dept (département/agence)
- loans (relation)

**AssetModel**
- id (CUID)
- type (enum)
- brand
- modelName
- items (relation)

**AssetItem**
- id (CUID)
- modelId (FK)
- serialNumber (unique)
- assetTag (unique)
- status (EN_STOCK | PRETE | HS | REPARATION)

**StockItem**
- id (CUID)
- name
- description
- quantity

**Loan**
- id (CUID)
- employeeId (FK)
- status (OPEN | CLOSED)
- pickupSignatureUrl
- returnSignatureUrl
- pickupSignedAt
- returnSignedAt
- closedAt
- lines (relation)

**LoanLine**
- id (CUID)
- loanId (FK)
- assetItemId (FK, nullable)
- stockItemId (FK, nullable)
- quantity

## Authentification

### JWT Strategy

L'API utilise une stratégie à deux tokens:

1. **Access Token** (courte durée: 15 min)
   - Envoyé dans le body de la réponse de login
   - Stocké en mémoire côté client (Zustand)
   - Utilisé dans l'header `Authorization: Bearer <token>`

2. **Refresh Token** (longue durée: 7 jours)
   - Envoyé dans un cookie httpOnly
   - Stocké en base de données
   - Utilisé pour obtenir un nouveau access token

### Middleware d'authentification

```javascript
// Protéger une route
router.get('/protected', authenticate, (req, res) => {
  // req.user contient les infos de l'utilisateur
})

// Protéger avec rôle
router.delete('/admin-only', authenticate, requireRole(['ADMIN']), (req, res) => {
  // Accessible uniquement aux ADMIN
})
```

### Hiérarchie des rôles

- **ADMIN:** Accès complet à toutes les fonctionnalités
- **GESTIONNAIRE:** Gestion des employés, équipements, prêts
- **LECTURE:** Lecture seule (pas d'implémentation frontend actuellement)

## Gestion des erreurs

### Classes d'erreurs personnalisées

```javascript
// 404
throw new NotFoundError('Employé non trouvé')

// 400
throw new ValidationError('Email invalide')

// 401
throw new UnauthorizedError('Token invalide')

// 403
throw new ForbiddenError('Accès refusé')

// 409
throw new ConflictError('Email déjà utilisé')
```

### Format de réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur descriptif"
}
```

## Commandes Prisma

```bash
# Créer une migration
npm run prisma:migrate -- --name nom_de_la_migration

# Appliquer les migrations
npm run prisma:migrate

# Générer le client Prisma
npm run prisma:generate

# Ouvrir Prisma Studio (GUI)
npm run prisma:studio

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset
```

## Développement

### Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur http://localhost:3001 avec rechargement automatique.

### Structure des fichiers

Chaque ressource suit le pattern:
1. **Route** (`routes/*.routes.js`) - Définit les endpoints
2. **Controller** (`controllers/*.controller.js`) - Gère les requêtes/réponses
3. **Service** (`services/*.service.js`) - Logique métier et accès DB
4. **Schema** (`schemas/validation.schemas.js`) - Validation Zod

### Exemple de flux

```
Request → Route → Middleware (auth, validation) → Controller → Service → Prisma → Database
                                                                                       ↓
Response ← Controller ← Service ← Prisma ← Database
```

## Tests

```bash
# Tests unitaires (à implémenter)
npm test

# Coverage (à implémenter)
npm run test:coverage
```

## Déploiement

### Build Docker

```bash
docker build -t inventaire-api .
docker run -p 3001:3001 --env-file .env inventaire-api
```

### Production

Avant le déploiement en production:

1. ✅ Changer les secrets JWT
2. ✅ Utiliser des mots de passe PostgreSQL forts
3. ✅ Configurer HTTPS
4. ✅ Activer les logs
5. ✅ Configurer les backups de base de données
6. ✅ Limiter les tentatives de login (rate limiting)
7. ✅ Auditer les dépendances npm

## Licence

Propriété de Groupe Tilly. Tous droits réservés.
