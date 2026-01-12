/**
 * Express application configuration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { serveProtectedFile } from './middleware/serveProtectedFiles.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Metrics middleware (must be before routes to track all requests)
app.use(metricsMiddleware);

// Rate limiting (apply to all routes)
app.use('/api', generalLimiter);

// Serve uploaded files with authentication protection
// IMPORTANT: Tous les fichiers uploadés nécessitent désormais une authentification JWT
app.use('/uploads/*', serveProtectedFile);

// Metrics endpoint (before other routes, no rate limiting)
app.use('/api', metricsRoutes);

// API routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
