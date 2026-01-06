/**
 * Dashboard Controller
 * Handles dashboard statistics requests
 */

import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * POST /api/dashboard/refresh
 * Manually refresh dashboard statistics (admin only)
 */
export const refreshStats = asyncHandler(async (req, res) => {
  await dashboardService.refreshDashboardStats();

  const stats = await dashboardService.getDashboardStats();

  res.json({
    success: true,
    message: 'Dashboard statistics refreshed successfully',
    data: stats,
  });
});
