import { apiClient } from './client'
import type { ApiResponse, DashboardStats, Loan, StockItem, Employee, AssetItem } from '@/lib/types/models.types'

const LOW_STOCK_THRESHOLD = 5

/**
 * Get dashboard statistics
 * Calculates stats from existing endpoints since /dashboard/stats doesn't exist yet
 */
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  try {
    // Fetch data from existing endpoints
    const [employeesRes, assetsRes, loansRes] = await Promise.all([
      apiClient.get<ApiResponse<any>>('/employees'),
      apiClient.get<ApiResponse<any>>('/assets/items'),
      apiClient.get<ApiResponse<any>>('/loans'),
    ])

    // Extract data (handle both direct array and paginated responses)
    const employeesData = employeesRes.data.data
    const employees: Employee[] = Array.isArray(employeesData) ? employeesData : employeesData.employees || []

    const assetsData = assetsRes.data.data
    const assets: AssetItem[] = Array.isArray(assetsData) ? assetsData : assetsData.items || []

    const loansData = loansRes.data.data
    const loans: Loan[] = Array.isArray(loansData) ? loansData : loansData.loans || []

    // Calculate stats
    const activeLoans = loans.filter(loan => loan.status === 'OPEN').length
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
    return {
      totalEmployees: 0,
      totalAssets: 0,
      activeLoans: 0,
      loanedAssets: 0,
    }
  }
}

/**
 * Get recent loans (last 5)
 */
export async function getRecentLoansApi(): Promise<Loan[]> {
  try {
    const response = await apiClient.get<ApiResponse<any>>('/loans')
    const data = response.data.data
    const loans: Loan[] = Array.isArray(data) ? data : data.loans || []

    // Sort by createdAt descending and take first 5
    return loans
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  } catch (error) {
    return []
  }
}

/**
 * Get low stock items (quantity < 5)
 * Fetches all stock and filters client-side
 */
export async function getLowStockItemsApi(): Promise<StockItem[]> {
  try {
    const response = await apiClient.get<ApiResponse<any>>('/stock')
    const data = response.data.data
    const items: StockItem[] = Array.isArray(data) ? data : data.items || []

    // Filter items with quantity below threshold
    return items.filter(item => item.quantity < LOW_STOCK_THRESHOLD)
  } catch (error) {
    return []
  }
}
