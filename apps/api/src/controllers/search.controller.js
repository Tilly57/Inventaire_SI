/**
 * @fileoverview Search controller - Handles global search and autocomplete requests
 */

import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendSuccess } from '../utils/responseHelpers.js';
import * as searchService from '../services/search.service.js';

/**
 * Global search across all entities
 *
 * @route GET /api/search
 * @access Private
 * @param {string} q - Search query
 * @param {number} limit - Max results per category (default: 10, max: 50)
 *
 * @example
 * GET /api/search?q=laptop%20dell&limit=5
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return sendSuccess(res, {
      employees: [],
      assetItems: [],
      assetModels: [],
      stockItems: []
    });
  }

  const results = await searchService.globalSearch({ query, limit });
  sendSuccess(res, results);
});

/**
 * Autocomplete employees by name or email
 *
 * @route GET /api/search/autocomplete/employees
 * @access Private
 * @param {string} q - Search query
 * @param {number} limit - Max results (default: 10, max: 20)
 *
 * @example
 * GET /api/search/autocomplete/employees?q=john
 */
export const autocompleteEmployees = asyncHandler(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return sendSuccess(res, []);
  }

  const results = await searchService.autocompleteEmployees(query, limit);
  sendSuccess(res, results);
});

/**
 * Autocomplete asset items
 *
 * @route GET /api/search/autocomplete/asset-items
 * @access Private
 * @param {string} q - Search query
 * @param {number} limit - Max results (default: 10, max: 20)
 * @param {boolean} availableOnly - Only show EN_STOCK items (default: true)
 *
 * @example
 * GET /api/search/autocomplete/asset-items?q=LAP&availableOnly=true
 */
export const autocompleteAssetItems = asyncHandler(async (req, res) => {
  const { q: query, limit = 10, availableOnly = 'true' } = req.query;

  if (!query || query.trim().length < 2) {
    return sendSuccess(res, []);
  }

  const available = availableOnly === 'true' || availableOnly === true;
  const results = await searchService.autocompleteAssetItems(query, limit, available);
  sendSuccess(res, results);
});

/**
 * Autocomplete asset models
 *
 * @route GET /api/search/autocomplete/asset-models
 * @access Private
 * @param {string} q - Search query
 * @param {number} limit - Max results (default: 10, max: 20)
 *
 * @example
 * GET /api/search/autocomplete/asset-models?q=dell
 */
export const autocompleteAssetModels = asyncHandler(async (req, res) => {
  const { q: query, limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return sendSuccess(res, []);
  }

  const results = await searchService.autocompleteAssetModels(query, limit);
  sendSuccess(res, results);
});
