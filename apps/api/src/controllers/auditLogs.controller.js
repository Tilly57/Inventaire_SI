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

  let logs;

  if (tableName && recordId) {
    // Get logs for a specific record
    logs = await auditLogUtils.getAuditLogs(
      tableName,
      recordId,
      parseInt(limit)
    );
  } else if (userId) {
    // Get logs for a specific user
    logs = await auditLogUtils.getUserAuditLogs(userId, parseInt(limit));
  } else {
    // Get recent logs
    logs = await auditLogUtils.getRecentAuditLogs(parseInt(limit));
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

  const logs = await auditLogUtils.getAuditLogs(
    tableName,
    recordId,
    parseInt(limit)
  );

  res.json({
    success: true,
    data: logs,
  });
});
