/**
 * Audit Log Utility
 * Records all data modifications for audit trail
 */

import prisma from '../config/database.js';
import logger from '../config/logger.js';

/** Fields that must never be stored in audit logs */
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'refreshToken', 'secret', 'accessToken'];

/**
 * Remove sensitive fields from an object before storing in audit log
 * @param {Object} data - Data to sanitize
 * @returns {Object|null} Sanitized copy or null
 */
function sanitizeSensitiveData(data) {
  if (!data) return null;
  const sanitized = JSON.parse(JSON.stringify(data));
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} params.tableName - Name of the table/model
 * @param {string} params.recordId - ID of the record
 * @param {Object} [params.oldValues] - Previous values (for UPDATE/DELETE)
 * @param {Object} [params.newValues] - New values (for CREATE/UPDATE)
 * @param {string} [params.ipAddress] - IP address of the request
 * @param {string} [params.userAgent] - User agent of the request
 * @returns {Promise<void>}
 */
export async function createAuditLog({
  userId,
  action,
  tableName,
  recordId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    // Validate required parameters
    if (!userId || !action || !tableName || !recordId) {
      logger.error('Missing required audit log parameters', {
        userId,
        action,
        tableName,
        recordId,
      });
      return;
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: action.toUpperCase(),
        tableName,
        recordId,
        oldValues: sanitizeSensitiveData(oldValues),
        newValues: sanitizeSensitiveData(newValues),
        ipAddress,
        userAgent,
      },
    });

    logger.debug('Audit log created', { userId, action, tableName, recordId });
  } catch (error) {
    // Don't fail the operation if audit logging fails
    logger.error('Failed to create audit log', {
      error: error.message,
      userId,
      action,
      tableName,
      recordId,
    });
  }
}

/**
 * Get audit logs for a specific record
 * @param {string} tableName - Name of the table/model
 * @param {string} recordId - ID of the record
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getAuditLogs(tableName, recordId, limit = 50) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: error.message,
      tableName,
      recordId,
    });
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 * @param {string} userId - ID of the user
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getUserAuditLogs(userId, limit = 100) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch user audit logs', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Get all recent audit logs
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of audit logs
 */
export async function getRecentAuditLogs(limit = 100) {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs;
  } catch (error) {
    logger.error('Failed to fetch recent audit logs', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string|null} IP address
 */
export function getIpAddress(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Extract user agent from request
 * @param {Object} req - Express request object
 * @returns {string|null} User agent
 */
export function getUserAgent(req) {
  return req.headers['user-agent'] || null;
}
