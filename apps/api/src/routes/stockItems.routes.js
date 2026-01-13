/**
 * Stock Items routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllStockItems, getStockItemById, createStockItem, updateStockItem, adjustQuantity, deleteStockItem } from '../controllers/stockItems.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createStockItemSchema, updateStockItemSchema, adjustQuantitySchema } from '../validators/stockItems.validator.js';

const router = express.Router();

// All stock item routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

/**
 * @swagger
 * /api/stock-items:
 *   get:
 *     summary: Obtenir la liste de tous les articles consommables
 *     tags: [Stock Items]
 *     description: |
 *       Retourne tous les articles de stock avec pagination optionnelle.
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
 *         description: Recherche dans name, type, brand
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type (cable, adapter, etc.)
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filtrer les articles en rupture de stock
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
 *         description: Liste des articles de stock
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
 *                       name:
 *                         type: string
 *                         example: Câble HDMI 2m
 *                       type:
 *                         type: string
 *                         example: cable
 *                       brand:
 *                         type: string
 *                         example: Belkin
 *                       quantity:
 *                         type: integer
 *                         example: 45
 *                       minQuantity:
 *                         type: integer
 *                         example: 10
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
router.get('/', getAllStockItems);

/**
 * @swagger
 * /api/stock-items/{id}:
 *   get:
 *     summary: Obtenir les détails d'un article consommable
 *     tags: [Stock Items]
 *     description: Retourne un article de stock avec son historique de prêts
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
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 minQuantity:
 *                   type: integer
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
router.get('/:id', getStockItemById);

/**
 * @swagger
 * /api/stock-items:
 *   post:
 *     summary: Créer un nouvel article consommable
 *     tags: [Stock Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Câble HDMI 2m
 *               type:
 *                 type: string
 *                 example: cable
 *                 description: Type d'article (cable, adapter, mouse, etc.)
 *               brand:
 *                 type: string
 *                 example: Belkin
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *               minQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10
 *                 description: Seuil d'alerte de stock bas
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
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 minQuantity:
 *                   type: integer
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
router.post('/', validate(createStockItemSchema), createStockItem);

/**
 * @swagger
 * /api/stock-items/{id}:
 *   patch:
 *     summary: Mettre à jour un article consommable
 *     tags: [Stock Items]
 *     description: Modification partielle d'un article de stock
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
 *               name:
 *                 type: string
 *                 example: Câble HDMI 3m
 *               type:
 *                 type: string
 *                 example: cable
 *               brand:
 *                 type: string
 *                 example: Belkin Pro
 *               minQuantity:
 *                 type: integer
 *                 example: 15
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
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 brand:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                 minQuantity:
 *                   type: integer
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
router.patch('/:id', validate(updateStockItemSchema), updateStockItem);

/**
 * @swagger
 * /api/stock-items/{id}/quantity:
 *   patch:
 *     summary: Ajuster la quantité d'un article consommable
 *     tags: [Stock Items]
 *     description: |
 *       Endpoint dédié à l'ajustement de quantité.
 *       Permet d'incrémenter ou décrémenter le stock.
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
 *               - adjustment
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 example: -5
 *                 description: Quantité à ajouter (positif) ou retirer (négatif)
 *     responses:
 *       200:
 *         description: Quantité ajustée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 quantity:
 *                   type: integer
 *                   example: 45
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
router.patch('/:id/quantity', validate(adjustQuantitySchema), adjustQuantity);

/**
 * @swagger
 * /api/stock-items/{id}:
 *   delete:
 *     summary: Supprimer un article consommable
 *     tags: [Stock Items]
 *     description: Suppression d'un article de stock
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/:id', deleteStockItem);

export default router;
