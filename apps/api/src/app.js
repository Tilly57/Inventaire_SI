/**
 * Express application configuration
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

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

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// API routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
