/**
 * @fileoverview Axios HTTP client configuration with JWT authentication
 *
 * This module provides:
 * - Axios instance with default configuration
 * - Access token management (in-memory storage for security)
 * - Request interceptor to inject auth tokens
 * - Response interceptor for automatic token refresh on 401 errors
 * - Request queueing during token refresh to prevent race conditions
 */

import axios, { AxiosError } from 'axios'
import { API_URL } from '@/lib/utils/constants'

/**
 * Main Axios instance for all API requests
 * Configured with base URL and credentials support for cookies
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: enables cookie transmission for refresh tokens
})

/**
 * Access token storage in memory (more secure than localStorage)
 *
 * Security note: Storing tokens in memory prevents XSS attacks from
 * accessing tokens via localStorage. Token is lost on page refresh,
 * but will be restored via refresh token cookie.
 */
let accessToken: string | null = null

/**
 * Set the access token in memory
 *
 * @param token - JWT access token or null to clear
 */
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

/**
 * Get the current access token from memory
 *
 * @returns Current access token or null if not authenticated
 */
export const getAccessToken = () => {
  return accessToken
}

/**
 * Request interceptor: Automatically adds Bearer token to Authorization header
 *
 * This interceptor runs before every API request and injects the
 * access token if available.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token && config.headers) {
      // Inject Bearer token into Authorization header
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Token refresh mechanism state
 *
 * These variables manage the token refresh process to prevent
 * multiple simultaneous refresh attempts (race condition).
 */
let isRefreshing = false  // Flag to indicate refresh in progress

/**
 * Queue of failed requests waiting for token refresh
 *
 * When a token refresh is in progress, subsequent 401 requests
 * are queued here and will be retried after refresh completes.
 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

/**
 * Process the queue of failed requests after token refresh
 *
 * @param error - Error from refresh attempt (if failed)
 * @param token - New access token (if successful)
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)  // Refresh failed, reject all queued requests
    } else {
      prom.resolve(token)  // Refresh succeeded, resolve with new token
    }
  })
  failedQueue = []  // Clear the queue
}

/**
 * Response interceptor: Handles 401 errors with automatic token refresh
 *
 * This interceptor implements a sophisticated token refresh strategy:
 * 1. On 401 error, attempt to refresh the access token
 * 2. Queue subsequent 401 requests during refresh
 * 3. Retry all queued requests with new token
 * 4. Redirect to login if refresh fails
 */
apiClient.interceptors.response.use(
  (response) => {
    // Success response, pass through
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh for auth endpoints (would cause infinite loop)
      if (originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      // If refresh already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            // Refresh completed, retry original request
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to refresh token using refresh token cookie
        // The refresh token is httpOnly and automatically sent by browser
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const { accessToken: newAccessToken } = response.data.data

        // Update token in memory
        setAccessToken(newAccessToken)

        // Resolve all queued requests with new token
        processQueue(null, newAccessToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - user session is truly expired
        processQueue(refreshError as Error, null)
        setAccessToken(null)

        // Redirect to login page (but not if already there)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Not a 401 error, or retry already attempted
    return Promise.reject(error)
  }
)

export default apiClient
