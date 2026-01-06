# Guide de Sauvegarde et Restauration - Inventaire SI

Ce guide explique comment sauvegarder et restaurer la base de données PostgreSQL de l'application Inventaire SI.

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Backup Manuel](#backup-manuel)
3. [Restauration de Backup](#restauration-de-backup)
4. [Backup Automatique](#backup-automatique)
5. [Gestion des Backups](#gestion-des-backups)
6. [Dépannage](#dépannage)

## Vue d'ensemble

### Types de Backups

Le système propose deux types de backups :

- **Backup Manuel** : Créé à la demande par l'utilisateur
- **Backup Automatique** : Créé automatiquement tous les jours à 02h00

### Emplacement des Fichiers

- **Backups** : `backups/database/`
- **Logs des backups automatiques** : `backups/logs/`
- **Scripts** : `scripts/backups/`

### Format des Backups

Les backups sont créés au format PostgreSQL custom (`.dump`) avec compression maximale (niveau 9). Ce format :
- Est compact et économise de l'espace disque
- Permet une restauration partielle si nécessaire
- Nécessite `pg_restore` pour la restauration (pas `psql`)

## Backup Manuel

### Créer un Backup Manuel

1. Ouvrez un terminal dans le répertoire racine du projet
2. Exécutez le script de backup :

```bash
scripts\backups\backup-database.bat
```

### Créer un Backup avec un Nom Personnalisé

```bash
scripts\backups\backup-database.bat mon_backup
```

Cela créera un fichier nommé `mon_backup_YYYYMMDD_HHMMSS.dump`

### Ce que Fait le Script

1. Vérifie que Docker et le conteneur de base de données sont en cours d'exécution
2. Crée le répertoire de backup s'il n'existe pas
3. Effectue un backup complet de la base de données avec compression
4. Vérifie que le backup a été créé correctement
5. Affiche des informations sur le backup (taille, emplacement)
6. Liste les derniers backups disponibles
7. Avertit si plus de 30 backups sont présents

### Sortie Exemple

```
========================================
  BACKUP BASE DE DONNEES INVENTAIRE SI
========================================

Container: inventaire_si-db-1
Base de donnees: inventaire
Fichier de backup: backups\database\inventaire_20260106_140523.dump

Demarrage du backup...

========================================
  BACKUP TERMINE AVEC SUCCES
========================================
Fichier: backups\database\inventaire_20260106_140523.dump
Taille: 12845 octets
```

## Restauration de Backup

### Restaurer un Backup (Mode Interactif)

1. Ouvrez un terminal dans le répertoire racine du projet
2. Exécutez le script de restauration :

```bash
scripts\backups\restore-database.bat
```

3. Le script affichera la liste des backups disponibles :

```
Backups disponibles:

1. inventaire_20260106_140523.dump
2. inventaire_20260105_134527.dump
3. inventaire_20260105_112118.dump

Choisissez le numero du backup a restaurer (1-3) ou Q pour quitter:
```

4. Entrez le numéro du backup à restaurer
5. Confirmez l'opération en tapant `oui`

### Restaurer un Backup Spécifique

```bash
scripts\backups\restore-database.bat backups\database\inventaire_20260106_140523.dump
```

### Ce que Fait le Script

1. Affiche la liste des backups disponibles (en mode interactif)
2. Demande confirmation avant de restaurer
3. **Crée automatiquement un backup de sécurité** de l'état actuel
4. Restaure le backup sélectionné
5. Affiche des statistiques sur la base de données restaurée :
   - Nombre d'utilisateurs
   - Nombre d'employés
   - Nombre d'asset items
   - Nombre de prêts actifs

### Backup de Sécurité

Avant chaque restauration, le script crée automatiquement un backup de sécurité nommé :
```
pre_restore_YYYYMMDD_HHMMSS.dump
```

Cela vous permet de revenir à l'état précédent si la restauration ne se passe pas comme prévu.

## Backup Automatique

### Configuration Initiale

1. **Ouvrez un terminal en tant qu'Administrateur** :
   - Cliquez droit sur PowerShell ou CMD
   - Sélectionnez "Exécuter en tant qu'administrateur"

2. Naviguez vers le répertoire du projet :
```bash
cd C:\Users\mgd\Desktop\Dev\inventaire_SI
```

3. Exécutez le script de configuration :
```bash
scripts\backups\setup-auto-backup.bat
```

4. Le script créera une tâche planifiée Windows qui :
   - S'exécute tous les jours à **02h00**
   - Crée un backup automatique
   - Supprime automatiquement les backups de plus de **30 jours**
   - Enregistre les logs dans `backups/logs/`

### Configuration de la Tâche Planifiée

- **Nom de la tâche** : `InventaireSI_BackupDaily`
- **Fréquence** : Tous les jours à 02h00
- **Rétention** : 30 jours
- **Exécution** : En tant que SYSTEM (même si personne n'est connecté)

### Modifier l'Heure de Backup

1. Ouvrez le **Planificateur de tâches Windows** :
   - Appuyez sur `Win + R`
   - Tapez `taskschd.msc`
   - Appuyez sur Entrée

2. Cherchez la tâche : `InventaireSI_BackupDaily`

3. Double-cliquez pour modifier les paramètres

4. Allez dans l'onglet **Déclencheurs** pour modifier l'heure

### Vérifier que les Backups Automatiques Fonctionnent

1. Vérifiez les fichiers de backup :
```bash
dir backups\database\inventaire_auto_*.dump
```

2. Vérifiez les logs :
```bash
dir backups\logs\backup_*.log
```

3. Consultez le dernier log pour voir si le backup a réussi :
```bash
type backups\logs\backup_YYYYMMDD_HHMMSS.log
```

### Exécuter Manuellement le Backup Automatique

Pour tester la tâche planifiée sans attendre 02h00 :

```bash
scripts\backups\backup-auto-daily.bat
```

Ou depuis le Planificateur de tâches :
1. Ouvrez `taskschd.msc`
2. Cherchez `InventaireSI_BackupDaily`
3. Cliquez droit → **Exécuter**

## Gestion des Backups

### Nommage des Fichiers

- **Backups manuels** : `inventaire_YYYYMMDD_HHMMSS.dump`
- **Backups automatiques** : `inventaire_auto_YYYYMMDD_HHMMSS.dump`
- **Backups de sécurité** : `pre_restore_YYYYMMDD_HHMMSS.dump`

### Rétention des Backups

- Les backups automatiques sont conservés pendant **30 jours**
- Les backups manuels ne sont **jamais supprimés automatiquement**
- Les backups de sécurité ne sont **jamais supprimés automatiquement**

### Nettoyer les Anciens Backups Manuellement

Pour supprimer les backups de plus de 60 jours :

```bash
forfiles /P backups\database /M *.dump /D -60 /C "cmd /c del @path"
```

### Vérifier l'Espace Disque

Pour voir la taille totale des backups :

```bash
dir backups\database\*.dump | findstr "Fichier(s)"
```

## Dépannage

### Erreur : "Le conteneur n'est pas en cours d'exécution"

**Solution** : Démarrez Docker Compose :
```bash
docker-compose up -d
```

### Erreur : "pg_restore introuvable" ou "pg_dump introuvable"

**Solution** : Assurez-vous que PostgreSQL 18 est installé localement et que le chemin est correct :
```
C:\Program Files\PostgreSQL\18\bin\
```

Si votre installation est différente, modifiez le script `restore-database.bat` :
```batch
set PGRESTORE="C:\Chemin\Vers\PostgreSQL\bin\pg_restore.exe"
```

### Le Backup est Très Petit (< 1 Ko)

Cela indique probablement un problème. Vérifications :

1. Le conteneur Docker est-il en cours d'exécution ?
```bash
docker ps
```

2. La base de données contient-elle des données ?
```bash
docker exec inventaire_si-db-1 psql -U inventaire -d inventaire -c "\dt"
```

### La Restauration Échoue

1. Vérifiez que le fichier de backup existe et n'est pas corrompu
2. Vérifiez que vous utilisez la bonne version de `pg_restore` (PostgreSQL 18)
3. Consultez les messages d'erreur détaillés
4. Si nécessaire, restaurez le backup de sécurité créé automatiquement

### La Tâche Planifiée ne S'exécute Pas

1. Vérifiez que la tâche existe :
```bash
schtasks /query /tn InventaireSI_BackupDaily
```

2. Vérifiez les logs dans `backups/logs/`

3. Assurez-vous que Docker démarre automatiquement au démarrage de Windows

4. Dans le Planificateur de tâches, vérifiez que :
   - La tâche est activée
   - L'utilisateur d'exécution a les permissions nécessaires
   - Docker Desktop est configuré pour démarrer au démarrage

## Bonnes Pratiques

### Avant des Modifications Importantes

Créez toujours un backup manuel avant :
- Mettre à jour la structure de la base de données
- Importer de grandes quantités de données
- Effectuer des suppressions en masse
- Mettre à jour l'application

```bash
scripts\backups\backup-database.bat avant_maj
```

### Vérification Régulière

1. Vérifiez une fois par semaine que les backups automatiques sont créés
2. Testez la restauration d'un backup tous les mois pour vous assurer que le processus fonctionne

### Sauvegardes Externes

Pour une sécurité maximale, copiez régulièrement les backups vers :
- Un disque dur externe
- Un service cloud (Google Drive, OneDrive, etc.)
- Un autre ordinateur sur le réseau

### Conservation Longue Durée

Pour conserver certains backups indéfiniment :
1. Copiez le fichier `.dump` dans un autre répertoire
2. Ajoutez un suffixe descriptif : `inventaire_avant_migration_v2.dump`

## Exemples d'Utilisation Courants

### Scénario 1 : Backup Avant une Mise à Jour

```bash
# Créer un backup avec un nom descriptif
scripts\backups\backup-database.bat avant_maj_v0.7.0

# Effectuer la mise à jour...

# Si problème, restaurer le backup
scripts\backups\restore-database.bat backups\database\avant_maj_v0.7.0_*.dump
```

### Scénario 2 : Migration de Serveur

```bash
# Sur l'ancien serveur
scripts\backups\backup-database.bat migration_serveur

# Copier le fichier .dump vers le nouveau serveur

# Sur le nouveau serveur
scripts\backups\restore-database.bat backups\database\migration_serveur_*.dump
```

### Scénario 3 : Récupération après Erreur

```bash
# Restaurer le backup automatique de cette nuit
scripts\backups\restore-database.bat

# Sélectionner le backup automatique le plus récent (inventaire_auto_*)
```

## Support

Pour toute question ou problème :
1. Consultez ce guide
2. Vérifiez les logs dans `backups/logs/`
3. Vérifiez les messages d'erreur dans le terminal
4. Consultez la documentation PostgreSQL : https://www.postgresql.org/docs/

## Résumé des Commandes

| Action | Commande |
|--------|----------|
| Backup manuel | `scripts\backups\backup-database.bat` |
| Backup manuel nommé | `scripts\backups\backup-database.bat nom` |
| Restauration interactive | `scripts\backups\restore-database.bat` |
| Restauration spécifique | `scripts\backups\restore-database.bat fichier.dump` |
| Configurer backup auto | `scripts\backups\setup-auto-backup.bat` (admin) |
| Test backup auto | `scripts\backups\backup-auto-daily.bat` |
| Lister les backups | `dir backups\database\*.dump` |
| Voir les logs | `dir backups\logs\*.log` |
