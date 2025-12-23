/**
 * Asset Models routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllAssetModels, getAssetModelById, createAssetModel, updateAssetModel, deleteAssetModel } from '../controllers/assetModels.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createAssetModelSchema, updateAssetModelSchema } from '../validators/assetModels.validator.js';

const router = express.Router();

// All asset model routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

router.get('/', getAllAssetModels);
router.get('/:id', getAssetModelById);
router.post('/', validate(createAssetModelSchema), createAssetModel);
router.patch('/:id', validate(updateAssetModelSchema), updateAssetModel);
router.delete('/:id', deleteAssetModel);

export default router;
