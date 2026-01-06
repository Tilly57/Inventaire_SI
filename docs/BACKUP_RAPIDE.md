# Guide Rapide - Backup et Restauration

## 🔴 Commandes Essentielles (Les Plus Simples)

### 1. Créer un Backup Manuel

```bash
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups/database/inventaire_$(date +%Y%m%d_%H%M%S).dump
```

**Sous Windows PowerShell** :
```powershell
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > "backups/database/inventaire_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
```

**Sous Windows CMD** :
```batch
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups\database\inventaire_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%.dump
```

### 2. Lister les Backups Disponibles

```bash
ls -lht backups/database/*.dump | head -10
```

**Sous Windows** :
```batch
dir /B /O-D backups\database\*.dump
```

### 3. Restaurer un Backup

**Important** : Remplacez `FICHIER_BACKUP.dump` par le nom réel du fichier.

**Méthode 1 - Depuis Windows (Recommandé)** :
```batch
set PGPASSWORD=inventaire_pwd && "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h localhost -p 5432 -U inventaire -d inventaire --clean --if-exists --no-owner --no-privileges backups\database\FICHIER_BACKUP.dump
```

**Méthode 2 - Via Docker (si PostgreSQL 16 dans le container)** :
```bash
cat backups/database/FICHIER_BACKUP.dump | docker exec -i inventaire_si-db-1 pg_restore -U inventaire -d inventaire --clean --if-exists --no-owner --no-privileges
```

### 4. Vérifier les Données Après Restauration

```bash
docker exec inventaire_si-db-1 psql -U inventaire -d inventaire -c "
SELECT 'Utilisateurs: ' || COUNT(*) FROM \"User\";
SELECT 'Employés: ' || COUNT(*) FROM \"Employee\";
SELECT 'Assets: ' || COUNT(*) FROM \"AssetItem\";
SELECT 'Prêts actifs: ' || COUNT(*) FROM \"Loan\" WHERE \"deletedAt\" IS NULL;
"
```

## 🟢 Workflow Recommandé

### Avant de Faire des Modifications Importantes

```bash
# 1. Créer un backup de sécurité
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups/database/avant_modif_$(date +%Y%m%d_%H%M%S).dump

# 2. Vérifier que le backup a été créé
ls -lh backups/database/*.dump | tail -1

# 3. Faire vos modifications...

# 4. Si problème, restaurer le backup (voir commande de restauration ci-dessus)
```

### Sauvegarde Quotidienne Manuelle

Créez une tâche planifiée Windows qui exécute cette commande tous les jours à 2h00 :

```batch
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > C:\Users\mgd\Desktop\Dev\inventaire_SI\backups\database\auto_%date:~-4%%date:~3,2%%date:~0,2%.dump
```

## 🔵 Exemples Pratiques

### Exemple 1 : Backup avec Nom Personnalisé

```bash
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups/database/avant_migration_v2.dump
```

### Exemple 2 : Restaurer un Backup Spécifique

```batch
REM Windows CMD
set PGPASSWORD=inventaire_pwd && "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h localhost -p 5432 -U inventaire -d inventaire --clean --if-exists --no-owner --no-privileges backups\database\avant_migration_v2.dump
```

### Exemple 3 : Vérifier le Contenu d'un Backup

```bash
docker exec inventaire_si-db-1 pg_restore -l backups/database/FICHIER.dump
```

## 📊 Vérification de Santé

### Vérifier que Docker est En Cours d'Exécution

```bash
docker ps | grep inventaire_si-db-1
```

### Vérifier l'Espace Disque des Backups

```bash
# Linux/Mac
du -sh backups/database/

# Windows
dir backups\database
```

### Nettoyer les Vieux Backups (Plus de 30 Jours)

```bash
# Linux/Mac
find backups/database/ -name "*.dump" -mtime +30 -delete

# Windows
forfiles /P backups\database /M *.dump /D -30 /C "cmd /c del @path"
```

## ⚠️ Points Importants

1. **Toujours vérifier** que le fichier de backup a une taille > 0 après création
2. **Créer un backup de sécurité** avant toute restauration
3. **Tester régulièrement** la restauration pour s'assurer que les backups sont valides
4. **Conserver plusieurs backups** : ne jamais n'avoir qu'un seul backup
5. **Sauvegarder ailleurs** : copier régulièrement les backups sur un disque externe ou cloud

## 🆘 En Cas de Problème

### Le Backup est Vide ou Très Petit (< 1 Ko)

```bash
# Vérifier que le conteneur est en cours d'exécution
docker ps

# Vérifier que la base contient des données
docker exec inventaire_si-db-1 psql -U inventaire -d inventaire -c "\dt"
```

### La Restauration Échoue

1. Vérifier la version de PostgreSQL :
   ```bash
   docker exec inventaire_si-db-1 psql -V
   "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --version
   ```

2. Si les versions ne correspondent pas, utiliser pg_restore de la même version que celle qui a créé le backup

### Erreur "Cannot drop ... because other objects depend on it"

C'est normal. L'option `--if-exists` ignore ces erreurs. La restauration continue et fonctionne correctement.

## 📝 Commandes Utiles

### Voir la Dernière Sauvegarde

```bash
ls -lt backups/database/*.dump | head -1
```

### Copier un Backup vers un Autre Endroit

```bash
# Vers un disque externe
cp backups/database/inventaire_20260106_134522.dump /mnt/external_drive/

# Vers un dossier OneDrive/Google Drive
cp backups/database/inventaire_20260106_134522.dump ~/OneDrive/Backups_Inventaire/
```

### Compresser un Backup (Gain d'Espace)

Les backups sont déjà compressés avec `-Z9` (compression maximale), mais vous pouvez les compresser davantage avec gzip :

```bash
gzip backups/database/inventaire_20260106_134522.dump
# Crée : inventaire_20260106_134522.dump.gz
```

---

**Pour la documentation complète, consultez** : `docs/BACKUP_GUIDE.md`
