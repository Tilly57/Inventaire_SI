# Scripts de Backup - Inventaire SI

Ce répertoire contient tous les scripts pour gérer les backups de la base de données.

## 📁 Fichiers Disponibles

### Scripts PowerShell (Recommandés pour Windows)

- **`backup.ps1`** - Création de backup manuel
- **`restore.ps1`** - Restauration interactive de backup
- **`cleanup.ps1`** - Nettoyage des anciens backups

### Scripts Batch (Windows CMD)

- **`backup-database.bat`** - Backup manuel (version batch)
- **`restore-database.bat`** - Restauration (version batch)
- **`backup-auto-daily.bat`** - Backup automatique quotidien
- **`setup-auto-backup.bat`** - Configuration de la tâche planifiée

## 🚀 Utilisation Rapide

### Créer un Backup

**PowerShell (Recommandé)** :
```powershell
.\backup.ps1
```

Avec un nom personnalisé :
```powershell
.\backup.ps1 -BackupName "avant_migration"
```

**Batch** :
```batch
backup-database.bat
```

### Restaurer un Backup

**PowerShell (Recommandé)** :
```powershell
.\restore.ps1
```

Le script affichera une liste interactive des backups disponibles.

Pour restaurer un fichier spécifique :
```powershell
.\restore.ps1 -BackupFile "backups\database\inventaire_20260106_140523.dump"
```

**Batch** :
```batch
restore-database.bat
```

### Nettoyer les Anciens Backups

**Simulation (aucune suppression)** :
```powershell
.\cleanup.ps1 -DryRun
```

**Suppression des backups de plus de 30 jours** :
```powershell
.\cleanup.ps1
```

**Suppression personnalisée (ex: 60 jours)** :
```powershell
.\cleanup.ps1 -Days 60
```

## 🔧 Configuration des Backups Automatiques

### Windows - Tâche Planifiée

1. **Ouvrir PowerShell en tant qu'Administrateur**
2. Exécuter :
```batch
.\setup-auto-backup.bat
```

Cela créera une tâche planifiée qui :
- S'exécute tous les jours à 02h00
- Conserve les backups pendant 30 jours
- Enregistre les logs dans `backups/logs/`

### Modifier l'Heure d'Exécution

1. Ouvrir le **Planificateur de tâches Windows** (`Win + R` → `taskschd.msc`)
2. Chercher la tâche : `InventaireSI_BackupDaily`
3. Modifier les paramètres selon vos besoins

## 📊 Exemples d'Utilisation

### Backup Avant une Mise à Jour

```powershell
# PowerShell
.\backup.ps1 -BackupName "avant_maj_v0.7.0"

# Ou avec batch
backup-database.bat avant_maj_v0.7.0
```

### Restaurer le Dernier Backup

```powershell
# PowerShell - mode interactif
.\restore.ps1
# Puis sélectionner le backup #1 (le plus récent)
```

### Nettoyer les Backups de Plus de 90 Jours

```powershell
# PowerShell - simulation d'abord
.\cleanup.ps1 -Days 90 -DryRun

# Si tout est OK, exécuter réellement
.\cleanup.ps1 -Days 90
```

## 🔒 Sécurité

### Politique de Rétention

- **Backups automatiques** (`inventaire_auto_*`) : 30 jours
- **Backups manuels** (`inventaire_*`) : Conservés indéfiniment
- **Backups de sécurité** (`pre_restore_*`) : Conservés indéfiniment

Le script `cleanup.ps1` ne supprime **jamais** les backups manuels créés par l'utilisateur.

### Backup de Sécurité Automatique

Le script de restauration (`restore.ps1`) crée **automatiquement** un backup de sécurité avant toute restauration :
- Nom : `pre_restore_YYYYMMDD_HHMMSS.dump`
- Permet de revenir en arrière si la restauration échoue

## ⚠️ Prérequis

### Pour les Scripts PowerShell

- **Docker Desktop** : Doit être installé et en cours d'exécution
- **PostgreSQL 18** : Installé localement pour `pg_restore` (chemin par défaut : `C:\Program Files\PostgreSQL\18\bin\`)

Si PostgreSQL est installé ailleurs, modifiez la variable `$PGRESTORE` dans `restore.ps1` :
```powershell
$PGRESTORE = "C:\Chemin\Vers\PostgreSQL\bin\pg_restore.exe"
```

### Pour les Scripts Batch

Mêmes prérequis que PowerShell.

## 🛠️ Dépannage

### "L'exécution de scripts est désactivée sur ce système"

Si vous voyez cette erreur avec PowerShell :

1. Ouvrir PowerShell en tant qu'Administrateur
2. Exécuter :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
3. Réessayer

### "Docker n'est pas en cours d'exécution"

1. Démarrer Docker Desktop
2. Attendre qu'il soit complètement démarré
3. Réessayer le script

### "Le conteneur n'est pas en cours d'exécution"

```bash
docker-compose up -d
```

### "pg_restore introuvable"

Vérifier que PostgreSQL 18 est installé :
```powershell
Test-Path "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
```

Si `False`, installer PostgreSQL 18 ou modifier le chemin dans les scripts.

## 📚 Documentation Complète

- **Guide Rapide** : `../../docs/BACKUP_RAPIDE.md`
- **Documentation Complète** : `../../docs/BACKUP_GUIDE.md`

## 💡 Bonnes Pratiques

1. **Créer un backup avant toute modification importante**
   ```powershell
   .\backup.ps1 -BackupName "avant_modif"
   ```

2. **Vérifier régulièrement que les backups automatiques fonctionnent**
   ```powershell
   # Lister les backups récents
   Get-ChildItem ..\..\backups\database\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 5
   ```

3. **Tester la restauration au moins une fois par mois**
   ```powershell
   # Créer un backup de test
   .\backup.ps1 -BackupName "test_restore"

   # Restaurer ce backup pour vérifier
   .\restore.ps1 -BackupFile "..\..\backups\database\test_restore_*.dump"
   ```

4. **Copier les backups importants ailleurs**
   ```powershell
   # Vers OneDrive/Google Drive
   Copy-Item "..\..\backups\database\*.dump" "$env:USERPROFILE\OneDrive\Backups_Inventaire\"

   # Vers un disque externe
   Copy-Item "..\..\backups\database\*.dump" "E:\Backups\Inventaire\"
   ```

5. **Nettoyer régulièrement les anciens backups**
   ```powershell
   # Tous les mois, supprimer les backups de plus de 30 jours
   .\cleanup.ps1 -Days 30
   ```

## 🆘 Support

Pour toute question ou problème :
1. Consulter la documentation dans `docs/`
2. Vérifier que Docker est en cours d'exécution
3. Vérifier les logs dans `backups/logs/` pour les backups automatiques

## 📝 Notes

- Les scripts PowerShell sont **recommandés** pour Windows car ils offrent une meilleure gestion des erreurs et une interface plus conviviale
- Les scripts Batch sont fournis pour la compatibilité avec les anciens systèmes ou pour l'automatisation via le Planificateur de tâches Windows
- Tous les backups sont créés au **format PostgreSQL custom** (`.dump`) avec **compression niveau 9** pour économiser l'espace disque
