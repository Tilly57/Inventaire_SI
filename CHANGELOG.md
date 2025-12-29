# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2025-12-29

### Added

**Infrastructure de Tests Backend (Jest + Supertest)**
- Configuration Jest complète avec support ES Modules et cross-platform
- 11 tests unitaires auth service (register, login, JWT tokens) - 100% passants
- 14 tests unitaires loans service (create, close, soft delete)
- Tests d'intégration API endpoints (auth routes avec Supertest)
- Test utilities: `testUtils.js` (create test data), `apiTestUtils.js` (API helpers)
- Scripts NPM: `test`, `test:watch`, `test:coverage`, `test:unit`, `test:integration`
- Fichiers de configuration: `jest.config.js`, `.env.test`, setup files
- Support Windows avec `cross-env`
- Coverage: ~30% (auth service complet)

**Rate Limiting (Protection API)**
- Middleware `express-rate-limit` configuré avec 4 niveaux de protection:
  - **General limiter**: 100 requêtes / 15 minutes (toutes routes API)
  - **Auth limiter**: 5 requêtes / 15 minutes (protection brute force login/register)
  - **Mutation limiter**: 30 requêtes / 15 minutes (POST/PUT/PATCH/DELETE)
  - **Upload limiter**: 10 uploads / heure (signatures)
- Headers `RateLimit-*` standards dans les réponses
- Messages d'erreur en français
- Appliqué à `app.js` (general) et `auth.routes.js` (auth strict)

**Secrets Management**
- Externalisation complète des secrets de `docker-compose.yml`
- Fichiers `.env` créés (root, api, web) avec toutes les variables
- Fichiers `.env.example` templates avec instructions
- `.gitignore` complet pour protection des secrets (multi-niveaux)
- Variables sécurisées: `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- Documentation génération secrets forts: `openssl rand -base64 32`
- Protection contre commits accidentels de secrets

### Changed

**Docker Compose**
- Passage de secrets hardcodés à variables d'environnement `${VAR}`
- Lecture depuis `.env` root pour toutes les configurations
- Variables: database, JWT secrets, CORS, signatures directory

**Package.json (API)**
- Ajout de 5 nouveaux scripts de test
- Configuration cross-platform avec `cross-env`

### Security

- ✅ **Aucun secret hardcodé** - Tous externalisés dans .env (gitignored)
- ✅ **Protection brute force** - Max 5 tentatives login / 15 minutes
- ✅ **Protection DoS** - Rate limiting général 100 req / 15 minutes
- ✅ **Protection spam** - Limitations mutations et uploads
- ✅ **Tests automatisés** - Validation auth et business logic

### Documentation

- **IMPROVEMENTS_CRITIQUE.md** - Guide complet 30+ pages des améliorations
- **TODO.md** - Roadmap améliorations futures (CRITIQUE, IMPORTANT, RECOMMANDÉ, SOUHAITÉ)
- **README.md** - Section "Sécurité & Qualité" ajoutée
- Documentation technique rate limiting et tests
- Instructions setup production avec .env

### Dependencies

**Ajoutées:**
- `jest@^30.2.0` - Framework de tests
- `@jest/globals@^30.2.0` - Globals Jest pour ES Modules
- `supertest@^7.1.4` - Tests endpoints HTTP
- `@types/jest@^30.0.0` - Types Jest
- `@types/supertest@^6.0.3` - Types Supertest
- `cross-env@^10.1.0` - Variables env cross-platform
- `express-rate-limit@^8.2.1` - Rate limiting middleware

## [0.4.1] - 2025-12-29

### Fixed
- **UI Dashboard**: Changement de la couleur de l'icône "Équipements"
  - Ajout de la couleur 'info' (bleu) dans le composant StatsCard
  - Icône Équipements : danger (rouge) → info (bleu)
  - Meilleure distinction visuelle entre Employés (orange) et Équipements (bleu)

## [0.4.0] - 2025-12-29

### Added
- **Suppression en masse des modèles d'équipements (ADMIN uniquement)**:
  - Checkboxes multi-sélection dans la table des modèles (visible ADMIN uniquement)
  - Bouton "Supprimer (X)" pour suppression en masse
  - Dialogue `BulkDeleteAssetModelsDialog` avec détails et avertissements
  - Endpoint backend `POST /api/asset-models/batch-delete` (middleware `requireAdmin`)
  - Suppression cascade automatique : Modèle + AssetItems + StockItems
  - Transaction atomique pour garantir l'intégrité des données
  - Validation : bloque si équipements prêtés (status PRETE) ou stock prêté (loaned > 0)
  - Invalidation cache complète : assetModels, assetItems, stockItems
  - Toast avec compteurs de suppression (modèles, équipements, stock)

### Changed
- **Service AssetModels**: Modification de `deleteAssetModel()` pour suppression cascade
  - Suppression d'un modèle supprime désormais tous les AssetItems et StockItems associés
  - Protection : impossible si des équipements sont actuellement prêtés
  - Protection : impossible si des articles de stock sont actuellement prêtés

## [0.3.1] - 2025-12-29

### Fixed
- **UI**: Masquer les boutons de création d'équipements et de modèles
  - Bouton "Nouvel équipement" masqué dans la page Équipements
  - Bouton "Nouveau modèle" masqué dans la page Stock

## [0.3.0] - 2025-12-29

### Added
- **Soft Delete pour Prêts**: Conservation complète de l'historique
  - Migration Prisma: ajout de `deletedAt` et `deletedById` au modèle Loan
  - Prêts marqués comme supprimés au lieu d'être effacés définitivement
  - Conservation des signatures, lignes de prêt et traçabilité complète
  - Réversion automatique des statuts d'équipements (PRETE → EN_STOCK)
  - Restauration automatique des quantités en stock (quantity +1, loaned -1)
  - Traçabilité: qui a supprimé, quand, avec relation vers l'utilisateur

- **Impression Historique (ADMIN uniquement)**:
  - Nouveau bouton "Imprimer l'historique" visible uniquement pour les ADMIN
  - Dialogue de sélection: tout l'historique ou employé spécifique
  - Vue d'impression optimisée A4 avec format professionnel
  - Affichage détaillé: prêts, employés, articles, signatures, dates
  - Export PDF via boîte de dialogue d'impression du navigateur
  - Composant `PrintLoansHistoryDialog` pour la sélection
  - Composant `LoansPrintView` pour l'affichage imprimable

### Changed
- **Services Backend**: Adaptation pour soft delete
  - `deleteLoan()`: UPDATE au lieu de DELETE, conservation des données
  - `batchDeleteLoans()`: Suppression en masse avec soft delete
  - `getAllLoans()`: Filtre automatique `deletedAt: null`
  - Protection: toutes les fonctions de modification rejettent les prêts supprimés

- **Controllers**: Passage de `userId` pour traçabilité des suppressions

### Fixed
- **Validation**: Correction schéma batch delete (retrait wrapper `body` inutile)
- **UI**: Ajout composant manquant `radio-group.tsx`
- **Dependencies**: Installation `@radix-ui/react-radio-group`

## [0.2.3] - 2025-12-29

### Added
- **Scripts**: Automatisation complète de la création de GitHub release
  - `deploy-production.sh` crée automatiquement la release sans confirmation
  - Affichage du lien direct vers la release créée

### Removed
- **Scripts**: Suppression de `quick-commit.sh`
  - Respect strict du workflow de release (feature → staging → release.sh)
  - Pas de commits directs sur main

### Changed
- **Dashboard**: Code production-ready
  - Retrait des logs de debug de `getLowStockItemsApi()`
  - Performance optimisée

## [0.2.2] - 2025-12-29

### Added
- **Dashboard**: Carte "Alertes stock bas" affiche maintenant tous les types d'articles
  - Support unifié pour StockItems (consommables) ET AssetItems (équipements)
  - AssetItems groupés par modèle avec comptage des items EN_STOCK
  - Nouveau type `LowStockAlertItem` pour unifier les deux sources
  - Labels dynamiques : "disponible(s)" pour stock, "en stock" pour assets
  - Logs de debug détaillés pour troubleshooting

### Changed
- **API**: `getLowStockItemsApi()` récupère et combine les deux types d'articles
- **Logique d'alerte**:
  - StockItems: alerte si (quantity - loaned) < 2
  - AssetItems: alerte si nombre EN_STOCK par modèle < 2

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
