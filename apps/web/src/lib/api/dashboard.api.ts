/**
 * @fileoverview Dashboard API client
 *
 * Provides functions for dashboard statistics and data aggregation.
 *
 * Note: These functions perform CLIENT-SIDE calculations by fetching
 * data from existing endpoints. This approach is used because dedicated
 * dashboard endpoints don't exist yet on the backend.
 *
 * Future improvement: Move calculations to backend for better performance.
 *
 * All functions include error handling to prevent dashboard crashes.
 */

import { apiClient } from './client'
import type { ApiResponse, DashboardStats, Loan, StockItem, Employee, AssetItem, LowStockAlertItem } from '@/lib/types/models.types'
import { LOW_STOCK_THRESHOLD } from '@/lib/utils/constants'

/**
 * Get dashboard statistics
 *
 * Calculates aggregate statistics by fetching and processing data
 * from multiple endpoints in parallel.
 *
 * Statistics calculated:
 * - totalEmployees: Count of all employees
 * - totalAssets: Count of all physical asset items
 * - activeLoans: Count of loans with status='OPEN'
 * - loanedAssets: Total count of lines in all active loans
 *
 * Returns default values (all zeros) if any endpoint fails to prevent
 * dashboard from crashing.
 *
 * @returns Promise resolving to DashboardStats object
 *
 * @example
 * const stats = await getDashboardStatsApi();
 * // stats = {
 * //   totalEmployees: 125,
 * //   totalAssets: 450,
 * //   activeLoans: 23,
 * //   loanedAssets: 67  // Sum of all lines in active loans
 * // }
 */
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    // Fetch data from existing endpoints with high limit to get all items
    // Use Promise.all for parallel requests (better performance)
    const [employeesRes, assetsRes, loansRes] = await Promise.all([
      apiClient.get<ApiResponse<any>>('/employees?limit=1000'),
      apiClient.get<ApiResponse<any>>('/asset-items?limit=1000'),
      apiClient.get<ApiResponse<any>>('/loans?limit=1000'),
    ])

    // Extract data from responses
    // Handle both direct array and paginated response formats
    const employeesData = employeesRes.data.data
    const employees: Employee[] = Array.isArray(employeesData) ? employeesData : employeesData.employees || []

    const assetsData = assetsRes.data.data
    const assets: AssetItem[] = Array.isArray(assetsData) ? assetsData : assetsData.items || []

    const loansData = loansRes.data.data
    const loans: Loan[] = Array.isArray(loansData) ? loansData : loansData.loans || []

    // Calculate statistics from fetched data
    // Filter active loans (status='OPEN')
    const activeLoans = loans.filter(loan => loan.status === 'OPEN').length

    // Count total loaned items (sum of line counts in active loans)
    // Each loan line represents one loaned item or stock quantity
    const loanedAssets = loans
      .filter(loan => loan.status === 'OPEN')
      .reduce((sum, loan) => sum + (loan.lines?.length || 0), 0)

    return {
      totalEmployees: employees.length,
      totalAssets: assets.length,
      activeLoans,
      loanedAssets,
    }
  } catch (error) {
    // Return default values if endpoints fail
    // This prevents dashboard from breaking on API errors
    return {
      totalEmployees: 0,
      totalAssets: 0,
      activeLoans: 0,
      loanedAssets: 0,
    }
  }
}

/**
 * Get recent loans
 *
 * Fetches all loans and returns the 5 most recent ones
 * (sorted by creation date descending).
 *
 * Useful for dashboard "Recent Activity" widget.
 *
 * @returns Promise resolving to array of up to 5 most recent loans
 *
 * @example
 * const recent = await getRecentLoansApi();
 * // recent = [
 * //   { id, status, openedAt, employee: { firstName, lastName }, ... },
 * //   ... // up to 5 loans
 * // ]
 */
export async function getRecentLoansApi(): Promise<Loan[]> {
  try {
    const response = await apiClient.get<ApiResponse<any>>('/loans?limit=1000')
    const data = response.data.data
    const loans: Loan[] = Array.isArray(data) ? data : data.loans || []

    // Sort by createdAt descending (most recent first)
    // Take only first 5 loans
    return loans
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  } catch (error) {
    // Return empty array on error to prevent dashboard crash
    return []
  }
}

/**
 * Get low stock items (unified for StockItems and AssetItems)
 *
 * Fetches both stock items (consumables) and asset items (individual equipment),
 * and returns alerts for items below the low stock threshold.
 *
 * Logic:
 * - StockItems: Alert if (quantity - loaned) < threshold
 * - AssetItems: Group by model, count EN_STOCK items, alert if count < threshold
 *
 * Threshold imported from constants (currently 2).
 *
 * @returns Promise resolving to array of low stock alert items
 *
 * @example
 * const lowStock = await getLowStockItemsApi();
 * // lowStock = [
 * //   { id, assetModelId, assetModel, availableQuantity: 1, itemType: 'stock' },
 * //   { id, assetModelId, assetModel, availableQuantity: 0, itemType: 'asset' },
 * //   ...
 * // ]
 */
export async function getLowStockItemsApi(): Promise<LowStockAlertItem[]> {
  try {
    // Fetch both StockItems and AssetItems in parallel
    const [stockResponse, assetsResponse] = await Promise.all([
      apiClient.get<ApiResponse<any>>('/stock-items?limit=1000'),
      apiClient.get<ApiResponse<any>>('/asset-items?limit=1000'),
    ])

    const stockData = stockResponse.data.data
    const stockItems: StockItem[] = Array.isArray(stockData) ? stockData : stockData.items || []

    const assetsData = assetsResponse.data.data
    const assetItems: AssetItem[] = Array.isArray(assetsData) ? assetsData : assetsData.items || []

    const alerts: LowStockAlertItem[] = []

    // Process StockItems (consumables)
    stockItems.forEach(item => {
      const available = item.quantity - item.loaned

      if (available < LOW_STOCK_THRESHOLD) {
        alerts.push({
          id: item.id,
          assetModelId: item.assetModelId,
          assetModel: item.assetModel,
          availableQuantity: available,
          itemType: 'stock'
        })
      }
    })

    // Process AssetItems (individual equipment) - group by model
    const assetsByModel = new Map<string, AssetItem[]>()

    assetItems.forEach(item => {
      if (!assetsByModel.has(item.modelId)) {
        assetsByModel.set(item.modelId, [])
      }
      assetsByModel.get(item.modelId)!.push(item)
    })

    // Count EN_STOCK items per model and create alerts
    assetsByModel.forEach((items, modelId) => {
      const inStockCount = items.filter(item => item.status === 'EN_STOCK').length
      const assetModel = items[0]?.assetModel

      if (inStockCount < LOW_STOCK_THRESHOLD) {
        alerts.push({
          id: `asset-model-${modelId}`, // Synthetic ID for grouped assets
          assetModelId: modelId,
          assetModel: assetModel,
          availableQuantity: inStockCount,
          itemType: 'asset'
        })
      }
    })

    return alerts
  } catch (error) {
    // Return empty array on error to prevent dashboard crash
    return []
  }
}
