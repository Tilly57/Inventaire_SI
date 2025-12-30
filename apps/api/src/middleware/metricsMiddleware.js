/**
 * Middleware pour collecter les métriques Prometheus
 */
import {
  httpRequestDuration,
  httpRequestTotal,
  httpResponseSize,
  httpRequestsInProgress,
} from '../config/metrics.js';

/**
 * Normaliser les routes pour éviter les cardinalités élevées
 * Ex: /api/loans/123 -> /api/loans/:id
 */
function normalizeRoute(path) {
  // Remplacer les IDs (CUIDs, UUIDs, nombres) par :id
  return path
    .replace(/\/[a-z0-9]{25}(?=\/|$)/gi, '/:id') // CUID (25 chars)
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:id') // UUID
    .replace(/\/\d+(?=\/|$)/g, '/:id'); // Nombres
}

/**
 * Middleware de métriques HTTP
 */
export function metricsMiddleware(req, res, next) {
  // Ignorer la route /metrics elle-même
  if (req.path === '/api/metrics') {
    return next();
  }

  const start = Date.now();

  // Incrémenter le gauge des requêtes en cours
  httpRequestsInProgress.inc();

  // Capturer la fin de la requête
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convertir en secondes
    const route = normalizeRoute(req.path);
    const method = req.method;
    const statusCode = res.statusCode;

    // Labels communs
    const labels = {
      method,
      route,
      status_code: statusCode,
    };

    // Collecter les métriques
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);

    // Taille de la réponse (si disponible)
    const contentLength = res.get('Content-Length');
    if (contentLength) {
      httpResponseSize.observe(labels, parseInt(contentLength, 10));
    }

    // Décrémenter le gauge des requêtes en cours
    httpRequestsInProgress.dec();
  });

  next();
}
