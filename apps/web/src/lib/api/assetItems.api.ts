import apiClient from './client'
import type {
  AssetItem,
  CreateAssetItemDto,
  UpdateAssetItemDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllAssetItemsApi(): Promise<AssetItem[]> {
  const response = await apiClient.get<any>('/asset-items')
  const data = response.data.data
  return Array.isArray(data) ? data : data.items || []
}

export async function getAssetItemApi(id: string): Promise<AssetItem> {
  const response = await apiClient.get<ApiResponse<AssetItem>>(`/asset-items/${id}`)
  return response.data.data
}

export async function createAssetItemApi(data: CreateAssetItemDto): Promise<AssetItem> {
  const response = await apiClient.post<ApiResponse<AssetItem>>('/asset-items', data)
  return response.data.data
}

export async function updateAssetItemApi(id: string, data: UpdateAssetItemDto): Promise<AssetItem> {
  const response = await apiClient.patch<ApiResponse<AssetItem>>(`/asset-items/${id}`, data)
  return response.data.data
}

export async function deleteAssetItemApi(id: string): Promise<void> {
  await apiClient.delete(`/asset-items/${id}`)
}
