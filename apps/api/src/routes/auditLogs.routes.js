/**
 * Audit Logs Routes
 * Routes for viewing audit trail
 */

import express from 'express';
import * as auditLogsController from '../controllers/auditLogs.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

/**
 * All audit log routes require authentication and ADMIN role
 */
router.use(requireAuth, requireRole('ADMIN'));

/**
 * GET /api/audit-logs
 * Get audit logs with optional filters
 * Query params: tableName, recordId, userId, limit
 */
router.get('/', auditLogsController.getAuditLogs);

/**
 * GET /api/audit-logs/:tableName/:recordId
 * Get audit logs for a specific record
 */
router.get('/:tableName/:recordId', auditLogsController.getRecordAuditLogs);

export default router;
