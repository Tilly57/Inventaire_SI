/**
 * Equipment Types routes
 *
 * GET routes: all authenticated users (needed for asset model forms)
 * Write routes: ADMIN only
 */
import express from 'express';
import {
  getAllTypes,
  getTypeById,
  createType,
  updateType,
  deleteType
} from '../controllers/equipmentTypes.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import {
  createEquipmentTypeSchema,
  updateEquipmentTypeSchema
} from '../validators/equipmentTypes.validator.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/equipment-types - Get all equipment types
router.get('/', getAllTypes);

// GET /api/equipment-types/:id - Get equipment type by ID
router.get('/:id', getTypeById);

// Write operations require ADMIN role
router.post('/', requireAdmin, validate(createEquipmentTypeSchema), createType);

// PATCH /api/equipment-types/:id - Update equipment type
router.patch('/:id', requireAdmin, validate(updateEquipmentTypeSchema), updateType);

// DELETE /api/equipment-types/:id - Delete equipment type
router.delete('/:id', requireAdmin, deleteType);

export default router;
