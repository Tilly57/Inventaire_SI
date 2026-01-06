/**
 * @fileoverview Audit helpers for simplified audit trail logging
 *
 * Provides streamlined functions for common audit logging patterns.
 * Eliminates 40+ duplicate audit logging blocks across services.
 */

import { createAuditLog, getIpAddress, getUserAgent } from './auditLog.js';

/**
 * Log a database action to the audit trail
 *
 * Simplified wrapper around createAuditLog that handles common patterns.
 * Automatically skips logging if no user in request (e.g., system operations).
 *
 * @param {string} action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} tableName - Database table/model name
 * @param {string} recordId - ID of the affected record
 * @param {Object} req - Express request object (must have req.user)
 * @param {Object} [values={}] - Optional old/new values
 * @param {Object} [values.oldValues] - Previous record state (for UPDATE/DELETE)
 * @param {Object} [values.newValues] - New record state (for CREATE/UPDATE)
 * @returns {Promise<void>}
 *
 * @example
 * // Log CREATE action
 * await logAction('CREATE', 'AssetItem', item.id, req, {
 *   newValues: item
 * });
 *
 * @example
 * // Log UPDATE action
 * await logAction('UPDATE', 'AssetItem', id, req, {
 *   oldValues: existingItem,
 *   newValues: updatedItem
 * });
 *
 * @example
 * // Log DELETE action
 * await logAction('DELETE', 'AssetItem', id, req, {
 *   oldValues: existingItem
 * });
 */
export const logAction = async (action, tableName, recordId, req, values = {}) => {
  // Skip if no authenticated user (e.g., system operations, tests)
  if (!req?.user) return;

  await createAuditLog({
    userId: req.user.id,
    action: action.toUpperCase(),
    tableName,
    recordId,
    oldValues: values.oldValues || null,
    newValues: values.newValues || null,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });
};

/**
 * Log a CREATE action (convenience wrapper)
 *
 * @param {string} tableName - Database table/model name
 * @param {string} recordId - ID of created record
 * @param {Object} req - Express request object
 * @param {Object} newValues - Created record data
 * @returns {Promise<void>}
 *
 * @example
 * await logCreate('AssetItem', item.id, req, item);
 */
export const logCreate = async (tableName, recordId, req, newValues) => {
  await logAction('CREATE', tableName, recordId, req, { newValues });
};

/**
 * Log an UPDATE action (convenience wrapper)
 *
 * @param {string} tableName - Database table/model name
 * @param {string} recordId - ID of updated record
 * @param {Object} req - Express request object
 * @param {Object} oldValues - Previous record state
 * @param {Object} newValues - New record state
 * @returns {Promise<void>}
 *
 * @example
 * await logUpdate('AssetItem', id, req, existingItem, updatedItem);
 */
export const logUpdate = async (tableName, recordId, req, oldValues, newValues) => {
  await logAction('UPDATE', tableName, recordId, req, { oldValues, newValues });
};

/**
 * Log a DELETE action (convenience wrapper)
 *
 * @param {string} tableName - Database table/model name
 * @param {string} recordId - ID of deleted record
 * @param {Object} req - Express request object
 * @param {Object} oldValues - Deleted record data
 * @returns {Promise<void>}
 *
 * @example
 * await logDelete('AssetItem', id, req, existingItem);
 */
export const logDelete = async (tableName, recordId, req, oldValues) => {
  await logAction('DELETE', tableName, recordId, req, { oldValues });
};
