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

# Delete release branch if it exists
RELEASE_BRANCH="release/${VERSION}"
print_info "Checking for release branch..."

# Check if branch exists locally
if git show-ref --verify --quiet "refs/heads/${RELEASE_BRANCH}"; then
    print_info "Deleting local branch ${RELEASE_BRANCH}..."
    git branch -D "${RELEASE_BRANCH}"
    print_success "Local branch deleted"
fi

# Check if branch exists on origin
if git ls-remote --heads origin "${RELEASE_BRANCH}" | grep -q "${RELEASE_BRANCH}"; then
    print_info "Deleting remote branch ${RELEASE_BRANCH}..."
    git push origin --delete "${RELEASE_BRANCH}"
    print_success "Remote branch deleted"
fi

print_success "Deployment completed! 🎉"
echo ""
print_info "Version ${VERSION} is now live on main"
print_info "Tag: v${VERSION}"
echo ""

# Create GitHub release automatically
if command -v gh &> /dev/null; then
    print_info "Creating GitHub release..."
    gh release create "v${VERSION}" \
        --title "Release v${VERSION}" \
        --notes-file "$NOTES_FILE"
    print_success "GitHub release created"
    print_info "View at: https://github.com/Tilly57/Inventaire_SI/releases/tag/v${VERSION}"
else
    print_warning "GitHub CLI (gh) not installed"
    print_info "Create GitHub release manually at:"
    print_info "https://github.com/Tilly57/Inventaire_SI/releases/new?tag=v${VERSION}"
fi

echo ""

# Calculate next version (increment patch)
print_info "Preparing next release branch..."
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
NEXT_PATCH=$((PATCH + 1))
NEXT_VERSION="${MAJOR}.${MINOR}.${NEXT_PATCH}"
NEXT_RELEASE_BRANCH="release/${NEXT_VERSION}"

print_info "Next version will be: ${NEXT_VERSION}"

# Create next release branch from main
print_info "Creating branch ${NEXT_RELEASE_BRANCH}..."
git checkout -b "${NEXT_RELEASE_BRANCH}"

# Update VERSION file
echo "${NEXT_VERSION}" > VERSION
git add VERSION
git commit -m "chore: prepare release ${NEXT_VERSION}

Initialize release branch for version ${NEXT_VERSION}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push new release branch
print_info "Pushing ${NEXT_RELEASE_BRANCH} to origin..."
git push origin "${NEXT_RELEASE_BRANCH}"

print_success "Next release branch created: ${NEXT_RELEASE_BRANCH}"
echo ""
print_info "Summary:"
print_info "  ✓ Released: v${VERSION}"
print_info "  ✓ Current branch: ${NEXT_RELEASE_BRANCH}"
print_info "  ✓ Ready for development of v${NEXT_VERSION}"
echo ""
print_success "You are now on ${NEXT_RELEASE_BRANCH} - ready to start working on v${NEXT_VERSION}!"
