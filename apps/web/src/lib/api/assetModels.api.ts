/**
 * @fileoverview Asset Models API client
 *
 * Provides functions to interact with /api/asset-models endpoints.
 *
 * Asset Models represent equipment templates/categories
 * (e.g., "Dell Latitude 5420 Laptop", "HP Monitor 24 inch").
 * Individual physical items (AssetItems) reference these models.
 *
 * Requires ADMIN or GESTIONNAIRE role for modifications.
 */

import apiClient from './client'
import type {
  AssetModel,
  CreateAssetModelDto,
  UpdateAssetModelDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all asset models
 *
 * Returns all equipment model templates with item counts.
 * Uses high limit (1000) to bypass pagination.
 *
 * @returns Promise resolving to array of asset models
 *
 * @example
 * const models = await getAllAssetModelsApi();
 * // models = [
 * //   { id, type: 'LAPTOP', brand: 'Dell', modelName: 'Latitude 5420',
 * //     _count: { items: 15 } },
 * //   ...
 * // ]
 */
export async function getAllAssetModelsApi(): Promise<AssetModel[]> {
  const response = await apiClient.get<any>('/asset-models?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.models || []
}

/**
 * Fetch single asset model by ID
 *
 * Returns model details with all associated physical items.
 *
 * @param id - Asset model ID (CUID format)
 * @returns Promise resolving to AssetModel with items array
 * @throws {NotFoundError} If model doesn't exist (404)
 *
 * @example
 * const model = await getAssetModelApi('modelId123');
 * // model = {
 * //   id, type, brand, modelName,
 * //   items: [{ id, assetTag, serial, status, ... }],
 * //   _count: { items: 15 }
 * // }
 */
export async function getAssetModelApi(id: string): Promise<AssetModel> {
  const response = await apiClient.get<ApiResponse<AssetModel>>(`/asset-models/${id}`)
  return response.data.data
}

/**
 * Create new asset model
 *
 * Creates an equipment template that can be referenced by multiple items.
 *
 * @param data - Asset model creation data
 * @param data.type - Equipment type (LAPTOP, DESKTOP, MONITOR, etc.)
 * @param data.brand - Manufacturer brand (e.g., "Dell", "HP")
 * @param data.modelName - Specific model name (e.g., "Latitude 5420")
 * @param data.description - Optional description
 * @returns Promise resolving to created AssetModel
 *
 * @example
 * const model = await createAssetModelApi({
 *   type: 'LAPTOP',
 *   brand: 'Dell',
 *   modelName: 'Latitude 5420',
 *   description: '14" Business Laptop'
 * });
 */
export async function createAssetModelApi(data: CreateAssetModelDto): Promise<AssetModel> {
  const response = await apiClient.post<ApiResponse<AssetModel>>('/asset-models', data)
  return response.data.data
}

/**
 * Update existing asset model
 *
 * Updates model template. Changes cascade to all items referencing this model
 * (items see updated model info automatically via relationship).
 *
 * @param id - Asset model ID to update
 * @param data - Updated model data
 * @param data.type - Updated equipment type
 * @param data.brand - Updated brand
 * @param data.modelName - Updated model name
 * @param data.description - Updated description
 * @returns Promise resolving to updated AssetModel
 * @throws {NotFoundError} If model doesn't exist (404)
 *
 * @example
 * const updated = await updateAssetModelApi('modelId123', {
 *   modelName: 'Latitude 5430',
 *   description: 'Updated model - 2023 version'
 * });
 */
export async function updateAssetModelApi(id: string, data: UpdateAssetModelDto): Promise<AssetModel> {
  const response = await apiClient.patch<ApiResponse<AssetModel>>(`/asset-models/${id}`, data)
  return response.data.data
}

/**
 * Delete asset model
 *
 * IMPORTANT: Models with associated items cannot be deleted.
 * This prevents orphaned items and maintains referential integrity.
 *
 * @param id - Asset model ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If model doesn't exist (404)
 * @throws {ValidationError} If model has associated items (400)
 *
 * @example
 * await deleteAssetModelApi('modelId123');
 * // Throws error if any AssetItems reference this model
 */
export async function deleteAssetModelApi(id: string): Promise<void> {
  await apiClient.delete(`/asset-models/${id}`)
}
