/**
 * @fileoverview Unit tests for AssetModelsListPage
 *
 * Tests:
 * - Page rendering with asset models list
 * - Loading and error states
 * - Search functionality
 * - ADMIN role features (bulk delete, equipment types tab)
 * - Tabs navigation
 * - Pagination
 * - Dialog interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AssetModelsListPage } from '@/pages/AssetModelsListPage'
import * as useAssetModelsHook from '@/lib/hooks/useAssetModels'
import * as useAuthHook from '@/lib/hooks/useAuth'
import { ReactNode } from 'react'

// Mock hooks
vi.mock('@/lib/hooks/useAssetModels')
vi.mock('@/lib/hooks/useAuth')

// Mock components
vi.mock('@/components/assets/AssetModelsTable', () => ({
  AssetModelsTable: ({ models, selectedModels, onSelectionChange }: any) => (
    <div data-testid="asset-models-table">
      {models?.map((model: any) => (
        <div key={model.id} data-testid={`model-${model.id}`}>
          {model.brand} {model.modelName}
        </div>
      ))}
      {selectedModels && (
        <button
          onClick={() => onSelectionChange(['model-1'])}
          data-testid="select-model"
        >
          Select Model
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/equipmentTypes/EquipmentTypesTable', () => ({
  EquipmentTypesTable: () => (
    <div data-testid="equipment-types-table">Equipment Types Table</div>
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
vi.mock('@/components/assets/AssetModelFormDialog', () => ({
  AssetModelFormDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="asset-model-form-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/assets/BulkDeleteAssetModelsDialog', () => ({
  BulkDeleteAssetModelsDialog: ({ open, onClose, models }: any) =>
    open ? (
      <div data-testid="bulk-delete-dialog">
        <span>Delete {models?.length} models</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}))

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

const mockAssetModels = [
  {
    id: 'model-1',
    brand: 'Dell',
    modelName: 'Latitude 5420',
    type: 'Ordinateur Portable',
  },
  {
    id: 'model-2',
    brand: 'HP',
    modelName: 'ProBook 450',
    type: 'Ordinateur Portable',
  },
  {
    id: 'model-3',
    brand: 'Lenovo',
    modelName: 'ThinkPad T14',
    type: 'Ordinateur Portable',
  },
]

describe('AssetModelsListPage', () => {
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
    it('should render page title and description', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText("Modèles d'équipements")).toBeDefined()
      expect(screen.getByText("Gérez les modèles d'équipements disponibles")).toBeDefined()
    })

    it('should render asset models table with data', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-models-table')).toBeDefined()
      expect(screen.getByTestId('model-model-1')).toBeDefined()
      expect(screen.getByText('Dell Latitude 5420')).toBeDefined()
      expect(screen.getByText('HP ProBook 450')).toBeDefined()
    })

    it('should render search input', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeDefined()
      expect(searchInput.getAttribute('placeholder')).toBe(
        'Rechercher par marque, modèle ou type...'
      )
    })

    it('should render "Nouveau modèle" button', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Nouveau modèle')).toBeDefined()
    })

    it('should render tabs with models tab active by default', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('tabs')).toBeDefined()
      expect(screen.getByTestId('tab-trigger-models')).toBeDefined()
      expect(screen.getByTestId('tab-content-models')).toBeDefined()
    })

    it('should render pagination when there are models', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('pagination')).toBeDefined()
    })
  })

  describe('Loading state', () => {
    it('should show loading spinner when data is loading', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Chargement...')).toBeDefined()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeDefined()
    })

    it('should not show models table during loading', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('asset-models-table')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should show error message when fetch fails', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByText('Erreur lors du chargement des modèles')).toBeDefined()
    })

    it('should not show models table in error state', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('asset-models-table')).toBeNull()
    })
  })

  describe('Search functionality', () => {
    it('should filter models by brand', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'HP')

      await waitFor(() => {
        expect(screen.getByTestId('model-model-2')).toBeDefined()
        expect(screen.queryByTestId('model-model-1')).toBeNull()
      })
    })

    it('should filter models by model name', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'ThinkPad')

      await waitFor(() => {
        expect(screen.getByTestId('model-model-3')).toBeDefined()
        expect(screen.queryByTestId('model-model-1')).toBeNull()
        expect(screen.queryByTestId('model-model-2')).toBeNull()
      })
    })

    it('should filter models by type', async () => {
      const user = userEvent.setup()
      const modelsWithDifferentTypes = [
        ...mockAssetModels,
        {
          id: 'model-4',
          brand: 'Samsung',
          modelName: 'Monitor 27"',
          type: 'Écran',
        },
      ]

      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: modelsWithDifferentTypes,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Écran')

      await waitFor(() => {
        expect(screen.getByTestId('model-model-4')).toBeDefined()
        expect(screen.queryByTestId('model-model-1')).toBeNull()
      })
    })

    it('should be case-insensitive', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'dell')

      await waitFor(() => {
        expect(screen.getByTestId('model-model-1')).toBeDefined()
        expect(screen.queryByTestId('model-model-2')).toBeNull()
      })
    })
  })

  describe('ADMIN role features', () => {
    it('should show bulk delete button for ADMIN when models are selected', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-model')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })
    })

    it('should show alert when models are selected for ADMIN', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-model')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeDefined()
        // The actual text is "1 modèle sélectionné" with number wrapped in <strong>
        expect(screen.getByText(/modèle sélectionné/)).toBeDefined()
      })
    })

    it('should show equipment types tab for ADMIN', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('tab-trigger-types')).toBeDefined()
      expect(screen.getByTestId('tab-content-types')).toBeDefined()
    })

    it('should NOT show equipment types tab for non-ADMIN', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('tab-trigger-types')).toBeNull()
    })

    it('should NOT enable selection for non-ADMIN', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.queryByTestId('select-model')).toBeNull()
    })

    it('should open bulk delete dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'ADMIN', username: 'admin' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const selectButton = screen.getByTestId('select-model')
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/Supprimer \(1\)/)).toBeDefined()
      })

      const deleteButton = screen.getByText(/Supprimer \(1\)/)
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId('bulk-delete-dialog')).toBeDefined()
      })
    })
  })

  describe('Dialog interactions', () => {
    it('should open model form dialog when "Nouveau modèle" is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const createButton = screen.getByText('Nouveau modèle')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('asset-model-form-dialog')).toBeDefined()
      })
    })

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: mockAssetModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      const createButton = screen.getByText('Nouveau modèle')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('asset-model-form-dialog')).toBeDefined()
      })

      const closeButton = screen.getByText('Close')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('asset-model-form-dialog')).toBeNull()
      })
    })
  })

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup()
      // Create enough models to require pagination
      const manyModels = Array.from({ length: 25 }, (_, i) => ({
        id: `model-${i}`,
        brand: `Brand${i}`,
        modelName: `Model${i}`,
        type: 'Ordinateur Portable',
      }))

      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: manyModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      // Text is split across elements, use regex
      expect(screen.getByText(/Page 1/)).toBeDefined()

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeDefined()
      })
    })

    it('should reset to page 1 when search changes', async () => {
      const user = userEvent.setup()
      const manyModels = Array.from({ length: 25 }, (_, i) => ({
        id: `model-${i}`,
        brand: `Brand${i}`,
        modelName: `Model${i}`,
        type: 'Ordinateur Portable',
      }))

      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: manyModels,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      // Go to page 2
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Page 2/)).toBeDefined()
      })

      // Search should reset to page 1
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'Brand1')

      await waitFor(() => {
        expect(screen.getByText(/Page 1/)).toBeDefined()
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty models array', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-models-table')).toBeDefined()
      expect(screen.queryByTestId('pagination')).toBeNull()
    })

    it('should handle non-array models data', () => {
      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: null as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-models-table')).toBeDefined()
    })

    it('should handle missing optional model fields', () => {
      const modelsWithMissingFields = [
        {
          id: 'model-1',
          brand: null,
          modelName: 'Model 1',
          type: null,
        },
      ]

      vi.mocked(useAssetModelsHook.useAssetModels).mockReturnValue({
        data: modelsWithMissingFields as any,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        user: { id: '1', role: 'GESTIONNAIRE', username: 'user' },
      } as any)

      render(<AssetModelsListPage />, { wrapper: createWrapper(queryClient) })

      expect(screen.getByTestId('asset-models-table')).toBeDefined()
    })
  })
})
