/**
 * Stock Items controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as stockItemsService from '../services/stockItems.service.js';

/**
 * GET /api/stock-items
 */
export const getAllStockItems = asyncHandler(async (req, res) => {
  const stockItems = await stockItemsService.getAllStockItems();

  res.json({
    success: true,
    data: stockItems
  });
});

/**
 * GET /api/stock-items/:id
 */
export const getStockItemById = asyncHandler(async (req, res) => {
  const stockItem = await stockItemsService.getStockItemById(req.params.id);

  res.json({
    success: true,
    data: stockItem
  });
});

/**
 * POST /api/stock-items
 */
export const createStockItem = asyncHandler(async (req, res) => {
  const stockItem = await stockItemsService.createStockItem(req.body);

  res.status(201).json({
    success: true,
    data: stockItem
  });
});

/**
 * PATCH /api/stock-items/:id
 */
export const updateStockItem = asyncHandler(async (req, res) => {
  const stockItem = await stockItemsService.updateStockItem(req.params.id, req.body);

  res.json({
    success: true,
    data: stockItem
  });
});

/**
 * PATCH /api/stock-items/:id/quantity
 */
export const adjustQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const stockItem = await stockItemsService.adjustStockQuantity(req.params.id, quantity);

  res.json({
    success: true,
    data: stockItem
  });
});

/**
 * DELETE /api/stock-items/:id
 */
export const deleteStockItem = asyncHandler(async (req, res) => {
  const result = await stockItemsService.deleteStockItem(req.params.id);

  res.json({
    success: true,
    data: result
  });
});
