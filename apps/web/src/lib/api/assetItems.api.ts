/**
 * @fileoverview Asset Items API client
 *
 * Provides functions to interact with /api/asset-items endpoints.
 *
 * Asset Items represent individual physical equipment instances
 * (e.g., a specific laptop with serial #SN12345, asset tag #INV-2024-001).
 * Each item references an AssetModel template and has unique identifiers.
 *
 * Status workflow: EN_STOCK → PRETE → EN_STOCK (or HS/REPARATION)
 *
 * Requires ADMIN or GESTIONNAIRE role for modifications.
 */

import apiClient from './client'
import type {
  AssetItem,
  CreateAssetItemDto,
  UpdateAssetItemDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all asset items
 *
 * Returns all physical equipment items with model details.
 * Uses high limit (1000) to bypass pagination.
 *
 * @returns Promise resolving to array of asset items
 *
 * @example
 * const items = await getAllAssetItemsApi();
 * // items = [
 * //   {
 * //     id, assetTag: 'INV-001', serial: 'SN12345',
 * //     status: 'EN_STOCK',
 * //     assetModel: { type: 'LAPTOP', brand: 'Dell', modelName: '...' }
 * //   },
 * //   ...
 * // ]
 */
export async function getAllAssetItemsApi(): Promise<AssetItem[]> {
  const response = await apiClient.get<any>('/asset-items?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.items || []
}

/**
 * Fetch single asset item by ID
 *
 * Returns item details with model and complete loan history.
 *
 * @param id - Asset item ID (CUID format)
 * @returns Promise resolving to AssetItem with model and loan history
 * @throws {NotFoundError} If item doesn't exist (404)
 *
 * @example
 * const item = await getAssetItemApi('itemId123');
 * // item = {
 * //   id, assetTag, serial, status, notes,
 * //   assetModel: { type, brand, modelName },
 * //   loanLines: [{ loan: { employee, openedAt, ... } }]
 * // }
 */
export async function getAssetItemApi(id: string): Promise<AssetItem> {
  const response = await apiClient.get<ApiResponse<AssetItem>>(`/asset-items/${id}`)
  return response.data.data
}

/**
 * Create new asset item
 *
 * Creates a physical equipment item with unique identifiers.
 * Validates asset model exists and ensures unique asset tag and serial.
 *
 * @param data - Asset item creation data
 * @param data.assetModelId - Reference to equipment model template
 * @param data.assetTag - Unique inventory tag (e.g., "INV-2024-001")
 * @param data.serial - Unique manufacturer serial number
 * @param data.status - Initial status (default: "EN_STOCK")
 * @param data.notes - Optional notes
 * @returns Promise resolving to created AssetItem with model
 * @throws {NotFoundError} If asset model doesn't exist (404)
 * @throws {ConflictError} If asset tag or serial already exists (409)
 *
 * @example
 * const item = await createAssetItemApi({
 *   assetModelId: 'modelId123',
 *   assetTag: 'INV-2024-042',
 *   serial: 'SN987654321',
 *   status: 'EN_STOCK'
 * });
 */
export async function createAssetItemApi(data: CreateAssetItemDto): Promise<AssetItem> {
  const response = await apiClient.post<ApiResponse<AssetItem>>('/asset-items', data)
  return response.data.data
}

/**
 * Update existing asset item
 *
 * Updates item details. Validates new asset model, asset tag, and serial uniqueness.
 *
 * Note: Status is typically managed automatically by loan workflow,
 * but can be updated manually (e.g., marking as HS or REPARATION).
 *
 * @param id - Asset item ID to update
 * @param data - Updated item data
 * @param data.assetModelId - New asset model reference
 * @param data.assetTag - New asset tag (must be unique)
 * @param data.serial - New serial number (must be unique)
 * @param data.status - New status (EN_STOCK, PRETE, HS, REPARATION)
 * @param data.notes - Updated notes
 * @returns Promise resolving to updated AssetItem with model
 * @throws {NotFoundError} If item or new model doesn't exist (404)
 * @throws {ConflictError} If new asset tag or serial already exists (409)
 *
 * @example
 * const updated = await updateAssetItemApi('itemId123', {
 *   status: 'HS',
 *   notes: 'Écran cassé - envoyé en réparation'
 * });
 */
export async function updateAssetItemApi(id: string, data: UpdateAssetItemDto): Promise<AssetItem> {
  const response = await apiClient.patch<ApiResponse<AssetItem>>(`/asset-items/${id}`, data)
  return response.data.data
}

/**
 * Delete asset item
 *
 * Permanently removes physical item from system.
 *
 * Note: Unlike asset models and employees, items CAN be deleted
 * even with loan history (history preserved in loanLines for audit).
 *
 * @param id - Asset item ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If item doesn't exist (404)
 *
 * @example
 * await deleteAssetItemApi('itemId123');
 * // Loan history remains in database for audit purposes
 */
export async function deleteAssetItemApi(id: string): Promise<void> {
  await apiClient.delete(`/asset-items/${id}`)
}
