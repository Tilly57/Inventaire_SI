# Protection CSRF - Guide d'Utilisation

## Vue d'ensemble

Le système implémente une protection CSRF (Cross-Site Request Forgery) pour toutes les opérations qui modifient l'état (POST, PUT, PATCH, DELETE).

### Stratégie

- **Pattern:** Double Submit Cookie
- **Token:** 256-bit aléatoire (64 caractères hexadécimaux)
- **Durée de vie:** 24 heures
- **SameSite:** Strict
- **Méthodes protégées:** POST, PUT, PATCH, DELETE
- **Méthodes exemptées:** GET, HEAD, OPTIONS

## Routes Exemptées

Les routes suivantes ne nécessitent PAS de token CSRF:

- `/api/auth/login` - Authentification
- `/api/auth/register` - Inscription
- `/api/health` - Health checks
- `/api/metrics` - Métriques Prometheus
- `/api-docs` - Documentation Swagger

## Utilisation Frontend

### 1. Obtenir le Token CSRF

**Option A: Automatique au chargement de l'application**

```javascript
// Au démarrage de l'application
async function initApp() {
  try {
    const response = await fetch('http://localhost:3001/api/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();

    // Le token est maintenant dans un cookie 'XSRF-TOKEN'
    // Et retourné dans la réponse pour usage immédiat
    console.log('CSRF Token obtenu:', data.csrfToken);
  } catch (error) {
    console.error('Erreur obtention token CSRF:', error);
  }
}
```

**Option B: Lire depuis le cookie**

```javascript
// Fonction pour extraire le token du cookie
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : null;
}

const csrfToken = getCsrfTokenFromCookie();
```

### 2. Envoyer le Token dans les Requêtes

**Avec Fetch API:**

```javascript
const csrfToken = getCsrfTokenFromCookie();

fetch('http://localhost:3001/api/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': csrfToken  // Token CSRF requis
  },
  credentials: 'include',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  })
});
```

**Avec Axios (Configuration Globale):**

```javascript
import axios from 'axios';

// Fonction pour obtenir le token du cookie
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : null;
}

// Configuration globale Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true
});

// Intercepteur pour ajouter automatiquement le token CSRF
apiClient.interceptors.request.use(config => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

// Utilisation
apiClient.post('/api/employees', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
});
```

**Configuration dans le Client API Existant:**

Si vous utilisez déjà `apps/web/src/lib/api/client.ts`, ajoutez:

```typescript
// apps/web/src/lib/api/client.ts

import axios from 'axios';

// Fonction utilitaire
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : null;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// Intercepteur requêtes - Ajouter token CSRF
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter access token JWT
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ajouter token CSRF pour méthodes non-safe
    const nonSafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (config.method && nonSafeMethods.includes(config.method.toUpperCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);
```

### 3. Initialisation au Démarrage

**Dans votre App.tsx ou main.tsx:**

```typescript
// apps/web/src/App.tsx

import { useEffect } from 'react';
import { apiClient } from './lib/api/client';

function App() {
  useEffect(() => {
    // Obtenir le token CSRF au démarrage
    const initCsrf = async () => {
      try {
        await apiClient.get('/api/csrf-token');
        console.log('CSRF protection initialized');
      } catch (error) {
        console.error('Failed to initialize CSRF protection:', error);
      }
    };

    initCsrf();
  }, []);

  return (
    // Votre application
  );
}
```

## Gestion des Erreurs

### Erreur 401: Token Manquant

```json
{
  "success": false,
  "error": "CSRF token missing"
}
```

**Solution:** Assurez-vous d'inclure le header `X-XSRF-TOKEN` dans votre requête.

### Erreur 401: Validation Échouée

```json
{
  "success": false,
  "error": "CSRF token validation failed"
}
```

**Solutions possibles:**
1. Le token a expiré (24h) - Récupérer un nouveau token
2. Le token du cookie ne correspond pas au token du header
3. Le cookie a été supprimé - Récupérer un nouveau token

**Code de retry automatique:**

```javascript
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 &&
        error.response?.data?.error?.includes('CSRF')) {
      // Récupérer un nouveau token CSRF
      await apiClient.get('/api/csrf-token');

      // Retry la requête originale
      return apiClient.request(error.config);
    }

    return Promise.reject(error);
  }
);
```

## Test de la Protection

### Test avec cURL

**1. Obtenir le token:**

```bash
curl -v -X GET http://localhost:3001/api/csrf-token \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt
```

**2. Utiliser le token (extraire du fichier cookies.txt):**

```bash
curl -X POST http://localhost:3001/api/employees \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: <token-from-cookie>" \
  --cookie cookies.txt \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'
```

### Test avec Postman

1. **GET** `http://localhost:3001/api/csrf-token`
   - Le token sera automatiquement stocké dans un cookie

2. Dans vos requêtes POST/PUT/DELETE:
   - Aller dans l'onglet "Headers"
   - Ajouter: `X-XSRF-TOKEN` = `{{XSRF-TOKEN}}`
   - Postman lira automatiquement la valeur du cookie

## Sécurité Complémentaire

La protection CSRF fonctionne en synergie avec:

1. **CORS Restreint** - Seules les origines autorisées peuvent faire des requêtes
2. **SameSite Cookies** - Les cookies ne sont pas envoyés lors de requêtes cross-site
3. **HTTPS** - En production, les cookies sont marqués `Secure`
4. **JWT Access Tokens** - Les tokens d'accès sont en mémoire, pas dans les cookies

## Notes de Production

### Configuration Recommandée

```javascript
// Production environment variables
CORS_ORIGIN=https://votre-domaine.com
NODE_ENV=production
```

### Cookies en Production

Les cookies CSRF seront automatiquement configurés avec:
- `Secure: true` (HTTPS uniquement)
- `SameSite: strict`
- `Domain: votre-domaine.com`

### Monitoring

Les tentatives de CSRF bloquées sont loggées:

```
[WARN] CSRF blocked request from origin: https://malicious-site.com
```

Surveillez ces logs dans Grafana/Loki pour détecter des tentatives d'attaque.

## FAQ

### Q: Dois-je envoyer le token CSRF pour les requêtes GET?

**R:** Non, les requêtes GET/HEAD/OPTIONS sont exemptées car elles ne modifient pas l'état.

### Q: Le token expire-t-il?

**R:** Oui, après 24 heures. Le frontend devrait automatiquement récupérer un nouveau token.

### Q: Que se passe-t-il si j'oublie le token?

**R:** L'API retournera une erreur 401 avec le message "CSRF token missing".

### Q: Puis-je désactiver CSRF pour certaines routes?

**R:** Oui, ajoutez la route dans `EXEMPT_ROUTES` dans `apps/api/src/middleware/csrf.js`.

### Q: CSRF fonctionne-t-il avec les API externes?

**R:** Le CSRF protège contre les attaques cross-site. Pour les API server-to-server, CSRF n'est pas nécessaire (pas de cookies utilisateur).

## Ressources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
