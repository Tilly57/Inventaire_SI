/**
 * @fileoverview Asset Models management hooks with React Query
 *
 * Provides CRUD operations for equipment model templates with automatic caching,
 * cache invalidation, and toast notifications.
 *
 * Asset Models define equipment types (laptop, monitor, etc.) with brand and model name.
 * Each model can have multiple AssetItems (individual physical equipment instances).
 *
 * Features:
 * - Automatic cache management via React Query
 * - Optimistic UI updates with cache invalidation and refetch
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 *
 * Deletion restriction: Models with associated AssetItems cannot be deleted.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllAssetModelsApi,
  getAssetModelApi,
  createAssetModelApi,
  updateAssetModelApi,
  deleteAssetModelApi,
  batchDeleteAssetModelsApi,
} from '@/lib/api/assetModels.api'
import type {
  CreateAssetModelDto,
  UpdateAssetModelDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Hook to fetch all asset models
 *
 * Returns cached list of equipment model templates with item counts.
 * Cache key: ['assetModels']
 *
 * @returns React Query result object
 * @returns {AssetModel[] | undefined} data - Array of models with _count.items
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function AssetModelsListPage() {
 *   const { data: models = [], isLoading } = useAssetModels();
 *
 *   return (
 *     <Table>
 *       {models.map(model => (
 *         <Row key={model.id}>
 *           <Cell>{model.type}</Cell>
 *           <Cell>{model.brand} {model.modelName}</Cell>
 *           <Cell>{model._count.items} items</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   );
 * }
 */
export function useAssetModels() {
  return useQuery({
    queryKey: ['assetModels'],
    queryFn: getAllAssetModelsApi,
  })
}

/**
 * Hook to fetch single asset model by ID
 *
 * Returns model with list of associated AssetItems.
 * Only fetches when ID is provided.
 * Cache key: ['assetModels', id]
 *
 * @param id - Asset model ID to fetch
 * @returns React Query result object
 * @returns {AssetModel | undefined} data - Model with items array
 *
 * @example
 * function AssetModelDetailsPage({ modelId }) {
 *   const { data: model, isLoading } = useAssetModel(modelId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <h1>{model.brand} {model.modelName}</h1>
 *       <p>Type: {model.type}</p>
 *       <AssetItemsList items={model.items} />
 *     </div>
 *   );
 * }
 */
export function useAssetModel(id: string) {
  return useQuery({
    queryKey: ['assetModels', id],
    queryFn: () => getAssetModelApi(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new asset model
 *
 * On success:
 * - Invalidates asset models cache
 * - Refetches models list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CreateAssetModelForm() {
 *   const createModel = useCreateAssetModel();
 *
 *   const handleSubmit = (data) => {
 *     createModel.mutate(data, {
 *       onSuccess: () => navigate('/assets/models')
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Select name="type" options={['Ordinateur', 'Écran', 'Téléphone']} />
 *       <Input name="brand" placeholder="Dell, HP, Apple..." />
 *       <Input name="modelName" placeholder="Latitude 5420" />
 *       <Button disabled={createModel.isPending}>Create</Button>
 *     </Form>
 *   );
 * }
 */
export function useCreateAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateAssetModelDto) => createAssetModelApi(data),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.resetQueries({ queryKey: ['assetModels'] })
      await queryClient.resetQueries({ queryKey: ['assetItems'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })
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

/**
 * Hook to update existing asset model
 *
 * Updates model information (type, brand, modelName).
 *
 * On success:
 * - Invalidates and refetches asset models cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function EditAssetModelDialog({ model }) {
 *   const updateModel = useUpdateAssetModel();
 *
 *   const handleSubmit = (data) => {
 *     updateModel.mutate(
 *       { id: model.id, data },
 *       { onSuccess: () => onClose() }
 *     );
 *   };
 * }
 */
export function useUpdateAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetModelDto }) =>
      updateAssetModelApi(id, data),
    onSuccess: async (_result, variables) => {
      await queryClient.resetQueries({ queryKey: ['assetModels'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })

      // Only invalidate assetItems if quantity was provided (new items were created)
      if (variables.data.quantity && variables.data.quantity > 0) {
        await queryClient.invalidateQueries({ queryKey: ['assetItems'], refetchType: 'active' })
        await queryClient.refetchQueries({ queryKey: ['assetItems'] })
      }

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

/**
 * Hook to delete asset model
 *
 * IMPORTANT: Models with ANY associated AssetItems cannot be deleted.
 * Backend will return ValidationError if model has items.
 *
 * On success:
 * - Invalidates and refetches asset models cache
 * - Shows success toast
 *
 * On error (e.g., has associated items):
 * - Shows detailed error message from API
 *
 * @returns Mutation object
 *
 * @example
 * function AssetModelRow({ model }) {
 *   const deleteModel = useDeleteAssetModel();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete ${model.brand} ${model.modelName}?`)) {
 *       deleteModel.mutate(model.id);
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{model.brand} {model.modelName}</td>
 *       <td>{model._count.items} items</td>
 *       <td>
 *         <Button
 *           onClick={handleDelete}
 *           disabled={model._count.items > 0}
 *         >
 *           Delete
 *         </Button>
 *       </td>
 *     </tr>
 *   );
 * }
 */
export function useDeleteAssetModel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteAssetModelApi(id),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.resetQueries({ queryKey: ['assetModels'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Modèle supprimé',
        description: 'Le modèle d\'équipement a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      // Error message explains why deletion failed (e.g., has associated items)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer le modèle',
      })
    },
  })
}

/**
 * Hook to batch delete asset models (ADMIN only)
 *
 * Deletes multiple models and all associated items (AssetItems and StockItems).
 * IMPORTANT: Cannot delete if any AssetItem is currently loaned or StockItem has loaned items.
 *
 * On success:
 * - Invalidates asset models, asset items, and stock items caches
 * - Refetches all caches
 * - Shows success toast with deletion counts
 *
 * On error:
 * - Shows detailed error message from API
 *
 * @returns Mutation object
 *
 * @example
 * function AssetModelsListPage() {
 *   const batchDelete = useBatchDeleteAssetModels();
 *   const [selectedIds, setSelectedIds] = useState<string[]>([]);
 *
 *   const handleBatchDelete = () => {
 *     batchDelete.mutate(selectedIds, {
 *       onSuccess: () => setSelectedIds([])
 *     });
 *   };
 * }
 */
export function useBatchDeleteAssetModels() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (modelIds: string[]) => batchDeleteAssetModelsApi(modelIds),
    onSuccess: async (result) => {
      // Invalidate all related caches
      await queryClient.resetQueries({ queryKey: ['assetModels'] })
      await queryClient.resetQueries({ queryKey: ['assetItems'] })
      await queryClient.resetQueries({ queryKey: ['stockItems'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })

      toast({
        title: 'Modèles supprimés',
        description: `${result.modelsDeleted} modèle(s), ${result.assetItemsDeleted} équipement(s) et ${result.stockItemsDeleted} article(s) de stock supprimés`,
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer les modèles',
      })
    },
  })
}
