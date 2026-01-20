/**
 * Application entry point
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import app from './app.js';
import prisma from './config/database.js';
import logger from './config/logger.js';

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
    console.log('✅ Database connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

startServer();
