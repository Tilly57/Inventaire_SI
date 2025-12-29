# Scripts d'Automatisation - Inventaire SI

Ce dossier contient les scripts pour automatiser le workflow de développement, versioning et déploiement.

## 📋 Table des Matières

- [Scripts Disponibles](#scripts-disponibles)
- [Workflow de Release](#workflow-de-release)
- [Exemples d'Utilisation](#exemples-dutilisation)
- [Versioning Sémantique](#versioning-sémantique)

## 🛠️ Scripts Disponibles

### 1. `release.sh` - Gestion des Releases

Script principal pour créer une nouvelle version et gérer le workflow complet de release.

**Fonctionnalités** :
- ✅ Incrémentation automatique de version (MAJOR.MINOR.PATCH)
- ✅ Création de branche `release/X.Y.Z`
- ✅ Génération automatique du CHANGELOG
- ✅ Création de notes de release
- ✅ Merge automatique vers `staging`
- ✅ Option de déploiement vers `main`
- ✅ Création de tags Git
- ✅ Génération de GitHub releases (si `gh` CLI disponible)

**Usage** :
```bash
# Mode interactif (recommandé)
./scripts/release.sh

# Mode direct
./scripts/release.sh patch    # 0.1.0 -> 0.1.1
./scripts/release.sh minor    # 0.1.0 -> 0.2.0
./scripts/release.sh major    # 0.1.0 -> 1.0.0
```

### 2. `deploy-production.sh` - Déploiement en Production

Déploie une version déjà testée sur `staging` vers `main` (production).

**Usage** :
```bash
./scripts/deploy-production.sh 0.1.1
```

**Workflow** :
1. Merge `staging` → `main`
2. Création du tag `v0.1.1`
3. Push vers origin
4. Option de création de GitHub release

### 3. `quick-commit.sh` - Commits Rapides

Automatise les commits quotidiens avec messages formatés et signature.

**Usage** :
```bash
# Commit simple
./scripts/quick-commit.sh "feat: add user authentication"

# Commit + push
./scripts/quick-commit.sh "fix: correct login bug" --push

# Amend du dernier commit
./scripts/quick-commit.sh --amend

# Amend + force push
./scripts/quick-commit.sh --amend --push
```

**Fonctionnalités** :
- ✅ Stage automatique des fichiers
- ✅ Templates de messages (feat, fix, docs, etc.)
- ✅ Signature automatique des commits
- ✅ Push optionnel
- ✅ Support de `--amend`

## 🔄 Workflow de Release

### Workflow Standard

```
feature/xxx ─┐
             │
dev ─────────┴──> release/X.Y.Z ──> staging ──> main (+ tag vX.Y.Z)
```

### Étapes Détaillées

1. **Développement sur branche feature**
   ```bash
   git checkout -b feature/new-feature
   # Développement...
   ./scripts/quick-commit.sh "feat: add new feature" --push
   ```

2. **Création de la release**
   ```bash
   # Merge feature vers dev/staging
   git checkout staging
   git merge feature/new-feature

   # Lancer le script de release
   ./scripts/release.sh patch
   ```

3. **Le script automatise** :
   - ✅ Création de `release/0.1.1`
   - ✅ Mise à jour du fichier `VERSION`
   - ✅ Génération du `CHANGELOG.md`
   - ✅ Création de `.release-notes/v0.1.1.md`
   - ✅ Commit de version bump
   - ✅ Merge vers `staging`

4. **Tests sur staging**
   ```bash
   # L'équipe teste sur l'environnement staging
   # Si bugs trouvés, fix et re-merge
   ```

5. **Déploiement en production**
   ```bash
   # Option 1: Directement pendant release.sh (choix interactif)
   # Option 2: Plus tard avec deploy-production.sh
   ./scripts/deploy-production.sh 0.1.1
   ```

6. **Résultat final** :
   - ✅ Branch `main` à jour avec v0.1.1
   - ✅ Tag Git `v0.1.1` créé
   - ✅ CHANGELOG.md mis à jour
   - ✅ Release notes dans `.release-notes/`
   - ✅ GitHub release créée (optionnel)

## 📊 Versioning Sémantique

Le projet utilise le [Semantic Versioning 2.0.0](https://semver.org/).

### Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0) : Changements incompatibles (breaking changes)
- **MINOR** (0.1.0) : Nouvelles fonctionnalités (backward compatible)
- **PATCH** (0.0.1) : Corrections de bugs (backward compatible)

### Exemples

| Version | Type | Changement |
|---------|------|------------|
| 0.1.0 → 0.1.1 | PATCH | Fix d'un bug de connexion |
| 0.1.1 → 0.2.0 | MINOR | Ajout de la création en masse d'équipements |
| 0.2.0 → 1.0.0 | MAJOR | Refonte complète de l'API (breaking) |

## 📝 Exemples d'Utilisation

### Scénario 1: Nouvelle Fonctionnalité (Minor)

```bash
# 1. Développer la fonctionnalité
git checkout -b feature/bulk-import
# ... développement ...
./scripts/quick-commit.sh "feat: add bulk employee import" --push

# 2. Merger vers staging
git checkout staging
git merge feature/bulk-import

# 3. Créer une release
./scripts/release.sh minor
# Version: 0.1.0 → 0.2.0

# 4. Tester sur staging, puis déployer
./scripts/deploy-production.sh 0.2.0
```

### Scénario 2: Correction Urgente (Patch)

```bash
# 1. Fix sur une branche hotfix
git checkout -b hotfix/login-bug
# ... correction ...
./scripts/quick-commit.sh "fix: correct login validation" --push

# 2. Merger vers staging
git checkout staging
git merge hotfix/login-bug

# 3. Release patch
./scripts/release.sh patch
# Version: 0.2.0 → 0.2.1

# 4. Déployer immédiatement (confirmer "y" dans le script)
```

### Scénario 3: Commits Quotidiens

```bash
# Commit simple sans push
./scripts/quick-commit.sh "docs: update README"

# Commit avec push
./scripts/quick-commit.sh "style: format code" --push

# Amender le dernier commit
./scripts/quick-commit.sh --amend --push
```

## 📂 Structure des Fichiers Générés

```
inventaire_SI/
├── VERSION                      # Version actuelle (ex: 0.1.1)
├── CHANGELOG.md                 # Historique complet des versions
├── .release-notes/              # Notes de release par version
│   ├── v0.1.0.md
│   ├── v0.1.1.md
│   └── v0.2.0.md
└── scripts/
    ├── release.sh
    ├── deploy-production.sh
    ├── quick-commit.sh
    └── README.md (ce fichier)
```

## 🔧 Configuration

### Prérequis

1. **Git** installé et configuré
2. **Bash** (Git Bash sur Windows)
3. **GitHub CLI** (optionnel, pour les releases GitHub)
   ```bash
   # Installer gh CLI (optionnel)
   # Windows: winget install GitHub.cli
   # macOS: brew install gh
   # Linux: voir https://cli.github.com/
   ```

### Permissions

Rendre les scripts exécutables :

```bash
chmod +x scripts/*.sh
```

### Variables d'Environnement (Optionnel)

Aucune variable requise. Les scripts utilisent la configuration Git locale.

## 📌 Conventions de Commits

Les scripts encouragent l'utilisation des [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage de code
- `refactor:` - Refactorisation
- `perf:` - Optimisation de performance
- `test:` - Ajout de tests
- `chore:` - Tâches de maintenance
- `build:` - Build system
- `ci:` - CI/CD

**Exemple** :
```bash
./scripts/quick-commit.sh "feat(auth): add JWT refresh token rotation" --push
```

## 🆘 Dépannage

### Le script ne s'exécute pas

```bash
# Vérifier les permissions
ls -la scripts/

# Rendre exécutable
chmod +x scripts/release.sh

# Exécuter avec bash explicitement
bash scripts/release.sh
```

### Erreur "Not a git repository"

```bash
# Vérifier que vous êtes dans le bon répertoire
pwd
git status
```

### Erreur "You have uncommitted changes"

```bash
# Commit ou stash vos changements
git status
./scripts/quick-commit.sh "wip: work in progress"
# Ou
git stash
```

### GitHub CLI non trouvé

```bash
# Installer gh CLI ou créer la release manuellement
# Le script fournira l'URL pour créer la release sur GitHub
```

## 🚀 Prochaines Améliorations

- [ ] Support des pre-releases (alpha, beta, rc)
- [ ] Intégration avec CI/CD (GitHub Actions)
- [ ] Validation automatique des tests avant release
- [ ] Génération automatique de migration database
- [ ] Rollback automatique en cas d'échec

## 📚 Ressources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub CLI](https://cli.github.com/)

---

**Note** : Ces scripts sont conçus pour le projet Inventaire SI et suivent les conventions établies dans le projet.
