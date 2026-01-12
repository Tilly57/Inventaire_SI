# Synchronisation Base de Données : Production → Docker

Ce guide explique comment synchroniser la base de données de production (locale) vers l'environnement Docker.

## 📋 Contexte

Vous avez deux instances de base de données :
- **Production locale** : PostgreSQL sur `localhost:5432` (celle utilisée actuellement par l'API)
- **Docker** : PostgreSQL dans conteneur Docker (à synchroniser)

## 🎯 Objectif

Garantir que la base Docker contienne exactement les mêmes données que la base de production locale.

## 🔄 Processus de Synchronisation

### Étape 1 : Créer un Backup de la Production

Un backup a déjà été créé automatiquement :
```
backups/database/inventaire_production_20260106_164635.dump
```

Pour créer un nouveau backup manuel :
```bash
# Windows (PowerShell)
$env:PGPASSWORD="inventaire_pwd"
pg_dump -h localhost -p 5432 -U inventaire -F c -b -v `
  -f "backups/database/inventaire_production_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump" inventaire

# Linux/Mac
PGPASSWORD=inventaire_pwd pg_dump -h localhost -p 5432 -U inventaire -F c -b -v \
  -f "backups/database/inventaire_production_$(date +%Y%m%d_%H%M%S).dump" inventaire
```

### Étape 2 : Restaurer vers Docker

#### Option A : Script Automatique (Recommandé)

**Windows (Batch)** :
```cmd
cd scripts\backups
restore-to-docker.bat
```

**Windows (PowerShell)** :
```powershell
cd scripts\backups
.\restore-to-docker.ps1
```

Le script va automatiquement :
1. ✅ Vérifier que Docker est lancé
2. ✅ Trouver le backup le plus récent
3. ✅ Demander confirmation
4. ✅ Arrêter les conteneurs
5. ✅ Restaurer la base de données
6. ✅ Nettoyer les fichiers temporaires

#### Option B : Restauration Manuelle

Si vous préférez la méthode manuelle :

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Démarrer uniquement la base de données
docker-compose up -d db

# 3. Attendre que PostgreSQL soit prêt (15-20 secondes)
# Windows: timeout /t 15
# Linux/Mac: sleep 15

# 4. Recréer la base de données
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "DROP DATABASE IF EXISTS inventaire;"
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "CREATE DATABASE inventaire OWNER inventaire;"

# 5. Copier le backup dans le conteneur
docker cp backups/database/inventaire_production_20260106_164635.dump inventaire_si-db-1:/tmp/restore.dump

# 6. Restaurer le backup
docker exec inventaire_si-db-1 pg_restore -U inventaire -d inventaire -v /tmp/restore.dump

# 7. Nettoyer
docker exec inventaire_si-db-1 rm /tmp/restore.dump

# 8. Démarrer tous les services
docker-compose up -d
```

### Étape 3 : Vérifier la Restauration

```bash
# Se connecter à la base Docker
docker exec -it inventaire_si-db-1 psql -U inventaire inventaire

# Vérifier le nombre d'enregistrements
inventaire=# SELECT COUNT(*) FROM "Employee";
inventaire=# SELECT COUNT(*) FROM "AssetItem";
inventaire=# SELECT COUNT(*) FROM "User";
inventaire=# \q
```

## 📊 Contenu de la Base Actuelle

Le backup contient les tables suivantes (avec données) :
- ✅ `AssetItem` - Articles d'équipement
- ✅ `AssetModel` - Modèles d'équipements
- ✅ `AuditLog` - Journaux d'audit
- ✅ `Employee` - Employés
- ✅ `EquipmentType` - Types d'équipements
- ✅ `Loan` - Prêts
- ✅ `LoanLine` - Lignes de prêts
- ✅ `StockItem` - Articles de stock
- ✅ `User` - Utilisateurs
- ✅ `_prisma_migrations` - Historique migrations

Plus les fonctionnalités avancées :
- ✅ Full-Text Search (colonnes `searchVector` + indexes GIN)
- ✅ Vue matérialisée `dashboard_stats`
- ✅ Indexes de performance

## ⚠️ Points d'Attention

### Mot de Passe PostgreSQL

Le mot de passe par défaut est `inventaire_pwd`. Si vous l'avez changé :
- Mettez à jour `secrets/db_password.txt`
- Mettez à jour le `DATABASE_URL` dans `.env`

### Volumes Docker

La base Docker est stockée dans un volume nommé. Pour un reset complet :
```bash
docker-compose down -v  # ⚠️ SUPPRIME TOUTES LES DONNÉES !
docker-compose up -d
# Puis restaurer le backup
```

### Migration après Restauration

Si vous avez des migrations Prisma non appliquées après la restauration :
```bash
cd apps/api
npx prisma migrate deploy
```

## 🔄 Workflow de Développement Recommandé

### Mode 1 : Développement Local (Actuel)
```bash
# Base PostgreSQL locale (localhost:5432)
cd apps/api
npm run dev

cd apps/web
npm run dev
```

**Avantages** :
- ✅ Démarrage rapide
- ✅ Pas de dépendance Docker
- ✅ Hot reload optimal

### Mode 2 : Développement Docker (Production-like)
```bash
# Tout dans Docker
docker-compose up -d

# Ou seulement la base en Docker, API/Frontend en local
docker-compose up -d db
cd apps/api && npm run dev
cd apps/web && npm run dev
```

**Avantages** :
- ✅ Environnement identique à la production
- ✅ Isolation complète
- ✅ Monitoring (Grafana, Prometheus, Loki)

## 📝 Automatisation

### Backup Automatique Quotidien

Le système de backup automatique existant (`backup-auto-daily.bat`) crée déjà des backups quotidiens à 2h00.

Pour ajouter une synchronisation automatique vers Docker (optionnel) :

1. Créer un nouveau script `sync-to-docker-daily.bat`
2. L'ajouter au planificateur de tâches Windows
3. Exécution suggérée : tous les lundis à 3h00

## 🆘 Dépannage

### Docker ne démarre pas
```bash
# Vérifier l'état
docker info

# Redémarrer Docker Desktop
# Windows : Panneau de configuration > Services > Docker Desktop
```

### Erreur "database is being accessed"
```bash
# Forcer la déconnexion de tous les clients
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'inventaire' AND pid <> pg_backend_pid();
"
```

### Backup corrompu
```bash
# Vérifier l'intégrité
pg_restore -l backups/database/inventaire_production_20260106_164635.dump
```

## 📚 Ressources

- [Documentation PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Guide Backup Principal](./BACKUP_GUIDE.md)
