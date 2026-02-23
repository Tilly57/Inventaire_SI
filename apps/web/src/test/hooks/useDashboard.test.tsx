/**
 * @fileoverview Unit tests for useDashboard hooks
 *
 * Tests:
 * - useDashboardStats (fetch dashboard statistics)
 * - useRecentLoans (fetch recent loan activity)
 * - useLowStockItems (fetch low stock alerts)
 * - useOutOfServiceItems (fetch out-of-service assets)
 * - useEquipmentByType (fetch equipment type statistics)
 * - Query caching behavior
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useDashboardStats,
  useRecentLoans,
  useLowStockItems,
  useOutOfServiceItems,
  useEquipmentByType,
} from '@/lib/hooks/useDashboard'
import * as dashboardApi from '@/lib/api/dashboard.api'
import { ReactNode } from 'react'

// Mock the API
vi.mock('@/lib/api/dashboard.api')

// Helper to create wrapper with QueryClient
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useDashboard hooks', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  describe('useDashboardStats', () => {
    it('should fetch dashboard statistics successfully', async () => {
      const mockStats = {
        totalEmployees: 50,
        totalAssets: 200,
        activeLoans: 15,
        loanedAssets: 30,
        outOfServiceAssets: 5,
      }

      vi.mocked(dashboardApi.getDashboardStatsApi).mockResolvedValue(mockStats)

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
      expect(dashboardApi.getDashboardStatsApi).toHaveBeenCalledOnce()
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error')
      vi.mocked(dashboardApi.getDashboardStatsApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should show loading state initially', () => {
      vi.mocked(dashboardApi.getDashboardStatsApi).mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should cache data with correct query key', async () => {
      const mockStats = {
        totalEmployees: 50,
        totalAssets: 200,
        activeLoans: 15,
        loanedAssets: 30,
        outOfServiceAssets: 5,
      }

      vi.mocked(dashboardApi.getDashboardStatsApi).mockResolvedValue(mockStats)

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['dashboard', 'stats'])
      expect(cachedData).toEqual(mockStats)
    })

    it('should handle zero values in statistics', async () => {
      const mockStats = {
        totalEmployees: 0,
        totalAssets: 0,
        activeLoans: 0,
        loanedAssets: 0,
        outOfServiceAssets: 0,
      }

      vi.mocked(dashboardApi.getDashboardStatsApi).mockResolvedValue(mockStats)

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
    })

    it('should handle large values in statistics', async () => {
      const mockStats = {
        totalEmployees: 10000,
        totalAssets: 50000,
        activeLoans: 2500,
        loanedAssets: 7500,
        outOfServiceAssets: 500,
      }

      vi.mocked(dashboardApi.getDashboardStatsApi).mockResolvedValue(mockStats)

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockStats)
    })
  })

  describe('useRecentLoans', () => {
    it('should fetch recent loans successfully', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          employeeId: 'emp-1',
          status: 'OPEN' as const,
          createdAt: new Date('2024-01-15'),
          employee: { id: 'emp-1', firstName: 'Jean', lastName: 'Dupont' },
        },
        {
          id: 'loan-2',
          employeeId: 'emp-2',
          status: 'CLOSED' as const,
          createdAt: new Date('2024-01-14'),
          employee: { id: 'emp-2', firstName: 'Marie', lastName: 'Martin' },
        },
      ]

      vi.mocked(dashboardApi.getRecentLoansApi).mockResolvedValue(mockLoans as any)

      const { result } = renderHook(() => useRecentLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLoans)
      expect(dashboardApi.getRecentLoansApi).toHaveBeenCalledOnce()
    })

    it('should handle empty recent loans', async () => {
      vi.mocked(dashboardApi.getRecentLoansApi).mockResolvedValue([])

      const { result } = renderHook(() => useRecentLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch loans')
      vi.mocked(dashboardApi.getRecentLoansApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useRecentLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockLoans = [
        { id: 'loan-1', employeeId: 'emp-1', status: 'OPEN' as const, createdAt: new Date() },
      ]

      vi.mocked(dashboardApi.getRecentLoansApi).mockResolvedValue(mockLoans as any)

      const { result } = renderHook(() => useRecentLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['dashboard', 'recent-loans'])
      expect(cachedData).toEqual(mockLoans)
    })

    it('should handle maximum of 5 recent loans', async () => {
      const mockLoans = Array.from({ length: 5 }, (_, i) => ({
        id: `loan-${i + 1}`,
        employeeId: `emp-${i + 1}`,
        status: 'OPEN' as const,
        createdAt: new Date(),
      }))

      vi.mocked(dashboardApi.getRecentLoansApi).mockResolvedValue(mockLoans as any)

      const { result } = renderHook(() => useRecentLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.length).toBe(5)
    })
  })

  describe('useLowStockItems', () => {
    it('should fetch low stock items successfully', async () => {
      const mockLowStockItems = [
        {
          id: 'stock-1',
          assetModelId: 'model-1',
          assetModel: { id: 'model-1', brand: 'HP', modelName: 'EliteBook', type: 'Laptop' },
          availableQuantity: 1,
          itemType: 'stock' as const,
        },
        {
          id: 'asset-model-model-2',
          assetModelId: 'model-2',
          assetModel: { id: 'model-2', brand: 'Dell', modelName: 'Monitor', type: 'Screen' },
          availableQuantity: 0,
          itemType: 'asset' as const,
        },
      ]

      vi.mocked(dashboardApi.getLowStockItemsApi).mockResolvedValue(mockLowStockItems as any)

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLowStockItems)
      expect(dashboardApi.getLowStockItemsApi).toHaveBeenCalledOnce()
    })

    it('should handle empty low stock items', async () => {
      vi.mocked(dashboardApi.getLowStockItemsApi).mockResolvedValue([])

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch low stock items')
      vi.mocked(dashboardApi.getLowStockItemsApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockLowStockItems = [
        {
          id: 'stock-1',
          assetModelId: 'model-1',
          availableQuantity: 1,
          itemType: 'stock' as const,
        },
      ]

      vi.mocked(dashboardApi.getLowStockItemsApi).mockResolvedValue(mockLowStockItems as any)

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['dashboard', 'low-stock'])
      expect(cachedData).toEqual(mockLowStockItems)
    })

    it('should handle both stock and asset item types', async () => {
      const mockLowStockItems = [
        { id: 'stock-1', itemType: 'stock' as const, availableQuantity: 1 },
        { id: 'asset-1', itemType: 'asset' as const, availableQuantity: 0 },
      ]

      vi.mocked(dashboardApi.getLowStockItemsApi).mockResolvedValue(mockLowStockItems as any)

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].itemType).toBe('stock')
      expect(result.current.data?.[1].itemType).toBe('asset')
    })
  })

  describe('useOutOfServiceItems', () => {
    it('should fetch out of service items successfully', async () => {
      const mockOutOfServiceItems = [
        {
          id: 'asset-1',
          assetTag: 'LAP-001',
          status: 'HS' as const,
          assetModelId: 'model-1',
          assetModel: { id: 'model-1', brand: 'HP', modelName: 'EliteBook', type: 'Laptop' },
        },
        {
          id: 'asset-2',
          assetTag: 'MON-002',
          status: 'HS' as const,
          assetModelId: 'model-2',
          assetModel: { id: 'model-2', brand: 'Dell', modelName: 'U2415', type: 'Screen' },
        },
      ]

      vi.mocked(dashboardApi.getOutOfServiceItemsApi).mockResolvedValue(mockOutOfServiceItems as any)

      const { result } = renderHook(() => useOutOfServiceItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockOutOfServiceItems)
      expect(dashboardApi.getOutOfServiceItemsApi).toHaveBeenCalledOnce()
    })

    it('should handle empty out of service items', async () => {
      vi.mocked(dashboardApi.getOutOfServiceItemsApi).mockResolvedValue([])

      const { result } = renderHook(() => useOutOfServiceItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch out of service items')
      vi.mocked(dashboardApi.getOutOfServiceItemsApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useOutOfServiceItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockOutOfServiceItems = [
        { id: 'asset-1', assetTag: 'LAP-001', status: 'HS' as const },
      ]

      vi.mocked(dashboardApi.getOutOfServiceItemsApi).mockResolvedValue(mockOutOfServiceItems as any)

      const { result } = renderHook(() => useOutOfServiceItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['dashboard', 'out-of-service'])
      expect(cachedData).toEqual(mockOutOfServiceItems)
    })

    it('should only include items with HS status', async () => {
      const mockOutOfServiceItems = [
        { id: 'asset-1', status: 'HS' as const },
        { id: 'asset-2', status: 'HS' as const },
      ]

      vi.mocked(dashboardApi.getOutOfServiceItemsApi).mockResolvedValue(mockOutOfServiceItems as any)

      const { result } = renderHook(() => useOutOfServiceItems(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.every(item => item.status === 'HS')).toBe(true)
    })
  })

  describe('useEquipmentByType', () => {
    it('should fetch equipment by type successfully', async () => {
      const mockEquipmentByType = [
        { type: 'Laptop', count: 50, percentage: 40.0 },
        { type: 'Screen', count: 30, percentage: 24.0 },
        { type: 'Keyboard', count: 45, percentage: 36.0 },
      ]

      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockResolvedValue(mockEquipmentByType)

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockEquipmentByType)
      expect(dashboardApi.getEquipmentByTypeApi).toHaveBeenCalledOnce()
    })

    it('should handle empty equipment types', async () => {
      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockResolvedValue([])

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch equipment by type')
      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockEquipmentByType = [
        { type: 'Laptop', count: 50, percentage: 100.0 },
      ]

      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockResolvedValue(mockEquipmentByType)

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['dashboard', 'equipment-by-type'])
      expect(cachedData).toEqual(mockEquipmentByType)
    })

    it('should handle percentages correctly', async () => {
      const mockEquipmentByType = [
        { type: 'Laptop', count: 50, percentage: 50.0 },
        { type: 'Screen', count: 50, percentage: 50.0 },
      ]

      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockResolvedValue(mockEquipmentByType)

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const totalPercentage = result.current.data?.reduce((sum, item) => sum + item.percentage, 0)
      expect(totalPercentage).toBe(100.0)
    })

    it('should handle single equipment type', async () => {
      const mockEquipmentByType = [
        { type: 'Laptop', count: 100, percentage: 100.0 },
      ]

      vi.mocked(dashboardApi.getEquipmentByTypeApi).mockResolvedValue(mockEquipmentByType)

      const { result } = renderHook(() => useEquipmentByType(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].percentage).toBe(100.0)
    })
  })
})
