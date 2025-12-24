/**
 * @fileoverview Authentication API client
 *
 * Provides functions to interact with authentication endpoints:
 * - User login and registration
 * - Token refresh mechanism
 * - Current user retrieval
 * - Logout functionality
 *
 * Authentication flow:
 * 1. Login returns access token + user data
 * 2. Access token stored in memory (via authStore)
 * 3. Refresh token stored in httpOnly cookie (backend-managed)
 * 4. Token refresh handled automatically by API client interceptor
 */

import apiClient from './client'
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ApiResponse,
  User,
} from '@/lib/types/models.types'

/**
 * Login user and obtain authentication tokens
 *
 * Authenticates user with email and password, returns access token
 * and user information. Refresh token is set as httpOnly cookie by backend.
 *
 * @param credentials - Login credentials
 * @param credentials.email - User email address
 * @param credentials.password - User password (plain text)
 * @returns Promise resolving to AuthResponse with accessToken and user data
 * @throws {UnauthorizedError} If credentials are invalid (401)
 *
 * @example
 * const response = await loginApi({
 *   email: 'admin@example.com',
 *   password: 'SecurePass123!'
 * });
 * // response = { accessToken: '...', user: { id, email, role } }
 */
export async function loginApi(
  credentials: LoginDto
): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/login',
    credentials
  )
  return response.data.data
}

/**
 * Register new system user
 *
 * Creates a new user account. Requires ADMIN role on backend.
 * Returns access token and user data upon successful registration.
 *
 * Note: First registered user is automatically granted ADMIN role.
 *
 * @param data - Registration data
 * @param data.email - User email (must be unique)
 * @param data.password - User password (min 6 characters)
 * @param data.role - User role (ADMIN, GESTIONNAIRE, or LECTURE)
 * @returns Promise resolving to AuthResponse with accessToken and user data
 * @throws {ConflictError} If email already exists (409)
 * @throws {ForbiddenError} If not authorized to create users (403)
 *
 * @example
 * const response = await registerApi({
 *   email: 'new.user@example.com',
 *   password: 'SecurePass123!',
 *   role: 'GESTIONNAIRE'
 * });
 */
export async function registerApi(
  data: RegisterDto
): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/register',
    data
  )
  return response.data.data
}

/**
 * Get current authenticated user
 *
 * Retrieves information about the currently logged-in user.
 * Uses access token from Authorization header.
 *
 * Useful for:
 * - Verifying authentication status
 * - Refreshing user data after updates
 * - Restoring session on page reload (after token refresh)
 *
 * @returns Promise resolving to User object
 * @throws {UnauthorizedError} If not authenticated or token expired (401)
 *
 * @example
 * const user = await getCurrentUserApi();
 * // user = { id: '...', email: 'admin@example.com', role: 'ADMIN' }
 */
export async function getCurrentUserApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me')
  return response.data.data
}

/**
 * Logout user
 *
 * Invalidates the refresh token cookie on the server.
 * Client should also clear access token from memory after calling this.
 *
 * Note: This only affects the server-side refresh token.
 * The access token remains valid until expiration (15 minutes).
 *
 * @returns Promise resolving when logout is complete
 *
 * @example
 * await logoutApi();
 * // Clear access token from state
 * authStore.logout();
 * // Redirect to login page
 * navigate('/login');
 */
export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout')
}

/**
 * Refresh access token
 *
 * Obtains a new access token using the refresh token cookie.
 * Called automatically by API client interceptor when access token expires (401).
 *
 * Flow:
 * 1. Refresh token cookie sent automatically with request
 * 2. Backend validates refresh token
 * 3. New access token returned
 * 4. Client updates access token in memory
 *
 * Note: Normally called by apiClient interceptor, not directly.
 *
 * @returns Promise resolving to object with new accessToken
 * @throws {UnauthorizedError} If refresh token is invalid or expired (401)
 *
 * @example
 * // Usually called automatically by API client
 * const { accessToken } = await refreshTokenApi();
 * setAccessToken(accessToken);
 */
export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const response = await apiClient.post<
    ApiResponse<{ accessToken: string }>
  >('/auth/refresh')
  return response.data.data
}
