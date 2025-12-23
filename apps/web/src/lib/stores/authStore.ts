import { create } from 'zustand'
import type { User } from '@/lib/types/models.types'
import { setAccessToken } from '@/lib/api/client'

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setToken: (token) => {
    setAccessToken(token)
  },

  login: (user, token) => {
    setAccessToken(token)
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    setAccessToken(null)
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
}))
