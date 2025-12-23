/**
 * Main routes aggregator
 */
import express from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import employeesRoutes from './employees.routes.js';
import assetModelsRoutes from './assetModels.routes.js';
import assetItemsRoutes from './assetItems.routes.js';
import stockItemsRoutes from './stockItems.routes.js';
import loansRoutes from './loans.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Inventaire SI API'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/employees', employeesRoutes);
router.use('/asset-models', assetModelsRoutes);
router.use('/asset-items', assetItemsRoutes);
router.use('/stock-items', stockItemsRoutes);
router.use('/loans', loansRoutes);

export default router;
