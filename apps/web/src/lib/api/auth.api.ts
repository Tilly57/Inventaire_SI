import apiClient from './client'
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ApiResponse,
  User,
} from '@/lib/types/models.types'

/**
 * Login user and return access token + user data
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
 * Register new user (requires ADMIN role on backend)
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
 */
export async function getCurrentUserApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me')
  return response.data.data
}

/**
 * Logout user (invalidates refresh token)
 */
export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout')
}

/**
 * Refresh access token using refresh token cookie
 */
export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const response = await apiClient.post<
    ApiResponse<{ accessToken: string }>
  >('/auth/refresh')
  return response.data.data
}
