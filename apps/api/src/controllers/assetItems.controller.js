/**
 * Asset Items controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as assetItemsService from '../services/assetItems.service.js';
import { sendSuccess, sendCreated, sendSuccessWithMeta } from '../utils/responseHelpers.js';
import { parsePaginationParams } from '../utils/pagination.js';

/**
 * GET /api/asset-items
 * Supports pagination when page/pageSize params provided
 */
export const getAllAssetItems = asyncHandler(async (req, res) => {
  const { status, assetModelId, search, sortBy, sortOrder } = req.query;

  const isPaginationRequested = req.query.page !== undefined || req.query.pageSize !== undefined;

  if (isPaginationRequested) {
    const { page, pageSize } = parsePaginationParams(req.query);

    const result = await assetItemsService.getAllAssetItemsPaginated({
      status,
      assetModelId,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      ...result
    });
  } else {
    const assetItems = await assetItemsService.getAllAssetItems({ status, assetModelId, search });
    sendSuccess(res, assetItems);
  }
});

/**
 * GET /api/asset-items/:id
 */
export const getAssetItemById = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.getAssetItemById(req.params.id);

  sendSuccess(res, assetItem);
});

/**
 * POST /api/asset-items
 */
export const createAssetItem = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.createAssetItem(req.body, req);

  sendCreated(res, assetItem);
});

/**
 * PATCH /api/asset-items/:id
 */
export const updateAssetItem = asyncHandler(async (req, res) => {
  const assetItem = await assetItemsService.updateAssetItem(req.params.id, req.body, req);

  sendSuccess(res, assetItem);
});

/**
 * PATCH /api/asset-items/:id/status
 */
export const updateAssetItemStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const assetItem = await assetItemsService.updateAssetItemStatus(req.params.id, status, req);

  sendSuccess(res, assetItem);
});

/**
 * DELETE /api/asset-items/:id
 */
export const deleteAssetItem = asyncHandler(async (req, res) => {
  const result = await assetItemsService.deleteAssetItem(req.params.id, req);

  sendSuccess(res, result);
});

/**
 * POST /api/asset-items/bulk
 * Create multiple asset items in bulk with auto-generated tags
 */
export const createAssetItemsBulk = asyncHandler(async (req, res) => {
  const assetItems = await assetItemsService.createAssetItemsBulk(req.body);

  sendSuccessWithMeta(res, assetItems, { count: assetItems.length }, 201);
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

  sendSuccess(res, preview);
});
