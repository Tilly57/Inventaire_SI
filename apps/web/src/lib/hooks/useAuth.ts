import { useAuthStore } from '@/lib/stores/authStore'
import { loginApi, logoutApi } from '@/lib/api/auth.api'
import type { LoginDto } from '@/lib/types/models.types'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login: loginStore,
    logout: logoutStore,
    setUser,
    setLoading,
  } = useAuthStore()

  // Note: Auto-login check disabled for now
  // User must login manually

  const login = async (credentials: LoginDto) => {
    try {
      const { user, accessToken } = await loginApi(credentials)
      loginStore(user, accessToken)
      return { success: true }
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Erreur lors de la connexion'
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      // Ignore error, logout locally anyway
      console.error('Logout error:', error)
    } finally {
      logoutStore()
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
