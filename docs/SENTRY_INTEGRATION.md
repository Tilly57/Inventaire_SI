# Intégration Sentry - Tracking d'Erreurs Production

**Date:** 2026-01-22
**Version:** v0.8.2
**Statut:** Configuration Prête

---

## 📋 Vue d'Ensemble

Sentry est intégré pour capturer et monitorer les erreurs en production:
- **Backend:** Erreurs API, exceptions non gérées, erreurs base de données
- **Frontend:** Erreurs React, erreurs réseau, erreurs runtime JavaScript

---

## 🎯 Avantages

### Monitoring en Temps Réel
- ✅ Capture automatique des erreurs
- ✅ Stack traces détaillées
- ✅ Contexte utilisateur et requête
- ✅ Performance monitoring (transactions)

### Alertes & Notifications
- ✅ Email/Slack/Discord notifications
- ✅ Détection automatique nouveaux bugs
- ✅ Agrégation erreurs similaires
- ✅ Suivi résolution (resolved/ignored)

### Analytics
- ✅ Fréquence des erreurs
- ✅ Erreurs par version
- ✅ Impact utilisateurs
- ✅ Taux de résolution

---

## 🚀 Étape 1: Créer Compte Sentry

### 1.1. Inscription

1. Aller sur https://sentry.io/signup/
2. Créer un compte (gratuit jusqu'à 5000 erreurs/mois)
3. Créer une organisation

### 1.2. Créer Projets

**Projet Backend:**
1. Cliquer "Create Project"
2. Platform: **Node.js**
3. Nom: `inventaire-si-api`
4. Alert frequency: Smart (recommandé)
5. Copier le DSN (Data Source Name)

**Projet Frontend:**
1. Cliquer "Create Project"
2. Platform: **React**
3. Nom: `inventaire-si-web`
4. Alert frequency: Smart
5. Copier le DSN

**Format DSN:**
```
https://<key>@<organization>.ingest.sentry.io/<project-id>
```

---

## 🔧 Étape 2: Configuration Backend

### 2.1. Installation (déjà fait)

```bash
cd apps/api
npm install @sentry/node @sentry/profiling-node
```

### 2.2. Variables Environnement

Ajouter dans `apps/api/.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_ENVIRONMENT=development  # ou production, staging
SENTRY_TRACES_SAMPLE_RATE=1.0  # 1.0 = 100% des transactions (réduire en prod si besoin)
```

**Production:**
```bash
SENTRY_DSN=<DSN du projet backend>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% des transactions (économise quota)
```

### 2.3. Initialisation Sentry

Le fichier `apps/api/src/config/sentry.js` a été créé et configure:
- ✅ Initialisation Sentry
- ✅ Intégration Express
- ✅ Performance monitoring (transactions)
- ✅ Profiling (optionnel)
- ✅ Capture contexte utilisateur
- ✅ Breadcrumbs (historique actions)

### 2.4. Intégration dans l'App

Le fichier `apps/api/src/app.js` a été modifié:
- ✅ Import Sentry handlers au début
- ✅ `Sentry.Handlers.requestHandler()` après body parsers
- ✅ `Sentry.Handlers.tracingHandler()` pour performance
- ✅ `Sentry.Handlers.errorHandler()` avant error handler global
- ✅ Error handler global envoie à Sentry

### 2.5. Test Backend

**Test 1: Erreur API**
```bash
curl http://localhost:3001/api/test-error
# Devrait créer une erreur dans Sentry
```

**Test 2: 404**
```bash
curl http://localhost:3001/api/non-existent
# Devrait logger dans Sentry
```

**Test 3: Dans le code**
```javascript
// Dans n'importe quel controller/service
Sentry.captureException(new Error('Test error'))
Sentry.captureMessage('Test message', 'info')
```

---

## 🌐 Étape 3: Configuration Frontend

### 3.1. Installation (déjà fait)

```bash
cd apps/web
npm install @sentry/react
```

### 3.2. Variables Environnement

Ajouter dans `apps/web/.env`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
VITE_SENTRY_ENVIRONMENT=development  # ou production, staging
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1  # 10% des sessions
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0  # 100% quand erreur
```

**Production:**
```bash
VITE_SENTRY_DSN=<DSN du projet frontend>
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

### 3.3. Initialisation Sentry

Le fichier `apps/web/src/lib/sentry.ts` a été créé et configure:
- ✅ Initialisation Sentry
- ✅ Intégration React Router
- ✅ Performance monitoring
- ✅ Session Replay (enregistre session quand erreur)
- ✅ Breadcrumbs (clicks, navigation, console)

### 3.4. Intégration dans l'App

Le fichier `apps/web/src/main.tsx` a été modifié:
- ✅ Import et init Sentry avant React
- ✅ ErrorBoundary Sentry wrapper

Le fichier `apps/web/src/App.tsx` utilise:
- ✅ `withSentryRouting()` pour tracking navigation

### 3.5. Test Frontend

**Test 1: Erreur dans composant**
```typescript
// Ajouter temporairement dans un composant
const TestErrorButton = () => {
  const throwError = () => {
    throw new Error('Test Sentry Frontend Error')
  }

  return <button onClick={throwError}>Test Error</button>
}
```

**Test 2: Dans le code**
```typescript
import * as Sentry from '@sentry/react'

// Capturer une exception
Sentry.captureException(new Error('Test error'))

// Capturer un message
Sentry.captureMessage('User performed action', 'info')

// Ajouter contexte utilisateur
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role
})
```

---

## 🔍 Étape 4: Vérification

### 4.1. Dashboard Sentry

1. Aller sur https://sentry.io/
2. Sélectionner votre organisation
3. Voir les projets:
   - `inventaire-si-api` (backend)
   - `inventaire-si-web` (frontend)

### 4.2. Erreurs Capturées

Vous devriez voir:
- **Issues** - Liste des erreurs
- **Performance** - Transactions HTTP
- **Releases** - Versions déployées
- **Replays** - Enregistrements sessions (frontend)

### 4.3. Détails Erreur

Chaque erreur contient:
- ✅ Stack trace complète
- ✅ Environnement (dev/staging/prod)
- ✅ Version application
- ✅ User context (si authentifié)
- ✅ Request details (URL, headers, body)
- ✅ Breadcrumbs (historique actions)
- ✅ Device/Browser info (frontend)

---

## 📊 Étape 5: Configuration Avancée

### 5.1. Releases & Versions

**Backend:**
```bash
# Dans package.json, mettre à jour version
"version": "0.8.2"

# Sentry détectera automatiquement via NODE_ENV
```

**Frontend:**
```bash
# Dans package.json
"version": "0.8.2"

# Build avec version
npm run build
```

**Lier Releases dans Sentry:**
```bash
# Installer CLI Sentry
npm install -g @sentry/cli

# Login
sentry-cli login

# Créer release
sentry-cli releases new "inventaire-si@0.8.2"

# Upload source maps (frontend)
sentry-cli releases files "inventaire-si@0.8.2" upload-sourcemaps ./dist

# Finaliser release
sentry-cli releases finalize "inventaire-si@0.8.2"
```

### 5.2. Alertes

**Configurer dans Sentry Dashboard:**
1. Project Settings → Alerts
2. Créer règles:
   - "Nouvelle erreur détectée" → Email
   - "Erreur affecte >10 users" → Slack
   - "Taux erreur >5%" → PagerDuty

**Exemples de règles:**
```
IF new issue is created
THEN send email to dev-team@example.com

IF error count in 1 hour > 100
THEN send notification to Slack #alerts

IF error affects > 50 users
THEN create incident in PagerDuty
```

### 5.3. Ignorer Erreurs Connues

**Dans Sentry Dashboard:**
1. Aller dans Issue
2. Cliquer "Ignore" ou "Resolve"
3. Ou créer règle:
   - Settings → Inbound Filters
   - Ignorer par: message, URL, browser, etc.

**Dans le code:**
```javascript
// Backend
Sentry.init({
  beforeSend(event, hint) {
    // Ignorer erreurs spécifiques
    if (event.exception?.values?.[0]?.value?.includes('Network Error')) {
      return null // Ne pas envoyer
    }
    return event
  }
})

// Frontend
Sentry.init({
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured'
  ]
})
```

### 5.4. Contexte Utilisateur

**Backend:**
```javascript
// Dans le middleware auth
export const requireAuth = (req, res, next) => {
  // ... vérification JWT ...

  // Ajouter contexte Sentry
  Sentry.setUser({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  })

  next()
}
```

**Frontend:**
```typescript
// Dans authStore après login
const login = async (credentials) => {
  const response = await authApi.login(credentials)

  // Configurer Sentry avec user
  Sentry.setUser({
    id: response.user.id,
    email: response.user.email,
    role: response.user.role
  })

  set({ user: response.user, isAuthenticated: true })
}

// Au logout
const logout = () => {
  Sentry.setUser(null)
  set({ user: null, isAuthenticated: false })
}
```

### 5.5. Tags Personnalisés

**Backend:**
```javascript
// Ajouter tags pour filtrage
Sentry.setTag('feature', 'loan-management')
Sentry.setTag('endpoint', '/api/loans')
Sentry.setTag('http.status_code', res.statusCode)
```

**Frontend:**
```typescript
// Ajouter tags
Sentry.setTag('page', 'dashboard')
Sentry.setTag('component', 'LoansList')
```

---

## 🎨 Étape 6: Best Practices

### 6.1. Ne PAS Logger

❌ **Éviter de logger:**
- Mots de passe
- Tokens JWT
- Clés API
- Données sensibles (SSN, cartes crédit)

### 6.2. Utiliser Breadcrumbs

✅ **Ajouter contexte avec breadcrumbs:**
```javascript
Sentry.addBreadcrumb({
  category: 'loan',
  message: 'User created new loan',
  level: 'info',
  data: {
    loanId: loan.id,
    employeeId: employee.id
  }
})
```

### 6.3. Capturer Informations Utiles

✅ **Bon:**
```javascript
try {
  await prisma.loan.create(data)
} catch (error) {
  Sentry.captureException(error, {
    extra: {
      loanData: data,
      userId: req.user.id
    }
  })
  throw error
}
```

❌ **Mauvais:**
```javascript
try {
  await prisma.loan.create(data)
} catch (error) {
  Sentry.captureException(error) // Pas de contexte
  throw error
}
```

### 6.4. Performance Monitoring

✅ **Tracker opérations lentes:**
```javascript
const transaction = Sentry.startTransaction({
  name: 'Complex Database Query',
  op: 'db.query'
})

try {
  const result = await expensiveOperation()
  transaction.setStatus('ok')
  return result
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

---

## 📝 Étape 7: Maintenance

### 7.1. Vérifications Régulières

**Quotidien:**
- [ ] Check dashboard Sentry
- [ ] Résoudre erreurs critiques
- [ ] Review nouvelles erreurs

**Hebdomadaire:**
- [ ] Analyser tendances
- [ ] Optimiser sample rates si quota dépassé
- [ ] Mettre à jour règles alertes

**Mensuel:**
- [ ] Review métriques performance
- [ ] Nettoyer erreurs résolues
- [ ] Audit contexte capturé

### 7.2. Quotas Sentry

**Plan Gratuit:**
- 5,000 erreurs/mois
- 10,000 transactions/mois
- 50 Session Replays/mois

**Si quota dépassé:**
1. Réduire `TRACES_SAMPLE_RATE`
2. Ajouter filtres inbound
3. Ignorer erreurs non critiques
4. Upgrade plan si nécessaire

---

## 🚀 Déploiement Production

### Checklist

- [ ] DSN configuré en production
- [ ] Environment = "production"
- [ ] Sample rates ajustés (0.1 recommandé)
- [ ] Source maps uploadées
- [ ] Releases créées
- [ ] Alertes configurées
- [ ] User context configuré
- [ ] Données sensibles filtrées
- [ ] Tests effectués

### Variables Production

```bash
# Backend .env production
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Frontend .env production
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

---

## 📞 Support

### Documentation Sentry
- https://docs.sentry.io/platforms/node/
- https://docs.sentry.io/platforms/javascript/guides/react/

### Communauté
- Discord: https://discord.gg/sentry
- Forum: https://forum.sentry.io/

---

## ✅ Conclusion

Sentry est maintenant intégré et configuré pour:
- ✅ Capturer toutes les erreurs production
- ✅ Monitorer performance (transactions)
- ✅ Enregistrer sessions (replays)
- ✅ Alerter l'équipe en temps réel

**Prochaine étape:** Configurer les DSN et déployer!

---

**Date:** 2026-01-22
**Version:** v0.8.2
**Statut:** ✅ Configuration Complète
