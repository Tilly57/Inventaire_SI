/**
 * Routes pour les health checks (Kubernetes-compatible)
 */
import express from 'express';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Vérifie si le serveur est vivant
 *     tags: [Health]
 *     security: []
 *     description: |
 *       Endpoint de liveness check (Kubernetes-compatible).
 *       Vérifie si le processus est en cours d'exécution.
 *       Utilisé pour redémarrer les pods non responsifs.
 *     responses:
 *       200:
 *         description: Serveur vivant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00.000Z
 */
router.get('/health/liveness', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Vérifie si le serveur est prêt à recevoir du trafic
 *     tags: [Health]
 *     security: []
 *     description: |
 *       Endpoint de readiness check (Kubernetes-compatible).
 *       Vérifie la connexion à la base de données.
 *       Utilisé pour router le trafic vers les pods prêts.
 *     responses:
 *       200:
 *         description: Serveur prêt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *       503:
 *         description: Serveur non prêt (problème base de données)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: disconnected
 *                 error:
 *                   type: string
 */
router.get('/health/readiness', async (req, res) => {
  try {
    // Tester la connexion base de données avec une requête simple
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check readiness failed', { error: error.message });

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
      },
      error: error.message,
    });
  }
});

/**
 * GET /api/health/startup
 * Vérifie si l'application a terminé son initialisation
 * Utilisé par Kubernetes pour savoir quand commencer les liveness/readiness checks
 */
router.get('/health/startup', async (req, res) => {
  try {
    // Vérifier que la base de données est accessible
    await prisma.$queryRaw`SELECT 1`;

    // Vérifier que les tables principales existent
    const userCount = await prisma.user.count();

    res.json({
      status: 'started',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        migrations: 'applied',
        userTable: userCount >= 0 ? 'exists' : 'missing',
      },
    });
  } catch (error) {
    logger.error('Health check startup failed', { error: error.message });

    res.status(503).json({
      status: 'not started',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check simple
 *     tags: [Health]
 *     security: []
 *     description: |
 *       Endpoint de health check général.
 *       Retourne le statut du serveur et la connexion DB.
 *     responses:
 *       200:
 *         description: Serveur en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Durée de fonctionnement en secondes
 *                   example: 3600.5
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Serveur en mauvaise santé
 */
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

export default router;
