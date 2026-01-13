/**
 * Asset Items routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import {
  getAllAssetItems,
  getAssetItemById,
  createAssetItem,
  createAssetItemsBulk,
  previewBulkCreation,
  updateAssetItem,
  updateAssetItemStatus,
  deleteAssetItem
} from '../controllers/assetItems.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import {
  createAssetItemSchema,
  createAssetItemsBulkSchema,
  bulkPreviewSchema,
  updateAssetItemSchema,
  updateStatusSchema
} from '../validators/assetItems.validator.js';

const router = express.Router();

// All asset item routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

// Bulk routes - MUST be before GET /:id to avoid "bulk" being interpreted as an ID
/**
 * @swagger
 * /api/asset-items/bulk/preview:
 *   get:
 *     summary: Prévisualiser une création en masse d'articles
 *     tags: [Asset Items]
 *     description: |
 *       Génère une prévisualisation des asset tags pour une création en masse.
 *       Utile pour vérifier les numéros avant de créer les articles.
 *     parameters:
 *       - in: query
 *         name: assetModelId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du modèle d'équipement
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'articles à créer (max 100)
 *     responses:
 *       200:
 *         description: Prévisualisation des asset tags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preview:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["AST-00001", "AST-00002", "AST-00003"]
 *                 quantity:
 *                   type: integer
 *                   example: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/bulk/preview', validate(bulkPreviewSchema, 'query'), previewBulkCreation);

/**
 * @swagger
 * /api/asset-items/bulk:
 *   post:
 *     summary: Créer plusieurs articles d'équipement en masse
 *     tags: [Asset Items]
 *     description: |
 *       Création en masse d'articles avec génération automatique des asset tags.
 *       Les asset tags sont séquentiels (AST-00001, AST-00002, etc.).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetModelId
 *               - quantity
 *             properties:
 *               assetModelId:
 *                 type: string
 *                 example: clk123456789
 *                 description: ID du modèle d'équipement
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 10
 *                 description: Nombre d'articles à créer (max 100)
 *               serialNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["SN123", "SN124", "SN125"]
 *                 description: Numéros de série (optionnel)
 *     responses:
 *       201:
 *         description: Articles créés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 10 articles créés avec succès
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk', validate(createAssetItemsBulkSchema), createAssetItemsBulk);

// Standard CRUD routes
/**
 * @swagger
 * /api/asset-items:
 *   get:
 *     summary: Obtenir la liste de tous les articles d'équipement
 *     tags: [Asset Items]
 *     description: |
 *       Retourne tous les articles avec pagination optionnelle.
 *       Supporte les filtres de recherche et tri.
 *       **Cached 5min** - Invalidé après mutations.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans assetTag, serialNumber
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EN_STOCK, PRETE, HS, REPARATION]
 *         description: Filtrer par statut
 *       - in: query
 *         name: assetModelId
 *         schema:
 *           type: string
 *         description: Filtrer par modèle
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Champ de tri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri
 *     responses:
 *       200:
 *         description: Liste des articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       assetTag:
 *                         type: string
 *                         example: AST-00042
 *                       serialNumber:
 *                         type: string
 *                         example: SN123456789
 *                       status:
 *                         type: string
 *                         enum: [EN_STOCK, PRETE, HS, REPARATION]
 *                         example: EN_STOCK
 *                       assetModel:
 *                         type: object
 *                         description: Modèle associé
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', getAllAssetItems);

/**
 * @swagger
 * /api/asset-items/{id}:
 *   get:
 *     summary: Obtenir les détails d'un article
 *     tags: [Asset Items]
 *     description: Retourne un article avec son modèle et historique de prêts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'article (CUID)
 *     responses:
 *       200:
 *         description: Détails de l'article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 assetTag:
 *                   type: string
 *                 serialNumber:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [EN_STOCK, PRETE, HS, REPARATION]
 *                 assetModel:
 *                   type: object
 *                   description: Modèle complet
 *                 loanLines:
 *                   type: array
 *                   description: Historique des prêts
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', getAssetItemById);

/**
 * @swagger
 * /api/asset-items:
 *   post:
 *     summary: Créer un nouvel article d'équipement
 *     tags: [Asset Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetModelId
 *             properties:
 *               assetModelId:
 *                 type: string
 *                 example: clk123456789
 *                 description: ID du modèle d'équipement
 *               serialNumber:
 *                 type: string
 *                 example: SN123456789
 *                 description: Numéro de série (optionnel)
 *               status:
 *                 type: string
 *                 enum: [EN_STOCK, PRETE, HS, REPARATION]
 *                 default: EN_STOCK
 *                 example: EN_STOCK
 *     responses:
 *       201:
 *         description: Article créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 assetTag:
 *                   type: string
 *                   example: AST-00042
 *                 serialNumber:
 *                   type: string
 *                 status:
 *                   type: string
 *                 assetModelId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validate(createAssetItemSchema), createAssetItem);

/**
 * @swagger
 * /api/asset-items/{id}:
 *   patch:
 *     summary: Mettre à jour un article
 *     tags: [Asset Items]
 *     description: Modification partielle d'un article d'équipement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'article (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 example: SN987654321
 *               status:
 *                 type: string
 *                 enum: [EN_STOCK, PRETE, HS, REPARATION]
 *                 example: REPARATION
 *     responses:
 *       200:
 *         description: Article mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 assetTag:
 *                   type: string
 *                 serialNumber:
 *                   type: string
 *                 status:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/:id', validate(updateAssetItemSchema), updateAssetItem);

/**
 * @swagger
 * /api/asset-items/{id}/status:
 *   patch:
 *     summary: Mettre à jour uniquement le statut d'un article
 *     tags: [Asset Items]
 *     description: |
 *       Endpoint dédié à la mise à jour du statut.
 *       Plus rapide que PATCH /:id pour les changements de statut fréquents.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'article (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [EN_STOCK, PRETE, HS, REPARATION]
 *                 example: HS
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/:id/status', validate(updateStatusSchema), updateAssetItemStatus);

/**
 * @swagger
 * /api/asset-items/{id}:
 *   delete:
 *     summary: Supprimer un article
 *     tags: [Asset Items]
 *     description: Suppression d'un article (attention aux prêts en cours)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'article (CUID)
 *     responses:
 *       200:
 *         description: Article supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Article supprimé avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Impossible de supprimer (prêts en cours)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id', deleteAssetItem);

export default router;
