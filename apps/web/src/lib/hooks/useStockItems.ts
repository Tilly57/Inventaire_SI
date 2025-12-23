import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllStockItemsApi,
  getStockItemApi,
  createStockItemApi,
  updateStockItemApi,
  deleteStockItemApi,
} from '@/lib/api/stockItems.api'
import type {
  CreateStockItemDto,
  UpdateStockItemDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

export function useStockItems() {
  return useQuery({
    queryKey: ['stockItems'],
    queryFn: getAllStockItemsApi,
  })
}

export function useStockItem(id: string) {
  return useQuery({
    queryKey: ['stockItems', id],
    queryFn: () => getStockItemApi(id),
    enabled: !!id,
  })
}

export function useCreateStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateStockItemDto) => createStockItemApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stockItems'] })
      await queryClient.refetchQueries({ queryKey: ['stockItems'] })
      toast({
        title: 'Article créé',
        description: 'L\'article de stock a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer l\'article',
      })
    },
  })
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockItemDto }) =>
      updateStockItemApi(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stockItems'] })
      await queryClient.refetchQueries({ queryKey: ['stockItems'] })
      toast({
        title: 'Article modifié',
        description: 'L\'article de stock a été modifié avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier l\'article',
      })
    },
  })
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteStockItemApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stockItems'] })
      await queryClient.refetchQueries({ queryKey: ['stockItems'] })
      toast({
        title: 'Article supprimé',
        description: 'L\'article de stock a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer l\'article',
      })
    },
  })
}
