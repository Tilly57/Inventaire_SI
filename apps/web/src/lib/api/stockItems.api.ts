/**
 * @fileoverview Stock Items API client
 *
 * Provides functions to interact with /api/stock-items endpoints.
 *
 * Stock Items represent consumable supplies tracked by quantity
 * (e.g., cables, adapters, office supplies). Unlike AssetItems,
 * they don't have individual serial numbers or asset tags.
 *
 * Quantity management: Automatically decremented when added to loans,
 * incremented when returned.
 *
 * Requires ADMIN or GESTIONNAIRE role for modifications.
 */

import apiClient from './client'
import type {
  StockItem,
  CreateStockItemDto,
  UpdateStockItemDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all stock items
 *
 * Returns all consumable items with current quantities.
 * Uses high limit (1000) to bypass pagination.
 *
 * @returns Promise resolving to array of stock items
 *
 * @example
 * const items = await getAllStockItemsApi();
 * // items = [
 * //   { id, name: 'Câble HDMI 2m', quantity: 45, unit: 'pièce' },
 * //   { id, name: 'Adaptateur USB-C', quantity: 3, unit: 'pièce' },
 * //   ...
 * // ]
 */
export async function getAllStockItemsApi(): Promise<StockItem[]> {
  const response = await apiClient.get<any>('/stock-items?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.items || []
}

/**
 * Fetch single stock item by ID
 *
 * Returns item details with loan history showing quantities borrowed.
 *
 * @param id - Stock item ID (CUID format)
 * @returns Promise resolving to StockItem with loan history
 * @throws {NotFoundError} If item doesn't exist (404)
 *
 * @example
 * const item = await getStockItemApi('stockId123');
 * // item = {
 * //   id, name, quantity: 25, unit, description,
 * //   loanLines: [
 * //     { quantity: 5, loan: { employee: {...}, openedAt: '...' } },
 * //     ...
 * //   ]
 * // }
 */
export async function getStockItemApi(id: string): Promise<StockItem> {
  const response = await apiClient.get<ApiResponse<StockItem>>(`/stock-items/${id}`)
  return response.data.data
}

/**
 * Create new stock item
 *
 * Creates a consumable item tracked by quantity.
 *
 * @param data - Stock item creation data
 * @param data.name - Item name (e.g., "Câble HDMI 2m")
 * @param data.quantity - Initial quantity (default: 0)
 * @param data.unit - Unit of measurement (e.g., "pièce", "mètre", "boîte")
 * @param data.description - Optional description
 * @returns Promise resolving to created StockItem
 *
 * @example
 * const item = await createStockItemApi({
 *   name: 'Câble USB-C 1m',
 *   quantity: 50,
 *   unit: 'pièce',
 *   description: 'Câble USB-C pour chargement rapide'
 * });
 */
export async function createStockItemApi(data: CreateStockItemDto): Promise<StockItem> {
  const response = await apiClient.post<ApiResponse<StockItem>>('/stock-items', data)
  return response.data.data
}

/**
 * Update existing stock item
 *
 * Updates item details (name, description, unit).
 * For quantity adjustments, backend provides dedicated adjustment endpoint
 * which is called automatically by loan workflow.
 *
 * @param id - Stock item ID to update
 * @param data - Updated item data
 * @param data.name - Updated name
 * @param data.quantity - Updated quantity (prefer backend adjustment endpoint)
 * @param data.unit - Updated unit
 * @param data.description - Updated description
 * @returns Promise resolving to updated StockItem
 * @throws {NotFoundError} If item doesn't exist (404)
 *
 * @example
 * const updated = await updateStockItemApi('stockId123', {
 *   description: 'Câble USB-C 2m (nouvelle version longue)'
 * });
 */
export async function updateStockItemApi(id: string, data: UpdateStockItemDto): Promise<StockItem> {
  const response = await apiClient.patch<ApiResponse<StockItem>>(`/stock-items/${id}`, data)
  return response.data.data
}

/**
 * Delete stock item
 *
 * Permanently removes consumable item from system.
 *
 * Note: Items CAN be deleted even with loan history
 * (history preserved in loanLines for audit).
 *
 * Consider checking if quantity is zero before deletion to avoid
 * deleting items still physically in stock.
 *
 * @param id - Stock item ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If item doesn't exist (404)
 *
 * @example
 * await deleteStockItemApi('stockId123');
 * // Loan history remains in database for audit purposes
 */
export async function deleteStockItemApi(id: string): Promise<void> {
  await apiClient.delete(`/stock-items/${id}`)
}
