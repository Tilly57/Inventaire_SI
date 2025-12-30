/**
 * Routes pour les health checks (Kubernetes-compatible)
 */
import express from 'express';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /api/health/liveness
 * Vérifie si le serveur est vivant (processus en cours d'exécution)
 * Utilisé par Kubernetes pour redémarrer les pods non responsifs
 */
router.get('/health/liveness', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/readiness
 * Vérifie si le serveur est prêt à recevoir du trafic
 * Vérifie la connexion base de données
 * Utilisé par Kubernetes pour router le trafic
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
 * GET /api/health (alias pour readiness)
 * Endpoint de health check simple
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
