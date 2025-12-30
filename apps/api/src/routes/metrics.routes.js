/**
 * Routes pour exposer les métriques Prometheus
 */
import express from 'express';
import register from '../config/metrics.js';

const router = express.Router();

/**
 * GET /api/metrics
 * Expose les métriques au format Prometheus
 */
router.get('/metrics', async (req, res) => {
  try {
    // Définir le content-type pour Prometheus
    res.set('Content-Type', register.contentType);

    // Récupérer toutes les métriques
    const metrics = await register.metrics();

    res.send(metrics);
  } catch (error) {
    res.status(500).send('Erreur lors de la collecte des métriques');
  }
});

export default router;
