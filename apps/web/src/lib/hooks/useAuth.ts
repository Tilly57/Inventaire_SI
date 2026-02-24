/**
 * @fileoverview Authentication hook
 *
 * Provides authentication functionality by combining Zustand store
 * and API calls for login/logout operations.
 *
 * Unlike other hooks, this doesn't use React Query directly.
 * Authentication state is managed via Zustand for global access.
 *
 * Features:
 * - Login with email/password
 * - Logout with server-side token invalidation
 * - Access to current user and auth status
 * - Error handling with user-friendly messages
 */

import { useAuthStore } from '@/lib/stores/authStore'
import { loginApi, logoutApi } from '@/lib/api/auth.api'
import type { LoginDto } from '@/lib/types/models.types'
import { setUserContext } from '@/lib/sentry'
import { getErrorMessage } from '@/lib/utils/getErrorMessage'

/**
 * Authentication hook
 *
 * Provides authentication operations and current auth state.
 * Combines Zustand store (for state) with API calls (for server operations).
 *
 * @returns Object containing auth state and operations
 * @returns {User | null} user - Currently authenticated user
 * @returns {boolean} isAuthenticated - Whether user is logged in
 * @returns {boolean} isLoading - Whether auth operation is in progress
 * @returns {Function} login - Login function accepting credentials
 * @returns {Function} logout - Logout function
 *
 * @example
 * function LoginPage() {
 *   const { login, isLoading } = useAuth();
 *
 *   const handleSubmit = async (credentials) => {
 *     const result = await login(credentials);
 *     if (result.success) {
 *       navigate('/dashboard');
 *     } else {
 *       alert(result.error);
 *     }
 *   };
 * }
 *
 * @example
 * function Header() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) return <LoginButton />;
 *
 *   return (
 *     <div>
 *       Welcome {user.email}
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login: loginStore,
    logout: logoutStore,
  } = useAuthStore()

  // Note: Auto-login check disabled for now
  // User must login manually

  /**
   * Login user with email and password
   *
   * Calls login API and updates auth store on success.
   * Returns result object for UI feedback.
   *
   * @param credentials - Login credentials
   * @param credentials.email - User email
   * @param credentials.password - User password
   * @returns Promise resolving to result object
   * @returns {boolean} result.success - Whether login succeeded
   * @returns {string} [result.error] - Error message if login failed
   */
  const login = async (credentials: LoginDto) => {
    try {
      // Call login API to get user and access token
      const { user, accessToken } = await loginApi(credentials)

      // Update Zustand store with user data and token
      loginStore(user, accessToken)

      // Set user context in Sentry for error tracking
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.username || user.email,
      })

      return { success: true }
    } catch (error: unknown) {
      // Extract error message from API response
      const message = getErrorMessage(error, 'Erreur lors de la connexion')
      return { success: false, error: message }
    }
  }

  /**
   * Logout user
   *
   * Calls logout API to invalidate refresh token on server,
   * then clears local auth state.
   *
   * Even if API call fails, local logout still proceeds to ensure
   * user can always log out locally.
   */
  const logout = async () => {
    try {
      // Invalidate refresh token on server
      await logoutApi()
    } catch (error) {
      // Ignore error, logout locally anyway
      // This ensures user can always log out even if API fails
      console.error('Logout error:', error)
    } finally {
      // Clear local auth state (user data and access token)
      logoutStore()

      // Clear user context in Sentry
      setUserContext(null)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
