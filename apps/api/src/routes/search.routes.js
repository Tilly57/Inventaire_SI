/**
 * @fileoverview Search routes - Global search and autocomplete endpoints
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as searchController from '../controllers/search.controller.js';

const router = express.Router();

/**
 * All search routes require authentication
 */
router.use(requireAuth);

/**
 * @route GET /api/search
 * @desc Global search across all entities
 * @access Private
 * @query {string} q - Search query
 * @query {number} limit - Max results per category (default: 10, max: 50)
 */
router.get('/', searchController.globalSearch);

/**
 * @route GET /api/search/autocomplete/employees
 * @desc Autocomplete employees by name or email
 * @access Private
 * @query {string} q - Search query
 * @query {number} limit - Max results (default: 10, max: 20)
 */
router.get('/autocomplete/employees', searchController.autocompleteEmployees);

/**
 * @route GET /api/search/autocomplete/asset-items
 * @desc Autocomplete asset items
 * @access Private
 * @query {string} q - Search query
 * @query {number} limit - Max results (default: 10, max: 20)
 * @query {boolean} availableOnly - Only show EN_STOCK items (default: true)
 */
router.get('/autocomplete/asset-items', searchController.autocompleteAssetItems);

/**
 * @route GET /api/search/autocomplete/asset-models
 * @desc Autocomplete asset models
 * @access Private
 * @query {string} q - Search query
 * @query {number} limit - Max results (default: 10, max: 20)
 */
router.get('/autocomplete/asset-models', searchController.autocompleteAssetModels);

export default router;
