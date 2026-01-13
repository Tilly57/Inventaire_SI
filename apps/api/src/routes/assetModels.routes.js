/**
 * Asset Models routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllAssetModels, getAssetModelById, createAssetModel, updateAssetModel, deleteAssetModel, batchDeleteAssetModels } from '../controllers/assetModels.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager, requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createAssetModelSchema, updateAssetModelSchema, batchDeleteAssetModelsSchema } from '../validators/assetModels.validator.js';

const router = express.Router();

// All asset model routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

/**
 * @swagger
 * /api/asset-models:
 *   get:
 *     summary: Obtenir la liste de tous les modèles d'équipement
 *     tags: [Asset Models]
 *     description: |
 *       Retourne tous les modèles (templates) avec pagination optionnelle.
 *       Supporte les filtres de recherche et tri.
 *       **Cached 10min** - Invalidé après mutations.
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
 *         description: Recherche dans type, brand, modelName
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type (laptop, monitor, etc.)
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
 *         description: Liste des modèles
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
 *                       type:
 *                         type: string
 *                         example: laptop
 *                       brand:
 *                         type: string
 *                         example: Dell
 *                       modelName:
 *                         type: string
 *                         example: Latitude 5520
 *                       specs:
 *                         type: object
 *                         example: { cpu: "i5-1145G7", ram: "16GB" }
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       _count:
 *                         type: object
 *                         properties:
 *                           assetItems:
 *                             type: integer
 *                             description: Nombre d'articles liés
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', getAllAssetModels);

/**
 * @swagger
 * /api/asset-models:
 *   post:
 *     summary: Créer un nouveau modèle d'équipement
 *     tags: [Asset Models]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - brand
 *               - modelName
 *             properties:
 *               type:
 *                 type: string
 *                 example: laptop
 *                 description: Type d'équipement (laptop, monitor, phone, etc.)
 *               brand:
 *                 type: string
 *                 example: Dell
 *               modelName:
 *                 type: string
 *                 example: Latitude 5520
 *               specs:
 *                 type: object
 *                 example: { cpu: "i5-1145G7", ram: "16GB", storage: "512GB SSD" }
 *                 description: Spécifications techniques (JSON libre)
 *     responses:
 *       201:
 *         description: Modèle créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 modelName:
 *                   type: string
 *                 specs:
 *                   type: object
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
router.post('/', validate(createAssetModelSchema), createAssetModel);

// Batch delete route - ADMIN only (must be BEFORE /:id route)
/**
 * @swagger
 * /api/asset-models/batch-delete:
 *   post:
 *     summary: Supprimer plusieurs modèles en masse
 *     tags: [Asset Models]
 *     description: |
 *       Suppression en masse de modèles.
 *       **Réservé aux ADMIN uniquement.**
 *       IMPORTANT: Cette route doit être avant /:id dans le routeur.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["clk123", "clk456", "clk789"]
 *                 description: Tableau d'IDs de modèles à supprimer
 *     responses:
 *       200:
 *         description: Modèles supprimés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 3 modèles supprimés avec succès
 *                 count:
 *                   type: integer
 *                   example: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/batch-delete', requireAdmin, validate(batchDeleteAssetModelsSchema), batchDeleteAssetModels);

/**
 * @swagger
 * /api/asset-models/{id}:
 *   get:
 *     summary: Obtenir les détails d'un modèle
 *     tags: [Asset Models]
 *     description: Retourne un modèle avec ses articles associés
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du modèle (CUID)
 *     responses:
 *       200:
 *         description: Détails du modèle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 modelName:
 *                   type: string
 *                 specs:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 assetItems:
 *                   type: array
 *                   description: Articles liés à ce modèle
 *                   items:
 *                     type: object
 *                 _count:
 *                   type: object
 *                   properties:
 *                     assetItems:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', getAssetModelById);

/**
 * @swagger
 * /api/asset-models/{id}:
 *   patch:
 *     summary: Mettre à jour un modèle
 *     tags: [Asset Models]
 *     description: Modification partielle d'un modèle d'équipement
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du modèle (CUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: laptop
 *               brand:
 *                 type: string
 *                 example: Dell
 *               modelName:
 *                 type: string
 *                 example: Latitude 5530
 *               specs:
 *                 type: object
 *                 example: { cpu: "i7-1265U", ram: "32GB" }
 *     responses:
 *       200:
 *         description: Modèle mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 modelName:
 *                   type: string
 *                 specs:
 *                   type: object
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
router.patch('/:id', validate(updateAssetModelSchema), updateAssetModel);

/**
 * @swagger
 * /api/asset-models/{id}:
 *   delete:
 *     summary: Supprimer un modèle
 *     tags: [Asset Models]
 *     description: Suppression d'un modèle (attention aux articles associés)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du modèle (CUID)
 *     responses:
 *       200:
 *         description: Modèle supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Modèle supprimé avec succès
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Impossible de supprimer (articles associés)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id', deleteAssetModel);

export default router;
