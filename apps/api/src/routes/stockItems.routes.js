/**
 * Stock Items routes - ADMIN and GESTIONNAIRE
 */
import express from 'express';
import { getAllStockItems, getStockItemById, createStockItem, updateStockItem, adjustQuantity, deleteStockItem } from '../controllers/stockItems.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireManager } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createStockItemSchema, updateStockItemSchema, adjustQuantitySchema } from '../validators/stockItems.validator.js';

const router = express.Router();

// All stock item routes require authentication and ADMIN or GESTIONNAIRE role
router.use(requireAuth, requireManager);

router.get('/', getAllStockItems);
router.get('/:id', getStockItemById);
router.post('/', validate(createStockItemSchema), createStockItem);
router.patch('/:id', validate(updateStockItemSchema), updateStockItem);
router.patch('/:id/quantity', validate(adjustQuantitySchema), adjustQuantity);
router.delete('/:id', deleteStockItem);

export default router;
