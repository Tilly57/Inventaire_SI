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
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/lib/types/models.types'
import { setAccessToken } from '@/lib/api/client'

// Session expiration: 30 minutes
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

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
  lastActivity: number | null // Timestamp of last activity for session timeout
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateActivity: () => void // Update last activity timestamp
}

/**
 * Global authentication store
 *
 * Uses Zustand with persist middleware for session management.
 * - User data persists in localStorage for 30 minutes
 * - Access tokens remain in memory (not persisted for security)
 * - Session expires after 30 minutes of inactivity
 * - Refresh tokens handled via httpOnly cookies by backend
 *
 * @example
 * // In a component
 * const { user, isAuthenticated, login, logout } = useAuthStore()
 *
 * if (isAuthenticated) {
 *   console.log('Logged in as:', user.email)
 * }
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state: No user, not authenticated
      user: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: null,

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
          lastActivity: user ? Date.now() : null,
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
          lastActivity: Date.now(),
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
          lastActivity: null,
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

      /**
       * Update last activity timestamp
       *
       * Called on user interactions to extend session.
       * Prevents session timeout while user is active.
       */
      updateActivity: () => {
        const state = get()
        if (state.isAuthenticated) {
          set({ lastActivity: Date.now() })
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields (NOT isLoading, token stays in memory)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      // Check session expiration on hydration
      onRehydrateStorage: () => (state) => {
        if (state?.lastActivity) {
          const now = Date.now()
          const elapsed = now - state.lastActivity

          // If session expired (>30 min of inactivity), logout
          if (elapsed > SESSION_DURATION) {
            state.logout()
          }
        }
      },
    }
  )
)
