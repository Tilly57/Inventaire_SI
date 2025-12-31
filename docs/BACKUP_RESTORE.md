# Procédures de Sauvegarde et Restauration

## 📋 Vue d'ensemble

Le système effectue des sauvegardes automatiques quotidiennes de la base de données PostgreSQL à 12h00. Les sauvegardes sont conservées pendant 7 jours.

**Emplacement des sauvegardes :** `backups/database/`

---

## 🔄 Sauvegarde Automatique

### Configuration

La tâche planifiée Windows s'exécute tous les jours à 12h00.

**Nom de la tâche :** `PostgreSQL_Inventaire_Backup`

### Vérifier le statut

```bash
# Voir les détails de la tâche
schtasks /query /tn "PostgreSQL_Inventaire_Backup" /v

# Voir les sauvegardes récentes
ls -lh backups/database/
```

### Exécuter manuellement

```bash
# Windows
.\scripts\backup-database.bat

# Linux/Mac
./scripts/backup-database.sh
```

---

## 💾 Sauvegarde Manuelle

### Sauvegarde rapide avant une opération critique

```bash
# Créer une sauvegarde immédiate
.\scripts\backup-database.bat

# La sauvegarde sera créée dans backups/database/
# Format: inventaire_YYYYMMDD_HHMMSS.sql.gz
```

### Sauvegarde avec nom personnalisé

```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -h localhost -U inventaire -d inventaire -F c -f "backup_avant_migration.sql"
gzip "backup_avant_migration.sql"

# Linux/Mac
pg_dump -h localhost -U inventaire -d inventaire -F c -f "backup_avant_migration.sql"
gzip "backup_avant_migration.sql"
```

**Note :** Le mot de passe est `inventaire_pwd` (définir `PGPASSWORD=inventaire_pwd`)

---

## 🔧 Restauration

### ⚠️ IMPORTANT

**La restauration écrase TOUTES les données actuelles de la base de données !**

Assurez-vous de :
1. Créer une sauvegarde de la base actuelle AVANT de restaurer
2. Arrêter l'application pendant la restauration
3. Vérifier l'intégrité de la sauvegarde avant restauration

### Procédure de restauration complète

#### Étape 1 : Sauvegarder la base actuelle

```bash
# Créer une sauvegarde de sécurité
.\scripts\backup-database.bat
```

#### Étape 2 : Arrêter les services

```bash
# Arrêter l'API (si elle tourne en mode dev)
# Ctrl+C dans le terminal où npm run dev tourne

# OU arrêter PostgreSQL
net stop postgresql-x64-18
```

#### Étape 3 : Restaurer la sauvegarde

```bash
# Décompresser la sauvegarde
cd backups\database
gunzip inventaire_YYYYMMDD_HHMMSS.sql.gz

# Redémarrer PostgreSQL si arrêté
net start postgresql-x64-18

# Option 1: Restauration avec pg_restore (format custom)
"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h localhost -U inventaire -d inventaire --clean --if-exists inventaire_YYYYMMDD_HHMMSS.sql

# Option 2: Si le fichier est un dump SQL texte
psql -h localhost -U inventaire -d inventaire < inventaire_YYYYMMDD_HHMMSS.sql
```

**Mot de passe :** `inventaire_pwd`

#### Étape 4 : Vérifier la restauration

```bash
# Se connecter à la base
psql -h localhost -U inventaire -d inventaire

# Vérifier les tables
\dt

# Vérifier quelques données
SELECT COUNT(*) FROM "Employee";
SELECT COUNT(*) FROM "AssetItem";
SELECT COUNT(*) FROM "Loan";

# Quitter
\q
```

#### Étape 5 : Redémarrer l'application

```bash
cd apps/api
npm run dev
```

---

## 🆘 Restauration d'urgence (Shadow Copy Windows)

Si aucune sauvegarde n'est disponible, vous pouvez tenter de récupérer depuis les snapshots Windows.

### Vérifier les shadow copies disponibles

```bash
vssadmin list shadows
```

### Restaurer depuis un shadow copy

```bash
# 1. Identifier le snapshot le plus récent (noter le chemin du volume)
# Exemple: \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy7

# 2. Arrêter PostgreSQL
net stop postgresql-x64-18

# 3. Copier les fichiers depuis le snapshot
powershell -Command "Copy-Item -Path '\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyN\Program Files\PostgreSQL\18\data\*' -Destination 'C:\Program Files\PostgreSQL\18\data\' -Recurse -Force"

# 4. Redémarrer PostgreSQL
net start postgresql-x64-18
```

**⚠️ ATTENTION :** Cette méthode doit être utilisée en dernier recours uniquement !

---

## 📊 Monitoring des sauvegardes

### Vérifier les sauvegardes récentes

```bash
# Lister les 10 dernières sauvegardes
ls -lht backups/database/ | head -10

# Vérifier l'intégrité d'une sauvegarde
gunzip -t backups/database/inventaire_YYYYMMDD_HHMMSS.sql.gz
```

### Alertes

Configurez une alerte si aucune sauvegarde n'a été créée dans les dernières 24h :

```bash
# Vérifier l'âge de la dernière sauvegarde
$latest = Get-ChildItem backups\database\ | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ((Get-Date) - $latest.LastWriteTime -gt [TimeSpan]::FromHours(24)) {
    Write-Warning "⚠️ Aucune sauvegarde depuis 24h!"
}
```

---

## 🔐 Sécurité des sauvegardes

### Bonnes pratiques

1. **Stockage hors site :** Copiez les sauvegardes vers un emplacement distant (NAS, cloud, etc.)
2. **Chiffrement :** Chiffrez les sauvegardes avant transfert
3. **Test régulier :** Testez la restauration au moins une fois par mois
4. **Rétention :** Gardez au moins 7 jours de sauvegardes quotidiennes

### Chiffrement d'une sauvegarde

```bash
# Avec 7-Zip (Windows)
"C:\Program Files\7-Zip\7z.exe" a -p backup_chiffre.7z backups\database\inventaire_YYYYMMDD_HHMMSS.sql.gz

# Avec GPG (Linux/Mac)
gpg --symmetric --cipher-algo AES256 backups/database/inventaire_YYYYMMDD_HHMMSS.sql.gz
```

---

## 📝 Checklist de restauration

Avant de restaurer :

- [ ] Sauvegarde actuelle créée
- [ ] Fichier de sauvegarde vérifié (gunzip -t)
- [ ] Services arrêtés
- [ ] Utilisateurs informés de la maintenance
- [ ] Plan de rollback préparé

Après restauration :

- [ ] Données vérifiées (counts, samples)
- [ ] Application redémarrée
- [ ] Tests fonctionnels exécutés
- [ ] Utilisateurs informés de la fin de maintenance
- [ ] Logs vérifiés

---

## 📞 Support

En cas de problème :

1. Vérifier les logs : `apps/api/logs/`
2. Vérifier l'état PostgreSQL : `net start postgresql-x64-18`
3. Consulter cette documentation
4. Contacter l'administrateur système

**Dernière mise à jour :** 2025-12-31
