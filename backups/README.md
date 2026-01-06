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

### Créer un Backup

```bash
docker exec inventaire_si-db-1 pg_dump -U inventaire -Fc -Z9 inventaire > backups/database/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restaurer un Backup

```batch
set PGPASSWORD=inventaire_pwd && "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -h localhost -p 5432 -U inventaire -d inventaire --clean --if-exists --no-owner --no-privileges backups\database\FICHIER.dump
```

### Lister les Backups

```bash
ls -lht database/*.dump | head -10
```

## 📚 Documentation Complète

- **Guide Rapide** : `docs/BACKUP_RAPIDE.md`
- **Documentation Complète** : `docs/BACKUP_GUIDE.md`
- **Scripts** : `scripts/backups/`

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
