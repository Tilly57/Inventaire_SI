/**
 * Dashboard Service
 * Provides dashboard statistics using materialized view for optimal performance
 */

import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get dashboard statistics from materialized view
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function getDashboardStats() {
  try {
    // Query the materialized view
    const stats = await prisma.$queryRaw`
      SELECT
        total_employees,
        total_assets,
        available_assets,
        active_loans,
        low_stock_items,
        out_of_stock_items,
        last_updated
      FROM dashboard_stats
      LIMIT 1;
    `;

    if (!stats || stats.length === 0) {
      // If view is empty, return default values
      logger.warn('Dashboard stats view is empty, returning defaults');
      return {
        totalEmployees: 0,
        totalAssets: 0,
        availableAssets: 0,
        activeLoans: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        lastUpdated: new Date(),
      };
    }

    const stat = stats[0];

    return {
      totalEmployees: Number(stat.total_employees),
      totalAssets: Number(stat.total_assets),
      availableAssets: Number(stat.available_assets),
      activeLoans: Number(stat.active_loans),
      lowStockItems: Number(stat.low_stock_items),
      outOfStockItems: Number(stat.out_of_stock_items),
      lastUpdated: stat.last_updated,
    };
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Refresh the dashboard statistics materialized view
 * @returns {Promise<void>}
 */
export async function refreshDashboardStats() {
  try {
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW dashboard_stats;`;
    logger.info('Dashboard stats view refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing dashboard stats:', error);
    throw error;
  }
}
