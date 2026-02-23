/**
 * @fileoverview Unit tests for EmployeesListPage
 *
 * Tests:
 * - Page rendering with employees list
 * - Loading and error states
 * - Search functionality
 * - Bulk delete operations
 * - Export functionality
 * - Import dialog
 * - Pagination
 * - Dialog interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { EmployeesListPage } from '@/pages/EmployeesListPage'
import * as useEmployeesHook from '@/lib/hooks/useEmployees'
import * as exportApi from '@/lib/api/export.api'
import { ReactNode } from 'react'

// Mock hooks
vi.mock('@/lib/hooks/useEmployees')
vi.mock('@/lib/api/export.api')

// Mock toast
const mockToast = vi.fn()
vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock components
vi.mock('@/components/employees/EmployeesTable', () => ({
  EmployeesTable: ({ employees, selectedEmployees, onSelectionChange }: any) => (
    <div data-testid="employees-table">
      {employees?.map((employee: any) => (
        <div key={employee.id} data-testid={`employee-${employee.id}`}>
          {employee.firstName} {employee.lastName}
        </div>
      ))}
      <button
        onClick={() => onSelectionChange(['emp-1'])}
        data-testid="select-employee"
      >
        Select Employee
      </button>
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
vi.mock('@/components/employees/EmployeeFormDialog', () => ({
  EmployeeFormDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="employee-form-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/employees/ImportEmployeesDialog', () => ({
  ImportEmployeesDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="import-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
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

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))

// Helper to create wrapper
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

const mockEmployees = [
  {
    id: 'emp-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    dept: 'IT',
  },
  {
    id: 'emp-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    dept: 'HR',
  },
  {
    id: 'emp-3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    dept: 'IT',
  },
]

describe('EmployeesListPage', () => {
  let queryClient: QueryClient
  let mockDeleteEmployee: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    mockDeleteEmployee = vi.fn().mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    })
    vi.clearAllMocks()
    // Reset window.confirm mock
    global.confirm = vi.fn()
  })

  describe('Rendering - Success state', () => {
    it('should render page title and description', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Employés')).toBeDefined()
      expect(screen.getByText('Gérez les employés qui peuvent emprunter du matériel')).toBeDefined()
    })

    it('should render employees table with data', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('employees-table')).toBeDefined()
      expect(screen.getByTestId('employee-emp-1')).toBeDefined()
      expect(screen.getByText('John Doe')).toBeDefined()
      expect(screen.getByText('Jane Smith')).toBeDefined()
    })

    it('should render search input', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeDefined()
      expect(searchInput.getAttribute('placeholder')).toBe(
        'Rechercher par nom, email ou département...'
      )
    })

    it('should render all action buttons', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Exporter Excel')).toBeDefined()
      expect(screen.getByText('Importer Excel')).toBeDefined()
      expect(screen.getByText('Nouvel employé')).toBeDefined()
    })

    it('should render pagination when there are employees', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('pagination')).toBeDefined()
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner when data is loading', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Chargement...')).toBeDefined()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeDefined()
    })

    it('should not show employees table during loading', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('employees-table')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Erreur lors du chargement des employés')).toBeDefined()
    })

    it('should not show employees table in error state', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('employees-table')).toBeNull()
    })
  })

  describe('Search functionality', () => {
    it('should filter employees by first name', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Jane')

      await waitFor(() => {
        expect(screen.getByTestId('employee-emp-2')).toBeDefined()
        expect(screen.queryByTestId('employee-emp-1')).toBeNull()
      })
    })

    it('should filter employees by last name', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Johnson')

      await waitFor(() => {
        expect(screen.getByTestId('employee-emp-3')).toBeDefined()
        expect(screen.queryByTestId('employee-emp-1')).toBeNull()
      })
    })

    it('should filter employees by email', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'john@')

      await waitFor(() => {
        expect(screen.getByTestId('employee-emp-1')).toBeDefined()
        expect(screen.queryByTestId('employee-emp-2')).toBeNull()
      })
    })

    it('should filter employees by department', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'HR')

      await waitFor(() => {
        expect(screen.getByTestId('employee-emp-2')).toBeDefined()
        expect(screen.queryByTestId('employee-emp-1')).toBeNull()
        expect(screen.queryByTestId('employee-emp-3')).toBeNull()
      })
    })
  })

  describe('Bulk delete functionality', () => {
    it('should show delete button when employees are selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })
    })

    it('should show alert when employees are selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeDefined()
        // The number is wrapped in <strong> tag, just match the text part
        expect(screen.getByText('employé(s) sélectionné(s)')).toBeDefined()
      })
    })

    it('should call delete API when bulk delete is confirmed', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled()
        expect(mockMutateAsync).toHaveBeenCalledWith('emp-1')
      })
    })

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(false)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled()
        expect(mockMutateAsync).not.toHaveBeenCalled()
      })
    })

    it('should show success toast after deletion', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Suppression réussie',
          })
        )
      })
    })

    it('should show error toast when deletion fails', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi
        .fn()
        .mockRejectedValue({ response: { data: { error: 'Cannot delete employee' } } })
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-employee')
      await user.click(selectButton)

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: 'Erreur de suppression',
          })
        )
      })
    })
  })

  describe('Export functionality', () => {
    it('should call export API when export button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )
      vi.mocked(exportApi.exportEmployees).mockResolvedValue(undefined)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Excel')
      await user.click(exportButton)

      await waitFor(() => {
        expect(exportApi.exportEmployees).toHaveBeenCalled()
      })
    })

    it('should disable export button when there are no employees', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Excel')
      expect(exportButton).toHaveProperty('disabled', true)
    })

    it('should show loading text during export', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )
      vi.mocked(exportApi.exportEmployees).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Excel')
      await user.click(exportButton)

      expect(screen.getByText('Export...')).toBeDefined()
    })

    it('should show success toast after export', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )
      vi.mocked(exportApi.exportEmployees).mockResolvedValue(undefined)

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Excel')
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Export réussi',
          })
        )
      })
    })

    it('should show error toast when export fails', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )
      vi.mocked(exportApi.exportEmployees).mockRejectedValue(
        new Error('Export failed')
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const exportButton = screen.getByText('Exporter Excel')
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: "Erreur d'export",
          })
        )
      })
    })
  })

  describe('Dialog interactions', () => {
    it('should open employee form dialog when "Nouvel employé" is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const createButton = screen.getByText('Nouvel employé')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('employee-form-dialog')).toBeDefined()
      })
    })

    it('should open import dialog when "Importer Excel" is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: mockEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      const importButton = screen.getByText('Importer Excel')
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByTestId('import-dialog')).toBeDefined()
      })
    })
  })

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup()
      // Create enough employees to require pagination
      const manyEmployees = Array.from({ length: 25 }, (_, i) => ({
        id: `emp-${i}`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: `emp${i}@example.com`,
        dept: 'IT',
      }))

      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: manyEmployees,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

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
    it('should handle empty employees array', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('employees-table')).toBeDefined()
      expect(screen.queryByTestId('pagination')).toBeNull()
    })

    it('should handle non-array employees data', () => {
      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: null as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('employees-table')).toBeDefined()
    })

    it('should handle missing optional employee fields', () => {
      const employeesWithMissingFields = [
        {
          id: 'emp-1',
          firstName: 'John',
          lastName: 'Doe',
          email: null,
          dept: null,
        },
      ]

      vi.mocked(useEmployeesHook.useEmployees).mockReturnValue({
        data: employeesWithMissingFields as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useEmployeesHook.useDeleteEmployee).mockReturnValue(
        mockDeleteEmployee() as any
      )

      render(<EmployeesListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('employees-table')).toBeDefined()
    })
  })
})
