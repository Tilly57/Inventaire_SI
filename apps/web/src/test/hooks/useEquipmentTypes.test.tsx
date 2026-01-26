/**
 * @fileoverview Unit tests for useEquipmentTypes hooks
 *
 * Tests:
 * - useEquipmentTypes (fetch all equipment types)
 * - useEquipmentType (fetch single equipment type)
 * - useCreateEquipmentType (create mutation)
 * - useUpdateEquipmentType (update mutation)
 * - useDeleteEquipmentType (delete mutation)
 * - Toast notifications
 * - Cache invalidation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useEquipmentTypes,
  useEquipmentType,
  useCreateEquipmentType,
  useUpdateEquipmentType,
  useDeleteEquipmentType,
  equipmentTypesKeys,
} from '@/lib/hooks/useEquipmentTypes'
import * as equipmentTypesApi from '@/lib/api/equipmentTypes.api'
import { toast } from 'sonner'
import { ReactNode } from 'react'

// Mock the API
vi.mock('@/lib/api/equipmentTypes.api')

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Helper to create wrapper with QueryClient
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useEquipmentTypes hooks', () => {
  let queryClient: QueryClient

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
    vi.clearAllMocks()
  })

  describe('equipmentTypesKeys', () => {
    it('should generate correct query keys', () => {
      expect(equipmentTypesKeys.all).toEqual(['equipmentTypes'])
      expect(equipmentTypesKeys.lists()).toEqual(['equipmentTypes', 'list'])
      expect(equipmentTypesKeys.list()).toEqual(['equipmentTypes', 'list'])
      expect(equipmentTypesKeys.details()).toEqual(['equipmentTypes', 'detail'])
      expect(equipmentTypesKeys.detail('type-1')).toEqual(['equipmentTypes', 'detail', 'type-1'])
    })
  })

  describe('useEquipmentTypes', () => {
    it('should fetch all equipment types successfully', async () => {
      const mockTypes = [
        { id: 'type-1', name: 'Laptop', description: 'Portable computers' },
        { id: 'type-2', name: 'Monitor', description: 'Display screens' },
      ]

      vi.mocked(equipmentTypesApi.getAllEquipmentTypesApi).mockResolvedValue(mockTypes as any)

      const { result } = renderHook(() => useEquipmentTypes(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockTypes)
      expect(equipmentTypesApi.getAllEquipmentTypesApi).toHaveBeenCalledOnce()
    })

    it('should handle empty equipment types list', async () => {
      vi.mocked(equipmentTypesApi.getAllEquipmentTypesApi).mockResolvedValue([])

      const { result } = renderHook(() => useEquipmentTypes(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error')
      vi.mocked(equipmentTypesApi.getAllEquipmentTypesApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useEquipmentTypes(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should show loading state initially', () => {
      vi.mocked(equipmentTypesApi.getAllEquipmentTypesApi).mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useEquipmentTypes(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should cache data with correct query key', async () => {
      const mockTypes = [{ id: 'type-1', name: 'Laptop' }]
      vi.mocked(equipmentTypesApi.getAllEquipmentTypesApi).mockResolvedValue(mockTypes as any)

      const { result } = renderHook(() => useEquipmentTypes(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(equipmentTypesKeys.list())
      expect(cachedData).toEqual(mockTypes)
    })
  })

  describe('useEquipmentType', () => {
    it('should fetch single equipment type successfully', async () => {
      const mockType = {
        id: 'type-1',
        name: 'Laptop',
        description: 'Portable computers',
        createdAt: new Date(),
      }

      vi.mocked(equipmentTypesApi.getEquipmentTypeByIdApi).mockResolvedValue(mockType as any)

      const { result } = renderHook(() => useEquipmentType('type-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockType)
      expect(equipmentTypesApi.getEquipmentTypeByIdApi).toHaveBeenCalledWith('type-1')
    })

    it('should not fetch when id is empty', () => {
      vi.clearAllMocks()

      const { result } = renderHook(() => useEquipmentType(''), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isFetching).toBe(false)
      expect(result.current.fetchStatus).toBe('idle')
    })

    it('should handle fetch error', async () => {
      const mockError = new Error('Type not found')
      vi.mocked(equipmentTypesApi.getEquipmentTypeByIdApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useEquipmentType('type-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(mockError)
    })

    it('should cache data with correct query key', async () => {
      const mockType = { id: 'type-1', name: 'Laptop' }
      vi.mocked(equipmentTypesApi.getEquipmentTypeByIdApi).mockResolvedValue(mockType as any)

      const { result } = renderHook(() => useEquipmentType('type-1'), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const cachedData = queryClient.getQueryData(equipmentTypesKeys.detail('type-1'))
      expect(cachedData).toEqual(mockType)
    })

    it('should be enabled by default with valid id', () => {
      vi.mocked(equipmentTypesApi.getEquipmentTypeByIdApi).mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useEquipmentType('type-1'), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.isFetching).toBe(true)
    })
  })

  describe('useCreateEquipmentType', () => {
    it('should create equipment type successfully', async () => {
      const mockTypeData = { name: 'Keyboard', description: 'Input devices' }
      const mockCreatedType = { id: 'type-new', ...mockTypeData }

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockResolvedValue(mockCreatedType as any)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.createEquipmentTypeApi).toHaveBeenCalledWith(mockTypeData)
      expect(result.current.data).toEqual(mockCreatedType)
    })

    it('should show success toast on creation', async () => {
      const mockTypeData = { name: 'Keyboard' }
      const mockCreatedType = { id: 'type-new', ...mockTypeData }

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockResolvedValue(mockCreatedType as any)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).toHaveBeenCalledWith("Type d'équipement créé avec succès")
    })

    it('should show error toast on failure with API message', async () => {
      const mockTypeData = { name: 'Keyboard' }
      const mockError = {
        response: {
          data: {
            error: 'Type name already exists',
          },
        },
      }

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Type name already exists')
    })

    it('should show default error toast on failure without API message', async () => {
      const mockTypeData = { name: 'Keyboard' }
      const mockError = new Error('Network error')

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la création du type')
    })

    it('should call create API correctly', async () => {
      const mockTypeData = { name: 'Keyboard', description: 'Test' }
      const mockCreatedType = { id: 'type-new', ...mockTypeData }

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockResolvedValue(mockCreatedType as any)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.createEquipmentTypeApi).toHaveBeenCalledWith(mockTypeData)
      expect(result.current.data).toEqual(mockCreatedType)
    })

    it('should handle creation with description field', async () => {
      const mockTypeData = { name: 'Keyboard', description: 'Input devices for typing' }
      const mockCreatedType = { id: 'type-new', ...mockTypeData }

      vi.mocked(equipmentTypesApi.createEquipmentTypeApi).mockResolvedValue(mockCreatedType as any)

      const { result } = renderHook(() => useCreateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.description).toBe('Input devices for typing')
    })
  })

  describe('useUpdateEquipmentType', () => {
    it('should update equipment type successfully', async () => {
      const mockUpdateData = { id: 'type-1', data: { name: 'Updated Laptop' } }
      const mockUpdatedType = { id: 'type-1', name: 'Updated Laptop' }

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockResolvedValue(mockUpdatedType as any)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.updateEquipmentTypeApi).toHaveBeenCalledWith('type-1', { name: 'Updated Laptop' })
      expect(result.current.data).toEqual(mockUpdatedType)
    })

    it('should show success toast on update', async () => {
      const mockUpdateData = { id: 'type-1', data: { name: 'Updated Laptop' } }
      const mockUpdatedType = { id: 'type-1', name: 'Updated Laptop' }

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockResolvedValue(mockUpdatedType as any)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).toHaveBeenCalledWith("Type d'équipement modifié avec succès")
    })

    it('should show error toast on failure with API message', async () => {
      const mockUpdateData = { id: 'type-1', data: { name: 'Updated Laptop' } }
      const mockError = {
        response: {
          data: {
            error: 'Type is in use and cannot be modified',
          },
        },
      }

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Type is in use and cannot be modified')
    })

    it('should show default error toast on failure without API message', async () => {
      const mockUpdateData = { id: 'type-1', data: { name: 'Updated Laptop' } }
      const mockError = new Error('Network error')

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la modification du type')
    })

    it('should call update API correctly', async () => {
      const mockUpdateData = { id: 'type-1', data: { name: 'Updated Laptop' } }
      const mockUpdatedType = { id: 'type-1', name: 'Updated Laptop' }

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockResolvedValue(mockUpdatedType as any)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.updateEquipmentTypeApi).toHaveBeenCalledWith('type-1', { name: 'Updated Laptop' })
      expect(result.current.data).toEqual(mockUpdatedType)
    })

    it('should handle partial updates', async () => {
      const mockUpdateData = { id: 'type-1', data: { description: 'New description only' } }
      const mockUpdatedType = { id: 'type-1', name: 'Laptop', description: 'New description only' }

      vi.mocked(equipmentTypesApi.updateEquipmentTypeApi).mockResolvedValue(mockUpdatedType as any)

      const { result } = renderHook(() => useUpdateEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockUpdateData)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.updateEquipmentTypeApi).toHaveBeenCalledWith('type-1', { description: 'New description only' })
    })
  })

  describe('useDeleteEquipmentType', () => {
    it('should delete equipment type successfully', async () => {
      const mockTypeId = 'type-1'

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.deleteEquipmentTypeApi).toHaveBeenCalledWith('type-1')
    })

    it('should show success toast on deletion', async () => {
      const mockTypeId = 'type-1'

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(toast.success).toHaveBeenCalledWith("Type d'équipement supprimé avec succès")
    })

    it('should show error toast on failure with API message', async () => {
      const mockTypeId = 'type-1'
      const mockError = {
        response: {
          data: {
            error: 'Cannot delete type that is in use',
          },
        },
      }

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Cannot delete type that is in use')
    })

    it('should show default error toast on failure without API message', async () => {
      const mockTypeId = 'type-1'
      const mockError = new Error('Network error')

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la suppression du type')
    })

    it('should call delete API correctly', async () => {
      const mockTypeId = 'type-1'

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(equipmentTypesApi.deleteEquipmentTypeApi).toHaveBeenCalledWith('type-1')
    })

    it('should handle deletion of non-existent type gracefully', async () => {
      const mockTypeId = 'non-existent'
      const mockError = {
        response: {
          data: {
            error: 'Type not found',
          },
        },
      }

      vi.mocked(equipmentTypesApi.deleteEquipmentTypeApi).mockRejectedValue(mockError)

      const { result } = renderHook(() => useDeleteEquipmentType(), {
        wrapper: createWrapper(queryClient),
      })

      result.current.mutate(mockTypeId)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(toast.error).toHaveBeenCalledWith('Type not found')
    })
  })
})
