/**
 * Configuration des métriques Prometheus
 */
import promClient from 'prom-client';

// Créer un registre personnalisé
const register = new promClient.Registry();

// Collecter les métriques par défaut de Node.js (CPU, mémoire, event loop, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'inventaire_api_',
});

// Métrique: Durée des requêtes HTTP
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5], // Buckets en secondes
  registers: [register],
});

// Métrique: Nombre total de requêtes HTTP
export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Métrique: Taille des réponses HTTP
export const httpResponseSize = new promClient.Histogram({
  name: 'http_response_size_bytes',
  help: 'Taille des réponses HTTP en bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000], // Buckets en bytes
  registers: [register],
});

// Métrique: Requêtes actives en cours
export const httpRequestsInProgress = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'Nombre de requêtes HTTP en cours de traitement',
  registers: [register],
});

// Métriques Business: Prêts
export const loansTotal = new promClient.Gauge({
  name: 'loans_total',
  help: 'Nombre total de prêts',
  labelNames: ['status'], // OPEN, CLOSED
  registers: [register],
});

export const loansCreated = new promClient.Counter({
  name: 'loans_created_total',
  help: 'Nombre total de prêts créés',
  registers: [register],
});

export const loansClosed = new promClient.Counter({
  name: 'loans_closed_total',
  help: 'Nombre total de prêts fermés',
  registers: [register],
});

// Métriques Business: Employés
export const employeesTotal = new promClient.Gauge({
  name: 'employees_total',
  help: 'Nombre total d\'employés',
  registers: [register],
});

// Métriques Business: Équipements
export const assetsTotal = new promClient.Gauge({
  name: 'assets_total',
  help: 'Nombre total d\'équipements',
  labelNames: ['status'], // EN_STOCK, PRETE, HS, REPARATION
  registers: [register],
});

// Métriques Base de données
export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Durée des requêtes base de données en secondes',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const dbErrors = new promClient.Counter({
  name: 'db_errors_total',
  help: 'Nombre total d\'erreurs base de données',
  labelNames: ['operation', 'model'],
  registers: [register],
});

// Exporter le registre
export default register;
