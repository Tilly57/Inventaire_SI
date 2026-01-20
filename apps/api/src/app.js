/**
 * Simplified Express application for debugging
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { setCacheHeaders } from './middleware/cacheHeaders.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';
import swaggerSpec from './config/swagger.js';

const app = express();

// CORS - simplified
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Simplified for now
}));

// Compression
app.use(compression());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rate limiting
app.use('/api', generalLimiter);

// Cache headers
app.use('/api', setCacheHeaders);

// Metrics endpoint
app.use('/api', metricsRoutes);

// Swagger API Documentation
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Inventaire SI - API Docs',
}));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
