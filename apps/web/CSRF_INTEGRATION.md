# Intégration CSRF Frontend - Guide de Migration

## Vue d'ensemble

Le frontend a été mis à jour pour supporter la protection CSRF (Cross-Site Request Forgery) implémentée dans le backend.

### Changements Apportés

**Date:** 2026-01-22
**Version:** v0.8.1
**Impact:** Automatique - Aucune modification requise dans le code applicatif

---

## 📋 Fichiers Modifiés

### 1. `apps/web/src/lib/api/client.ts`

**Nouvelles fonctions ajoutées:**

```typescript
/**
 * Get CSRF token from cookie
 */
export const getCsrfToken = (): string | null

/**
 * Initialize CSRF protection
 */
export const initializeCsrf = async (): Promise<void>
```

**Intercepteurs mis à jour:**

- **Request Interceptor:** Ajoute automatiquement le header `X-XSRF-TOKEN` pour toutes les mutations (POST, PUT, PATCH, DELETE)
- **Response Interceptor:** Gère les erreurs CSRF 401 avec retry automatique

### 2. `apps/web/src/components/common/AppInitializer.tsx` ✨ NOUVEAU

Composant wrapper qui initialise CSRF au démarrage de l'application.

### 3. `apps/web/src/App.tsx`

Wrapper avec `AppInitializer` pour initialisation automatique au démarrage.

---

## 🔄 Comment Ça Fonctionne

### 1. Au Démarrage de l'Application

```typescript
// AppInitializer.tsx
useEffect(() => {
  // 1. Appelle GET /api/csrf-token
  await initializeCsrf()

  // 2. Le backend retourne le token et le stocke dans un cookie 'XSRF-TOKEN'
  // 3. L'application est maintenant protégée
}, [])
```

### 2. Lors d'une Mutation (POST/PUT/PATCH/DELETE)

```typescript
// Exemple: Créer un employé
const response = await apiClient.post('/employees', employeeData)

// Automatiquement, l'intercepteur:
// 1. Lit le token du cookie via getCsrfToken()
// 2. Ajoute le header: X-XSRF-TOKEN: <token>
// 3. Envoie la requête avec le token
```

### 3. En Cas d'Erreur CSRF

```typescript
// Si le token a expiré (24h) ou est invalide:
// 1. Backend retourne 401 avec message "CSRF token ..."
// 2. Intercepteur détecte l'erreur CSRF
// 3. Réinitialise le token via initializeCsrf()
// 4. Retry automatique de la requête originale
```

---

## ✅ Avantages de l'Implémentation

### 1. Transparent pour les Développeurs

```typescript
// AVANT et APRÈS - IDENTIQUE
const createEmployee = async (data) => {
  return await apiClient.post('/employees', data)
}

// Pas besoin de gérer manuellement le token CSRF !
```

### 2. Protection Automatique

- ✅ Toutes les mutations sont automatiquement protégées
- ✅ Pas de code supplémentaire dans les composants
- ✅ Pas de hooks custom nécessaires
- ✅ Retry automatique en cas d'expiration

### 3. Sécurité Renforcée

- ✅ Double Submit Cookie Pattern
- ✅ Token 256-bit aléatoire
- ✅ Expiration 24h
- ✅ SameSite=Strict

---

## 🧪 Tests

### Tester l'Initialisation

```typescript
// Dans la console navigateur après chargement de l'app
document.cookie.match(/XSRF-TOKEN=([^;]+)/)
// Devrait retourner un token de 64 caractères
```

### Tester une Mutation

```typescript
// Dans DevTools > Network
// Chercher une requête POST/PUT/PATCH/DELETE
// Vérifier les headers:
// - X-XSRF-TOKEN: <64-char-token>
```

### Tester le Retry Automatique

```typescript
// 1. Supprimer manuellement le cookie XSRF-TOKEN
document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

// 2. Faire une mutation (par exemple créer un employé)
// 3. Observer dans Network:
//    - Première requête POST: 401 CSRF error
//    - GET /api/csrf-token: 200 OK
//    - Retry POST: 200 OK (succès)
```

---

## 🔍 Debugging

### Vérifier si CSRF est Initialisé

```typescript
// Dans la console navigateur
import { getCsrfToken } from '@/lib/api/client'

const token = getCsrfToken()
console.log('CSRF Token:', token)
// Devrait afficher le token ou null
```

### Logs Console

Lors du développement, vous verrez:

```
[CSRF] Token initialized successfully
```

En cas d'erreur:

```
[CSRF] Failed to initialize token: <error>
[CSRF] Token validation failed, reinitializing...
```

### Erreurs Possibles

**1. Cookie non défini:**
```
CSRF Token: null
```
**Solution:** Vérifier que le backend est démarré et accessible

**2. 401 sur mutations:**
```
Error: CSRF token missing
```
**Solution:** Vérifier que AppInitializer est correctement wrappé dans App.tsx

**3. Token invalide:**
```
Error: CSRF token validation failed
```
**Solution:** Le retry automatique devrait résoudre le problème

---

## 🚀 Migration pour Code Existant

### Aucune Migration Requise! ✅

Le code applicatif existant fonctionne sans modification car:

1. **Initialisation automatique** via AppInitializer
2. **Injection automatique** du token via intercepteur request
3. **Retry automatique** via intercepteur response

### Composants Existants

```typescript
// AVANT (fonctionnait)
const { mutate } = useMutation({
  mutationFn: (data) => apiClient.post('/employees', data)
})

// APRÈS (fonctionne toujours exactement pareil)
const { mutate } = useMutation({
  mutationFn: (data) => apiClient.post('/employees', data)
})

// Rien à changer !
```

### Hooks Custom Existants

Tous les hooks custom (`useEmployees`, `useAssetItems`, etc.) continuent de fonctionner sans modification.

---

## 📊 Flowchart CSRF

```
┌─────────────────────────────────────────────────────────────┐
│                    App Startup                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│              AppInitializer (useEffect)                      │
│                                                              │
│  1. Call GET /api/csrf-token                                │
│  2. Backend sets cookie: XSRF-TOKEN=<64-char-token>         │
│  3. App continues loading                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│                User Interaction                              │
│                                                              │
│  User clicks "Create Employee" button                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│            Component calls API                               │
│                                                              │
│  apiClient.post('/employees', data)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│         Request Interceptor (automatic)                      │
│                                                              │
│  1. getCsrfToken() reads cookie                             │
│  2. Adds header: X-XSRF-TOKEN: <token>                      │
│  3. Adds header: Authorization: Bearer <jwt>                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────┐
│                Backend Validation                            │
│                                                              │
│  ✓ CORS check (origin allowed)                             │
│  ✓ JWT authentication                                       │
│  ✓ CSRF token validation                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           v                       v
    ┌───────────┐          ┌──────────────┐
    │  Success  │          │  401 Error   │
    │  200 OK   │          │  CSRF fail   │
    └───────────┘          └──────┬───────┘
                                  │
                                  v
              ┌──────────────────────────────────┐
              │   Response Interceptor           │
              │                                  │
              │  1. Detect CSRF error           │
              │  2. initializeCsrf()            │
              │  3. Retry request               │
              └──────────┬───────────────────────┘
                         │
                         v
                  ┌─────────────┐
                  │   Success   │
                  │   200 OK    │
                  └─────────────┘
```

---

## 📝 Checklist Déploiement

### Développement
- [x] CSRF initialisé dans App.tsx
- [x] Intercepteurs configurés dans client.ts
- [x] AppInitializer créé
- [ ] Tests manuels effectués
- [ ] Console logs vérifiés

### Staging
- [ ] Backend CSRF activé
- [ ] Frontend déployé avec modifications
- [ ] Tests E2E mutations
- [ ] Vérifier cookies HTTPS (Secure flag)

### Production
- [ ] Variables environnement configurées
- [ ] HTTPS activé (requis pour cookies Secure)
- [ ] CORS configuré pour domaine production
- [ ] Monitoring logs CSRF

---

## 🛠️ Troubleshooting

### Problème: Cookie XSRF-TOKEN non défini

**Diagnostic:**
```typescript
console.log(document.cookie)
// Ne contient pas XSRF-TOKEN
```

**Solutions:**
1. Vérifier que le backend est démarré
2. Vérifier que `/api/csrf-token` retourne 200
3. Vérifier dans DevTools > Application > Cookies

### Problème: 401 CSRF token missing sur toutes les mutations

**Diagnostic:**
```typescript
// Dans Network, vérifier les headers de la requête
// Manque: X-XSRF-TOKEN
```

**Solutions:**
1. Vérifier que `getCsrfToken()` retourne un token
2. Vérifier que l'intercepteur request est actif
3. Redémarrer l'application

### Problème: CSRF fonctionne en dev mais pas en production

**Diagnostic:**
```
Cookies marqués 'Secure' ne fonctionnent pas en HTTP
```

**Solutions:**
1. **CRITIQUE:** Activer HTTPS en production
2. Les cookies CSRF sont marqués `Secure: true` en production
3. HTTPS est OBLIGATOIRE pour la sécurité

---

## 🔗 Ressources

- **Guide Backend CSRF:** `docs/CSRF_PROTECTION.md`
- **Rapport Sécurité:** `SECURITY_FIXES_2026-01-22.md`
- **Audit Complet:** `AUDIT_COMPLET_2026-01-22.md`

---

## ✅ Conclusion

L'intégration CSRF est **transparente et automatique** pour les développeurs.

**Aucune modification requise dans le code applicatif existant.**

Tous les composants, hooks et API calls continuent de fonctionner exactement comme avant, avec une protection de sécurité renforcée.

**Prochaine étape:** Tests manuels et déploiement en staging.
