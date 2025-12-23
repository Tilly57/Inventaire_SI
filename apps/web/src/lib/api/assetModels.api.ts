import apiClient from './client'
import type {
  AssetModel,
  CreateAssetModelDto,
  UpdateAssetModelDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllAssetModelsApi(): Promise<AssetModel[]> {
  const response = await apiClient.get<any>('/asset-models?limit=1000')
  const data = response.data.data
  return Array.isArray(data) ? data : data.models || []
}

export async function getAssetModelApi(id: string): Promise<AssetModel> {
  const response = await apiClient.get<ApiResponse<AssetModel>>(`/asset-models/${id}`)
  return response.data.data
}

export async function createAssetModelApi(data: CreateAssetModelDto): Promise<AssetModel> {
  const response = await apiClient.post<ApiResponse<AssetModel>>('/asset-models', data)
  return response.data.data
}

export async function updateAssetModelApi(id: string, data: UpdateAssetModelDto): Promise<AssetModel> {
  const response = await apiClient.patch<ApiResponse<AssetModel>>(`/asset-models/${id}`, data)
  return response.data.data
}

export async function deleteAssetModelApi(id: string): Promise<void> {
  await apiClient.delete(`/asset-models/${id}`)
}
