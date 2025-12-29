# Guide de Démarrage - Workflow de Release

Ce guide explique comment utiliser les scripts d'automatisation pour gérer les releases du projet Inventaire SI.

## 🚀 Démarrage Rapide

### Première Release (v0.1.1)

```bash
# 1. Assurez-vous d'être sur staging avec tous les changements mergés
git checkout staging
git pull origin staging

# 2. Lancez le script de release
./scripts/release.sh patch

# 3. Le script vous guidera interactivement :
#    - Confirme la version (0.1.0 → 0.1.1)
#    - Crée la branche release/0.1.1
#    - Génère le CHANGELOG et les release notes
#    - Merge vers staging
#    - Demande si vous voulez déployer en production (main)

# 4. Choisissez "N" pour tester d'abord sur staging
#    Ou "Y" pour déployer immédiatement en production
```

### Résultat de la Première Release

Après exécution, vous aurez :

```
✓ Branche release/0.1.1 créée
✓ VERSION mise à jour (0.1.1)
✓ CHANGELOG.md mis à jour
✓ Notes de release générées (.release-notes/v0.1.1.md)
✓ Commit de version bump créé
✓ Merge vers staging effectué
✓ Push vers origin/staging
```

Si vous avez choisi de déployer en production :
```
✓ Merge vers main effectué
✓ Tag v0.1.1 créé
✓ Push vers origin/main
✓ Tag v0.1.1 pushé
✓ GitHub release créée (si gh CLI disponible)
```

## 📋 Workflow Complet - Exemple Réel

### Scénario : Ajouter une nouvelle fonctionnalité

```bash
# === PHASE 1: DÉVELOPPEMENT ===

# 1. Créer une branche feature
git checkout -b feature/export-excel
git push -u origin feature/export-excel

# 2. Développer la fonctionnalité
# ... éditer les fichiers ...

# 3. Commits réguliers avec quick-commit
./scripts/quick-commit.sh "feat(export): add Excel export for assets" --push
./scripts/quick-commit.sh "feat(export): add export button to UI" --push
./scripts/quick-commit.sh "docs: update README with export feature" --push

# === PHASE 2: MERGE VERS STAGING ===

# 4. Merger la feature vers staging
git checkout staging
git pull origin staging
git merge feature/export-excel
git push origin staging

# === PHASE 3: CRÉER LA RELEASE ===

# 5. Lancer le script de release (version MINOR car nouvelle feature)
./scripts/release.sh minor
# Version passe de 0.1.1 → 0.2.0

# 6. Le script crée automatiquement :
#    - release/0.2.0
#    - CHANGELOG.md avec "✨ Features: add Excel export"
#    - .release-notes/v0.2.0.md
#    - Merge vers staging

# 7. Choisir "N" pour ne PAS déployer en prod tout de suite

# === PHASE 4: TESTS SUR STAGING ===

# 8. Tester sur l'environnement staging
# L'équipe QA teste la nouvelle feature

# Si bug trouvé :
git checkout -b hotfix/export-bug
./scripts/quick-commit.sh "fix(export): correct column headers" --push
git checkout staging
git merge hotfix/export-bug
# Re-créer une release PATCH
./scripts/release.sh patch  # 0.2.0 → 0.2.1

# === PHASE 5: DÉPLOIEMENT PRODUCTION ===

# 9. Une fois les tests OK, déployer en production
./scripts/deploy-production.sh 0.2.1

# 10. Résultat :
#     - main à jour avec v0.2.1
#     - Tag v0.2.1 créé
#     - GitHub release publiée
```

## 🔄 Cas d'Usage Courants

### 1. Correction de Bug Urgent (Hotfix)

```bash
# Bug critique en production !

# 1. Créer une branche hotfix
git checkout -b hotfix/login-crash
git push -u origin hotfix/login-crash

# 2. Corriger le bug
./scripts/quick-commit.sh "fix(auth): prevent crash on invalid token" --push

# 3. Merger vers staging
git checkout staging
git merge hotfix/login-crash
git push origin staging

# 4. Release PATCH immédiate
./scripts/release.sh patch
# Choisir "Y" pour déployer immédiatement en prod

# 5. Vérifier que le tag est créé
git tag -l
# Devrait afficher v0.2.2

# 6. Vérifier sur GitHub
# https://github.com/Tilly57/Inventaire_SI/releases
```

### 2. Multiple Features en Parallèle

```bash
# Deux développeurs travaillent sur des features différentes

# Développeur 1
git checkout -b feature/pdf-export
./scripts/quick-commit.sh "feat: add PDF export" --push

# Développeur 2
git checkout -b feature/email-notifications
./scripts/quick-commit.sh "feat: add email notifications" --push

# Merge vers staging (feature par feature)
git checkout staging
git merge feature/pdf-export
git merge feature/email-notifications

# Une seule release MINOR qui inclut les deux features
./scripts/release.sh minor
# 0.2.1 → 0.3.0
# Le CHANGELOG listera automatiquement les deux features
```

### 3. Release Majeure (Breaking Changes)

```bash
# Refonte de l'API (breaking changes)

git checkout -b feature/api-v2
./scripts/quick-commit.sh "feat!: redesign REST API structure" --push
./scripts/quick-commit.sh "feat!: change authentication flow" --push

git checkout staging
git merge feature/api-v2

# Release MAJOR
./scripts/release.sh major
# 0.3.0 → 1.0.0

# Le CHANGELOG indiquera clairement les breaking changes
```

## 📊 Vérifications Avant Release

### Checklist Pré-Release

```bash
# 1. Vérifier qu'il n'y a pas de changements non commités
git status
# Devrait afficher "working tree clean"

# 2. Vérifier que staging est à jour
git checkout staging
git pull origin staging

# 3. Vérifier les commits depuis la dernière release
git log $(git describe --tags --abbrev=0)..HEAD --oneline
# Liste tous les commits qui seront dans la release

# 4. Vérifier que les tests passent (si automatisés)
npm test  # ou autre commande de test

# 5. Lancer la release
./scripts/release.sh
```

### Checklist Post-Release (Staging)

```bash
# 1. Vérifier que la branche release existe
git branch -a | grep release

# 2. Vérifier que staging est à jour
git log staging -1
# Devrait afficher "chore(release): merge release/X.Y.Z to staging"

# 3. Vérifier le CHANGELOG
cat CHANGELOG.md | head -n 30

# 4. Vérifier les release notes
ls -la .release-notes/
cat .release-notes/v0.1.1.md

# 5. Tester sur staging
# ... tests manuels ou automatisés ...
```

### Checklist Post-Déploiement (Production)

```bash
# 1. Vérifier que main est à jour
git log main -1
# Devrait afficher "chore(release): release vX.Y.Z"

# 2. Vérifier que le tag existe
git tag -l | grep v0.1.1

# 3. Vérifier sur GitHub
# https://github.com/Tilly57/Inventaire_SI/tags
# https://github.com/Tilly57/Inventaire_SI/releases

# 4. Vérifier l'application en production
# ... tests smoke ...
```

## 🛠️ Commandes Utiles

### Voir l'Historique des Versions

```bash
# Lister tous les tags
git tag -l

# Voir les détails d'un tag
git show v0.1.1

# Voir les commits d'une version
git log v0.1.0..v0.1.1 --oneline

# Comparer deux versions
git diff v0.1.0 v0.1.1 --stat
```

### Annuler une Release (Avant Prod)

```bash
# Si release mergée vers staging mais PAS encore en prod

# 1. Supprimer la branche release locale et remote
git branch -D release/0.1.1
git push origin --delete release/0.1.1

# 2. Reset staging au commit précédent
git checkout staging
git reset --hard HEAD~1  # ATTENTION : perte des commits
git push origin staging --force-with-lease

# 3. Recommencer la release correctement
./scripts/release.sh
```

### Rollback Production (Après Déploiement)

```bash
# En cas de bug critique après déploiement

# Option 1: Revert du merge
git checkout main
git revert -m 1 HEAD  # Revert le merge commit
git push origin main

# Option 2: Reset hard (DANGEREUX)
git checkout main
git reset --hard v0.1.0  # Retour à la version précédente
git push origin main --force  # ATTENTION : force push

# Option 3: Hotfix immédiat (RECOMMANDÉ)
# Corriger le bug et faire une release PATCH
./scripts/release.sh patch
```

## 📚 Ressources

### Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `VERSION` | Version actuelle du projet |
| `CHANGELOG.md` | Historique de toutes les versions |
| `.release-notes/` | Notes détaillées par version |
| `scripts/release.sh` | Script principal de release |
| `scripts/deploy-production.sh` | Déploiement production |
| `scripts/quick-commit.sh` | Commits rapides |

### Documentation

- [scripts/README.md](scripts/README.md) - Documentation complète des scripts
- [COMMENTING_GUIDE.md](COMMENTING_GUIDE.md) - Guide de documentation du code
- [Semantic Versioning](https://semver.org/) - Standard de versioning
- [Conventional Commits](https://www.conventionalcommits.org/) - Format des commits

## 🎯 Bonnes Pratiques

### DO ✅

- ✅ Toujours tester sur staging avant production
- ✅ Utiliser les types de commit conventionnels (feat, fix, docs, etc.)
- ✅ Vérifier le CHANGELOG généré avant de déployer
- ✅ Éditer les release notes si besoin (ajouter contexte, breaking changes)
- ✅ Créer des releases régulièrement (ne pas accumuler trop de commits)
- ✅ Utiliser PATCH pour bugs, MINOR pour features, MAJOR pour breaking

### DON'T ❌

- ❌ Ne pas skipper les tests sur staging
- ❌ Ne pas forcer les pushs sur main sans raison
- ❌ Ne pas modifier VERSION manuellement (laisser le script gérer)
- ❌ Ne pas commit directement sur staging/main (passer par des branches)
- ❌ Ne pas supprimer les tags sans excellente raison
- ❌ Ne pas créer de release sans avoir mergé toutes les features prévues

---

**Questions ?** Consultez [scripts/README.md](scripts/README.md) pour plus de détails.
