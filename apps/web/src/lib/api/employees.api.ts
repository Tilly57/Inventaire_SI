/**
 * @fileoverview Employees API client
 *
 * Provides functions to interact with /api/employees endpoints.
 *
 * Employees are end-users who borrow equipment, NOT system users who
 * access the application. See users.api.ts for system user management.
 *
 * Requires ADMIN or GESTIONNAIRE role for modifications.
 */

import apiClient from './client'
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all employees
 *
 * Returns all employees with loan count information.
 * Uses high limit (1000) to bypass pagination.
 *
 * @returns Promise resolving to array of employees
 *
 * @example
 * const employees = await getAllEmployeesApi();
 * // employees = [
 * //   { id, firstName, lastName, email, dept, _count: { loans: 5 } },
 * //   ...
 * // ]
 */
export async function getAllEmployeesApi(): Promise<Employee[]> {
  // Request all employees with a high limit to bypass pagination
  const response = await apiClient.get<any>('/employees?limit=1000')
  // Handle both formats: direct array or {employees, pagination}
  const data = response.data.data
  return Array.isArray(data) ? data : data.employees
}

/**
 * Fetch single employee by ID
 *
 * Returns employee details with recent loan history.
 *
 * @param id - Employee ID (CUID format)
 * @returns Promise resolving to Employee object with loan history
 * @throws {NotFoundError} If employee doesn't exist (404)
 *
 * @example
 * const employee = await getEmployeeApi('empId123');
 * // employee = {
 * //   id, firstName, lastName, email, dept,
 * //   loans: [{ id, status, openedAt, ... }],
 * //   _count: { loans: 10 }
 * // }
 */
export async function getEmployeeApi(id: string): Promise<Employee> {
  const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`)
  return response.data.data
}

/**
 * Create new employee
 *
 * Creates an employee who can borrow equipment.
 * Validates email uniqueness if provided.
 *
 * @param data - Employee creation data
 * @param data.firstName - Employee first name
 * @param data.lastName - Employee last name
 * @param data.email - Employee email (optional, must be unique)
 * @param data.dept - Department or agency (optional)
 * @returns Promise resolving to created Employee
 * @throws {ConflictError} If email already exists (409)
 *
 * @example
 * const employee = await createEmployeeApi({
 *   firstName: 'Jean',
 *   lastName: 'Dupont',
 *   email: 'jean.dupont@example.com',
 *   dept: 'Woippy'
 * });
 */
export async function createEmployeeApi(data: CreateEmployeeDto): Promise<Employee> {
  const response = await apiClient.post<ApiResponse<Employee>>('/employees', data)
  return response.data.data
}

/**
 * Update existing employee
 *
 * Updates employee information.
 * Validates email uniqueness if email is changed.
 *
 * @param id - Employee ID to update
 * @param data - Updated employee data
 * @param data.firstName - Updated first name
 * @param data.lastName - Updated last name
 * @param data.email - Updated email (must be unique)
 * @param data.dept - Updated department
 * @returns Promise resolving to updated Employee
 * @throws {NotFoundError} If employee doesn't exist (404)
 * @throws {ConflictError} If new email already exists (409)
 *
 * @example
 * const updated = await updateEmployeeApi('empId123', {
 *   dept: 'Paris'
 * });
 */
export async function updateEmployeeApi(id: string, data: UpdateEmployeeDto): Promise<Employee> {
  const response = await apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, data)
  return response.data.data
}

/**
 * Delete employee
 *
 * IMPORTANT: Employees with ANY loan history cannot be deleted.
 * This preserves audit trail and data integrity.
 *
 * @param id - Employee ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If employee doesn't exist (404)
 * @throws {ValidationError} If employee has loan history (400)
 *
 * @example
 * await deleteEmployeeApi('empId123');
 * // Throws error if employee has any loans (active or closed)
 */
export async function deleteEmployeeApi(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`)
}
