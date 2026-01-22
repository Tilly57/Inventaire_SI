/**
 * Application entry point
 *
 * IMPORTANT: Sentry must be imported first to catch all errors
 */
import 'dotenv/config';
import { initializeSentry } from './config/sentry.js';
import { readFileSync } from 'fs';
import app from './app.js';
import prisma from './config/database.js';
import logger from './config/logger.js';

// Initialize Sentry as early as possible
initializeSentry();

const PORT = process.env.PORT || 3001;

function loadSecret(envVar) {
  const fileVar = `${envVar}_FILE`;
  if (process.env[fileVar]) {
    try {
      return readFileSync(process.env[fileVar], 'utf-8').trim();
    } catch (error) {
      logger.error(`Error reading secret ${fileVar}:`, { message: error.message });
      process.exit(1);
    }
  }
  return process.env[envVar];
}

// Load secrets
const JWT_ACCESS_SECRET = loadSecret('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET = loadSecret('JWT_REFRESH_SECRET');

// Inject into process.env
process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;

// Start server
async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
        port: PORT
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();
