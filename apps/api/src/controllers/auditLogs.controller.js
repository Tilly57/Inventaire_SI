/**
 * Audit Logs Controller
 * Handles audit log queries
 */

import * as auditLogUtils from '../utils/auditLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * GET /api/audit-logs
 * Get audit logs with optional filters
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { tableName, recordId, userId, limit = 50 } = req.query;
  const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  let logs;

  if (tableName && recordId) {
    // Get logs for a specific record
    logs = await auditLogUtils.getAuditLogs(
      tableName,
      recordId,
      safeLimit
    );
  } else if (userId) {
    // Get logs for a specific user
    logs = await auditLogUtils.getUserAuditLogs(userId, safeLimit);
  } else {
    // Get recent logs
    logs = await auditLogUtils.getRecentAuditLogs(safeLimit);
  }

  res.json({
    success: true,
    data: logs,
  });
});

/**
 * GET /api/audit-logs/:tableName/:recordId
 * Get audit logs for a specific record
 */
export const getRecordAuditLogs = asyncHandler(async (req, res) => {
  const { tableName, recordId } = req.params;
  const { limit = 50 } = req.query;
  const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

  const logs = await auditLogUtils.getAuditLogs(
    tableName,
    recordId,
    safeLimit
  );

  res.json({
    success: true,
    data: logs,
  });
});
