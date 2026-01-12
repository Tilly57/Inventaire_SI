/**
 * Export API Client
 *
 * Fonctions pour télécharger les exports Excel avec filtres
 */

import apiClient from './client'

interface ExportEmployeesFilters {
  search?: string
  dept?: string
}

interface ExportAssetModelsFilters {
  type?: string
  brand?: string
}

interface ExportAssetItemsFilters {
  status?: string
  type?: string
  assetModelId?: string
}

interface ExportStockItemsFilters {
  lowStock?: boolean
}

interface ExportLoansFilters {
  status?: string
  employeeId?: string
  startDate?: string
  endDate?: string
}

/**
 * Télécharger un fichier Excel depuis une réponse blob
 */
function downloadExcelFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export employés vers Excel
 */
export async function exportEmployees(filters: ExportEmployeesFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.append('search', filters.search)
  if (filters.dept) params.append('dept', filters.dept)

  const response = await apiClient.get(`/export/employees?${params.toString()}`, {
    responseType: 'blob',
  })

  const filename = `Employes_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

/**
 * Export modèles d'équipements vers Excel
 */
export async function exportAssetModels(filters: ExportAssetModelsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.append('type', filters.type)
  if (filters.brand) params.append('brand', filters.brand)

  const response = await apiClient.get(`/export/asset-models?${params.toString()}`, {
    responseType: 'blob',
  })

  const filename = `Modeles_Equipements_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

/**
 * Export articles d'équipement vers Excel
 */
export async function exportAssetItems(filters: ExportAssetItemsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.type) params.append('type', filters.type)
  if (filters.assetModelId) params.append('assetModelId', filters.assetModelId)

  const response = await apiClient.get(`/export/asset-items?${params.toString()}`, {
    responseType: 'blob',
  })

  const filename = `Equipements_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

/**
 * Export stock vers Excel
 */
export async function exportStockItems(filters: ExportStockItemsFilters = {}) {
  const params = new URLSearchParams()
  if (filters.lowStock) params.append('lowStock', 'true')

  const response = await apiClient.get(`/export/stock-items?${params.toString()}`, {
    responseType: 'blob',
  })

  const filename = filters.lowStock
    ? `Stock_Bas_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `Stock_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

/**
 * Export prêts vers Excel
 */
export async function exportLoans(filters: ExportLoansFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.employeeId) params.append('employeeId', filters.employeeId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)

  const response = await apiClient.get(`/export/loans?${params.toString()}`, {
    responseType: 'blob',
  })

  const filename = `Prets_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

/**
 * Export dashboard complet (multi-feuilles)
 */
export async function exportDashboard() {
  const response = await apiClient.get('/export/dashboard', {
    responseType: 'blob',
  })

  const filename = `Dashboard_Complet_${new Date().toISOString().slice(0, 10)}.xlsx`
  downloadExcelFile(response.data, filename)
}

export default {
  exportEmployees,
  exportAssetModels,
  exportAssetItems,
  exportStockItems,
  exportLoans,
  exportDashboard,
}
