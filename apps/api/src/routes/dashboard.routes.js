/**
 * Dashboard Routes
 * Routes for dashboard statistics
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

/**
 * All dashboard routes require authentication
 */
router.use(requireAuth);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obtenir les statistiques du dashboard
 *     tags: [Dashboard]
 *     description: |
 *       Retourne les statistiques globales de l'application.
 *       **Cached 15min** - Invalidé après mutations ou refresh manuel.
 *       Accessible à tous les rôles authentifiés.
 *     responses:
 *       200:
 *         description: Statistiques du dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmployees:
 *                   type: integer
 *                   example: 156
 *                   description: Nombre total d'employés
 *                 totalAssetModels:
 *                   type: integer
 *                   example: 42
 *                   description: Nombre de modèles d'équipement
 *                 totalAssetItems:
 *                   type: integer
 *                   example: 387
 *                   description: Nombre d'articles d'équipement
 *                 assetsByStatus:
 *                   type: object
 *                   properties:
 *                     EN_STOCK:
 *                       type: integer
 *                       example: 245
 *                     PRETE:
 *                       type: integer
 *                       example: 98
 *                     HS:
 *                       type: integer
 *                       example: 23
 *                     REPARATION:
 *                       type: integer
 *                       example: 21
 *                 totalStockItems:
 *                   type: integer
 *                   example: 67
 *                   description: Nombre d'articles consommables
 *                 lowStockItems:
 *                   type: integer
 *                   example: 12
 *                   description: Articles sous seuil minimum
 *                 totalLoans:
 *                   type: integer
 *                   example: 234
 *                   description: Nombre total de prêts
 *                 openLoans:
 *                   type: integer
 *                   example: 45
 *                   description: Prêts actuellement ouverts
 *                 closedLoans:
 *                   type: integer
 *                   example: 189
 *                   description: Prêts clôturés
 *                 recentLoans:
 *                   type: array
 *                   description: 5 prêts les plus récents
 *                   items:
 *                     type: object
 *                 cachedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp du cache
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', dashboardController.getStats);

/**
 * @swagger
 * /api/dashboard/refresh:
 *   post:
 *     summary: Rafraîchir manuellement les statistiques du dashboard
 *     tags: [Dashboard]
 *     description: |
 *       Force le recalcul des statistiques et invalide le cache Redis.
 *       **Réservé aux ADMIN uniquement.**
 *       Utile après des imports de masse ou corrections de données.
 *     responses:
 *       200:
 *         description: Statistiques rafraîchies avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Statistiques rafraîchies avec succès
 *                 stats:
 *                   type: object
 *                   description: Nouvelles statistiques
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/refresh', requireRole('ADMIN'), dashboardController.refreshStats);

export default router;
