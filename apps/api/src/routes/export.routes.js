/**
 * @fileoverview Export Routes - Routes pour exports Excel
 *
 * Routes disponibles:
 * - GET /api/export/employees - Export employés
 * - GET /api/export/asset-models - Export modèles
 * - GET /api/export/asset-items - Export équipements
 * - GET /api/export/stock-items - Export stock
 * - GET /api/export/loans - Export prêts
 * - GET /api/export/dashboard - Export dashboard complet
 *
 * Accès: ADMIN, GESTIONNAIRE uniquement
 */

import express from 'express'
import {
  exportEmployeesController,
  exportAssetModelsController,
  exportAssetItemsController,
  exportStockItemsController,
  exportLoansController,
  exportDashboardController,
} from '../controllers/export.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { requireManager } from '../middleware/rbac.js'

const router = express.Router()

// Tous les exports nécessitent authentification et rôle ADMIN ou GESTIONNAIRE
router.use(requireAuth)
router.use(requireManager)

/**
 * @swagger
 * /api/export/employees:
 *   get:
 *     summary: Exporter les employés vers Excel
 *     tags: [Export]
 *     description: |
 *       Génère un fichier Excel (.xlsx) avec la liste des employés.
 *       Supporte les mêmes filtres que GET /api/employees.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche nom/prénom/email
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *         description: Filtrer par département
 *     responses:
 *       200:
 *         description: Fichier Excel généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="employees_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/employees', exportEmployeesController)

/**
 * @swagger
 * /api/export/asset-models:
 *   get:
 *     summary: Exporter les modèles d'équipement vers Excel
 *     tags: [Export]
 *     description: Génère un fichier Excel avec la liste des modèles
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filtrer par marque
 *     responses:
 *       200:
 *         description: Fichier Excel généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="asset-models_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/asset-models', exportAssetModelsController)

/**
 * @swagger
 * /api/export/asset-items:
 *   get:
 *     summary: Exporter les articles d'équipement vers Excel
 *     tags: [Export]
 *     description: Génère un fichier Excel avec la liste des articles
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EN_STOCK, PRETE, HS, REPARATION]
 *         description: Filtrer par statut
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type
 *       - in: query
 *         name: assetModelId
 *         schema:
 *           type: string
 *         description: Filtrer par modèle
 *     responses:
 *       200:
 *         description: Fichier Excel généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="asset-items_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/asset-items', exportAssetItemsController)

/**
 * @swagger
 * /api/export/stock-items:
 *   get:
 *     summary: Exporter les articles consommables vers Excel
 *     tags: [Export]
 *     description: Génère un fichier Excel avec la liste du stock
 *     parameters:
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Afficher seulement stock bas
 *     responses:
 *       200:
 *         description: Fichier Excel généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="stock-items_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stock-items', exportStockItemsController)

/**
 * @swagger
 * /api/export/loans:
 *   get:
 *     summary: Exporter les prêts vers Excel
 *     tags: [Export]
 *     description: Génère un fichier Excel avec la liste des prêts
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *         description: Filtrer par statut
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filtrer par employé
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Fichier Excel généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="loans_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/loans', exportLoansController)

/**
 * @swagger
 * /api/export/dashboard:
 *   get:
 *     summary: Exporter le dashboard complet vers Excel (multi-feuilles)
 *     tags: [Export]
 *     description: |
 *       Génère un fichier Excel avec plusieurs feuilles:
 *       - Vue d'ensemble (statistiques globales)
 *       - Employés (liste complète)
 *       - Équipements (articles avec modèles)
 *       - Stock (articles consommables)
 *       - Prêts actifs (status OPEN uniquement)
 *
 *       Export complet pour rapports ou archivage.
 *     responses:
 *       200:
 *         description: Fichier Excel multi-feuilles généré
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: attachment; filename="dashboard_2026-01-13.xlsx"
 *             schema:
 *               type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard', exportDashboardController)

export default router
