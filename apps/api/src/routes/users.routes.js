/**
 * Users routes - ADMIN only
 */
import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, changePassword } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validateRequest.js';
import { createUserSchema, updateUserSchema, changePasswordSchema } from '../validators/users.validator.js';

const router = express.Router();

// All user routes require authentication and ADMIN role
router.use(requireAuth, requireAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/password', validate(changePasswordSchema), changePassword);

export default router;
