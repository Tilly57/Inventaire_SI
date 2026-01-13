/**
 * Express application configuration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { serveProtectedFile } from './middleware/serveProtectedFiles.js';
import { setCacheHeaders } from './middleware/cacheHeaders.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';
import swaggerSpec from './config/swagger.js';

const app = express();

// CORS configuration with strict origin validation
// Validates origins against whitelist and secure patterns (http/https only)
const validateCorsOrigin = (origin) => {
  // Allow requests with no origin (e.g., mobile apps, curl, Postman)
  if (!origin) return true;

  // Parse and validate CORS origins from environment
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0);

  // Strict validation: origin must match exactly AND use http/https protocol
  const isAllowed = allowedOrigins.some(allowed => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);

      // Must use http or https protocol
      if (!['http:', 'https:'].includes(originUrl.protocol)) {
        return false;
      }

      // Exact match required (protocol + hostname + port)
      return allowedUrl.origin === originUrl.origin;
    } catch (err) {
      // Invalid URL format
      return false;
    }
  });

  return isAllowed;
};

app.use(cors({
  origin: validateCorsOrigin,
  credentials: true
}));

// Security headers with Helmet (CSP, XSS protection, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
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

// Swagger API Documentation - Phase 3.7
// Accessible at http://localhost:3001/api-docs
// Swagger JSON spec available at http://localhost:3001/api-docs.json
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Inventaire SI - API Docs',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    url: '/api-docs.json'
  }
}));

// API routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
