import apiClient from './client'
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllEmployeesApi(): Promise<Employee[]> {
  const response = await apiClient.get<any>('/employees')
  console.log('🌐 API Response:', response.data)
  // Handle both formats: direct array or {employees, pagination}
  const data = response.data.data
  console.log('📦 Data extracted:', data)
  console.log('📊 Is array?', Array.isArray(data))
  console.log('📈 Data length:', Array.isArray(data) ? data.length : 'not an array')
  const result = Array.isArray(data) ? data : data.employees
  console.log('✅ Final result length:', result?.length)
  return result
}

export async function getEmployeeApi(id: string): Promise<Employee> {
  const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`)
  return response.data.data
}

export async function createEmployeeApi(data: CreateEmployeeDto): Promise<Employee> {
  const response = await apiClient.post<ApiResponse<Employee>>('/employees', data)
  return response.data.data
}

export async function updateEmployeeApi(id: string, data: UpdateEmployeeDto): Promise<Employee> {
  const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, data)
  return response.data.data
}

export async function deleteEmployeeApi(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`)
}
