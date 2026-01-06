# Script PowerShell pour restauration de la base de données
# Usage: .\restore.ps1 [fichier_backup]

param(
    [string]$BackupFile = ""
)

$ErrorActionPreference = "Stop"

# Configuration
$DB_HOST = "localhost"
$DB_PORT = 5432
$DB_NAME = "inventaire"
$DB_USER = "inventaire"
$DB_PASSWORD = "inventaire_pwd"
$BACKUP_DIR = "backups\database"
$PGRESTORE = "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTAURATION BASE DE DONNEES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Si aucun fichier n'est spécifié, lister les backups disponibles
if ($BackupFile -eq "") {
    Write-Host "Backups disponibles:" -ForegroundColor Cyan
    Write-Host ""

    $backups = Get-ChildItem "$BACKUP_DIR\*.dump" | Sort-Object LastWriteTime -Descending

    if ($backups.Count -eq 0) {
        Write-Host "Aucun fichier de backup trouve dans $BACKUP_DIR" -ForegroundColor Red
        exit 1
    }

    for ($i = 0; $i -lt $backups.Count; $i++) {
        $size = [math]::Round($backups[$i].Length/1KB, 2)
        Write-Host "  $($i+1). $($backups[$i].Name) ($size KB) - $($backups[$i].LastWriteTime)" -ForegroundColor Gray
    }

    Write-Host ""
    $choice = Read-Host "Choisissez le numero du backup a restaurer (1-$($backups.Count)) ou Q pour quitter"

    if ($choice -eq "Q" -or $choice -eq "q") {
        Write-Host "Restauration annulee." -ForegroundColor Yellow
        exit 0
    }

    try {
        $index = [int]$choice - 1
        if ($index -lt 0 -or $index -ge $backups.Count) {
            Write-Host "Choix invalide." -ForegroundColor Red
            exit 1
        }
        $BackupFile = $backups[$index].FullName
    } catch {
        Write-Host "Choix invalide." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Fichier de backup: $BackupFile" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $BackupFile)) {
    Write-Host "ERREUR: Le fichier $BackupFile n'existe pas." -ForegroundColor Red
    exit 1
}

# Avertissement
Write-Host "ATTENTION: Cette operation va ECRASER toutes les donnees actuelles!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Etes-vous sur de vouloir continuer? (oui/non)"

if ($confirm -ne "oui") {
    Write-Host "Restauration annulee." -ForegroundColor Yellow
    exit 0
}

# Créer un backup de sécurité avant la restauration
Write-Host ""
Write-Host "Creation d'un backup de securite avant restauration..." -ForegroundColor Yellow
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$SAFETY_BACKUP = "$BACKUP_DIR\pre_restore_$TIMESTAMP.dump"

try {
    docker exec inventaire_si-db-1 pg_dump -U $DB_USER -Fc -Z9 $DB_NAME | Set-Content -Path $SAFETY_BACKUP -Encoding Byte
    Write-Host "Backup de securite cree: $SAFETY_BACKUP" -ForegroundColor Green
} catch {
    Write-Host "AVERTISSEMENT: Impossible de creer un backup de securite." -ForegroundColor Yellow
    $continue = Read-Host "Continuer quand meme? (oui/non)"
    if ($continue -ne "oui") {
        Write-Host "Restauration annulee." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Demarrage de la restauration..." -ForegroundColor Yellow
Write-Host ""

# Vérifier que pg_restore existe
if (-not (Test-Path $PGRESTORE)) {
    Write-Host "ERREUR: pg_restore n'a pas ete trouve a: $PGRESTORE" -ForegroundColor Red
    Write-Host "Veuillez installer PostgreSQL 18 ou modifier le chemin dans le script." -ForegroundColor Red
    exit 1
}

# Restaurer le backup
$env:PGPASSWORD = $DB_PASSWORD
try {
    & $PGRESTORE -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --clean --if-exists --no-owner --no-privileges $BackupFile 2>&1 | Out-Host
} catch {
    Write-Host ""
    Write-Host "ERREUR: La restauration a rencontre des problemes." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Le backup de securite est disponible ici: $SAFETY_BACKUP" -ForegroundColor Yellow
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  RESTAURATION TERMINEE AVEC SUCCES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Vérifier quelques statistiques
Write-Host "Verification de la base de donnees restauree:" -ForegroundColor Cyan
Write-Host ""

try {
    $users = docker exec inventaire_si-db-1 psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM `"User`";" | Out-String
    $employees = docker exec inventaire_si-db-1 psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM `"Employee`";" | Out-String
    $assets = docker exec inventaire_si-db-1 psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM `"AssetItem`";" | Out-String
    $loans = docker exec inventaire_si-db-1 psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM `"Loan`" WHERE `"deletedAt`" IS NULL;" | Out-String

    Write-Host "  Utilisateurs: $($users.Trim())" -ForegroundColor Gray
    Write-Host "  Employes: $($employees.Trim())" -ForegroundColor Gray
    Write-Host "  Assets: $($assets.Trim())" -ForegroundColor Gray
    Write-Host "  Prets actifs: $($loans.Trim())" -ForegroundColor Gray
} catch {
    Write-Host "Impossible de verifier les statistiques." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Restauration terminee avec succes!" -ForegroundColor Green
