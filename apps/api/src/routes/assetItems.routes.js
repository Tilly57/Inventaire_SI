/**
 * Asset Items routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import {
  getAllAssetItems,
  getAssetItemById,
  createAssetItem,
  createAssetItemsBulk,
  previewBulkCreation,
  updateAssetItem,
  updateAssetItemStatus,
  deleteAssetItem
} from '../controllers/assetItems.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import {
  createAssetItemSchema,
  createAssetItemsBulkSchema,
  bulkPreviewSchema,
  updateAssetItemSchema,
  updateStatusSchema
} from '../validators/assetItems.validator.js';

const router = express.Router();

// All asset item routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

// Bulk routes - MUST be before GET /:id to avoid "bulk" being interpreted as an ID
router.get('/bulk/preview', validate(bulkPreviewSchema, 'query'), previewBulkCreation);
router.post('/bulk', validate(createAssetItemsBulkSchema), createAssetItemsBulk);

// Standard CRUD routes
router.get('/', getAllAssetItems);
router.get('/:id', getAssetItemById);
router.post('/', validate(createAssetItemSchema), createAssetItem);
router.patch('/:id', validate(updateAssetItemSchema), updateAssetItem);
router.patch('/:id/status', validate(updateStatusSchema), updateAssetItemStatus);
router.delete('/:id', deleteAssetItem);

export default router;
