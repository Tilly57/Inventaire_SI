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
import { asyncHandler } from '../middleware/asyncHandler.js'
import logger from '../config/logger.js'

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sendXlsx(res, buffer, filenameBase) {
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `${filenameBase}_${timestamp}.xlsx`
  res.setHeader('Content-Type', XLSX_CONTENT_TYPE)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(buffer)
}

/**
 * @route GET /api/export/employees
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportEmployeesController = asyncHandler(async (req, res) => {
  const { search, dept } = req.query

  logger.info('Exporting employees', {
    userId: req.user.id,
    filters: { search, dept },
  })

  const buffer = await exportEmployees({ search, dept })
  sendXlsx(res, buffer, 'Employes')
})

/**
 * @route GET /api/export/asset-models
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportAssetModelsController = asyncHandler(async (req, res) => {
  const { type, brand } = req.query

  logger.info('Exporting asset models', {
    userId: req.user.id,
    filters: { type, brand },
  })

  const buffer = await exportAssetModels({ type, brand })
  sendXlsx(res, buffer, 'Modeles_Equipements')
})

/**
 * @route GET /api/export/asset-items
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportAssetItemsController = asyncHandler(async (req, res) => {
  const { status, type, assetModelId } = req.query

  logger.info('Exporting asset items', {
    userId: req.user.id,
    filters: { status, type, assetModelId },
  })

  const buffer = await exportAssetItems({ status, type, assetModelId })
  sendXlsx(res, buffer, 'Equipements')
})

/**
 * @route GET /api/export/stock-items
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportStockItemsController = asyncHandler(async (req, res) => {
  const lowStock = req.query.lowStock === 'true'

  logger.info('Exporting stock items', {
    userId: req.user.id,
    filters: { lowStock },
  })

  const buffer = await exportStockItems({ lowStock })
  sendXlsx(res, buffer, lowStock ? 'Stock_Bas' : 'Stock')
})

/**
 * @route GET /api/export/loans
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportLoansController = asyncHandler(async (req, res) => {
  const { status, employeeId, startDate, endDate } = req.query

  logger.info('Exporting loans', {
    userId: req.user.id,
    filters: { status, employeeId, startDate, endDate },
  })

  const buffer = await exportLoans({ status, employeeId, startDate, endDate })
  sendXlsx(res, buffer, 'Prets')
})

/**
 * @route GET /api/export/dashboard
 * @access Private (ADMIN, GESTIONNAIRE)
 */
export const exportDashboardController = asyncHandler(async (req, res) => {
  logger.info('Exporting dashboard', { userId: req.user.id })

  const buffer = await exportDashboard()
  sendXlsx(res, buffer, 'Dashboard_Complet')
})

export default {
  exportEmployeesController,
  exportAssetModelsController,
  exportAssetItemsController,
  exportStockItemsController,
  exportLoansController,
  exportDashboardController,
}