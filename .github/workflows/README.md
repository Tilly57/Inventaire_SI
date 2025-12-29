# GitHub Actions Workflows

Documentation des workflows automatisés pour le projet Inventaire SI.

## 📋 Table des Matières

- [Claude Code Assistant](#claude-code-assistant)
- [Configuration Requise](#configuration-requise)
- [Utilisation](#utilisation)
- [Troubleshooting](#troubleshooting)

---

## 🤖 Claude Code Assistant

### Vue d'Ensemble

Le workflow `claude-code.yml` active automatiquement Claude Code Assistant pour:
- ✅ Analyser les Pull Requests
- ✅ Répondre aux questions dans les issues
- ✅ Suggérer des améliorations de code
- ✅ Vérifier le respect des standards de documentation
- ✅ Aider avec le workflow de release

### Déclencheurs

Le workflow s'exécute automatiquement sur:

| Événement | Description |
|-----------|-------------|
| `pull_request` | Ouverture, mise à jour, réouverture, édition de PR |
| `issues` | Ouverture, édition, ajout de label |
| `issue_comment` | Création ou édition de commentaire |
| `pull_request_review` | Soumission de review |
| `workflow_dispatch` | Déclenchement manuel |

**Branches surveillées:**
- `main`
- `staging`
- `release/**`

### Architecture

Le workflow est composé de 3 jobs:

#### 1. `validate` - Validation Préalable (5 min)

Vérifie si Claude doit s'exécuter:
- ❌ Skip si l'auteur est un bot
- ❌ Skip si la PR est en mode Draft ou WIP
- ✅ Détermine le type de contexte (PR/Issue/Comment)

#### 2. `claude-code` - Analyse Principale (30 min)

Steps:
1. **Checkout** du repository (historique complet)
2. **Setup** Node.js 18.x avec cache npm
3. **Setup** Python 3.11 pour outils d'analyse
4. **Cache** du contexte Claude (perf)
5. **Préparation** du contexte projet
6. **Exécution** de Claude Code Assistant
7. **Analyse** du résultat
8. **Labeling** automatique basé sur fichiers modifiés
9. **Upload** des artifacts pour debugging

#### 3. `notify` - Notification

Poste un commentaire avec le résultat de l'analyse.

### Configuration

#### Fichiers de Contexte

Claude reçoit automatiquement:
- `CLAUDE.md` - Instructions principales
- `COMMENTING_GUIDE.md` - Standards de documentation
- `RELEASE_WORKFLOW.md` - Guide de release
- `VERSION` - Version actuelle
- `CHANGELOG.md` - Historique
- `.claude-context.md` - Contexte généré dynamiquement

#### Modèle et Paramètres

```yaml
model: claude-sonnet-4.5
max-tokens: 8000
temperature: 0.7
```

#### Langages Supportés

- JavaScript
- TypeScript
- Prisma
- Markdown

#### Fichiers Ignorés

```
node_modules/**
dist/**
build/**
.next/**
coverage/**
*.lock
*.log
```

### Optimisations

#### 🚀 Performance

- **Caching npm**: Accélère les builds (30-40% plus rapide)
- **Caching Claude context**: Évite de recharger le contexte
- **Fetch depth 0**: Historique complet pour meilleure analyse
- **Concurrency control**: Un seul Claude par PR/Issue

#### 💰 Coûts

- **Validation préalable**: Évite les runs inutiles
- **Timeout 30 min**: Limite les runs qui bloquent
- **Skip bots/drafts**: Réduit les appels API
- **Continue on error**: Ne bloque pas les autres workflows

#### 🏷️ Labels Automatiques

Les labels suivants sont ajoutés automatiquement basés sur les fichiers modifiés:

| Label | Condition |
|-------|-----------|
| `backend` | Fichiers dans `apps/api/` |
| `frontend` | Fichiers dans `apps/web/` |
| `documentation` | Fichiers `.md` |
| `automation` | Fichiers dans `scripts/` |

### Artifacts

Chaque run génère des artifacts pour debugging:
- `.claude-context.md` - Contexte utilisé
- `.claude-cache/` - Cache Claude
- **Rétention**: 7 jours

Accès: Actions → Workflow run → Artifacts

---

## ⚙️ Configuration Requise

### Secrets GitHub

| Secret | Description | Requis |
|--------|-------------|--------|
| `ANTHROPIC_API_KEY` | Clé API Anthropic Claude | ✅ Oui |
| `GITHUB_TOKEN` | Token GitHub (auto-fourni) | ✅ Oui |

#### Ajouter ANTHROPIC_API_KEY

1. Aller sur https://console.anthropic.com/
2. Créer une API Key
3. Dans GitHub: Settings → Secrets and variables → Actions
4. Cliquer "New repository secret"
5. Nom: `ANTHROPIC_API_KEY`
6. Valeur: Votre clé API
7. Cliquer "Add secret"

### Permissions

Le workflow nécessite les permissions suivantes:

```yaml
permissions:
  contents: write          # Créer des commits
  issues: write            # Commenter les issues
  pull-requests: write     # Commenter les PRs
  checks: write            # Créer des checks
  statuses: write          # Mettre à jour les statuts
```

Ces permissions sont déjà configurées dans le workflow.

---

## 💻 Utilisation

### Utilisation Automatique

Le workflow s'exécute automatiquement. Aucune action requise!

**Exemple:**
1. Créer une Pull Request
2. Claude analyse automatiquement les changements
3. Claude poste des commentaires avec suggestions
4. Les labels sont ajoutés automatiquement

### Utilisation Manuelle

Déclencher manuellement le workflow:

1. Aller sur **Actions** → **Claude Code Assistant**
2. Cliquer **"Run workflow"**
3. Sélectionner la branche
4. Remplir les inputs:
   - **target_type**: `pr` ou `issue`
   - **target_number**: Numéro de la PR ou Issue
5. Cliquer **"Run workflow"**

### Désactiver Temporairement

Plusieurs méthodes:

#### Méthode 1: Message de Commit
```bash
git commit -m "feat: add feature [skip ci]"
```

#### Méthode 2: Mode Draft
Mettre la PR en mode Draft (brouillon)

#### Méthode 3: Préfixe WIP
```
WIP: Add new feature
```

#### Méthode 4: Désactiver le Workflow
Dans `.github/workflows/claude-code.yml`:
```yaml
on:
  workflow_dispatch:  # Seulement manuel
```

---

## 🔧 Troubleshooting

### Problèmes Courants

#### 1. Workflow ne se déclenche pas

**Causes possibles:**
- ❌ PR est en mode Draft
- ❌ Titre commence par "WIP"
- ❌ Auteur est un bot
- ❌ Branche non surveillée (feature/xxx)

**Solution:**
- Retirer le mode Draft
- Retirer "WIP" du titre
- Vérifier la branche cible

#### 2. Erreur "API Key invalid"

**Cause:** `ANTHROPIC_API_KEY` incorrect ou expiré

**Solution:**
1. Vérifier le secret dans Settings → Secrets
2. Regénérer une nouvelle clé sur console.anthropic.com
3. Mettre à jour le secret

#### 3. Workflow timeout après 30 min

**Cause:** Analyse trop longue

**Solution:**
- Vérifier les fichiers ignorés (node_modules?)
- Réduire la taille de la PR
- Augmenter le timeout dans le workflow

#### 4. Labels non ajoutés

**Cause:** Permission manquante

**Solution:**
Vérifier que le workflow a la permission `pull-requests: write`

#### 5. Pas de commentaire Claude

**Causes possibles:**
- ❌ Claude n'a rien trouvé à commenter
- ❌ Erreur dans l'exécution
- ❌ Job `notify` a échoué

**Solution:**
Vérifier les logs du workflow dans Actions

### Logs et Debugging

#### Voir les Logs

1. Aller sur **Actions**
2. Cliquer sur le workflow run
3. Cliquer sur un job
4. Développer les steps

#### Télécharger les Artifacts

1. Aller sur **Actions**
2. Cliquer sur le workflow run
3. Scroll vers le bas → **Artifacts**
4. Télécharger `claude-analysis-XXX`

#### Mode Debug

Ajouter des secrets pour activer le mode debug:

```
ACTIONS_RUNNER_DEBUG = true
ACTIONS_STEP_DEBUG = true
```

---

## 📊 Métriques et Monitoring

### Voir les Statistiques

**GitHub Actions** → **Insights** → **Actions**

Métriques disponibles:
- Nombre de runs
- Durée moyenne
- Taux de succès
- Coût (si applicable)

### Optimisation des Coûts

| Optimisation | Impact |
|--------------|--------|
| Skip bots/drafts | -30% runs |
| Caching | -20% temps |
| Validation préalable | -15% runs |
| Concurrency control | Évite doublons |

**Estimation:**
- ~5-10 runs/jour
- ~10-15 min/run
- Coût Claude: ~$0.01-0.05/run

---

## 🚀 Améliorations Futures

Fonctionnalités planifiées:

- [ ] Intégration avec tests automatisés
- [ ] Analyse de sécurité (vulnerabilités)
- [ ] Suggestions de refactoring
- [ ] Génération automatique de release notes
- [ ] Validation du respect des conventions de commit
- [ ] Détection automatique de breaking changes
- [ ] Intégration avec Slack/Discord
- [ ] Rapports hebdomadaires de qualité

---

## 📚 Ressources

### Documentation

- [GitHub Actions](https://docs.github.com/en/actions)
- [Claude API](https://docs.anthropic.com/)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Projet

- [README.md](../../README.md) - Documentation principale
- [CLAUDE.md](../../CLAUDE.md) - Instructions Claude
- [COMMENTING_GUIDE.md](../../COMMENTING_GUIDE.md) - Standards de doc
- [RELEASE_WORKFLOW.md](../../RELEASE_WORKFLOW.md) - Workflow de release

---

**Dernière mise à jour:** 2024-12-29
**Version:** 1.0.0
**Maintenu par:** Équipe Inventaire SI
