/**
 * Application entry point
 */
import 'dotenv/config';
import app from './app.js';
import prisma from './config/database.js';

const PORT = process.env.PORT || 3001;

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Test database connection
async function startServer() {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
