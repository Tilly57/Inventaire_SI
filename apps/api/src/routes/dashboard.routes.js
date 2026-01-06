/**
 * Dashboard Routes
 * Routes for dashboard statistics
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

/**
 * All dashboard routes require authentication
 */
router.use(requireAuth);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (all roles)
 */
router.get('/stats', dashboardController.getStats);

/**
 * POST /api/dashboard/refresh
 * Manually refresh dashboard statistics (admin only)
 */
router.post('/refresh', requireRole('ADMIN'), dashboardController.refreshStats);

export default router;
