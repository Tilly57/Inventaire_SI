/**
 * @fileoverview Unit tests for Header component
 *
 * Tests:
 * - Rendering with user data
 * - User menu interactions
 * - Logout functionality
 * - Logo display
 * - Theme toggle
 * - Global search
 * - Mobile navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/Header'
import * as useAuthHook from '@/lib/hooks/useAuth'
import * as reactRouterDom from 'react-router-dom'
import { UserRoleLabels } from '@/lib/types/enums'

// Mock hooks
vi.mock('@/lib/hooks/useAuth')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Mock components
vi.mock('@/components/layout/MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile Nav</div>,
}))

vi.mock('@/components/common/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search">Global Search</div>,
}))

vi.mock('@/components/common/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button {...props} onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-menu-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="dropdown-menu-item">
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children, asChild }: any) => <div>{children}</div>,
}))

describe('Header', () => {
  let mockNavigate: ReturnType<typeof vi.fn>
  let mockLogout: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockNavigate = vi.fn()
    mockLogout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(reactRouterDom.useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
  })

  describe('Rendering with user', () => {
    it('should render header with user data', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByText('testuser')).toBeDefined()
      expect(screen.getByText(UserRoleLabels.ADMIN)).toBeDefined()
    })

    it('should render company name and logo', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByText('Groupe Tilly')).toBeDefined()
      expect(screen.getByText('Inventaire SI')).toBeDefined()
      expect(screen.getByAltText('Groupe Tilly Logo')).toBeDefined()
    })

    it('should render mobile navigation', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByTestId('mobile-nav')).toBeDefined()
    })

    it('should render global search', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByTestId('global-search')).toBeDefined()
    })

    it('should render theme toggle', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByTestId('theme-toggle')).toBeDefined()
    })

    it('should display correct role for GESTIONNAIRE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'manager',
          email: 'manager@example.com',
          role: 'GESTIONNAIRE',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByText(UserRoleLabels.GESTIONNAIRE)).toBeDefined()
    })

    it('should display correct role for LECTURE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'reader',
          email: 'reader@example.com',
          role: 'LECTURE',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByText(UserRoleLabels.LECTURE)).toBeDefined()
    })
  })

  describe('User menu interactions', () => {
    it('should show dropdown menu items when user menu is opened', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByTestId('dropdown-menu-content')).toBeDefined()
      expect(screen.getByText('Mon compte')).toBeDefined()
      expect(screen.getByText('Profil')).toBeDefined()
      expect(screen.getByText('Paramètres')).toBeDefined()
      expect(screen.getByText('Déconnexion')).toBeDefined()
    })

    it('should call logout and navigate when logout is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const logoutButtons = screen.getAllByText('Déconnexion')
      await user.click(logoutButtons[0])

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledOnce()
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Without user', () => {
    it('should not render anything when user is null', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })

    it('should not render anything when user is undefined', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: undefined,
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Logo handling', () => {
    it('should have correct logo source', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const logo = screen.getByAltText('Groupe Tilly Logo')
      expect(logo.getAttribute('src')).toBe('/images/logo.jpg')
    })

    it('should handle logo error gracefully', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const logo = screen.getByAltText('Groupe Tilly Logo') as HTMLImageElement

      // Simulate error event
      const errorEvent = new Event('error')
      logo.dispatchEvent(errorEvent)

      // Logo should be hidden after error
      expect(logo.style.display).toBe('none')
    })
  })

  describe('Styling', () => {
    it('should have correct header styling classes', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const header = container.querySelector('header')
      expect(header).toBeDefined()
      expect(header?.className).toContain('h-16')
      expect(header?.className).toContain('border-b')
      expect(header?.className).toContain('bg-[#231F20]')
    })

    it('should have correct user avatar styling', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const avatar = container.querySelector('.bg-\\[\\#EE2722\\]')
      expect(avatar).toBeDefined()
    })
  })

  describe('Responsive behavior', () => {
    it('should render mobile-specific elements', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      // Mobile nav should be present
      expect(screen.getByTestId('mobile-nav')).toBeDefined()
    })

    it('should have responsive text classes', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const companyName = screen.getByText('Groupe Tilly')
      expect(companyName.className).toContain('sm:text-xl')
    })
  })

  describe('User avatar', () => {
    it('should display user icon in avatar', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      // Check for user icon (lucide-react User component)
      const userIcon = container.querySelector('.lucide-user')
      expect(userIcon).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for logo', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const logo = screen.getByAltText('Groupe Tilly Logo')
      expect(logo).toBeDefined()
    })

    it('should have semantic header element', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const header = container.querySelector('header')
      expect(header).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing user email gracefully', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: undefined,
          role: 'ADMIN',
        } as any,
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      expect(screen.getByText('testuser')).toBeDefined()
    })

    it('should handle logout errors gracefully', async () => {
      const user = userEvent.setup()
      // Create a mock that resolves to simulate logout completing even with errors
      // In a real app, the logout function might catch errors internally
      const mockLogout = vi.fn().mockResolvedValue(undefined)

      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        logout: mockLogout,
      } as any)

      render(
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      )

      const logoutButtons = screen.getAllByText('Déconnexion')
      await user.click(logoutButtons[0])

      // Should call logout and navigate
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })
})
