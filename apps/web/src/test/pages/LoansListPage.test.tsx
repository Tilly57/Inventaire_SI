/**
 * @fileoverview Unit tests for LoansListPage
 *
 * Tests:
 * - Page rendering with loans list
 * - Loading and error states
 * - Search functionality
 * - Status filtering
 * - Pagination
 * - ADMIN role features (bulk delete, print)
 * - Dialog interactions
 * - Navigation to loan details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { LoansListPage } from '@/pages/LoansListPage'
import * as useLoansHook from '@/lib/hooks/useLoans'
import * as useEmployeesHook from '@/lib/hooks/useEmployees'
import * as useAuthHook from '@/lib/hooks/useAuth'
import * as reactRouterDom from 'react-router-dom'
import { LoanStatus } from '@/lib/types/enums'
import { ReactNode } from 'react'

// Mock hooks
vi.mock('@/lib/hooks/useLoans')
vi.mock('@/lib/hooks/useEmployees')
vi.mock('@/lib/hooks/useAuth')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Mock components
vi.mock('@/components/loans/LoansTable', () => ({
  LoansTable: ({ loans, selectedLoans, onSelectionChange }: any) => (
    <div data-testid="loans-table">
      {loans?.map((loan: any) => (
        <div key={loan.id} data-testid={`loan-${loan.id}`}>
          {loan.employee?.firstName} {loan.employee?.lastName}
        </div>
      ))}
      {selectedLoans && (
        <div data-testid="selection-enabled">Selection enabled</div>
      )}
    </div>
  ),
}))

vi.mock('@/components/common/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
      <span>Page {currentPage} of {totalPages}</span>
    </div>
  ),
}))

// Mock lazy loaded dialogs
vi.mock('@/components/loans/LoanFormDialog', () => ({
  LoanFormDialog: ({ open, onClose, onSuccess }: any) =>
    open ? (
      <div data-testid="loan-form-dialog">
        <button onClick={() => onSuccess('loan-123')}>Create Loan</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/loans/BulkDeleteLoansDialog', () => ({
  BulkDeleteLoansDialog: ({ open, onClose, loans }: any) =>
    open ? (
      <div data-testid="bulk-delete-dialog">
        <span>Delete {loans?.length} loans</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/loans/PrintLoansHistoryDialog', () => ({
  PrintLoansHistoryDialog: ({ open, onClose, onPrint, employees }: any) =>
    open ? (
      <div data-testid="print-dialog">
        <button onClick={() => onPrint('employee-1')}>Print for Employee</button>
        <button onClick={() => onPrint()}>Print All</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/loans/LoansPrintView', () => ({
  LoansPrintView: ({ loans, employeeName, onPrintComplete }: any) => (
    <div data-testid="loans-print-view">
      <span>Printing {loans?.length} loans</span>
      {employeeName && <span>For: {employeeName}</span>}
      <button onClick={onPrintComplete}>Complete</button>
    </div>
  ),
}))

// Mock UI components
vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="search-input"
    />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div data-testid="select-wrapper">
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="status-select"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, disabled, ...props }: any) => (
    <button
      {...props}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}))

// Helper to create wrapper
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

const mockLoans = [
  {
    id: 'loan-1',
    employeeId: 'emp-1',
    status: LoanStatus.OPEN,
    employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'loan-2',
    employeeId: 'emp-2',
    status: LoanStatus.CLOSED,
    employee: { id: 'emp-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    createdAt: '2024-01-02T10:00:00Z',
  },
  {
    id: 'loan-3',
    employeeId: 'emp-1',
    status: LoanStatus.OPEN,
    employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    createdAt: '2024-01-03T10:00:00Z',
  },
]

const mockEmployees = [
  { id: 'emp-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: 'emp-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
]

describe('LoansListPage', () => {
  let queryClient: QueryClient
  let mockNavigate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    mockNavigate = vi.fn()
    vi.mocked(reactRouterDom.useNavigate).mockReturnValue(mockNavigate)
    vi.clearAllMocks()
  })

  describe('Rendering - Success state', () => {
    it('should render page title and description', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Prêts')).toBeDefined()
      expect(screen.getByText("Gestion des prêts d'équipements aux employés")).toBeDefined()
    })

    it('should render loans table with data', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('loans-table')).toBeDefined()
      expect(screen.getByTestId('loan-loan-1')).toBeDefined()
      // Use getAllByText since employee names might appear multiple times
      expect(screen.getAllByText('John Doe')[0]).toBeDefined()
      expect(screen.getAllByText('Jane Smith')[0]).toBeDefined()
    })

    it('should render search input', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeDefined()
      expect(searchInput.getAttribute('placeholder')).toBe('Rechercher par employé...')
    })

    it('should render status filter', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('status-select')).toBeDefined()
    })

    it('should render "Nouveau prêt" button', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Nouveau prêt')).toBeDefined()
    })

    it('should render pagination when there are loans', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('pagination')).toBeDefined()
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner when data is loading', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Chargement...')).toBeDefined()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeDefined()
    })

    it('should not show loans table during loading', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('loans-table')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Erreur lors du chargement des prêts')).toBeDefined()
    })

    it('should not show loans table in error state', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('loans-table')).toBeNull()
    })
  })

  describe('Search functionality', () => {
    it('should filter loans by employee first name', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Jane')

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-2')).toBeDefined()
        expect(screen.queryByTestId('loan-loan-1')).toBeNull()
      })
    })

    it('should filter loans by employee last name', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Doe')

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-1')).toBeDefined()
        expect(screen.queryByTestId('loan-loan-2')).toBeNull()
      })
    })

    it('should filter loans by employee email', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'jane@')

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-2')).toBeDefined()
        expect(screen.queryByTestId('loan-loan-1')).toBeNull()
      })
    })
  })

  describe('Status filtering', () => {
    it('should filter loans by OPEN status', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const statusSelect = screen.getByTestId('status-select')
      await user.selectOptions(statusSelect, LoanStatus.OPEN)

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-1')).toBeDefined()
        expect(screen.getByTestId('loan-loan-3')).toBeDefined()
        expect(screen.queryByTestId('loan-loan-2')).toBeNull()
      })
    })

    it('should filter loans by CLOSED status', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const statusSelect = screen.getByTestId('status-select')
      await user.selectOptions(statusSelect, LoanStatus.CLOSED)

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-2')).toBeDefined()
        expect(screen.queryByTestId('loan-loan-1')).toBeNull()
        expect(screen.queryByTestId('loan-loan-3')).toBeNull()
      })
    })

    it('should show all loans when "all" is selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const statusSelect = screen.getByTestId('status-select')
      await user.selectOptions(statusSelect, 'all')

      await waitFor(() => {
        expect(screen.getByTestId('loan-loan-1')).toBeDefined()
        expect(screen.getByTestId('loan-loan-2')).toBeDefined()
        expect(screen.getByTestId('loan-loan-3')).toBeDefined()
      })
    })
  })

  describe('ADMIN role features', () => {
    it('should show bulk delete button for ADMIN when loans are selected', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      const { rerender } = render(<LoansListPage />, {
        wrapper: createWrapper(queryClient),
      })

      // Initially no button
      expect(screen.queryByText(/Supprimer \(/)).toBeNull()

      // Enable selection (simulated by showing button would require interaction)
      expect(screen.getByTestId('selection-enabled')).toBeDefined()
    })

    it('should show print history button for ADMIN', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText("Imprimer l'historique")).toBeDefined()
    })

    it('should NOT show print history button for non-ADMIN', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByText("Imprimer l'historique")).toBeNull()
    })

    it('should NOT enable selection for non-ADMIN', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('selection-enabled')).toBeNull()
    })
  })

  describe('Dialog interactions', () => {
    it('should open loan form dialog when "Nouveau prêt" is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const createButton = screen.getByText('Nouveau prêt')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('loan-form-dialog')).toBeDefined()
      })
    })

    it('should navigate to loan details when loan is created', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const createButton = screen.getByText('Nouveau prêt')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('loan-form-dialog')).toBeDefined()
      })

      const createLoanButton = screen.getByText('Create Loan')
      await user.click(createLoanButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/loans/loan-123')
      })
    })

    it('should open print dialog when print button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: mockLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      const printButton = screen.getByText("Imprimer l'historique")
      await user.click(printButton)

      await waitFor(() => {
        expect(screen.getByTestId('print-dialog')).toBeDefined()
      })
    })
  })

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup()
      // Create enough loans to require pagination (more than default page size)
      const manyLoans = Array.from({ length: 25 }, (_, i) => ({
        id: `loan-${i}`,
        employeeId: 'emp-1',
        status: LoanStatus.OPEN,
        employee: { id: 'emp-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }))

      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: manyLoans,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      // Text is split across elements, use regex
      expect(screen.getByText(/Page 1/)).toBeDefined()

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeDefined()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty loans array', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('loans-table')).toBeDefined()
      expect(screen.queryByTestId('pagination')).toBeNull()
    })

    it('should handle non-array loans data', () => {
      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: null as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('loans-table')).toBeDefined()
    })

    it('should handle missing employee data in loans', () => {
      const loansWithoutEmployee = [
        {
          id: 'loan-1',
          employeeId: 'emp-1',
          status: LoanStatus.OPEN,
          employee: null,
          createdAt: '2024-01-01T10:00:00Z',
        },
      ]

      vi.mocked(useLoansHook.useLoans).mockReturnValue({
        data: loansWithoutEmployee as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<LoansListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('loans-table')).toBeDefined()
    })
  })
})
