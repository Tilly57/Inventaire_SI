#!/bin/bash

###########################################
# Script de Commit Rapide
# Inventaire SI
#
# Usage:
#   ./scripts/quick-commit.sh "feat: add new feature"
#   ./scripts/quick-commit.sh "fix: correct bug" --push
#   ./scripts/quick-commit.sh --amend
###########################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Check if in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository!"
    exit 1
fi

# Parse arguments
COMMIT_MSG=""
SHOULD_PUSH=false
AMEND=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --push|-p)
            SHOULD_PUSH=true
            shift
            ;;
        --amend|-a)
            AMEND=true
            shift
            ;;
        *)
            COMMIT_MSG="$1"
            shift
            ;;
    esac
done

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: ${CURRENT_BRANCH}"

# Show status
echo ""
print_info "Changed files:"
git status --short

# Add all changes
echo ""
read -p "Stage all changes? (Y/n): " stage_confirm
if [[ "$stage_confirm" == "n" || "$stage_confirm" == "N" ]]; then
    print_info "Select files to stage manually, then run this script again"
    exit 0
fi

git add -A
print_success "Staged all changes"

# Amend mode
if [[ "$AMEND" == true ]]; then
    git commit --amend --no-edit
    print_success "Amended last commit"

    if [[ "$SHOULD_PUSH" == true ]]; then
        print_info "Force pushing amended commit..."
        git push origin "$CURRENT_BRANCH" --force-with-lease
        print_success "Force pushed to origin/${CURRENT_BRANCH}"
    fi
    exit 0
fi

# Interactive commit message if not provided
if [[ -z "$COMMIT_MSG" ]]; then
    echo ""
    print_info "Commit message templates:"
    echo "  feat: Add new feature"
    echo "  fix: Fix bug"
    echo "  docs: Update documentation"
    echo "  style: Format code"
    echo "  refactor: Refactor code"
    echo "  perf: Improve performance"
    echo "  test: Add tests"
    echo "  chore: Maintenance tasks"
    echo ""
    read -p "Enter commit message: " COMMIT_MSG

    if [[ -z "$COMMIT_MSG" ]]; then
        print_error "Commit message required!"
        exit 1
    fi
fi

# Create commit with signature
git commit -m "${COMMIT_MSG}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

print_success "Created commit: ${COMMIT_MSG}"

# Push if requested
if [[ "$SHOULD_PUSH" == true ]]; then
    print_info "Pushing to origin/${CURRENT_BRANCH}..."
    git push origin "$CURRENT_BRANCH"
    print_success "Pushed to origin/${CURRENT_BRANCH}"
else
    echo ""
    print_info "To push this commit, run:"
    echo "    git push origin ${CURRENT_BRANCH}"
    echo "Or use: ./scripts/quick-commit.sh --push"
fi
