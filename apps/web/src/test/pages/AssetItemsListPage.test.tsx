/**
 * @fileoverview Unit tests for AssetItemsListPage
 *
 * Tests:
 * - Page rendering with asset items list
 * - Loading and error states
 * - Search functionality
 * - Status and model filtering
 * - Bulk delete operations
 * - Pagination
 * - Dialog interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AssetItemsListPage } from '@/pages/AssetItemsListPage'
import * as useAssetItemsHook from '@/lib/hooks/useAssetItems'
import * as useAssetModelsHook from '@/lib/hooks/useAssetModels'
import { AssetStatus } from '@/lib/types/enums'
import { ReactNode } from 'react'

// Mock hooks
vi.mock('@/lib/hooks/useAssetItems')
vi.mock('@/lib/hooks/useAssetModels')

// Mock toast
const mockToast = vi.fn()
vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock components
vi.mock('@/components/assets/AssetItemsTable', () => ({
  AssetItemsTable: ({ items, selectedItems, onSelectionChange }: any) => (
    <div data-testid="asset-items-table">
      {items?.map((item: any) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.assetTag} - {item.assetModel?.brand}
        </div>
      ))}
      <button
        onClick={() => onSelectionChange(['item-1'])}
        data-testid="select-item"
      >
        Select Item
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

// Mock lazy loaded dialog
vi.mock('@/components/assets/AssetItemFormDialog', () => ({
  AssetItemFormDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="asset-item-form-dialog">
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="select"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, className }: any) => <div className={className}>{children}</div>,
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

const mockAssetModels = [
  { id: 'model-1', brand: 'Dell', modelName: 'Latitude 5420', type: 'Ordinateur Portable' },
  { id: 'model-2', brand: 'HP', modelName: 'ProBook 450', type: 'Ordinateur Portable' },
]

const mockAssetItems = [
  {
    id: 'item-1',
    assetTag: 'LAPTOP-001',
    serial: 'SN123456',
    status: AssetStatus.EN_STOCK,
    assetModelId: 'model-1',
    assetModel: mockAssetModels[0],
  },
  {
    id: 'item-2',
    assetTag: 'LAPTOP-002',
    serial: 'SN789012',
    status: AssetStatus.PRETE,
    assetModelId: 'model-2',
    assetModel: mockAssetModels[1],
  },
  {
    id: 'item-3',
    assetTag: 'LAPTOP-003',
    serial: 'SN345678',
    status: AssetStatus.HS,
    assetModelId: 'model-1',
    assetModel: mockAssetModels[0],
  },
]

describe('AssetItemsListPage', () => {
  let queryClient: QueryClient
  let mockDeleteItem: ReturnType<typeof vi.fn>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    mockDeleteItem = vi.fn().mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    })
    vi.clearAllMocks()
    global.confirm = vi.fn()
  })

  describe('Rendering - Success state', () => {
    it('should render page title and description', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Équipements')).toBeDefined()
      expect(
        screen.getByText('Gestion du parc informatique et des équipements individuels')
      ).toBeDefined()
    })

    it('should render asset items table with data', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-items-table')).toBeDefined()
      expect(screen.getByTestId('item-item-1')).toBeDefined()
      expect(screen.getByText(/LAPTOP-001/)).toBeDefined()
      // Use getAllByText since "Dell" appears multiple times (in table and dropdown)
      expect(screen.getAllByText(/Dell/)[0]).toBeDefined()
    })

    it('should render search input', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeDefined()
      expect(searchInput.getAttribute('placeholder')).toBe(
        'Rechercher par tag, série, modèle...'
      )
    })

    it('should render status and model filters', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      // Both selects exist - check we have 2 select elements
      const selects = screen.getAllByTestId('select')
      expect(selects.length).toBe(2)
      // First is status filter, second is model filter
      expect(selects[0]).toBeDefined()
      expect(selects[1]).toBeDefined()
    })

    it('should render pagination when there are items', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('pagination')).toBeDefined()
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner when data is loading', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Chargement...')).toBeDefined()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeDefined()
    })

    it('should not show items table during loading', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('asset-items-table')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Erreur lors du chargement des équipements')).toBeDefined()
    })

    it('should not show items table in error state', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('asset-items-table')).toBeNull()
    })
  })

  describe('Search functionality', () => {
    it('should filter items by asset tag', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, '002')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })

    it('should filter items by serial number', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'SN789')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })

    it('should filter items by brand', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'HP')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })

    it('should filter items by model name', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'ProBook')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })
  })

  describe('Status filtering', () => {
    it('should filter items by EN_STOCK status', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      // Get all selects - first one is status filter
      const allSelects = screen.getAllByTestId('select')
      const statusSelect = allSelects[0]
      await user.selectOptions(statusSelect, AssetStatus.EN_STOCK)

      await waitFor(() => {
        expect(screen.getByTestId('item-item-1')).toBeDefined()
        expect(screen.queryByTestId('item-item-2')).toBeNull()
        expect(screen.queryByTestId('item-item-3')).toBeNull()
      })
    })

    it('should filter items by PRETE status', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const statusSelect = screen.getAllByTestId('select')[0]
      await user.selectOptions(statusSelect, AssetStatus.PRETE)

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })

    it('should filter items by HS status', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const statusSelect = screen.getAllByTestId('select')[0]
      await user.selectOptions(statusSelect, AssetStatus.HS)

      await waitFor(() => {
        expect(screen.getByTestId('item-item-3')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
      })
    })
  })

  describe('Model filtering', () => {
    it('should filter items by model', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      // Get all selects - second one is model filter
      const modelSelect = screen.getAllByTestId('select')[1]
      await user.selectOptions(modelSelect, 'model-2')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.queryByTestId('item-item-1')).toBeNull()
        expect(screen.queryByTestId('item-item-3')).toBeNull()
      })
    })

    it('should show all items when "all" models is selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const modelSelect = screen.getAllByTestId('select')[1]
      await user.selectOptions(modelSelect, 'all')

      await waitFor(() => {
        expect(screen.getByTestId('item-item-1')).toBeDefined()
        expect(screen.getByTestId('item-item-2')).toBeDefined()
        expect(screen.getByTestId('item-item-3')).toBeDefined()
      })
    })
  })

  describe('Bulk delete functionality', () => {
    it('should show delete button when items are selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })
    })

    it('should show alert when items are selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeDefined()
        // The actual text is "1 équipement(s) sélectionné(s)" with the number wrapped in <strong>
        expect(screen.getByText('équipement(s) sélectionné(s)')).toBeDefined()
      })
    })

    it('should call delete API when bulk delete is confirmed', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled()
        expect(mockMutateAsync).toHaveBeenCalledWith('item-1')
      })
    })

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup()
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(false)

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
      await user.click(selectButton)

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
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
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
        .mockRejectedValue({ response: { data: { error: 'Cannot delete item' } } })
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: mockAssetItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any)
      vi.mocked(global.confirm).mockReturnValue(true)

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-item')
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

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup()
      // Create enough items to require pagination
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i}`,
        assetTag: `TAG-${String(i).padStart(3, '0')}`,
        serial: `SN${i}`,
        status: AssetStatus.EN_STOCK,
        assetModelId: 'model-1',
        assetModel: mockAssetModels[0],
      }))

      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: manyItems,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      // The text is split into separate elements by the mock, so use a more flexible query
      expect(screen.getByText(/Page 1/)).toBeDefined()

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeDefined()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty items array', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-items-table')).toBeDefined()
      expect(screen.queryByTestId('pagination')).toBeNull()
    })

    it('should handle non-array items data', () => {
      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: null as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-items-table')).toBeDefined()
    })

    it('should handle missing model data in items', () => {
      const itemsWithoutModel = [
        {
          id: 'item-1',
          assetTag: 'TAG-001',
          serial: 'SN123',
          status: AssetStatus.EN_STOCK,
          assetModelId: 'model-1',
          assetModel: null,
        },
      ]

      vi.mocked(useAssetItemsHook.useAssetItems).mockReturnValue({
        data: itemsWithoutModel as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
      } as any)
      vi.mocked(useAssetItemsHook.useDeleteAssetItem).mockReturnValue(
        mockDeleteItem() as any
      )

      render(<AssetItemsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-items-table')).toBeDefined()
    })
  })
})
