import apiClient from './client'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllUsersApi(): Promise<User[]> {
  const response = await apiClient.get<ApiResponse<User[]>>('/users')
  return response.data.data
}

export async function getUserApi(id: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
  return response.data.data
}

export async function createUserApi(data: CreateUserDto): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>('/users', data)
  return response.data.data
}

export async function updateUserApi(id: string, data: UpdateUserDto): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data)
  return response.data.data
}

export async function deleteUserApi(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}

export async function changePasswordApi(id: string, data: ChangePasswordDto): Promise<void> {
  await apiClient.patch(`/users/${id}/password`, data)
}
