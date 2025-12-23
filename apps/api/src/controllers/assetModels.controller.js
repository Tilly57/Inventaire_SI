/**
 * Asset Models controllers - HTTP handlers
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as assetModelsService from '../services/assetModels.service.js';

/**
 * GET /api/asset-models
 */
export const getAllAssetModels = asyncHandler(async (req, res) => {
  const assetModels = await assetModelsService.getAllAssetModels();

  res.json({
    success: true,
    data: assetModels
  });
});

/**
 * GET /api/asset-models/:id
 */
export const getAssetModelById = asyncHandler(async (req, res) => {
  const assetModel = await assetModelsService.getAssetModelById(req.params.id);

  res.json({
    success: true,
    data: assetModel
  });
});

/**
 * POST /api/asset-models
 */
export const createAssetModel = asyncHandler(async (req, res) => {
  const assetModel = await assetModelsService.createAssetModel(req.body);

  res.status(201).json({
    success: true,
    data: assetModel
  });
});

/**
 * PATCH /api/asset-models/:id
 */
export const updateAssetModel = asyncHandler(async (req, res) => {
  const assetModel = await assetModelsService.updateAssetModel(req.params.id, req.body);

  res.json({
    success: true,
    data: assetModel
  });
});

/**
 * DELETE /api/asset-models/:id
 */
export const deleteAssetModel = asyncHandler(async (req, res) => {
  const result = await assetModelsService.deleteAssetModel(req.params.id);

  res.json({
    success: true,
    data: result
  });
});
