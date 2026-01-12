/**
 * @fileoverview Export Controller - Gestion des exports Excel
 *
 * Endpoints:
 * - GET /api/export/employees - Export employés
 * - GET /api/export/asset-models - Export modèles équipements
 * - GET /api/export/asset-items - Export articles équipements
 * - GET /api/export/stock-items - Export stock
 * - GET /api/export/loans - Export prêts
 * - GET /api/export/dashboard - Export dashboard complet (multi-feuilles)
 */

import {
  exportEmployees,
  exportAssetModels,
  exportAssetItems,
  exportStockItems,
  exportLoans,
  exportDashboard,
} from '../services/export.service.js'
import logger from '../config/logger.js'

/**
 * Export employés vers Excel
 *
 * Query params:
 * - search: string (recherche nom/prénom/email)
 * - dept: string (filtrer par département)
 *
 * @route GET /api/export/employees
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportEmployeesController(req, res) {
  try {
    const { search, dept } = req.query

    logger.info('Exporting employees', {
      userId: req.user.id,
      filters: { search, dept },
    })

    const buffer = await exportEmployees({ search, dept })

    // Générer nom de fichier avec timestamp
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Employes_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export employees failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des employés',
    })
  }
}

/**
 * Export modèles d'équipements vers Excel
 *
 * Query params:
 * - type: string (filtrer par type)
 * - brand: string (filtrer par marque)
 *
 * @route GET /api/export/asset-models
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportAssetModelsController(req, res) {
  try {
    const { type, brand } = req.query

    logger.info('Exporting asset models', {
      userId: req.user.id,
      filters: { type, brand },
    })

    const buffer = await exportAssetModels({ type, brand })

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Modeles_Equipements_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export asset models failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des modèles',
    })
  }
}

/**
 * Export articles d'équipement vers Excel
 *
 * Query params:
 * - status: string (EN_STOCK, PRETE, HS, REPARATION)
 * - type: string (filtrer par type)
 * - assetModelId: string (filtrer par modèle)
 *
 * @route GET /api/export/asset-items
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportAssetItemsController(req, res) {
  try {
    const { status, type, assetModelId } = req.query

    logger.info('Exporting asset items', {
      userId: req.user.id,
      filters: { status, type, assetModelId },
    })

    const buffer = await exportAssetItems({ status, type, assetModelId })

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Equipements_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export asset items failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des équipements',
    })
  }
}

/**
 * Export stock vers Excel
 *
 * Query params:
 * - lowStock: boolean (afficher seulement stock bas)
 *
 * @route GET /api/export/stock-items
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportStockItemsController(req, res) {
  try {
    const lowStock = req.query.lowStock === 'true'

    logger.info('Exporting stock items', {
      userId: req.user.id,
      filters: { lowStock },
    })

    const buffer = await exportStockItems({ lowStock })

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = lowStock
      ? `Stock_Bas_${timestamp}.xlsx`
      : `Stock_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export stock items failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export du stock',
    })
  }
}

/**
 * Export prêts vers Excel
 *
 * Query params:
 * - status: string (OPEN, CLOSED)
 * - employeeId: string (filtrer par employé)
 * - startDate: Date (date début)
 * - endDate: Date (date fin)
 *
 * @route GET /api/export/loans
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportLoansController(req, res) {
  try {
    const { status, employeeId, startDate, endDate } = req.query

    logger.info('Exporting loans', {
      userId: req.user.id,
      filters: { status, employeeId, startDate, endDate },
    })

    const buffer = await exportLoans({
      status,
      employeeId,
      startDate,
      endDate,
    })

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Prets_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export loans failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des prêts',
    })
  }
}

/**
 * Export dashboard complet (multi-feuilles)
 *
 * Génère un fichier Excel avec plusieurs feuilles:
 * - Vue d'ensemble (statistiques)
 * - Employés
 * - Équipements
 * - Stock
 * - Prêts actifs
 *
 * @route GET /api/export/dashboard
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export async function exportDashboardController(req, res) {
  try {
    logger.info('Exporting dashboard', { userId: req.user.id })

    const buffer = await exportDashboard()

    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Dashboard_Complet_${timestamp}.xlsx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    logger.error('Export dashboard failed', {
      error: error.message,
      userId: req.user.id,
    })
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export du dashboard',
    })
  }
}

export default {
  exportEmployeesController,
  exportAssetModelsController,
  exportAssetItemsController,
  exportStockItemsController,
  exportLoansController,
  exportDashboardController,
}
