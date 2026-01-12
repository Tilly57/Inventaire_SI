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

/**
 * Valider la force d'un secret JWT (SÉCURITÉ CRITIQUE)
 * @param {string} secret - Secret à valider
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateSecretStrength(secret) {
  const errors = [];

  // 1. Longueur minimale de 32 caractères
  if (secret.length < 32) {
    errors.push(`Longueur insuffisante (${secret.length} < 32 caractères)`);
  }

  // 2. Vérifier patterns par défaut dangereux
  const dangerousPatterns = [
    /change_?me/i,
    /default/i,
    /secret/i,
    /password/i,
    /admin/i,
    /test/i,
    /example/i,
    /demo/i,
    /your_.*_here/i
  ];

  const foundPatterns = dangerousPatterns.filter(pattern => pattern.test(secret));
  if (foundPatterns.length > 0) {
    errors.push('Contient des patterns par défaut dangereux');
  }

  // 3. Vérifier la complexité (au moins 3 des 4 types de caractères)
  const hasLowercase = /[a-z]/.test(secret);
  const hasUppercase = /[A-Z]/.test(secret);
  const hasDigits = /\d/.test(secret);
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);

  const complexityScore = [hasLowercase, hasUppercase, hasDigits, hasSpecial].filter(Boolean).length;

  if (complexityScore < 3) {
    errors.push(`Complexité insuffisante (score ${complexityScore}/4). Utilisez majuscules, minuscules, chiffres et caractères spéciaux`);
  }

  // 4. Vérifier patterns répétitifs (ex: "aaaaaaa", "1111111")
  if (/(.)\1{5,}/.test(secret)) {
    errors.push('Contient des caractères répétés excessivement');
  }

  // 5. Vérifier séquences simples (ex: "abcdef", "123456")
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(secret)) {
    errors.push('Contient des séquences alphabétiques simples');
  }

  if (/(?:012|123|234|345|456|567|678|789)/.test(secret)) {
    errors.push('Contient des séquences numériques simples');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Valider que les JWT secrets sont forts (SÉCURITÉ CRITIQUE)
const jwtSecrets = requiredSecrets.filter(s => s.name.includes('JWT'));
const weakSecrets = [];

for (const secret of jwtSecrets) {
  const validation = validateSecretStrength(secret.value);
  if (!validation.valid) {
    weakSecrets.push({
      name: secret.name,
      errors: validation.errors
    });
  }
}

if (weakSecrets.length > 0) {
  logger.error('🚨 ERREUR DE SÉCURITÉ: Secrets JWT faibles détectés!');
  for (const weak of weakSecrets) {
    logger.error(`   ${weak.name}:`);
    weak.errors.forEach(err => logger.error(`     - ${err}`));
  }
  logger.error('');
  logger.error('   💡 Action requise: Générer des secrets forts');
  logger.error('      Commande: openssl rand -base64 48');
  logger.error('      ou: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"');
  process.exit(1);
}

// Injecter les secrets chargés dans process.env pour le reste de l'application
process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;

// Validate environment variables with Zod
import { env } from './config/env.js';
logger.info('✅ Environment variables validated');

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
