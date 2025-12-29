/**
 * Equipment Types routes
 *
 * All routes require ADMIN role
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

// Apply authentication and ADMIN role to all routes
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/equipment-types - Get all equipment types
router.get('/', getAllTypes);

// GET /api/equipment-types/:id - Get equipment type by ID
router.get('/:id', getTypeById);

// POST /api/equipment-types - Create new equipment type
router.post('/', validate(createEquipmentTypeSchema), createType);

// PATCH /api/equipment-types/:id - Update equipment type
router.patch('/:id', validate(updateEquipmentTypeSchema), updateType);

// DELETE /api/equipment-types/:id - Delete equipment type
router.delete('/:id', deleteType);

export default router;
