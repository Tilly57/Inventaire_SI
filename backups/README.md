# Répertoire des Backups - Inventaire SI

Ce répertoire contient les sauvegardes de la base de données PostgreSQL.

## 📁 Structure

```
backups/
├── database/          # Fichiers de backup (.dump)
├── logs/             # Logs des backups automatiques
└── README.md         # Ce fichier
```

## 🚀 Commandes Rapides

### Créer un Backup (Recommandé - Multi-plateforme)

```bash
# Backup automatique avec script Node.js
node scripts/backup-automation.js

# Backup manuel avec nom personnalisé
node scripts/backup-automation.js --name="avant_maj_v0.8.0"
```

### Créer un Backup (Méthode directe)

```bash
# Linux/Mac
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups/database/backup_$(date +%Y%m%d_%H%M%S).dump

# Windows PowerShell
.\scripts\backups\backup.ps1

# Windows Batch
scripts\backups\backup-database.bat
```

### Restaurer un Backup

```bash
# PowerShell (Recommandé pour Windows)
.\scripts\backups\restore.ps1

# Batch
scripts\backups\restore-database.bat
```

### Lister les Backups

```bash
# Linux/Mac
ls -lht database/*.dump | head -10

# Windows PowerShell
Get-ChildItem database\*.dump | Sort-Object LastWriteTime -Descending | Select-Object -First 10
```

### Vérifier la Santé des Backups

```bash
# Démarrer le service de monitoring
node scripts/backup-monitor.js

# Ouvrir dans le navigateur
http://localhost:8080/status

# Vérifier via API
curl http://localhost:8080/health
```

## 🤖 Automatisation

### Activer les Backups Automatiques

**Windows:**
```batch
# Ouvrir PowerShell en tant qu'Administrateur
scripts\setup-backup-automation.bat
```

**Linux/Mac:**
```bash
# Exécuter le script d'installation
chmod +x scripts/setup-backup-automation.sh
./scripts/setup-backup-automation.sh
```

**Docker:**
```bash
# Démarrer avec automatisation
docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d
```

Une fois configuré:
- ✅ Backups quotidiens à 2h00 du matin
- ✅ Suppression automatique après 30 jours
- ✅ Logs détaillés dans `backups/logs/`
- ✅ Monitoring de santé disponible

## 📚 Documentation Complète

- **Automatisation** : `docs/BACKUP_AUTOMATION.md` ⭐ NOUVEAU
- **Guide Rapide** : `docs/BACKUP_RAPIDE.md`
- **Documentation Complète** : `docs/BACKUP_GUIDE.md`
- **Scripts PowerShell/Batch** : `scripts/backups/README.md`

## ⚠️ Important

- **NE JAMAIS SUPPRIMER** les fichiers de backup sans vérification
- Les backups automatiques sont préfixés par `inventaire_auto_`
- Les backups manuels sont préfixés par `inventaire_`
- Les backups de sécurité (avant restauration) sont préfixés par `pre_restore_`

## 🔒 Rétention

- **Backups automatiques** : Conservés 30 jours (suppression automatique)
- **Backups manuels** : Conservés indéfiniment (suppression manuelle uniquement)
- **Backups de sécurité** : Conservés indéfiniment (suppression manuelle uniquement)

## 💾 Recommandations

1. Vérifiez régulièrement que les backups automatiques sont créés
2. Testez la restauration au moins une fois par mois
3. Copiez les backups importants sur un support externe
4. Gardez au moins 3 backups récents en tout temps
