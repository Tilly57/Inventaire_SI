#!/bin/bash

###########################################
# Script de Déploiement en Production
# Inventaire SI
#
# Usage:
#   ./scripts/deploy-production.sh 0.1.1
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

# Check argument
if [[ -z "$1" ]]; then
    print_error "Version number required!"
    echo "Usage: ./scripts/deploy-production.sh <version>"
    echo "Example: ./scripts/deploy-production.sh 0.1.1"
    exit 1
fi

VERSION=$1
RELEASE_NOTES_DIR=".release-notes"
NOTES_FILE="${RELEASE_NOTES_DIR}/v${VERSION}.md"

print_info "Deploying version ${VERSION} to production..."
echo ""

# Verify release notes exist
if [[ ! -f "$NOTES_FILE" ]]; then
    print_error "Release notes not found: $NOTES_FILE"
    print_info "Run ./scripts/release.sh first to create the release"
    exit 1
fi

# Confirm deployment
print_warning "This will merge staging to main and deploy to production."
read -p "Continue? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Merge staging to main
print_info "Merging staging to main..."
git checkout main
git pull origin main
git merge --no-ff staging -m "chore(release): release v${VERSION}

Deploy version ${VERSION} to production.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Create tag
print_info "Creating tag v${VERSION}..."
git tag -a "v${VERSION}" -F "$NOTES_FILE"

# Push to origin
print_info "Pushing to origin..."
git push origin main
git push origin "v${VERSION}"

print_success "Deployment completed! 🎉"
echo ""
print_info "Version ${VERSION} is now live on main"
print_info "Tag: v${VERSION}"
echo ""

# Create GitHub release if gh CLI available
if command -v gh &> /dev/null; then
    read -p "Create GitHub release? (y/N): " gh_confirm
    if [[ "$gh_confirm" == "y" || "$gh_confirm" == "Y" ]]; then
        gh release create "v${VERSION}" \
            --title "Release v${VERSION}" \
            --notes-file "$NOTES_FILE"
        print_success "GitHub release created"
    fi
else
    print_info "Create GitHub release manually at:"
    print_info "https://github.com/Tilly57/Inventaire_SI/releases/new?tag=v${VERSION}"
fi
