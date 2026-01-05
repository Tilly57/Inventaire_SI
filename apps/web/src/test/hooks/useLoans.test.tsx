/**
 * @fileoverview Unit tests for useLoans hooks
 *
 * Tests:
 * - useLoans (fetch all loans)
 * - useLoan (fetch single loan)
 * - useCreateLoan (create mutation)
 * - useAddLoanLine (add line mutation)
 * - useDeleteLoan (delete mutation)
 * - Toast notifications
 * - Cache invalidation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useLoans,
  useLoan,
  useCreateLoan,
  useAddLoanLine,
  useDeleteLoan,
} from '@/lib/hooks/useLoans'
import * as loansApi from '@/lib/api/loans.api'
import * as useToastHook from '@/lib/hooks/use-toast'
import { ReactNode } from 'react'

// Mock the API
vi.mock('@/lib/api/loans.api')

// Mock the toast hook
vi.mock('@/lib/hooks/use-toast')

// Helper to create wrapper with QueryClient
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLoans hooks', () => {
  let queryClient: QueryClient
  let mockToast: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    mockToast = vi.fn()
    vi.mocked(useToastHook.useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })
  })

  describe('useLoans', () => {
    it('should fetch all loans successfully', async () => {
      const mockLoans = [
        { id: 'loan-1', employeeId: 'emp-1', status: 'OPEN', createdAt: new Date() },
        { id: 'loan-2', employeeId: 'emp-2', status: 'CLOSED', createdAt: new Date() },
      ]

      vi.mocked(loansApi.getAllLoansApi).mockResolvedValue(mockLoans)

      const { result } = renderHook(() => useLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLoans)
      expect(loansApi.getAllLoansApi).toHaveBeenCalledOnce()
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error')
      vi.mocked(loansApi.getAllLoansApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should show loading state initially', () => {
      vi.mocked(loansApi.getAllLoansApi).mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useLoans(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should cache data with correct query key', async () => {
      const mockLoans = [{ id: 'loan-1', employeeId: 'emp-1', status: 'OPEN' }]
      vi.mocked(loansApi.getAllLoansApi).mockResolvedValue(mockLoans)

      const { result } = renderHook(() => useLoans(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['loans'])
      expect(cachedData).toEqual(mockLoans)
    })
  })

  describe('useLoan', () => {
    it('should fetch single loan successfully', async () => {
      const mockLoan = {
        id: 'loan-1',
        employeeId: 'emp-1',
        status: 'OPEN',
        lines: [],
        employee: { id: 'emp-1', firstName: 'Jean', lastName: 'Dupont' },
      }

      vi.mocked(loansApi.getLoanApi).mockResolvedValue(mockLoan)

      const { result } = renderHook(() => useLoan('loan-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockLoan)
      expect(loansApi.getLoanApi).toHaveBeenCalledWith('loan-1')
    })

    it('should not fetch when id is empty', () => {
      // Clear any previous calls
      vi.clearAllMocks()

      const { result } = renderHook(() => useLoan(''), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isFetching).toBe(false)
      // The query is disabled when id is empty
      expect(result.current.fetchStatus).toBe('idle')
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Loan not found')
      vi.mocked(loansApi.getLoanApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useLoan('loan-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockLoan = { id: 'loan-1', employeeId: 'emp-1', status: 'OPEN' }
      vi.mocked(loansApi.getLoanApi).mockResolvedValue(mockLoan)

      const { result } = renderHook(() => useLoan('loan-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(['loans', 'loan-1'])
      expect(cachedData).toEqual(mockLoan)
    })
  })

  describe('useCreateLoan', () => {
    it('should create loan successfully', async () => {
      const mockLoanData = { employeeId: 'emp-1' }
      const mockCreatedLoan = { id: 'loan-new', ...mockLoanData, status: 'OPEN' }

      vi.mocked(loansApi.createLoanApi).mockResolvedValue(mockCreatedLoan)

      const { result } = renderHook(() => useCreateLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(loansApi.createLoanApi).toHaveBeenCalledWith(mockLoanData)
      expect(result.current.data).toEqual(mockCreatedLoan)
    })

    it('should show success toast on creation', async () => {
      const mockLoanData = { employeeId: 'emp-1' }
      const mockCreatedLoan = { id: 'loan-new', ...mockLoanData, status: 'OPEN' }

      vi.mocked(loansApi.createLoanApi).mockResolvedValue(mockCreatedLoan)

      const { result } = renderHook(() => useCreateLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Prêt créé',
        description: 'Le prêt a été créé avec succès',
      })
    })

    it('should show error toast on failure', async () => {
      const mockLoanData = { employeeId: 'emp-1' }
      const mockError = {
        response: {
          data: {
            error: 'Employee not found',
          },
        },
      }

      vi.mocked(loansApi.createLoanApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreateLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Employee not found',
      })
    })

    it('should invalidate loans cache on success', async () => {
      const mockLoanData = { employeeId: 'emp-1' }
      const mockCreatedLoan = { id: 'loan-new', ...mockLoanData, status: 'OPEN' }

      vi.mocked(loansApi.createLoanApi).mockResolvedValue(mockCreatedLoan)

      // Pre-populate cache
      queryClient.setQueryData(['loans'], [{ id: 'loan-1' }])

      const { result } = renderHook(() => useCreateLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Cache should have been invalidated (refetch triggered)
      expect(queryClient.getQueryState(['loans'])?.isInvalidated).toBe(true)
    })

    it('should set created loan in cache immediately', async () => {
      const mockLoanData = { employeeId: 'emp-1' }
      const mockCreatedLoan = { id: 'loan-new', ...mockLoanData, status: 'OPEN' }

      vi.mocked(loansApi.createLoanApi).mockResolvedValue(mockCreatedLoan)

      const { result } = renderHook(() => useCreateLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedLoan = queryClient.getQueryData(['loans', 'loan-new'])
      expect(cachedLoan).toEqual(mockCreatedLoan)
    })
  })

  describe('useAddLoanLine', () => {
    it('should add loan line successfully', async () => {
      const mockLineData = { loanId: 'loan-1', data: { assetItemId: 'asset-1' } }
      const mockUpdatedLoan = { id: 'loan-1', lines: [{ id: 'line-1', assetItemId: 'asset-1' }] }

      vi.mocked(loansApi.addLoanLineApi).mockResolvedValue(mockUpdatedLoan)

      const { result } = renderHook(() => useAddLoanLine(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLineData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(loansApi.addLoanLineApi).toHaveBeenCalledWith('loan-1', { assetItemId: 'asset-1' })
    })

    it('should show success toast on add line', async () => {
      const mockLineData = { loanId: 'loan-1', data: { assetItemId: 'asset-1' } }
      const mockUpdatedLoan = { id: 'loan-1', lines: [{ id: 'line-1' }] }

      vi.mocked(loansApi.addLoanLineApi).mockResolvedValue(mockUpdatedLoan)

      const { result } = renderHook(() => useAddLoanLine(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLineData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Ligne ajoutée',
        description: 'La ligne a été ajoutée au prêt',
      })
    })

    it('should invalidate both loans list and specific loan cache', async () => {
      const mockLineData = { loanId: 'loan-1', data: { assetItemId: 'asset-1' } }
      const mockUpdatedLoan = { id: 'loan-1', lines: [{ id: 'line-1' }] }

      vi.mocked(loansApi.addLoanLineApi).mockResolvedValue(mockUpdatedLoan)

      // Pre-populate caches
      queryClient.setQueryData(['loans'], [{ id: 'loan-1' }])
      queryClient.setQueryData(['loans', 'loan-1'], { id: 'loan-1', lines: [] })

      const { result } = renderHook(() => useAddLoanLine(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLineData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(queryClient.getQueryState(['loans'])?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(['loans', 'loan-1'])?.isInvalidated).toBe(true)
    })

    it('should show error toast on failure', async () => {
      const mockLineData = { loanId: 'loan-1', data: { assetItemId: 'asset-1' } }
      const mockError = {
        response: {
          data: {
            error: 'Asset already borrowed',
          },
        },
      }

      vi.mocked(loansApi.addLoanLineApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useAddLoanLine(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLineData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Asset already borrowed',
      })
    })
  })

  describe('useDeleteLoan', () => {
    it('should delete loan successfully', async () => {
      const mockLoanId = 'loan-1'

      vi.mocked(loansApi.deleteLoanApi).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useDeleteLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(loansApi.deleteLoanApi).toHaveBeenCalledWith('loan-1')
    })

    it('should show success toast on deletion', async () => {
      const mockLoanId = 'loan-1'

      vi.mocked(loansApi.deleteLoanApi).mockResolvedValue({ success: true })

      const { result } = renderHook(() => useDeleteLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Prêt supprimé',
        description: 'Le prêt a été supprimé avec succès',
      })
    })

    it('should show error toast on failure', async () => {
      const mockLoanId = 'loan-1'
      const mockError = {
        response: {
          data: {
            error: 'Cannot delete closed loan',
          },
        },
      }

      vi.mocked(loansApi.deleteLoanApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useDeleteLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanId)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Cannot delete closed loan',
      })
    })

    it('should invalidate loans cache on successful deletion', async () => {
      const mockLoanId = 'loan-1'

      vi.mocked(loansApi.deleteLoanApi).mockResolvedValue({ success: true })

      // Pre-populate cache
      queryClient.setQueryData(['loans'], [{ id: 'loan-1' }, { id: 'loan-2' }])

      const { result } = renderHook(() => useDeleteLoan(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockLoanId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(queryClient.getQueryState(['loans'])?.isInvalidated).toBe(true)
    })
  })
})
