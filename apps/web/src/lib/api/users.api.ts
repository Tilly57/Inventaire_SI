/**
 * @fileoverview Users API client
 *
 * Provides functions to interact with /api/users endpoints for system user management.
 *
 * System users are admins and managers who access the application,
 * NOT employees who borrow equipment. See employees.api.ts for that.
 *
 * All user management operations require ADMIN role.
 */

import apiClient from './client'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ApiResponse,
} from '@/lib/types/models.types'

/**
 * Fetch all system users
 *
 * Returns all users without password hashes (excluded for security).
 * Uses high limit (1000) to bypass pagination and get all users.
 *
 * @returns Promise resolving to array of users
 *
 * @example
 * const users = await getAllUsersApi();
 * // users = [{ id, email, role, createdAt, updatedAt }, ...]
 */
export async function getAllUsersApi(): Promise<User[]> {
  const response = await apiClient.get<any>('/users?limit=1000')
  const data = response.data.data
  // Handle both direct array and paginated response formats
  return Array.isArray(data) ? data : data.users || data
}

/**
 * Fetch single user by ID
 *
 * Returns user details without password hash.
 *
 * @param id - User ID (CUID format)
 * @returns Promise resolving to User object
 * @throws {NotFoundError} If user doesn't exist (404)
 *
 * @example
 * const user = await getUserApi('userId123');
 * // user = { id, email, role, createdAt, updatedAt }
 */
export async function getUserApi(id: string): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
  return response.data.data
}

/**
 * Create new system user
 *
 * Creates a user with email, password, and role.
 * Requires ADMIN role.
 *
 * @param data - User creation data
 * @param data.email - User email (must be unique)
 * @param data.password - Password (plain text, will be hashed by backend)
 * @param data.role - User role (ADMIN, GESTIONNAIRE, or LECTURE)
 * @returns Promise resolving to created User (without password)
 * @throws {ConflictError} If email already exists (409)
 * @throws {ForbiddenError} If not authorized (403)
 *
 * @example
 * const user = await createUserApi({
 *   email: 'manager@example.com',
 *   password: 'SecurePass123!',
 *   role: 'GESTIONNAIRE'
 * });
 */
export async function createUserApi(data: CreateUserDto): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>('/users', data)
  return response.data.data
}

/**
 * Update existing user
 *
 * Updates user email and/or role.
 * For password changes, use changePasswordApi instead.
 *
 * @param id - User ID to update
 * @param data - Updated user data
 * @param data.email - New email (must be unique if changed)
 * @param data.role - New role
 * @returns Promise resolving to updated User
 * @throws {NotFoundError} If user doesn't exist (404)
 * @throws {ConflictError} If new email already exists (409)
 *
 * @example
 * const updated = await updateUserApi('userId123', {
 *   role: 'ADMIN'
 * });
 */
export async function updateUserApi(id: string, data: UpdateUserDto): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data)
  return response.data.data
}

/**
 * Delete user
 *
 * Permanently removes user from the system.
 * Requires ADMIN role.
 *
 * Note: Users can be deleted without restriction (no cascading checks).
 *
 * @param id - User ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws {NotFoundError} If user doesn't exist (404)
 *
 * @example
 * await deleteUserApi('userId123');
 */
export async function deleteUserApi(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}

/**
 * Change user password
 *
 * Updates user's password. Requires current password for verification.
 * User can change their own password, or ADMIN can change any password.
 *
 * @param id - User ID
 * @param data - Password change data
 * @param data.currentPassword - Current password for verification
 * @param data.newPassword - New password (plain text, will be hashed)
 * @returns Promise resolving when password is changed
 * @throws {NotFoundError} If user doesn't exist (404)
 * @throws {UnauthorizedError} If current password is incorrect (401)
 *
 * @example
 * await changePasswordApi('userId123', {
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass456!'
 * });
 */
export async function changePasswordApi(id: string, data: ChangePasswordDto): Promise<void> {
  await apiClient.patch(`/users/${id}/password`, data)
}
