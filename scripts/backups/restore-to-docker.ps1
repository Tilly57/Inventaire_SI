# Script pour restaurer la base de données de production dans Docker
# Usage: .\restore-to-docker.ps1 [-BackupFile <path>]

param(
    [string]$BackupFile = ""
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Restauration base de donnees vers Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est lancé
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Host "[ERREUR] Docker n'est pas lance ou inaccessible" -ForegroundColor Red
    Write-Host "Veuillez demarrer Docker Desktop et reessayer" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Trouver le fichier de backup le plus récent ou utiliser celui spécifié
if ($BackupFile -eq "") {
    Write-Host "Recherche du backup le plus recent..." -ForegroundColor Yellow
    $BackupFile = Get-ChildItem "..\..\backups\database\*.dump" -ErrorAction SilentlyContinue |
                  Sort-Object LastWriteTime -Descending |
                  Select-Object -First 1 -ExpandProperty FullName

    if (-not $BackupFile) {
        Write-Host "[ERREUR] Aucun fichier de backup trouve dans backups/database/" -ForegroundColor Red
        Read-Host "Appuyez sur Entree pour quitter"
        exit 1
    }
}

Write-Host "Fichier de backup : $BackupFile" -ForegroundColor Green
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $BackupFile)) {
    Write-Host "[ERREUR] Le fichier $BackupFile n'existe pas" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Demander confirmation
Write-Host "ATTENTION : Cette operation va :" -ForegroundColor Yellow
Write-Host "  1. Arreter les conteneurs Docker"
Write-Host "  2. Supprimer la base de donnees existante dans Docker"
Write-Host "  3. Restaurer la base de production"
Write-Host ""
$Confirm = Read-Host "Continuer ? (O/N)"
if ($Confirm -ne "O" -and $Confirm -ne "o") {
    Write-Host "Operation annulee" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/5] Arret des conteneurs..." -ForegroundColor Cyan
docker-compose down

Write-Host ""
Write-Host "[2/5] Demarrage uniquement de la base de donnees..." -ForegroundColor Cyan
docker-compose up -d db

Write-Host ""
Write-Host "[3/5] Attente du demarrage de PostgreSQL (15 secondes)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "[4/5] Suppression de la base existante et recreation..." -ForegroundColor Cyan
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "DROP DATABASE IF EXISTS inventaire;"
docker exec inventaire_si-db-1 psql -U inventaire postgres -c "CREATE DATABASE inventaire OWNER inventaire;"

Write-Host ""
Write-Host "[5/5] Restauration du backup..." -ForegroundColor Cyan

# Copier le backup dans le conteneur (utiliser chemin WSL si nécessaire)
$BackupFileName = Split-Path $BackupFile -Leaf
docker cp $BackupFile inventaire_si-db-1:/tmp/restore.dump

# Restaurer le backup
docker exec inventaire_si-db-1 pg_restore -U inventaire -d inventaire -v /tmp/restore.dump 2>&1 | Write-Host

# Nettoyer
docker exec inventaire_si-db-1 rm /tmp/restore.dump

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Restauration terminee avec succes !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour demarrer tous les services :" -ForegroundColor Yellow
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entree pour quitter"
