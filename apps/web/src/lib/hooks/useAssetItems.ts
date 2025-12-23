import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllAssetItemsApi,
  getAssetItemApi,
  createAssetItemApi,
  updateAssetItemApi,
  deleteAssetItemApi,
} from '@/lib/api/assetItems.api'
import type {
  CreateAssetItemDto,
  UpdateAssetItemDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

export function useAssetItems() {
  return useQuery({
    queryKey: ['assetItems'],
    queryFn: getAllAssetItemsApi,
  })
}

export function useAssetItem(id: string) {
  return useQuery({
    queryKey: ['assetItems', id],
    queryFn: () => getAssetItemApi(id),
    enabled: !!id,
  })
}

export function useCreateAssetItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateAssetItemDto) => createAssetItemApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.refetchQueries({ queryKey: ['assetItems'] })
      toast({
        title: 'Équipement créé',
        description: 'L\'équipement a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer l\'équipement',
      })
    },
  })
}

export function useUpdateAssetItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetItemDto }) =>
      updateAssetItemApi(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.refetchQueries({ queryKey: ['assetItems'] })
      toast({
        title: 'Équipement modifié',
        description: 'L\'équipement a été modifié avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier l\'équipement',
      })
    },
  })
}

export function useDeleteAssetItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteAssetItemApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.refetchQueries({ queryKey: ['assetItems'] })
      toast({
        title: 'Équipement supprimé',
        description: 'L\'équipement a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer l\'équipement',
      })
    },
  })
}
