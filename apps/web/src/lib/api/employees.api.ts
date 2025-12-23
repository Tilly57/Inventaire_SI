import apiClient from './client'
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ApiResponse,
} from '@/lib/types/models.types'

export async function getAllEmployeesApi(): Promise<Employee[]> {
  // Request all employees with a high limit to bypass pagination
  const response = await apiClient.get<any>('/employees?limit=1000')
  // Handle both formats: direct array or {employees, pagination}
  const data = response.data.data
  return Array.isArray(data) ? data : data.employees
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
