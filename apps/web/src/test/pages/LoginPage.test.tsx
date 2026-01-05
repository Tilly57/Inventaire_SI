/**
 * @fileoverview Unit tests for LoginPage component
 *
 * Tests:
 * - Rendering and UI elements
 * - Loading state display
 * - Redirect behavior when authenticated
 * - Form display when not authenticated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import * as useAuthHook from '@/lib/hooks/useAuth'
import * as reactRouterDom from 'react-router-dom'

// Mock the hooks
vi.mock('@/lib/hooks/useAuth')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Mock the LoginForm component
vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Mock</div>,
}))

// Mock the Card components from shadcn/ui
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h1>{children}</h1>,
}))

describe('LoginPage', () => {
  let mockNavigate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockNavigate = vi.fn()
    vi.mocked(reactRouterDom.useNavigate).mockReturnValue(mockNavigate)
  })

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
      expect(screen.queryByTestId('login-form')).not.toBeInTheDocument()
    })

    it('should show spinner with correct styling when loading', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { container } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Authenticated redirect', () => {
    it('should redirect to /dashboard when already authenticated', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', email: 'test@test.com', role: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })

    it('should not redirect when loading', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: true,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not redirect when not authenticated', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Login form display', () => {
    it('should render login form when not authenticated and not loading', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByTestId('login-form')).toBeInTheDocument()
      expect(screen.queryByText('Chargement...')).not.toBeInTheDocument()
    })

    it('should display page title "Inventaire SI"', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText('Inventaire SI')).toBeInTheDocument()
    })

    it('should display login instructions', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText("Connectez-vous pour accéder à l'application")).toBeInTheDocument()
    })

    it('should display logo image with correct alt text', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const logo = screen.getByAltText('Groupe Tilly Logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', '/images/logo.jpg')
    })
  })

  describe('UI styling', () => {
    it('should have correct background color for page', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { container } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const pageContainer = container.querySelector('.bg-\\[\\#231F20\\]')
      expect(pageContainer).toBeInTheDocument()
    })

    it('should render card with white background', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { container } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      const card = container.querySelector('.bg-white')
      expect(card).toBeInTheDocument()
    })
  })
})
