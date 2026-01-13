/**
 * Authentication routes
 */
import express from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               role:
 *                 type: string
 *                 enum: [ADMIN, GESTIONNAIRE, LECTURE]
 *                 example: GESTIONNAIRE
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateur créé avec succès
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: clk1234567890
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     role:
 *                       type: string
 *                       example: GESTIONNAIRE
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter et obtenir des tokens JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abc123...; HttpOnly; Path=/api/auth/refresh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *                 accessToken:
 *                   type: string
 *                   description: Token JWT à utiliser dans Authorization header
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Email ou mot de passe incorrect
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renouveler l'access token avec le refresh token
 *     tags: [Auth]
 *     security: []
 *     description: Utilise le refresh token en cookie pour générer un nouvel access token
 *     responses:
 *       200:
 *         description: Token renouvelé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token manquant ou invalide
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Se déconnecter et supprimer le refresh token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtenir les informations de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: clk1234567890
 *                 email:
 *                   type: string
 *                   example: admin@example.com
 *                 role:
 *                   type: string
 *                   enum: [ADMIN, GESTIONNAIRE, LECTURE]
 *                   example: ADMIN
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00.000Z
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', requireAuth, me);

export default router;
