/**
 * Equipment Types API
 *
 * API functions for managing equipment types (CRUD operations)
 */
import apiClient from './client';
import type {
  EquipmentType,
  CreateEquipmentTypeDto,
  UpdateEquipmentTypeDto,
  ApiResponse,
} from '../types/models.types';

/**
 * Get all equipment types
 */
export async function getAllEquipmentTypesApi(): Promise<EquipmentType[]> {
  const response = await apiClient.get<ApiResponse<EquipmentType[]>>('/equipment-types');
  return response.data.data;
}

/**
 * Get equipment type by ID
 */
export async function getEquipmentTypeByIdApi(id: string): Promise<EquipmentType> {
  const response = await apiClient.get<ApiResponse<EquipmentType>>(`/equipment-types/${id}`);
  return response.data.data;
}

/**
 * Create a new equipment type
 */
export async function createEquipmentTypeApi(data: CreateEquipmentTypeDto): Promise<EquipmentType> {
  const response = await apiClient.post<ApiResponse<EquipmentType>>('/equipment-types', data);
  return response.data.data;
}

/**
 * Update an equipment type
 */
export async function updateEquipmentTypeApi(
  id: string,
  data: UpdateEquipmentTypeDto
): Promise<EquipmentType> {
  const response = await apiClient.patch<ApiResponse<EquipmentType>>(`/equipment-types/${id}`, data);
  return response.data.data;
}

/**
 * Delete an equipment type
 */
export async function deleteEquipmentTypeApi(id: string): Promise<void> {
  await apiClient.delete(`/equipment-types/${id}`);
}
