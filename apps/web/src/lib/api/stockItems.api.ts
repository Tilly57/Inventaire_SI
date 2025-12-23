import apiClient from './client'
import type {
  StockItem,
  CreateStockItemDto,
  UpdateStockItemDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllStockItemsApi(): Promise<StockItem[]> {
  const response = await apiClient.get<any>('/stock-items')
  const data = response.data.data
  return Array.isArray(data) ? data : data.items || []
}

export async function getStockItemApi(id: string): Promise<StockItem> {
  const response = await apiClient.get<ApiResponse<StockItem>>(`/stock-items/${id}`)
  return response.data.data
}

export async function createStockItemApi(data: CreateStockItemDto): Promise<StockItem> {
  const response = await apiClient.post<ApiResponse<StockItem>>('/stock-items', data)
  return response.data.data
}

export async function updateStockItemApi(id: string, data: UpdateStockItemDto): Promise<StockItem> {
  const response = await apiClient.patch<ApiResponse<StockItem>>(`/stock-items/${id}`, data)
  return response.data.data
}

export async function deleteStockItemApi(id: string): Promise<void> {
  await apiClient.delete(`/stock-items/${id}`)
}
