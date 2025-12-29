# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2025-12-29

### Fixed
- **Dashboard**: Correction du seuil de stock bas incohérent
  - Synchronisation de `LOW_STOCK_THRESHOLD` entre l'API (5) et le composant (2)
  - Import de la constante depuis `constants.ts` (valeur unifiée: 2)
  - Mise à jour de la documentation JSDoc

### Changed
- **CI/CD**: Optimisation du workflow GitHub Actions Claude Code
  - Validation préalable (skip bots, drafts, WIP)
  - Caching multi-niveaux (npm, Python, contexte Claude)
  - Auto-labeling basé sur fichiers modifiés
  - Documentation complète du workflow (450+ lignes)

### Documentation
- **README.md**: Réécriture complète avec badges et informations v0.2.0
  - Badges version, license, node, TypeScript
  - Section nouveautés v0.2.0
  - Documentation architecture et installation
  - Guide des scripts d'automatisation

## [0.2.0] - 2024-12-29

### Added

**Automatisation & DevOps**
- Scripts d'automatisation pour le workflow de release (release.sh, deploy-production.sh, quick-commit.sh)
- Système de versioning sémantique (MAJOR.MINOR.PATCH)
- Génération automatique de CHANGELOG et release notes
- Documentation complète workflow (RELEASE_WORKFLOW.md, scripts/README.md)

**Documentation**
- Documentation JSDoc complète (95% - 38/40 fichiers)
- Backend: 7 services, 3 middlewares, 3 controllers, 3 utils
- Frontend: 8 API clients, 8 hooks, 4 composants, 2 config
- COMMENTING_GUIDE.md avec templates et bonnes pratiques

**Fonctionnalités Core**
- Création en masse d'équipements avec tags séquentiels auto-générés
- Import Excel d'employés avec génération auto d'emails et sanitization
- Dashboard enrichi avec stats temps réel et alertes stock bas
- Gestion complète des prêts avec signatures numériques
- Suivi des quantités prêtées pour articles de stock

**Interface Utilisateur**
- Charte graphique Groupe Tilly (Orange #EE2722, Noir #231F20)
- Logo personnalisé (header, login, favicon)
- Pagination universelle sur toutes les listes
- Sélection multiple avec checkboxes
- Navigation mobile responsive
- Skeleton loaders pour états de chargement

**Architecture Technique**
- Système d'erreurs personnalisées (AppError, ValidationError, etc.)
- JWT dual-token strategy (access 15min, refresh 7d)
- Middlewares robustes (auth, RBAC, errorHandler)
- React Query pour cache et synchronisation
- Validation Zod complète frontend/backend

### Changed
- StockItems référencent maintenant AssetModels (refactorisation majeure)
- Schéma Prisma avec champ `loaned` pour tracking quantités
- Formulaire équipements en mode conditionnel (simple/bulk)

### Fixed
- Correction erreurs TypeScript pour build frontend
- Fix affichage modèle et reset formulaires
- Correction champ modelId → assetModelId
- Extraction correcte assetModel dans controllers
- Prévention doublons import Excel

### Security
- Routes protégées avec RBAC (ADMIN, GESTIONNAIRE, LECTURE)
- Tokens httpOnly cookies (protection XSS)
- Messages d'erreur génériques (prévention email enumeration)
- Validation inputs stricte (Zod + Prisma)

## [0.1.0] - 2024-01-XX

### Added
- Initial release
- Système de gestion d'inventaire IT
- Gestion des équipements (AssetItems) et modèles (AssetModels)
- Gestion des stocks consommables (StockItems)
- Gestion des employés avec import Excel
- Système de prêts avec signatures numériques
- Dashboard avec statistiques
- Authentication JWT avec refresh tokens
- RBAC (Role-Based Access Control)
- API REST complète
- Frontend React avec TypeScript
- Docker Compose pour développement

---

**Légende** :
- `Added` - Nouvelles fonctionnalités
- `Changed` - Modifications de fonctionnalités existantes
- `Deprecated` - Fonctionnalités bientôt supprimées
- `Removed` - Fonctionnalités supprimées
- `Fixed` - Corrections de bugs
- `Security` - Corrections de sécurité
