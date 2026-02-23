/**
 * @fileoverview Unit tests for DashboardPage
 *
 * Tests:
 * - Page rendering with stats
 * - Loading states
 * - Error handling
 * - Export functionality
 * - Stats card rendering
 * - Widget components integration
 * - Lazy loading of chart component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from '@/pages/DashboardPage'
import * as useDashboardHook from '@/lib/hooks/useDashboard'
import * as exportApi from '@/lib/api/export.api'
import { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'

// Mock the hooks
vi.mock('@/lib/hooks/useDashboard')

// Mock the export API
vi.mock('@/lib/api/export.api')

// Mock the toast hook
vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  }),
}))

// Mock dashboard components
vi.mock('@/components/dashboard/StatsCard', () => ({
  StatsCard: ({ title, value }: any) => (
    <div data-testid={`stats-card-${title}`}>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('@/components/dashboard/RecentLoans', () => ({
  RecentLoans: () => <div data-testid="recent-loans">Recent Loans Widget</div>,
}))

vi.mock('@/components/dashboard/LowStockAlert', () => ({
  LowStockAlert: () => <div data-testid="low-stock-alert">Low Stock Alert Widget</div>,
}))

vi.mock('@/components/dashboard/OutOfServiceList', () => ({
  OutOfServiceList: () => <div data-testid="out-of-service-list">Out of Service Widget</div>,
}))

vi.mock('@/components/dashboard/EquipmentByTypeChart', () => ({
  EquipmentByTypeChart: () => <div data-testid="equipment-chart">Equipment Chart</div>,
}))

// Helper to create wrapper with QueryClient
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  describe('Rendering - Success state', () => {
    it('should render page title and description', async () => {
      const mockStats = {
        totalEmployees: 50,
        totalAssets: 200,
        activeLoans: 15,
        loanedAssets: 30,
        outOfServiceAssets: 5,
      }

      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Tableau de bord')).toBeDefined()
      expect(screen.getByText("Vue d'ensemble des statistiques et activités récentes")).toBeDefined()
    })

    it('should render all stats cards with correct data', async () => {
      const mockStats = {
        totalEmployees: 50,
        totalAssets: 200,
        activeLoans: 15,
        loanedAssets: 30,
        outOfServiceAssets: 5,
      }

      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(screen.getByTestId('stats-card-Employés')).toBeDefined()
        expect(screen.getByTestId('stats-card-Équipements')).toBeDefined()
        expect(screen.getByTestId('stats-card-Prêts actifs')).toBeDefined()
        expect(screen.getByTestId('stats-card-Articles prêtés')).toBeDefined()
        expect(screen.getByTestId('stats-card-Hors service')).toBeDefined()
      })
    })

    it('should render export button', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Exporter Dashboard Complet')).toBeDefined()
    })

    it('should render all dashboard widgets', async () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(screen.getByTestId('recent-loans')).toBeDefined()
        expect(screen.getByTestId('low-stock-alert')).toBeDefined()
        expect(screen.getByTestId('out-of-service-list')).toBeDefined()
      })
    })
  })

  describe('Loading state', () => {
    it('should show loading skeletons when data is loading', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      // Should show 5 skeleton loaders for stats cards
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThanOrEqual(5)
    })

    it('should show page title during loading', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Tableau de bord')).toBeDefined()
    })

    it('should not show stats cards during loading', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('stats-card-Employés')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when stats fetch fails', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch stats'),
        isSuccess: false,
        isError: true,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Erreur lors du chargement des statistiques. Veuillez réessayer.')).toBeDefined()
    })

    it('should show page title in error state', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch stats'),
        isSuccess: false,
        isError: true,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Tableau de bord')).toBeDefined()
    })

    it('should not show stats cards in error state', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch stats'),
        isSuccess: false,
        isError: true,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('stats-card-Employés')).toBeNull()
    })

    it('should not show export button in error state', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch stats'),
        isSuccess: false,
        isError: true,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByText('Exporter Dashboard Complet')).toBeNull()
    })
  })

  describe('Export functionality', () => {
    it('should call export API when export button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      vi.mocked(exportApi.exportDashboard).mockResolvedValue(undefined)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Dashboard Complet')
      await user.click(exportButton)

      await waitFor(() => {
        expect(exportApi.exportDashboard).toHaveBeenCalledOnce()
      })
    })

    it('should disable export button during export', async () => {
      const user = userEvent.setup()
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      vi.mocked(exportApi.exportDashboard).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Dashboard Complet')
      await user.click(exportButton)

      // Button should show loading text
      expect(screen.getByText('Export...')).toBeDefined()
    })

    it('should handle export error gracefully', async () => {
      const user = userEvent.setup()
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      vi.mocked(exportApi.exportDashboard).mockRejectedValue(new Error('Export failed'))

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Dashboard Complet')
      await user.click(exportButton)

      await waitFor(() => {
        // Button should be re-enabled after error
        expect(screen.getByText('Exporter Dashboard Complet')).toBeDefined()
      })
    })
  })

  describe('Stats cards display', () => {
    it('should display employee count correctly', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 125,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const employeesCard = screen.getByTestId('stats-card-Employés')
      expect(employeesCard.textContent).toContain('125')
    })

    it('should display assets count correctly', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 450,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const assetsCard = screen.getByTestId('stats-card-Équipements')
      expect(assetsCard.textContent).toContain('450')
    })

    it('should display active loans count correctly', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 23,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const loansCard = screen.getByTestId('stats-card-Prêts actifs')
      expect(loansCard.textContent).toContain('23')
    })

    it('should display loaned assets count correctly', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 67,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const loanedCard = screen.getByTestId('stats-card-Articles prêtés')
      expect(loanedCard.textContent).toContain('67')
    })

    it('should display out of service count correctly', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 8,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const outOfServiceCard = screen.getByTestId('stats-card-Hors service')
      expect(outOfServiceCard.textContent).toContain('8')
    })

    it('should handle zero values in stats', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 0,
          totalAssets: 0,
          activeLoans: 0,
          loanedAssets: 0,
          outOfServiceAssets: 0,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('stats-card-Employés').textContent).toContain('0')
      expect(screen.getByTestId('stats-card-Équipements').textContent).toContain('0')
      expect(screen.getByTestId('stats-card-Prêts actifs').textContent).toContain('0')
      expect(screen.getByTestId('stats-card-Articles prêtés').textContent).toContain('0')
      expect(screen.getByTestId('stats-card-Hors service').textContent).toContain('0')
    })
  })

  describe('Responsive layout', () => {
    it('should render with grid layout classes', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      const { container } = render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      // Check for responsive grid classes
      const gridContainers = container.querySelectorAll('[class*="grid"]')
      expect(gridContainers.length).toBeGreaterThan(0)
    })
  })

  describe('Animation classes', () => {
    it('should apply animation classes to stats cards', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: {
          totalEmployees: 50,
          totalAssets: 200,
          activeLoans: 15,
          loanedAssets: 30,
          outOfServiceAssets: 5,
        },
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      const { container } = render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      const animatedElements = container.querySelectorAll('[class*="animate-slideIn"]')
      expect(animatedElements.length).toBe(5) // 5 stats cards with animation
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined stats data gracefully', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        isSuccess: true,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      // Should not render stats cards when data is undefined
      expect(screen.queryByTestId('stats-card-Employés')).toBeNull()
    })

    it('should render widgets even when stats are loading', () => {
      vi.mocked(useDashboardHook.useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      } as any)

      render(<DashboardPage />, { wrapper: createWrapper(queryClient) })

      // Widgets should still be rendered
      expect(screen.getByTestId('recent-loans')).toBeDefined()
      expect(screen.getByTestId('low-stock-alert')).toBeDefined()
    })
  })
})
