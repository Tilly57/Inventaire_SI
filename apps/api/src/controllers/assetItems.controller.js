/**
 * Asset Items controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as assetItemsService from '../services/assetItems.service.js';

/**
 * GET /api/asset-items
 */
export const getAllAssetItems = asyncHandler(async (req, res) => {
  const { status, assetModelId, search } = req.query;

  const assetItems = await assetItemsService.getAllAssetItems({ status, assetModelId, search });

  res.json({
    success: true,
    data: assetItems
  });
});

/**
 * GET /api/asset-items/:id
 */
export const getAssetItemById = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.getAssetItemById(req.params.id);

  res.json({
    success: true,
    data: assetItem
  });
});

/**
 * POST /api/asset-items
 */
export const createAssetItem = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.createAssetItem(req.body);

  res.status(201).json({
    success: true,
    data: assetItem
  });
});

/**
 * PATCH /api/asset-items/:id
 */
export const updateAssetItem = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.updateAssetItem(req.params.id, req.body);

  res.json({
    success: true,
    data: assetItem
  });
});

/**
 * PATCH /api/asset-items/:id/status
 */
export const updateAssetItemStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const assetItem = await assetItemsService.updateAssetItemStatus(req.params.id, status);

  res.json({
    success: true,
    data: assetItem
  });
});

/**
 * DELETE /api/asset-items/:id
 */
export const deleteAssetItem = asyncHandler(async (req, res) => {
  const result = await assetItemsService.deleteAssetItem(req.params.id);

  res.json({
    success: true,
    data: result
  });
});

/**
 * POST /api/asset-items/bulk
 * Create multiple asset items in bulk with auto-generated tags
 */
export const createAssetItemsBulk = asyncHandler(async (req, res) => {
  const assetItems = await assetItemsService.createAssetItemsBulk(req.body);

  res.status(201).json({
    success: true,
    data: assetItems,
    count: assetItems.length
  });
});

/**
 * GET /api/asset-items/bulk/preview
 * Preview bulk creation - returns generated tags and conflicts
 */
export const previewBulkCreation = asyncHandler(async (req, res) => {
  const { tagPrefix, quantity } = req.query;

  const preview = await assetItemsService.previewBulkCreation(
    tagPrefix,
    parseInt(quantity, 10)
  );

  res.json({
    success: true,
    data: preview
  });
});
