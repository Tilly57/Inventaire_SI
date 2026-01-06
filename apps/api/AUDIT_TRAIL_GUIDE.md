# 📊 Guide d'Utilisation - Audit Trail

## Vue d'ensemble

L'audit trail enregistre automatiquement toutes les modifications apportées aux données du système, permettant une traçabilité complète des actions effectuées par les utilisateurs.

---

## 🎯 Ce qui est enregistré

Pour chaque action (CREATE, UPDATE, DELETE), le système enregistre :

- ✅ **Action effectuée** (CREATE, UPDATE, DELETE)
- ✅ **Table/Modèle concerné** (Employee, Loan, AssetItem, etc.)
- ✅ **ID de l'enregistrement**
- ✅ **Utilisateur** qui a effectué l'action
- ✅ **Date et heure** de l'action
- ✅ **Valeurs avant/après** (pour les UPDATE)
- ✅ **Adresse IP** de l'utilisateur
- ✅ **User-Agent** du navigateur

---

## 📝 Utilisation dans le Code

### 1. Importer les utilitaires

```javascript
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog.js';
```

### 2. Enregistrer une action

#### Exemple : Création d'un employé

```javascript
import { createAuditLog } from '../utils/auditLog.js';

export async function createEmployee(data, req) {
  const employee = await prisma.employee.create({ data });

  // Enregistrer dans l'audit log
  await createAuditLog({
    userId: req.user.id,
    action: 'CREATE',
    tableName: 'Employee',
    recordId: employee.id,
    newValues: employee,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });

  return employee;
}
```

#### Exemple : Modification d'un prêt

```javascript
export async function updateLoan(loanId, updateData, req) {
  // Récupérer l'ancienne version
  const oldLoan = await prisma.loan.findUnique({ where: { id: loanId } });

  // Mettre à jour
  const newLoan = await prisma.loan.update({
    where: { id: loanId },
    data: updateData
  });

  // Enregistrer dans l'audit log
  await createAuditLog({
    userId: req.user.id,
    action: 'UPDATE',
    tableName: 'Loan',
    recordId: loanId,
    oldValues: oldLoan,
    newValues: newLoan,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });

  return newLoan;
}
```

#### Exemple : Suppression (soft delete)

```javascript
export async function deleteLoan(loanId, req) {
  // Récupérer l'ancienne version
  const loan = await prisma.loan.findUnique({ where: { id: loanId } });

  // Soft delete
  await prisma.loan.update({
    where: { id: loanId },
    data: { deletedAt: new Date(), deletedById: req.user.id }
  });

  // Enregistrer dans l'audit log
  await createAuditLog({
    userId: req.user.id,
    action: 'DELETE',
    tableName: 'Loan',
    recordId: loanId,
    oldValues: loan,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });
}
```

---

## 🔍 Consulter les Logs d'Audit

### Via l'API (Authentification requise - ADMIN uniquement)

#### 1. Récupérer tous les logs récents

```bash
GET /api/audit-logs?limit=50
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "action": "UPDATE",
      "tableName": "Employee",
      "recordId": "...",
      "oldValues": { "dept": "IT" },
      "newValues": { "dept": "HR" },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-01-06T08:37:35.000Z",
      "user": {
        "email": "admin@inventaire.local",
        "role": "ADMIN"
      }
    }
  ]
}
```

#### 2. Logs pour un enregistrement spécifique

```bash
GET /api/audit-logs?tableName=Employee&recordId=cmjtr6p3y0000dfqk6m70wvn4
```

ou

```bash
GET /api/audit-logs/Employee/cmjtr6p3y0000dfqk6m70wvn4
```

#### 3. Logs d'un utilisateur spécifique

```bash
GET /api/audit-logs?userId=cmjtr02wf0000dfh4me0kpbky
```

---

### Via les Scripts de Démonstration

#### Générer des logs de démonstration

```bash
cd apps/api
node demo-audit.js
```

#### Afficher les logs

```bash
cd apps/api
node show-audit-logs.js
```

---

### Via le Composant React (Frontend)

```typescript
import { AuditTrail } from '@/components/common/AuditTrail';

// Dans votre composant
<AuditTrail
  tableName="Employee"
  recordId={employee.id}
  limit={20}
/>
```

Le composant affiche automatiquement :
- ✅ Timeline visuelle des modifications
- ✅ Détails des changements (avant → après)
- ✅ Utilisateur qui a effectué l'action
- ✅ Date et heure formatées
- ✅ Adresse IP et User-Agent

---

## 📊 Intégration dans les Services

### Services à intégrer (TODO)

Pour activer l'enregistrement automatique dans les services :

1. **employees.service.js**
   - [ ] createEmployee
   - [ ] updateEmployee
   - [ ] deleteEmployee

2. **loans.service.js**
   - [ ] createLoan
   - [ ] addLoanLine
   - [ ] updateLoanSignature
   - [ ] closeLoan
   - [ ] softDeleteLoan

3. **assetItems.service.js**
   - [ ] createAssetItem
   - [ ] updateAssetItem
   - [ ] updateAssetItemStatus

4. **stockItems.service.js**
   - [ ] createStockItem
   - [ ] updateStockItem
   - [ ] adjustStockQuantity

5. **users.service.js**
   - [ ] createUser
   - [ ] updateUser
   - [ ] deleteUser

---

## 🔐 Sécurité

### Contrôle d'Accès

- ✅ Consultation des logs : **ADMIN uniquement**
- ✅ Création automatique : Tous les utilisateurs authentifiés
- ✅ Les logs ne peuvent **jamais être modifiés ou supprimés**

### Données Sensibles

⚠️ **Attention** : L'audit trail enregistre les valeurs complètes des enregistrements.

**Ne jamais enregistrer :**
- ❌ Mots de passe (même hashés)
- ❌ Tokens d'authentification
- ❌ Secrets API

**Exemple de filtrage :**

```javascript
await createAuditLog({
  userId: req.user.id,
  action: 'UPDATE',
  tableName: 'User',
  recordId: user.id,
  oldValues: {
    email: oldUser.email,
    role: oldUser.role
    // Ne PAS inclure passwordHash
  },
  newValues: {
    email: newUser.email,
    role: newUser.role
  }
});
```

---

## 📈 Performance

### Indexes Créés

Le modèle AuditLog inclut automatiquement des indexes pour optimiser les requêtes :

```prisma
@@index([tableName, recordId])  // Recherche par enregistrement
@@index([userId])                // Recherche par utilisateur
@@index([createdAt])             // Tri chronologique
```

### Bonnes Pratiques

1. ✅ Utiliser `createAuditLog` de manière asynchrone (ne bloque pas la requête)
2. ✅ Limiter la taille des `oldValues` et `newValues` (ne pas inclure relations profondes)
3. ✅ Nettoyer les logs anciens périodiquement (recommandé : garder 1 an)
4. ✅ Monitorer la taille de la table AuditLog

### Nettoyage Automatique (Optionnel)

```sql
-- Supprimer les logs de plus de 1 an
DELETE FROM "AuditLog"
WHERE "createdAt" < NOW() - INTERVAL '1 year';
```

---

## 🧪 Tests

### Test Manuel

```bash
# 1. Générer des logs de test
node apps/api/demo-audit.js

# 2. Afficher les logs
node apps/api/show-audit-logs.js

# 3. Tester l'API (avec authentification)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/audit-logs
```

### Test via Interface Web

1. Connectez-vous sur http://localhost:8080
2. Effectuez des modifications (créer/modifier un employé)
3. Les logs seront automatiquement créés
4. Consultez-les via l'API ou le composant `<AuditTrail>`

---

## 📚 Référence API

### createAuditLog(params)

Crée un log d'audit.

**Paramètres :**
- `userId` (string, requis) - ID de l'utilisateur
- `action` (string, requis) - CREATE | UPDATE | DELETE
- `tableName` (string, requis) - Nom de la table/modèle
- `recordId` (string, requis) - ID de l'enregistrement
- `oldValues` (object, optionnel) - Valeurs avant modification
- `newValues` (object, optionnel) - Nouvelles valeurs
- `ipAddress` (string, optionnel) - Adresse IP
- `userAgent` (string, optionnel) - User-Agent du navigateur

**Retour :** `Promise<void>`

---

### getAuditLogs(tableName, recordId, limit)

Récupère les logs pour un enregistrement spécifique.

**Paramètres :**
- `tableName` (string) - Nom de la table
- `recordId` (string) - ID de l'enregistrement
- `limit` (number, défaut: 50) - Nombre max de logs

**Retour :** `Promise<AuditLog[]>`

---

### getUserAuditLogs(userId, limit)

Récupère les logs d'un utilisateur spécifique.

**Paramètres :**
- `userId` (string) - ID de l'utilisateur
- `limit` (number, défaut: 100) - Nombre max de logs

**Retour :** `Promise<AuditLog[]>`

---

### getRecentAuditLogs(limit)

Récupère les logs les plus récents.

**Paramètres :**
- `limit` (number, défaut: 100) - Nombre max de logs

**Retour :** `Promise<AuditLog[]>`

---

## 🎓 Exemples Complets

Voir les fichiers de démonstration :
- `apps/api/demo-audit.js` - Génération de logs de test
- `apps/api/show-audit-logs.js` - Consultation des logs
- `apps/web/src/components/common/AuditTrail.tsx` - Composant React

---

## ✅ Checklist d'Intégration

Pour chaque service qui modifie des données :

- [ ] Importer `createAuditLog`, `getIpAddress`, `getUserAgent`
- [ ] Ajouter le paramètre `req` aux fonctions
- [ ] Récupérer les anciennes valeurs (pour UPDATE/DELETE)
- [ ] Appeler `createAuditLog` après modification
- [ ] Gérer les erreurs (ne pas bloquer si audit échoue)
- [ ] Tester la création des logs
- [ ] Vérifier que les données sensibles ne sont pas enregistrées

---

**Version :** v0.7.1
**Dernière mise à jour :** 2026-01-06
