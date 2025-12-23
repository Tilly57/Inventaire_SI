/**
 * Authentication routes
 */
import express from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, me);

export default router;
