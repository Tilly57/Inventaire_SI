import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllAssetModelsApi,
  getAssetModelApi,
  createAssetModelApi,
  updateAssetModelApi,
  deleteAssetModelApi,
} from '@/lib/api/assetModels.api'
import type {
  CreateAssetModelDto,
  UpdateAssetModelDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

export function useAssetModels() {
  return useQuery({
    queryKey: ['assetModels'],
    queryFn: getAllAssetModelsApi,
  })
}

export function useAssetModel(id: string) {
  return useQuery({
    queryKey: ['assetModels', id],
    queryFn: () => getAssetModelApi(id),
    enabled: !!id,
  })
}

export function useCreateAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateAssetModelDto) => createAssetModelApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.refetchQueries({ queryKey: ['assetModels'] })
      toast({
        title: 'Modèle créé',
        description: 'Le modèle d\'équipement a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer le modèle',
      })
    },
  })
}

export function useUpdateAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetModelDto }) =>
      updateAssetModelApi(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.refetchQueries({ queryKey: ['assetModels'] })
      toast({
        title: 'Modèle modifié',
        description: 'Le modèle d\'équipement a été modifié avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier le modèle',
      })
    },
  })
}

export function useDeleteAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteAssetModelApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.refetchQueries({ queryKey: ['assetModels'] })
      toast({
        title: 'Modèle supprimé',
        description: 'Le modèle d\'équipement a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer le modèle',
      })
    },
  })
}
