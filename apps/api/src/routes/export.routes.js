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
import { requireRole } from '../middleware/rbac.js'
import { UserRole } from '@prisma/client'

const router = express.Router()

// Tous les exports nécessitent authentification et rôle ADMIN ou GESTIONNAIRE
router.use(requireAuth)
router.use(requireRole([UserRole.ADMIN, UserRole.GESTIONNAIRE]))

/**
 * GET /api/export/employees
 * Export employés vers Excel
 *
 * Query params:
 * - search: string (recherche nom/prénom/email)
 * - dept: string (filtrer par département)
 */
router.get('/employees', exportEmployeesController)

/**
 * GET /api/export/asset-models
 * Export modèles d'équipements vers Excel
 *
 * Query params:
 * - type: string (filtrer par type)
 * - brand: string (filtrer par marque)
 */
router.get('/asset-models', exportAssetModelsController)

/**
 * GET /api/export/asset-items
 * Export articles d'équipement vers Excel
 *
 * Query params:
 * - status: string (EN_STOCK, PRETE, HS, REPARATION)
 * - type: string (filtrer par type)
 * - assetModelId: string (filtrer par modèle)
 */
router.get('/asset-items', exportAssetItemsController)

/**
 * GET /api/export/stock-items
 * Export stock vers Excel
 *
 * Query params:
 * - lowStock: boolean (afficher seulement stock bas)
 */
router.get('/stock-items', exportStockItemsController)

/**
 * GET /api/export/loans
 * Export prêts vers Excel
 *
 * Query params:
 * - status: string (OPEN, CLOSED)
 * - employeeId: string (filtrer par employé)
 * - startDate: Date (date début)
 * - endDate: Date (date fin)
 */
router.get('/loans', exportLoansController)

/**
 * GET /api/export/dashboard
 * Export dashboard complet (multi-feuilles)
 *
 * Génère un fichier Excel avec plusieurs feuilles:
 * - Vue d'ensemble (statistiques)
 * - Employés
 * - Équipements
 * - Stock
 * - Prêts actifs
 */
router.get('/dashboard', exportDashboardController)

export default router
