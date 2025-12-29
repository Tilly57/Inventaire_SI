/**
 * Asset Models routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllAssetModels, getAssetModelById, createAssetModel, updateAssetModel, deleteAssetModel, batchDeleteAssetModels } from '../controllers/assetModels.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager, requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createAssetModelSchema, updateAssetModelSchema, batchDeleteAssetModelsSchema } from '../validators/assetModels.validator.js';

const router = express.Router();

// All asset model routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

router.get('/', getAllAssetModels);
router.post('/', validate(createAssetModelSchema), createAssetModel);

// Batch delete route - ADMIN only (must be BEFORE /:id route)
router.post('/batch-delete', requireAdmin, validate(batchDeleteAssetModelsSchema), batchDeleteAssetModels);

router.get('/:id', getAssetModelById);
router.patch('/:id', validate(updateAssetModelSchema), updateAssetModel);
router.delete('/:id', deleteAssetModel);

export default router;
