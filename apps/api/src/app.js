/**
 * Express application configuration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { serveProtectedFile } from './middleware/serveProtectedFiles.js';
import { setCacheHeaders } from './middleware/cacheHeaders.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Compression middleware (gzip/deflate) - Phase 3.4
// Compress all responses > 1KB for -70% bandwidth savings
app.use(compression({
  level: 6, // Compression level (0-9, 6 is optimal balance)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client sends x-no-compression header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter
    return compression.filter(req, res);
  }
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

// Cache headers for improved performance - Phase 3.4
// Must be before routes to set headers on all API responses
app.use('/api', setCacheHeaders);

// API routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
