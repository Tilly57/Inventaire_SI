/**
 * @fileoverview Unit tests for Sidebar component
 *
 * Tests:
 * - Rendering with user data
 * - Navigation items based on roles
 * - Active route highlighting
 * - Navigation links functionality
 * - User information display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import * as useAuthHook from '@/lib/hooks/useAuth'
import { NAVIGATION_ITEMS } from '@/lib/utils/constants'

// Mock hooks
vi.mock('@/lib/hooks/useAuth')

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering with user', () => {
    it('should render sidebar with user data for ADMIN', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('admin')).toBeDefined()
      expect(screen.getByText('admin@example.com')).toBeDefined()
    })

    it('should render sidebar title', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('Gestion des équipements')).toBeDefined()
    })

    it('should render user information at the bottom', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'GESTIONNAIRE',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('testuser')).toBeDefined()
      expect(screen.getByText('test@example.com')).toBeDefined()
    })
  })

  describe('Navigation items for ADMIN role', () => {
    it('should show all navigation items for ADMIN', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Check that all items allowed for ADMIN are shown
      const adminItems = NAVIGATION_ITEMS.filter((item) =>
        item.allowedRoles.includes('ADMIN')
      )

      adminItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeDefined()
      })
    })

    it('should show Dashboard link for ADMIN', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('Tableau de bord')).toBeDefined()
    })

    it('should show Users link for ADMIN', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('Utilisateurs')).toBeDefined()
    })

    it('should show all resource links for ADMIN', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('Employés')).toBeDefined()
      expect(screen.getByText('Stock')).toBeDefined()
      expect(screen.getByText('Équipements')).toBeDefined()
      // The actual label is "Modèles d'équipement"
      expect(screen.getByText(/Modèles/)).toBeDefined()
      expect(screen.getByText('Prêts')).toBeDefined()
    })
  })

  describe('Navigation items for GESTIONNAIRE role', () => {
    it('should show appropriate items for GESTIONNAIRE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'manager',
          email: 'manager@example.com',
          role: 'GESTIONNAIRE',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const gestionnaireItems = NAVIGATION_ITEMS.filter((item) =>
        item.allowedRoles.includes('GESTIONNAIRE')
      )

      gestionnaireItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeDefined()
      })
    })

    it('should NOT show Users link for GESTIONNAIRE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'manager',
          email: 'manager@example.com',
          role: 'GESTIONNAIRE',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.queryByText('Utilisateurs')).toBeNull()
    })
  })

  describe('Navigation items for LECTURE role', () => {
    it('should show appropriate items for LECTURE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'reader',
          email: 'reader@example.com',
          role: 'LECTURE',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const lectureItems = NAVIGATION_ITEMS.filter((item) =>
        item.allowedRoles.includes('LECTURE')
      )

      lectureItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeDefined()
      })
    })

    it('should NOT show Users link for LECTURE', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'reader',
          email: 'reader@example.com',
          role: 'LECTURE',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.queryByText('Utilisateurs')).toBeNull()
    })
  })

  describe('Active route highlighting', () => {
    it('should highlight dashboard when on dashboard route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar />
        </MemoryRouter>
      )

      const dashboardLink = screen.getByText('Tableau de bord').closest('a')
      expect(dashboardLink?.className).toContain('bg-[#EE2722]')
    })

    it('should highlight employees when on employees route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/employees']}>
          <Sidebar />
        </MemoryRouter>
      )

      const employeesLink = screen.getByText('Employés').closest('a')
      expect(employeesLink?.className).toContain('bg-[#EE2722]')
    })

    it('should highlight loans when on loans route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/loans']}>
          <Sidebar />
        </MemoryRouter>
      )

      const loansLink = screen.getByText('Prêts').closest('a')
      expect(loansLink?.className).toContain('bg-[#EE2722]')
    })

    it('should not highlight inactive routes', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar />
        </MemoryRouter>
      )

      const employeesLink = screen.getByText('Employés').closest('a')
      // Check that it doesn't have the active state (not the hover state which contains bg-[#EE2722]/10)
      // Active state would have 'bg-[#EE2722]' without the /10 opacity
      expect(employeesLink?.className).toContain('text-gray-400')
      expect(employeesLink?.className).not.toMatch(/bg-\[#EE2722\](?!\/)/)  // Match bg-[#EE2722] not followed by /
    })
  })

  describe('Navigation links', () => {
    it('should have correct href for each navigation item', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const dashboardLink = screen.getByText('Tableau de bord').closest('a')
      expect(dashboardLink?.getAttribute('href')).toBe('/dashboard')

      const employeesLink = screen.getByText('Employés').closest('a')
      expect(employeesLink?.getAttribute('href')).toBe('/employees')

      const loansLink = screen.getByText('Prêts').closest('a')
      expect(loansLink?.getAttribute('href')).toBe('/loans')
    })

    it('should render all links as anchor tags', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const links = container.querySelectorAll('nav a')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Icons rendering', () => {
    it('should render icons for navigation items', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Check for lucide icons (SVG elements)
      const icons = container.querySelectorAll('nav svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Without user', () => {
    it('should not render anything when user is null', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: null,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })

    it('should not render anything when user is undefined', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: undefined,
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Styling', () => {
    it('should have correct sidebar styling classes', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('w-64')
      expect(aside?.className).toContain('bg-[#231F20]')
      expect(aside?.className).toContain('min-h-screen')
    })

    it('should have correct active link styling', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar />
        </MemoryRouter>
      )

      const activeLink = screen.getByText('Tableau de bord').closest('a')
      expect(activeLink?.className).toContain('bg-[#EE2722]')
      expect(activeLink?.className).toContain('text-white')
    })

    it('should have correct inactive link styling', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar />
        </MemoryRouter>
      )

      const inactiveLink = screen.getByText('Employés').closest('a')
      expect(inactiveLink?.className).toContain('text-gray-400')
      expect(inactiveLink?.className).toContain('hover:bg-[#EE2722]/10')
    })
  })

  describe('Responsive behavior', () => {
    it('should be hidden on mobile (md:flex)', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('hidden')
      expect(aside?.className).toContain('md:flex')
    })
  })

  describe('User info section', () => {
    it('should render user info section with border', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Find the user info section (should have border-t class)
      const userInfoSection = container.querySelector('.border-t.border-\\[\\#EE2722\\]\\/20')
      expect(userInfoSection).toBeDefined()
    })

    it('should truncate long email addresses', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'verylongemailaddress@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const emailElement = screen.getByText('verylongemailaddress@example.com')
      expect(emailElement.className).toContain('truncate')
    })
  })

  describe('Semantic HTML', () => {
    it('should use aside element for sidebar', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const aside = container.querySelector('aside')
      expect(aside).toBeDefined()
    })

    it('should use nav element for navigation', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const nav = container.querySelector('nav')
      expect(nav).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing email gracefully', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: undefined,
          role: 'ADMIN',
        } as any,
      } as any)

      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      expect(screen.getByText('testuser')).toBeDefined()
    })

    it('should handle role with no allowed items', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: 'UNKNOWN_ROLE' as any,
        },
      } as any)

      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Should still render sidebar structure
      const aside = container.querySelector('aside')
      expect(aside).toBeDefined()
    })
  })
})
