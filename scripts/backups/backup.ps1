# Script PowerShell pour backup de la base de données
# Usage: .\backup.ps1 [nom_optionnel]

param(
    [string]$BackupName = ""
)

$ErrorActionPreference = "Stop"

# Configuration
$DB_CONTAINER = "inventaire_si-db-1"
$DB_NAME = "inventaire"
$DB_USER = "inventaire"
$BACKUP_DIR = "backups\database"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Déterminer le nom du backup
if ($BackupName -eq "") {
    $BACKUP_FILE = "$BACKUP_DIR\inventaire_$TIMESTAMP.dump"
} else {
    $BACKUP_FILE = "$BACKUP_DIR\${BackupName}_$TIMESTAMP.dump"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP BASE DE DONNEES INVENTAIRE SI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Container: $DB_CONTAINER"
Write-Host "Base de donnees: $DB_NAME"
Write-Host "Fichier: $BACKUP_FILE"
Write-Host ""

# Vérifier que Docker est en cours d'exécution
try {
    $null = docker ps 2>&1
} catch {
    Write-Host "ERREUR: Docker n'est pas en cours d'execution." -ForegroundColor Red
    Write-Host "Veuillez demarrer Docker Desktop." -ForegroundColor Red
    exit 1
}

# Vérifier que le conteneur est en cours d'exécution
$containerStatus = docker ps --filter "name=$DB_CONTAINER" --format "{{.Names}}" 2>$null
if ($containerStatus -ne $DB_CONTAINER) {
    Write-Host "ERREUR: Le conteneur $DB_CONTAINER n'est pas en cours d'execution." -ForegroundColor Red
    Write-Host "Veuillez demarrer avec: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# Créer le répertoire de backup s'il n'existe pas
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Host "Creation du repertoire de backup: $BACKUP_DIR"
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

# Effectuer le backup
Write-Host "Demarrage du backup..." -ForegroundColor Yellow
try {
    docker exec $DB_CONTAINER pg_dump -U $DB_USER -Fc -Z9 $DB_NAME | Set-Content -Path $BACKUP_FILE -Encoding Byte
} catch {
    Write-Host ""
    Write-Host "ERREUR: Le backup a echoue!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Vérifier que le fichier existe
if (-not (Test-Path $BACKUP_FILE)) {
    Write-Host ""
    Write-Host "ERREUR: Le fichier de backup n'a pas ete cree!" -ForegroundColor Red
    exit 1
}

# Obtenir la taille du fichier
$fileInfo = Get-Item $BACKUP_FILE
$fileSize = $fileInfo.Length

if ($fileSize -lt 1000) {
    Write-Host ""
    Write-Host "AVERTISSEMENT: Le fichier de backup est tres petit ($fileSize octets)" -ForegroundColor Yellow
    Write-Host "Cela peut indiquer un probleme." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  BACKUP TERMINE AVEC SUCCES" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Fichier: $BACKUP_FILE" -ForegroundColor Green
    Write-Host "Taille: $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Green
}

Write-Host ""

# Lister les derniers backups
Write-Host "Derniers backups disponibles:" -ForegroundColor Cyan
Get-ChildItem "$BACKUP_DIR\*.dump" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
    $size = [math]::Round($_.Length/1KB, 2)
    Write-Host "  - $($_.Name) ($size KB) - $($_.LastWriteTime)" -ForegroundColor Gray
}
Write-Host ""

# Compter le nombre total de backups
$backupCount = (Get-ChildItem "$BACKUP_DIR\*.dump").Count
if ($backupCount -gt 30) {
    Write-Host "INFORMATION: Vous avez $backupCount fichiers de backup." -ForegroundColor Yellow
    Write-Host "Pensez a nettoyer les anciens backups pour economiser de l'espace." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Backup termine avec succes!" -ForegroundColor Green
