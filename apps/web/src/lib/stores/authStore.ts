/**
 * @fileoverview Authentication state management with Zustand
 *
 * This store manages global authentication state including:
 * - Current user information
 * - Authentication status
 * - Loading state for async operations
 * - Access token management (in-memory via API client)
 *
 * Security: Access tokens are stored in memory (not localStorage) for XSS protection.
 * Refresh tokens are handled via httpOnly cookies by the backend.
 */

import { create } from 'zustand'
import type { User } from '@/lib/types/models.types'
import { setAccessToken } from '@/lib/api/client'

/**
 * Authentication state interface
 *
 * @interface AuthState
 * @property {User | null} user - Currently authenticated user or null
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {boolean} isLoading - Whether auth operation is in progress
 * @property {Function} setUser - Update current user
 * @property {Function} setToken - Update access token
 * @property {Function} login - Complete login with user and token
 * @property {Function} logout - Clear authentication state
 * @property {Function} setLoading - Update loading state
 */
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

/**
 * Global authentication store
 *
 * Uses Zustand for lightweight state management without boilerplate.
 * State persists across component re-renders but NOT across page refreshes
 * (intentional for security - tokens are restored via refresh token cookie).
 *
 * @example
 * // In a component
 * const { user, isAuthenticated, login, logout } = useAuthStore()
 *
 * if (isAuthenticated) {
 *   console.log('Logged in as:', user.email)
 * }
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state: No user, not authenticated
  user: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Set current user
   *
   * Automatically updates isAuthenticated based on user presence.
   *
   * @param user - User object or null to clear
   */
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,  // Convert to boolean: user exists = authenticated
    }),

  /**
   * Set access token
   *
   * Updates token in API client memory (NOT in this store).
   * This keeps tokens out of React state for security.
   *
   * @param token - JWT access token or null to clear
   */
  setToken: (token) => {
    setAccessToken(token)
  },

  /**
   * Complete login process
   *
   * Sets both user data and access token, marks as authenticated.
   * Called after successful login API response.
   *
   * @param user - Authenticated user object
   * @param token - JWT access token
   *
   * @example
   * const response = await loginApi(email, password)
   * login(response.user, response.accessToken)
   */
  login: (user, token) => {
    setAccessToken(token)
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  /**
   * Clear authentication state
   *
   * Removes user data and token, marks as unauthenticated.
   * Called on explicit logout or when session expires.
   *
   * @example
   * logout()
   * navigate('/login')
   */
  logout: () => {
    setAccessToken(null)  // Clear token from API client
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  /**
   * Set loading state
   *
   * Used during async auth operations (login, logout, token refresh).
   *
   * @param loading - Whether auth operation is in progress
   *
   * @example
   * setLoading(true)
   * await loginApi(credentials)
   * setLoading(false)
   */
  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
}))
