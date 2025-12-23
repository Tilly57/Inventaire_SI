import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsApi, getRecentLoansApi, getLowStockItemsApi } from '@/lib/api/dashboard.api'

/**
 * Hook to get dashboard statistics
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStatsApi,
  })
}

/**
 * Hook to get recent loans
 */
export const useRecentLoans = () => {
  return useQuery({
    queryKey: ['dashboard', 'recent-loans'],
    queryFn: getRecentLoansApi,
  })
}

/**
 * Hook to get low stock items
 */
export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: getLowStockItemsApi,
  })
}
