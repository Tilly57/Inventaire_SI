/**
 * @fileoverview Unit tests for useAuth hook
 *
 * Tests:
 * - Hook initialization and state
 * - Login functionality (success and error cases)
 * - Logout functionality (success and error cases)
 * - Store integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/useAuth'
import * as authStore from '@/lib/stores/authStore'
import * as authApi from '@/lib/api/auth.api'

// Mock the store
vi.mock('@/lib/stores/authStore')

// Mock the API
vi.mock('@/lib/api/auth.api')

describe('useAuth', () => {
  let mockLoginStore: ReturnType<typeof vi.fn>
  let mockLogoutStore: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockLoginStore = vi.fn()
    mockLogoutStore = vi.fn()

    // Default mock implementation
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLoginStore,
      logout: mockLogoutStore,
    } as any)
  })

  describe('Hook initialization', () => {
    it('should return initial state from store', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should return authenticated user from store', () => {
      const mockUser = { id: '1', email: 'test@test.com', role: 'ADMIN' as const }
      vi.mocked(authStore.useAuthStore).mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        login: mockLoginStore,
        logout: mockLogoutStore,
      } as any)

      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should return loading state from store', () => {
      vi.mocked(authStore.useAuthStore).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: mockLoginStore,
        logout: mockLogoutStore,
      } as any)

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Login functionality', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: '1', email: 'test@test.com', role: 'ADMIN' as const }
      const mockCredentials = { email: 'test@test.com', password: 'password123' }
      const mockAccessToken = 'mock-access-token'

      vi.mocked(authApi.loginApi).mockResolvedValue({
        user: mockUser,
        accessToken: mockAccessToken,
      })

      const { result } = renderHook(() => useAuth())

      const loginResult = await result.current.login(mockCredentials)

      expect(authApi.loginApi).toHaveBeenCalledWith(mockCredentials)
      expect(mockLoginStore).toHaveBeenCalledWith(mockUser, mockAccessToken)
      expect(loginResult).toEqual({ success: true })
    })

    it('should handle login error with API error message', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'wrong' }
      const mockError = {
        response: {
          data: {
            error: 'Identifiants invalides',
          },
        },
      }

      vi.mocked(authApi.loginApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      const loginResult = await result.current.login(mockCredentials)

      expect(loginResult).toEqual({
        success: false,
        error: 'Identifiants invalides',
      })
      expect(mockLoginStore).not.toHaveBeenCalled()
    })

    it('should handle login error with default message', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'wrong' }
      const mockError = new Error('Network error')

      vi.mocked(authApi.loginApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      const loginResult = await result.current.login(mockCredentials)

      expect(loginResult).toEqual({
        success: false,
        error: 'Erreur lors de la connexion',
      })
      expect(mockLoginStore).not.toHaveBeenCalled()
    })

    it('should handle login error without response data', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'wrong' }
      const mockError = {
        response: {
          data: {},
        },
      }

      vi.mocked(authApi.loginApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      const loginResult = await result.current.login(mockCredentials)

      expect(loginResult).toEqual({
        success: false,
        error: 'Erreur lors de la connexion',
      })
    })

    it('should not call store if login API fails', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'wrong' }
      vi.mocked(authApi.loginApi).mockRejectedValue(new Error('Failed'))

      const { result } = renderHook(() => useAuth())

      await result.current.login(mockCredentials)

      expect(mockLoginStore).not.toHaveBeenCalled()
    })
  })

  describe('Logout functionality', () => {
    it('should logout successfully and clear store', async () => {
      vi.mocked(authApi.logoutApi).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await result.current.logout()

      expect(authApi.logoutApi).toHaveBeenCalledOnce()
      expect(mockLogoutStore).toHaveBeenCalledOnce()
    })

    it('should clear store even if logout API fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(authApi.logoutApi).mockRejectedValue(new Error('API error'))

      const { result } = renderHook(() => useAuth())

      await result.current.logout()

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(mockLogoutStore).toHaveBeenCalledOnce()

      consoleErrorSpy.mockRestore()
    })

    it('should log error to console when logout API fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockError = new Error('Network error')
      vi.mocked(authApi.logoutApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAuth())

      await result.current.logout()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', mockError)

      consoleErrorSpy.mockRestore()
    })

    it('should always call logout store in finally block', async () => {
      vi.mocked(authApi.logoutApi).mockRejectedValue(new Error('API error'))
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth())

      await result.current.logout()

      // Store logout should be called even if API fails
      expect(mockLogoutStore).toHaveBeenCalledOnce()

      consoleErrorSpy.mockRestore()
    })

    it('should handle logout API success without errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error')
      vi.mocked(authApi.logoutApi).mockResolvedValue(undefined)

      const { result } = renderHook(() => useAuth())

      await result.current.logout()

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(mockLogoutStore).toHaveBeenCalledOnce()
    })
  })

  describe('Return values', () => {
    it('should return login function', () => {
      const { result } = renderHook(() => useAuth())

      expect(typeof result.current.login).toBe('function')
    })

    it('should return logout function', () => {
      const { result } = renderHook(() => useAuth())

      expect(typeof result.current.logout).toBe('function')
    })

    it('should return all required properties', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('isAuthenticated')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('login')
      expect(result.current).toHaveProperty('logout')
    })

    it('should provide login and logout functions', () => {
      const { result } = renderHook(() => useAuth())

      // Functions should be callable
      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
    })
  })
})
