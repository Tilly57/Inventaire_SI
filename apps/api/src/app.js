/**
 * Express application with production-ready security configuration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { setCacheHeaders } from './middleware/cacheHeaders.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import { csrfTokenGenerator, csrfProtection, getCsrfToken } from './middleware/csrf.js';

const app = express();

// Trust first proxy (Nginx) — needed for correct req.ip and req.protocol behind reverse proxy
app.set('trust proxy', 1);

// CORS - Production-ready configuration with restricted origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin (health checks, monitoring tools, internal calls)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
  maxAge: 86400 // 24 hours
}));

// Security headers with Helmet - Production-ready CSP
// In production, we disable Swagger and enforce strict CSP (no unsafe-inline)
// In development, we relax CSP slightly for Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]  // Strict in production - NO unsafe-inline
        : ["'self'", "'unsafe-inline'"],  // Relaxed for Swagger in dev
      styleSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]  // Strict in production - NO unsafe-inline
        : ["'self'", "'unsafe-inline'"],  // Relaxed for Swagger in dev
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Compression
app.use(compression());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Sentry request/tracing handlers (Sentry v7 API — skipped if unavailable in v8+)
if (Sentry.Handlers) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// HTTP request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// CSRF token generation (must be before csrfProtection)
app.use(csrfTokenGenerator);

// CSRF token endpoint (before csrfProtection to allow getting token)
app.get('/api/csrf-token', getCsrfToken);

// CSRF protection for state-changing operations
app.use('/api', csrfProtection);

// Rate limiting
app.use('/api', generalLimiter);

// Cache headers
app.use('/api', setCacheHeaders);

// Metrics endpoint
app.use('/api', metricsRoutes);

// Swagger API Documentation - Only in development
// In production, use external documentation or separate subdomain
if (process.env.NODE_ENV !== 'production') {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Inventaire SI - API Docs',
  }));

  logger.info('📚 Swagger UI available at /api-docs');
} else {
  logger.info('📚 Swagger UI disabled in production (security: strict CSP)');
}

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (Sentry v7 API — skipped if unavailable in v8+)
if (Sentry.Handlers) {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return !error.statusCode || error.statusCode >= 500;
    }
  }));
}

// Global error handler
app.use(errorHandler);

export default app;
