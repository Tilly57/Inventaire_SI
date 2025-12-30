/**
 * Application entry point
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import app from './app.js';
import prisma from './config/database.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3001;

/**
 * Lire un secret depuis Docker secrets (_FILE) ou variable d'environnement
 * @param {string} envVar - Nom de la variable d'environnement
 * @returns {string|undefined} - Valeur du secret
 */
function loadSecret(envVar) {
  const fileVar = `${envVar}_FILE`;

  // Priorité 1: Lire depuis fichier Docker secret si défini
  if (process.env[fileVar]) {
    try {
      return readFileSync(process.env[fileVar], 'utf-8').trim();
    } catch (error) {
      logger.error(`❌ Erreur lecture secret ${fileVar}:`, { message: error.message });
      process.exit(1);
    }
  }

  // Priorité 2: Utiliser variable d'environnement directe
  return process.env[envVar];
}

// Charger les secrets
const JWT_ACCESS_SECRET = loadSecret('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET = loadSecret('JWT_REFRESH_SECRET');

// Valider la présence des secrets
const requiredSecrets = [
  { name: 'JWT_ACCESS_SECRET', value: JWT_ACCESS_SECRET },
  { name: 'JWT_REFRESH_SECRET', value: JWT_REFRESH_SECRET },
  { name: 'DATABASE_URL', value: process.env.DATABASE_URL }
];

const missingSecrets = requiredSecrets.filter(s => !s.value);
if (missingSecrets.length > 0) {
  logger.error(`❌ Secrets manquants: ${missingSecrets.map(s => s.name).join(', ')}`);
  process.exit(1);
}

// Valider que les secrets ne sont pas les valeurs par défaut (SÉCURITÉ CRITIQUE)
const defaultSecrets = [
  'change_me_access',
  'change_me_refresh',
  'supersecretkey',
  'secret',
  'changeme',
  'default'
];

const insecureSecrets = requiredSecrets.filter(s =>
  defaultSecrets.some(def => s.value.toLowerCase().includes(def))
);

if (insecureSecrets.length > 0) {
  logger.error('🚨 ERREUR DE SÉCURITÉ: Secrets par défaut détectés!');
  logger.error(`   Secrets concernés: ${insecureSecrets.map(s => s.name).join(', ')}`);
  logger.error('   Action requise: Générer des secrets forts avec ./scripts/generate-secrets.sh');
  process.exit(1);
}

// Injecter les secrets chargés dans process.env pour le reste de l'application
process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;

// Test database connection
async function startServer() {
  try {
    // Test Prisma connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 API server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('⚠️  SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('⚠️  SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
