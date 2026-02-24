/**
 * @fileoverview Axios HTTP client configuration with JWT authentication and CSRF protection
 *
 * This module provides:
 * - Axios instance with default configuration
 * - Access token management (in-memory storage for security)
 * - CSRF token management (cookie-based double submit pattern)
 * - Request interceptor to inject auth tokens and CSRF tokens
 * - Response interceptor for automatic token refresh on 401 errors
 * - Request queueing during token refresh to prevent race conditions
 */

import axios, { AxiosError } from 'axios'
import { API_URL } from '@/lib/utils/constants'
import { setUserContext } from '@/lib/sentry'

/**
 * Main Axios instance for all API requests
 * Configured with base URL and credentials support for cookies
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000, // 30s — prevent requests from hanging indefinitely
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
 * Get CSRF token from cookie
 *
 * The CSRF token is stored in a cookie named 'XSRF-TOKEN' by the backend.
 * This cookie is readable by JavaScript (not httpOnly) to allow client-side access.
 *
 * @returns CSRF token string or null if not found
 */
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Initialize CSRF protection by fetching the CSRF token from the backend
 *
 * This should be called once when the application starts.
 * The backend will set the XSRF-TOKEN cookie which will be used
 * for all subsequent state-changing requests.
 *
 * @returns Promise that resolves when CSRF token is initialized
 */
export const initializeCsrf = async (): Promise<void> => {
  try {
    await apiClient.get('/csrf-token')
    if (import.meta.env.DEV) console.log('[CSRF] Token initialized successfully')
  } catch (error) {
    if (import.meta.env.DEV) console.error('[CSRF] Failed to initialize token:', error)
    // Don't throw - allow app to continue even if CSRF init fails
    // The backend will return 401 on mutations if token is missing
  }
}

/**
 * Request interceptor: Automatically adds Bearer token and CSRF token to headers
 *
 * This interceptor runs before every API request and:
 * 1. Injects the JWT access token if available
 * 2. Injects the CSRF token for state-changing operations (POST/PUT/PATCH/DELETE)
 */
apiClient.interceptors.request.use(
  (config) => {
    // 1. Add JWT access token
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 2. Add CSRF token for state-changing operations
    const method = config.method?.toUpperCase()
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

    if (method && mutationMethods.includes(method) && config.headers) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        // Use standard CSRF header name (matches backend expectation)
        config.headers['X-XSRF-TOKEN'] = csrfToken
      }
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

    // Handle 401 Unauthorized errors (expired token or CSRF failure)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorMessage = (error.response?.data as any)?.error || ''

      // Check if this is a CSRF token error
      if (errorMessage.includes('CSRF')) {
        if (import.meta.env.DEV) console.log('[CSRF] Token validation failed, reinitializing...')

        // Reinitialize CSRF token
        await initializeCsrf()

        // Retry the original request with new CSRF token
        originalRequest._retry = true
        return apiClient(originalRequest)
      }
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
        setUserContext(null)

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
