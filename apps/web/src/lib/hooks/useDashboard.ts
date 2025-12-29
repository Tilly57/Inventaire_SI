/**
 * @fileoverview Dashboard hooks for statistics and data aggregation
 *
 * Provides React Query hooks for dashboard widgets:
 * - Overall statistics (employees, assets, loans)
 * - Recent loan activity
 * - Low stock alerts
 *
 * All hooks use automatic caching and background refetching
 * provided by React Query.
 *
 * Note: These hooks fetch data that is calculated CLIENT-SIDE
 * by the API client functions (see dashboard.api.ts).
 */

import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsApi, getRecentLoansApi, getLowStockItemsApi } from '@/lib/api/dashboard.api'

/**
 * Hook to get dashboard statistics
 *
 * Fetches aggregate statistics for dashboard overview:
 * - Total employees count
 * - Total assets count
 * - Active loans count
 * - Total loaned assets count
 *
 * Uses React Query for automatic caching and background updates.
 * Data is refreshed when component mounts or when cache expires.
 *
 * @returns React Query result object
 * @returns {DashboardStats | undefined} data - Statistics object
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 * @returns {Error | null} error - Error object if fetch failed
 *
 * @example
 * function DashboardPage() {
 *   const { data: stats, isLoading } = useDashboardStats();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <StatCard title="Employees" value={stats.totalEmployees} />
 *       <StatCard title="Assets" value={stats.totalAssets} />
 *       <StatCard title="Active Loans" value={stats.activeLoans} />
 *     </div>
 *   );
 * }
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStatsApi,
  })
}

/**
 * Hook to get recent loans
 *
 * Fetches the 5 most recent loans for activity feed widget.
 * Loans are sorted by creation date (newest first).
 *
 * @returns React Query result object
 * @returns {Loan[] | undefined} data - Array of up to 5 recent loans
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function RecentActivityWidget() {
 *   const { data: loans = [], isLoading } = useRecentLoans();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <ul>
 *       {loans.map(loan => (
 *         <li key={loan.id}>
 *           {loan.employee.firstName} - {loan.status}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
export const useRecentLoans = () => {
  return useQuery({
    queryKey: ['dashboard', 'recent-loans'],
    queryFn: getRecentLoansApi,
  })
}

/**
 * Hook to get low stock items (unified for StockItems and AssetItems)
 *
 * Fetches both stock items (consumables) and asset items (individual equipment)
 * and returns alerts for items below the threshold (< 2).
 *
 * Logic:
 * - StockItems: Alert if (quantity - loaned) < 2
 * - AssetItems: Group by model, count EN_STOCK items, alert if count < 2
 *
 * @returns React Query result object
 * @returns {LowStockAlertItem[] | undefined} data - Array of low stock alerts
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function LowStockAlert() {
 *   const { data: items = [], isLoading } = useLowStockItems();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (items.length === 0) return <p>All stock levels OK</p>;
 *
 *   return (
 *     <Alert>
 *       <h3>Low Stock Alert</h3>
 *       <ul>
 *         {items.map(item => (
 *           <li key={item.id}>
 *             {item.assetModel.brand} {item.assetModel.modelName}: {item.availableQuantity}
 *           </li>
 *         ))}
 *       </ul>
 *     </Alert>
 *   );
 * }
 */
export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: getLowStockItemsApi,
  })
}
