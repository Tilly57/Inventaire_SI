# Guide de Commentaires du Code - Inventaire SI

Ce document détaille la stratégie de documentation du code pour le projet Inventaire SI.

## Fichiers Déjà Commentés ✅

### Backend (16 fichiers)

#### Services (7 fichiers)
1. **apps/api/src/services/loans.service.js** - Service de gestion des prêts (le plus complexe)
2. **apps/api/src/services/auth.service.js** - Service d'authentification
3. **apps/api/src/services/employees.service.js** - Service de gestion des employés
4. **apps/api/src/services/users.service.js** - Service de gestion des utilisateurs système
5. **apps/api/src/services/assetModels.service.js** - Service de gestion des modèles d'équipements
6. **apps/api/src/services/assetItems.service.js** - Service de gestion des équipements individuels
7. **apps/api/src/services/stockItems.service.js** - Service de gestion du stock consommables

#### Middlewares (3 fichiers)
8. **apps/api/src/middleware/auth.js** - Middleware authentification JWT
9. **apps/api/src/middleware/errorHandler.js** - Middleware gestion d'erreurs globale
10. **apps/api/src/middleware/rbac.js** - Middleware contrôle d'accès par rôles

#### Controllers (3 fichiers)
11. **apps/api/src/controllers/auth.controller.js** - Endpoints d'authentification
12. **apps/api/src/controllers/loans.controller.js** - Endpoints de gestion des prêts
13. **apps/api/src/controllers/employees.controller.js** - Endpoints de gestion des employés

#### Utils (3 fichiers)
14. **apps/api/src/utils/errors.js** - Classes d'erreurs custom
15. **apps/api/src/utils/jwt.js** - Fonctions JWT (génération et vérification)
16. **apps/api/src/utils/constants.js** - Constantes de l'application

### Frontend (22 fichiers)

#### Configuration & Stores (2 fichiers)
1. **apps/web/src/lib/api/client.ts** - Configuration Axios avec refresh token
2. **apps/web/src/lib/stores/authStore.ts** - Store Zustand d'authentification

#### API Clients (8 fichiers)
3. **apps/web/src/lib/api/auth.api.ts** - API client authentification
4. **apps/web/src/lib/api/users.api.ts** - API client utilisateurs système
5. **apps/web/src/lib/api/employees.api.ts** - API client employés
6. **apps/web/src/lib/api/assetModels.api.ts** - API client modèles d'équipements
7. **apps/web/src/lib/api/assetItems.api.ts** - API client équipements individuels
8. **apps/web/src/lib/api/stockItems.api.ts** - API client stock consommables
9. **apps/web/src/lib/api/loans.api.ts** - API client prêts (avec signatures)
10. **apps/web/src/lib/api/dashboard.api.ts** - API client dashboard (calculs client)

#### Hooks React Query (8 fichiers)
11. **apps/web/src/lib/hooks/useAuth.ts** - Hook d'authentification
12. **apps/web/src/lib/hooks/useEmployees.ts** - Hook de gestion des employés
13. **apps/web/src/lib/hooks/useLoans.ts** - Hook de gestion des prêts
14. **apps/web/src/lib/hooks/useAssetModels.ts** - Hook de gestion des modèles
15. **apps/web/src/lib/hooks/useAssetItems.ts** - Hook de gestion des équipements
16. **apps/web/src/lib/hooks/useStockItems.ts** - Hook de gestion du stock
17. **apps/web/src/lib/hooks/useUsers.ts** - Hook de gestion des utilisateurs
18. **apps/web/src/lib/hooks/useDashboard.ts** - Hook du dashboard

#### Composants & Pages (4 fichiers)
19. **apps/web/src/components/layout/ProtectedRoute.tsx** - Guard de routes (auth + RBAC)
20. **apps/web/src/components/common/Pagination.tsx** - Composant de pagination réutilisable
21. **apps/web/src/components/employees/ImportEmployeesDialog.tsx** - Dialog d'import Excel
22. **apps/web/src/pages/LoanDetailsPage.tsx** - Page de détails de prêt

## Format de Commentaires Utilisé

### 1. En-tête de Fichier (@fileoverview)

```javascript
/**
 * @fileoverview Nom du module - Description courte
 *
 * Ce module gère:
 * - Fonctionnalité 1
 * - Fonctionnalité 2
 * - Fonctionnalité 3
 *
 * Notes de sécurité, patterns importants, etc.
 */
```

### 2. Fonctions avec JSDoc

```javascript
/**
 * Description de ce que fait la fonction
 *
 * Détails supplémentaires si nécessaire (comportements spéciaux,
 * règles métier, considérations de sécurité).
 *
 * @param {Type} paramName - Description du paramètre
 * @param {Type} [optionalParam] - Paramètre optionnel
 * @returns {Promise<Type>} Description du retour
 * @throws {ErrorType} Quand l'erreur est lancée
 *
 * @example
 * const result = await maFonction('value');
 * // result = { ... }
 */
export async function maFonction(paramName, optionalParam) {
  // Implémentation
}
```

### 3. Commentaires Inline

```javascript
// Commentaire expliquant pourquoi (pas juste ce que fait le code)
const result = complexOperation()

// Règle métier importante
if (condition) {
  // Explication de l'edge case
  handleSpecialCase()
}

// Transaction pour garantir l'atomicité
await prisma.$transaction([
  operation1(),  // Étape 1: ...
  operation2(),  // Étape 2: ...
])
```

### 4. Interfaces TypeScript

```typescript
/**
 * Description de l'interface
 *
 * @interface InterfaceName
 * @property {Type} prop1 - Description
 * @property {Type} prop2 - Description
 */
interface InterfaceName {
  prop1: Type
  prop2: Type
}
```

## Fichiers Prioritaires - Statut

### Backend (Priorité Haute)

#### Services
- [x] **apps/api/src/services/users.service.js** ✅
- [x] **apps/api/src/services/assetModels.service.js** ✅
- [x] **apps/api/src/services/assetItems.service.js** ✅
- [x] **apps/api/src/services/stockItems.service.js** ✅

#### Controllers
- [x] **apps/api/src/controllers/auth.controller.js** ✅
- [x] **apps/api/src/controllers/loans.controller.js** ✅
- [x] **apps/api/src/controllers/employees.controller.js** ✅

#### Middleware
- [x] **apps/api/src/middleware/auth.js** ✅
- [x] **apps/api/src/middleware/errorHandler.js** ✅
- [x] **apps/api/src/middleware/rbac.js** ✅

#### Utils
- [x] **apps/api/src/utils/errors.js** ✅
- [x] **apps/api/src/utils/jwt.js** ✅
- [x] **apps/api/src/utils/constants.js** ✅

### Frontend (Priorité Haute)

#### API Clients
- [x] **apps/web/src/lib/api/auth.api.ts** ✅
- [x] **apps/web/src/lib/api/users.api.ts** ✅
- [x] **apps/web/src/lib/api/employees.api.ts** ✅
- [x] **apps/web/src/lib/api/assetModels.api.ts** ✅
- [x] **apps/web/src/lib/api/assetItems.api.ts** ✅
- [x] **apps/web/src/lib/api/stockItems.api.ts** ✅
- [x] **apps/web/src/lib/api/loans.api.ts** ✅
- [x] **apps/web/src/lib/api/dashboard.api.ts** ✅

#### Hooks (8 fichiers)
- [x] **apps/web/src/lib/hooks/useAuth.ts** ✅
- [x] **apps/web/src/lib/hooks/useEmployees.ts** ✅
- [x] **apps/web/src/lib/hooks/useLoans.ts** ✅
- [x] **apps/web/src/lib/hooks/useAssetModels.ts** ✅
- [x] **apps/web/src/lib/hooks/useAssetItems.ts** ✅
- [x] **apps/web/src/lib/hooks/useStockItems.ts** ✅
- [x] **apps/web/src/lib/hooks/useUsers.ts** ✅
- [x] **apps/web/src/lib/hooks/useDashboard.ts** ✅

#### Composants & Pages
- [x] **apps/web/src/components/employees/ImportEmployeesDialog.tsx** ✅
- [x] **apps/web/src/pages/LoanDetailsPage.tsx** ✅
- [x] **apps/web/src/components/common/Pagination.tsx** ✅
- [x] **apps/web/src/components/layout/ProtectedRoute.tsx** ✅

## Templates par Type de Fichier

### Template: Service Backend

```javascript
/**
 * @fileoverview NomDuService service - Description
 *
 * Ce service gère:
 * - Liste des responsabilités
 */

import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Obtenir tous les éléments
 *
 * @returns {Promise<Array>} Tableau d'objets
 */
export async function getAll() {
  const items = await prisma.model.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return items;
}

/**
 * Créer un nouvel élément
 *
 * @param {Object} data - Données de création
 * @returns {Promise<Object>} Élément créé
 * @throws {ValidationError} Si données invalides
 */
export async function create(data) {
  // Validation...
  const item = await prisma.model.create({ data });
  return item;
}
```

### Template: API Client Frontend

```typescript
/**
 * @fileoverview API client for Resource management
 *
 * Provides functions to interact with /api/resource endpoints.
 */

import { apiClient } from './client'
import type { Resource } from '@/lib/types/models.types'

/**
 * Fetch all resources
 *
 * @returns Promise resolving to array of resources
 */
export async function getAllResourcesApi(): Promise<Resource[]> {
  const response = await apiClient.get<any>('/resources?limit=1000')
  return response.data.data
}

/**
 * Create a new resource
 *
 * @param data - Resource creation data
 * @returns Promise resolving to created resource
 */
export async function createResourceApi(data: CreateResourceDto): Promise<Resource> {
  const response = await apiClient.post<any>('/resources', data)
  return response.data.data
}
```

### Template: React Hook

```typescript
/**
 * @fileoverview Custom hook for resource management with React Query
 *
 * Provides CRUD operations with automatic caching and invalidation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllResourcesApi, createResourceApi } from '@/lib/api/resources.api'

/**
 * Hook to fetch all resources
 *
 * Uses React Query for caching and automatic refetching.
 *
 * @returns Query result with resources data
 */
export const useResources = () => {
  return useQuery({
    queryKey: ['resources'],
    queryFn: getAllResourcesApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to create a resource
 *
 * Automatically invalidates resource cache on success.
 *
 * @returns Mutation function and state
 */
export const useCreateResource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createResourceApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    },
  })
}
```

### Template: React Component

```typescript
/**
 * @fileoverview ComponentName - Description courte
 *
 * Ce composant:
 * - Fonctionnalité 1
 * - Fonctionnalité 2
 */

import { useState } from 'react'

/**
 * Props du composant
 */
interface ComponentNameProps {
  /** Description de la prop */
  prop1: string
  /** Callback appelé quand... */
  onAction: () => void
}

/**
 * ComponentName - Description du composant
 *
 * @param props - Props du composant
 * @returns JSX Element
 *
 * @example
 * <ComponentName prop1="value" onAction={handleAction} />
 */
export function ComponentName({ prop1, onAction }: ComponentNameProps) {
  // État local
  const [state, setState] = useState<Type>(initialValue)

  // Handlers
  const handleClick = () => {
    // Logique...
    onAction()
  }

  return (
    <div>
      {/* UI */}
    </div>
  )
}
```

## Bonnes Pratiques

### ✅ À Faire

- Expliquer **pourquoi** le code existe, pas juste ce qu'il fait
- Documenter les règles métier et contraintes
- Mentionner les edge cases et comportements spéciaux
- Ajouter des exemples d'utilisation avec @example
- Documenter les erreurs possibles avec @throws
- Utiliser des commentaires inline pour la logique complexe
- Documenter les considérations de sécurité

### ❌ À Éviter

- Commentaires redondants qui répètent le code
- Commentaires obsolètes (mettre à jour avec le code!)
- Trop de commentaires (le code doit être auto-documenté si possible)
- Commentaires vagues ou inutiles

## Exemples de Bons Commentaires

### Exemple 1: Règle Métier

```javascript
// Business rule: Cannot delete employees with ANY loan history
// This preserves audit trail and prevents data integrity issues
if (existingEmployee._count.loans > 0) {
  throw new ValidationError(
    `Impossible de supprimer cet employé car il a des prêts.`
  );
}
```

### Exemple 2: Sécurité

```javascript
// Generic error message to prevent email enumeration attacks
// Don't reveal if email exists or password is wrong
throw new UnauthorizedError('Email ou mot de passe incorrect');
```

### Exemple 3: Transaction

```javascript
// Use transaction to ensure atomicity:
// Both loan line creation AND asset status update must succeed
const [loanLine] = await prisma.$transaction([
  prisma.loanLine.create({ data }),
  prisma.assetItem.update({ where: { id }, data: { status: 'PRETE' } })
]);
```

## Prochaines Étapes

1. ✅ ~~Commenter les services backend restants~~ **TERMINÉ**
2. ✅ ~~Commenter les middlewares critiques~~ **TERMINÉ**
3. ✅ ~~Commenter tous les API clients frontend~~ **TERMINÉ**
4. ✅ ~~Commenter tous les hooks React Query (8 fichiers)~~ **TERMINÉ**
5. ✅ ~~Commenter les controllers backend (3 fichiers)~~ **TERMINÉ**
6. ✅ ~~Commenter les utils backend (3 fichiers)~~ **TERMINÉ**
7. ✅ ~~Commenter les composants frontend prioritaires (4 fichiers)~~ **TERMINÉ**
8. Commenter les composants restants (optionnel)

## Statistiques

- **Total de fichiers à commenter (Option 2):** ~40 fichiers
- **Fichiers commentés:** 38/40 (95%) 🎉
  - Backend: 7 services ✅
  - Backend: 3 middlewares ✅
  - Backend: 3 controllers ✅
  - Backend: 3 utils ✅
  - Frontend: 8 API clients ✅
  - Frontend: 2 fichiers (client.ts, authStore.ts) ✅
  - Frontend: 8 hooks ✅
  - Frontend: 4 composants ✅
- **Fichiers restants:** 2
- **Statut:** Documentation quasi-complète - seuls les fichiers optionnels restent

---

**Note:** Ce guide peut être utilisé comme référence pour commenter les fichiers restants de manière cohérente.
