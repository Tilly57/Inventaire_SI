/**
 * Application entry point
 *
 * IMPORTANT: Sentry must be imported first to catch all errors
 */
import 'dotenv/config';
import { initializeSentry } from './config/sentry.js';
import * as Sentry from '@sentry/node';
import { readFileSync } from 'fs';
import app from './app.js';
import prisma from './config/database.js';
import logger from './config/logger.js';
import { getRedisClient } from './services/cache.service.js';

initializeSentry();

const PORT = process.env.PORT || 3001;
const SHUTDOWN_TIMEOUT_MS = 30_000;

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

const JWT_ACCESS_SECRET = loadSecret('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET = loadSecret('JWT_REFRESH_SECRET');

process.env.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;

let server;
let shuttingDown = false;

async function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}, starting graceful shutdown (timeout ${SHUTDOWN_TIMEOUT_MS}ms)`);

  // Force-exit safety net: if resources hang, kill the process
  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    try {
      const redis = getRedisClient();
      if (redis && redis.status !== 'end') {
        await redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.warn('Redis shutdown error', { message: error.message });
    }

    await prisma.$disconnect();
    logger.info('Database connection closed');

    await Sentry.close(2_000);

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
        port: PORT,
      });
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();