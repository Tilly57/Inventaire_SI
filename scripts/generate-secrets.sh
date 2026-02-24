#!/bin/bash

###########################################
# Script de Génération de Secrets
# Inventaire SI
#
# Génère des secrets forts pour JWT et crée
# les fichiers nécessaires pour Docker secrets
###########################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

SECRETS_DIR="secrets"

print_info "Génération des secrets pour Inventaire SI..."
echo ""

# Create secrets directory
if [ ! -d "$SECRETS_DIR" ]; then
    mkdir -p "$SECRETS_DIR"
    print_success "Dossier secrets/ créé"
else
    print_warning "Dossier secrets/ existe déjà"
fi

# Generate JWT Access Secret (64 bytes = 512 bits entropy)
print_info "Génération JWT Access Secret (64 bytes)..."
openssl rand -base64 64 | tr -d '\n' > "$SECRETS_DIR/jwt_access_secret.txt"
print_success "JWT Access Secret généré"

# Generate JWT Refresh Secret (64 bytes = 512 bits entropy)
print_info "Génération JWT Refresh Secret (64 bytes)..."
openssl rand -base64 64 | tr -d '\n' > "$SECRETS_DIR/jwt_refresh_secret.txt"
print_success "JWT Refresh Secret généré"

# Generate Database Password (64 caractères alphanumériques pour ~380 bits d'entropie)
print_info "Génération Database Password (64 chars)..."
openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64 > "$SECRETS_DIR/db_password.txt"
print_success "Database Password généré"

# Set proper permissions (read-only for owner)
chmod 600 "$SECRETS_DIR"/*.txt
print_success "Permissions configurées (600)"

echo ""
print_success "Tous les secrets ont été générés! 🎉"
echo ""
print_warning "IMPORTANT:"
echo "  1. Les secrets sont dans le dossier secrets/"
echo "  2. Ce dossier est ignoré par git (.gitignore)"
echo "  3. NE PAS commiter ces fichiers!"
echo "  4. Sauvegardez-les de manière sécurisée"
echo ""
print_info "Fichiers générés:"
ls -lh "$SECRETS_DIR"
echo ""
print_info "Prochaines étapes:"
echo "  1. Mettre à jour docker-compose.yml pour utiliser Docker secrets"
echo "  2. Redémarrer les containers: docker-compose up -d --force-recreate"
echo ""
