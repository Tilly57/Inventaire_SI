/**
 * @fileoverview Response helpers for standardized API responses
 *
 * Provides consistent response formatting across all controllers.
 * Eliminates duplicate response patterns (50+ occurrences reduced to reusable functions).
 */

/**
 * Send a successful response
 *
 * @param {Object} res - Express response object
 * @param {*} data - Data to return
 * @param {number} [statusCode=200] - HTTP status code
 *
 * @example
 * sendSuccess(res, user); // 200 OK
 * sendSuccess(res, items, 201); // 201 Created
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Send a created response (HTTP 201)
 *
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 *
 * @example
 * sendCreated(res, newUser);
 */
export const sendCreated = (res, data) => {
  sendSuccess(res, data, 201);
};

/**
 * Send a successful response with additional metadata
 *
 * @param {Object} res - Express response object
 * @param {*} data - Data to return
 * @param {Object} meta - Additional metadata (count, pagination, etc.)
 * @param {number} [statusCode=200] - HTTP status code
 *
 * @example
 * sendSuccessWithMeta(res, items, { count: items.length, total: 100 });
 */
export const sendSuccessWithMeta = (res, data, meta, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    ...meta
  });
};
