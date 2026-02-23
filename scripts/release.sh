#!/bin/bash

###########################################
# Script de Release Automatisé
# Inventaire SI - Workflow de versioning
#
# Usage:
#   ./scripts/release.sh patch   # 0.1.0 -> 0.1.1
#   ./scripts/release.sh minor   # 0.1.0 -> 0.2.0
#   ./scripts/release.sh major   # 0.1.0 -> 1.0.0
#   ./scripts/release.sh         # Interactive mode
###########################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSION_FILE="VERSION"
CHANGELOG_FILE="CHANGELOG.md"
RELEASE_NOTES_DIR=".release-notes"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Inventaire SI - Release Manager${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository!"
        exit 1
    fi
}

# Check for uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD --; then
        print_error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi
}

# Get current version
get_current_version() {
    if [[ ! -f "$VERSION_FILE" ]]; then
        echo "0.0.0"
    else
        cat "$VERSION_FILE"
    fi
}

# Parse version into components
parse_version() {
    local version=$1
    local IFS='.'
    read -ra VERSION_PARTS <<< "$version"
    MAJOR="${VERSION_PARTS[0]}"
    MINOR="${VERSION_PARTS[1]}"
    PATCH="${VERSION_PARTS[2]}"
}

# Increment version based on type
increment_version() {
    local current_version=$1
    local bump_type=$2

    parse_version "$current_version"

    case $bump_type in
        major)
            MAJOR=$((MAJOR + 1))
            MINOR=0
            PATCH=0
            ;;
        minor)
            MINOR=$((MINOR + 1))
            PATCH=0
            ;;
        patch)
            PATCH=$((PATCH + 1))
            ;;
        *)
            print_error "Invalid version bump type: $bump_type"
            print_info "Valid types: major, minor, patch"
            exit 1
            ;;
    esac

    echo "${MAJOR}.${MINOR}.${PATCH}"
}

# Interactive version selection
select_version_type() {
    local current_version=$1

    echo ""
    print_info "Current version: $current_version"
    echo ""
    echo "Select version bump type:"
    echo "  1) Patch (${current_version} -> $(increment_version "$current_version" patch)) - Bug fixes"
    echo "  2) Minor (${current_version} -> $(increment_version "$current_version" minor)) - New features"
    echo "  3) Major (${current_version} -> $(increment_version "$current_version" major)) - Breaking changes"
    echo "  4) Cancel"
    echo ""
    read -p "Enter choice [1-4]: " choice

    case $choice in
        1) echo "patch" ;;
        2) echo "minor" ;;
        3) echo "major" ;;
        4) exit 0 ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
}

# Update VERSION file
update_version_file() {
    local new_version=$1
    echo "$new_version" > "$VERSION_FILE"
    print_success "Updated VERSION file to $new_version"
}

# Generate changelog entry
generate_changelog_entry() {
    local version=$1
    local date=$(date +%Y-%m-%d)

    mkdir -p "$RELEASE_NOTES_DIR"
    local notes_file="$RELEASE_NOTES_DIR/v${version}.md"

    # Get commits since last tag
    local last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    local commit_range

    if [[ -z "$last_tag" ]]; then
        commit_range="HEAD"
        print_info "No previous tags found. Generating changelog from all commits." >&2
    else
        commit_range="${last_tag}..HEAD"
        print_info "Generating changelog from ${last_tag} to HEAD" >&2
    fi

    # Generate release notes
    cat > "$notes_file" <<EOF
# Release v${version} - ${date}

## Summary

<!-- Add a brief summary of this release -->

## Changes

EOF

    # Categorize commits
    echo "### ✨ Features" >> "$notes_file"
    git log $commit_range --pretty=format:"- %s" --grep="^feat" >> "$notes_file" || true
    echo "" >> "$notes_file"
    echo "" >> "$notes_file"

    echo "### 🐛 Bug Fixes" >> "$notes_file"
    git log $commit_range --pretty=format:"- %s" --grep="^fix" >> "$notes_file" || true
    echo "" >> "$notes_file"
    echo "" >> "$notes_file"

    echo "### 📚 Documentation" >> "$notes_file"
    git log $commit_range --pretty=format:"- %s" --grep="^docs" >> "$notes_file" || true
    echo "" >> "$notes_file"
    echo "" >> "$notes_file"

    echo "### 🔧 Improvements" >> "$notes_file"
    git log $commit_range --pretty=format:"- %s" --grep="^refactor\|^perf\|^style" >> "$notes_file" || true
    echo "" >> "$notes_file"
    echo "" >> "$notes_file"

    echo "### 📦 Dependencies" >> "$notes_file"
    git log $commit_range --pretty=format:"- %s" --grep="^build\|^chore" >> "$notes_file" || true
    echo "" >> "$notes_file"
    echo "" >> "$notes_file"

    echo "### All Commits" >> "$notes_file"
    git log $commit_range --pretty=format:"- %h %s (%an)" >> "$notes_file"
    echo "" >> "$notes_file"

    print_success "Generated release notes: $notes_file" >&2
    echo "$notes_file"
}

# Update CHANGELOG.md
update_changelog() {
    local version=$1
    local notes_file=$2

    if [[ ! -f "$CHANGELOG_FILE" ]]; then
        echo "# Changelog" > "$CHANGELOG_FILE"
        echo "" >> "$CHANGELOG_FILE"
        echo "All notable changes to this project will be documented in this file." >> "$CHANGELOG_FILE"
        echo "" >> "$CHANGELOG_FILE"
    fi

    # Prepend new version to changelog
    {
        head -n 4 "$CHANGELOG_FILE"
        echo ""
        cat "$notes_file"
        echo ""
        tail -n +5 "$CHANGELOG_FILE"
    } > "${CHANGELOG_FILE}.tmp"

    mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"

    print_success "Updated CHANGELOG.md"
}

# Create release branch
create_release_branch() {
    local version=$1
    local branch_name="release/${version}"

    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
        print_warning "Branch ${branch_name} already exists"
        read -p "Delete and recreate? (y/N): " confirm
        if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
            git branch -D "$branch_name"
        else
            exit 1
        fi
    fi

    git checkout -b "$branch_name"
    print_success "Created release branch: $branch_name"
}

# Commit version changes
commit_version_bump() {
    local version=$1

    git add "$VERSION_FILE" "$CHANGELOG_FILE" "$RELEASE_NOTES_DIR"
    git commit -m "chore(release): bump version to ${version}

- Update VERSION file
- Generate CHANGELOG.md entry
- Add release notes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    print_success "Committed version bump to ${version}"
}

# Push release branch
push_release_branch() {
    local version=$1
    local branch_name="release/${version}"

    git push -u origin "$branch_name"
    print_success "Pushed ${branch_name} to origin"
}

# Merge to staging
merge_to_staging() {
    local version=$1
    local release_branch="release/${version}"

    print_info "Merging ${release_branch} to staging..."

    git checkout staging
    git pull origin staging
    git merge --no-ff "$release_branch" -m "chore(release): merge ${release_branch} to staging

Preparing v${version} for testing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    git push origin staging

    print_success "Merged to staging and pushed"
}

# Merge to main and create tag
merge_to_main_and_tag() {
    local version=$1

    print_info "Merging staging to main..."

    git checkout main
    git pull origin main
    git merge --no-ff staging -m "chore(release): release v${version}

Merge staging to main for production deployment.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

    # Create annotated tag
    local notes_file="$RELEASE_NOTES_DIR/v${version}.md"
    git tag -a "v${version}" -F "$notes_file"

    # Push main and tags
    git push origin main
    git push origin "v${version}"

    print_success "Merged to main, created tag v${version}, and pushed"
}

# Merge to production branch
merge_to_production() {
    local version=$1

    print_info "Merging main to production..."

    # Create production branch if it doesn't exist
    if ! git show-ref --verify --quiet "refs/heads/production"; then
        print_info "Creating production branch from main..."
        git checkout -b production main
    else
        git checkout production
        git pull origin production
    fi

    git merge --no-ff main -m "chore(release): deploy v${version} to production

Merge main to production for deployment.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

    git push -u origin production

    print_success "Merged to production and pushed"
}

# Create GitHub release (if gh CLI is available)
create_github_release() {
    local version=$1
    local notes_file="$RELEASE_NOTES_DIR/v${version}.md"

    if command -v gh &> /dev/null; then
        print_info "Creating GitHub release..."
        gh release create "v${version}" \
            --title "Release v${version}" \
            --notes-file "$notes_file"
        print_success "GitHub release created"
    else
        print_warning "GitHub CLI (gh) not found. Skipping GitHub release creation."
        print_info "You can create the release manually at:"
        print_info "https://github.com/Tilly57/Inventaire_SI/releases/new?tag=v${version}"
    fi
}

# Main workflow
main() {
    print_header

    # Pre-flight checks
    check_git_repo
    check_clean_working_tree

    # Get current version
    local current_version=$(get_current_version)

    # Determine bump type
    local bump_type=$1
    if [[ -z "$bump_type" ]]; then
        bump_type=$(select_version_type "$current_version")
    fi

    # Calculate new version
    local new_version=$(increment_version "$current_version" "$bump_type")

    echo ""
    print_info "Current version: ${current_version}"
    print_info "New version:     ${new_version}"
    print_info "Bump type:       ${bump_type}"
    echo ""

    read -p "Proceed with release? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        print_warning "Release cancelled"
        exit 0
    fi

    echo ""
    print_info "Starting release workflow..."
    echo ""

    # Step 1: Create release branch
    print_info "[1/8] Creating release branch..."
    create_release_branch "$new_version"

    # Step 2: Update version file
    print_info "[2/8] Updating version file..."
    update_version_file "$new_version"

    # Step 3: Generate changelog
    print_info "[3/8] Generating changelog and release notes..."
    local notes_file=$(generate_changelog_entry "$new_version")
    update_changelog "$new_version" "$notes_file"

    # Step 4: Commit changes
    print_info "[4/8] Committing version bump..."
    commit_version_bump "$new_version"

    # Step 5: Push release branch
    print_info "[5/8] Pushing release branch..."
    push_release_branch "$new_version"

    # Step 6: Merge to staging
    print_info "[6/8] Merging to staging..."
    merge_to_staging "$new_version"

    # Step 7: Ask about production deployment
    echo ""
    print_warning "Release branch merged to staging for testing."
    print_info "Test the changes on staging before deploying to production."
    echo ""
    read -p "Deploy to production (main + production branch) now? (y/N): " deploy_confirm

    if [[ "$deploy_confirm" == "y" || "$deploy_confirm" == "Y" ]]; then
        print_info "[7/8] Merging to main and tagging..."
        merge_to_main_and_tag "$new_version"
        create_github_release "$new_version"

        print_info "[8/8] Deploying to production branch..."
        merge_to_production "$new_version"

        # Return to main branch
        git checkout main

        echo ""
        print_success "Release v${new_version} completed successfully! 🎉"
        echo ""
        print_info "Summary:"
        print_info "  - Release branch: release/${new_version}"
        print_info "  - Staging: merged ✓"
        print_info "  - Main: merged ✓"
        print_info "  - Production: merged ✓"
        print_info "  - Tag: v${new_version} ✓"
        print_info "  - Release notes: ${notes_file}"
    else
        echo ""
        print_success "Release branch created and merged to staging! 🚀"
        echo ""
        print_info "Summary:"
        print_info "  - Release branch: release/${new_version}"
        print_info "  - Staging: merged ✓"
        print_info "  - Main: pending"
        print_info "  - Production: pending"
        echo ""
        print_warning "To deploy to production later, run:"
        echo "    ./scripts/deploy-production.sh ${new_version}"
    fi

    echo ""
}

# Run main workflow
main "$@"
