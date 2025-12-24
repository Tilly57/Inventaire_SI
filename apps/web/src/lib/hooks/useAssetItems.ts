/**
 * @fileoverview Asset Items management hooks with React Query
 *
 * Provides CRUD operations for individual physical equipment instances with
 * automatic caching, cache invalidation, and toast notifications.
 *
 * Asset Items represent unique, trackable equipment (laptops, monitors, phones)
 * with individual serial numbers, asset tags, and status tracking.
 *
 * Features:
 * - Automatic cache management via React Query
 * - Optimistic UI updates with cache invalidation and refetch
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 * - Status workflow tracking (EN_STOCK, PRETE, HS, REPARATION)
 *
 * Each AssetItem belongs to an AssetModel and has unique identifiers.
 */

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

/**
 * Hook to fetch all asset items
 *
 * Returns cached list of individual equipment instances with their models.
 * Cache key: ['assetItems']
 *
 * @returns React Query result object
 * @returns {AssetItem[] | undefined} data - Array of items with assetModel relation
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function AssetItemsListPage() {
 *   const { data: items = [], isLoading } = useAssetItems();
 *
 *   return (
 *     <Table>
 *       {items.map(item => (
 *         <Row key={item.id}>
 *           <Cell>{item.assetTag}</Cell>
 *           <Cell>{item.assetModel.brand} {item.assetModel.modelName}</Cell>
 *           <Cell><StatusBadge status={item.status} /></Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   );
 * }
 */
export function useAssetItems() {
  return useQuery({
    queryKey: ['assetItems'],
    queryFn: getAllAssetItemsApi,
  })
}

/**
 * Hook to fetch single asset item by ID
 *
 * Returns item with full model details.
 * Only fetches when ID is provided.
 * Cache key: ['assetItems', id]
 *
 * @param id - Asset item ID to fetch
 * @returns React Query result object
 * @returns {AssetItem | undefined} data - Item with assetModel relation
 *
 * @example
 * function AssetItemDetailsPage({ itemId }) {
 *   const { data: item, isLoading } = useAssetItem(itemId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <h1>Asset Tag: {item.assetTag}</h1>
 *       <p>Model: {item.assetModel.brand} {item.assetModel.modelName}</p>
 *       <p>Serial Number: {item.serialNumber}</p>
 *       <p>Status: {item.status}</p>
 *     </div>
 *   );
 * }
 */
export function useAssetItem(id: string) {
  return useQuery({
    queryKey: ['assetItems', id],
    queryFn: () => getAssetItemApi(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new asset item
 *
 * Creates a new physical equipment instance.
 * Requires unique assetTag and serialNumber.
 * Initial status is typically EN_STOCK.
 *
 * On success:
 * - Invalidates asset items cache
 * - Refetches items list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CreateAssetItemForm() {
 *   const createItem = useCreateAssetItem();
 *   const { data: models } = useAssetModels();
 *
 *   const handleSubmit = (data) => {
 *     createItem.mutate(data, {
 *       onSuccess: () => navigate('/assets/items')
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Select name="assetModelId" options={models} />
 *       <Input name="assetTag" placeholder="ASSET-001" />
 *       <Input name="serialNumber" placeholder="SN123456" />
 *       <Select name="status" options={['EN_STOCK', 'HS', 'REPARATION']} />
 *       <Button disabled={createItem.isPending}>Create</Button>
 *     </Form>
 *   );
 * }
 */
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

/**
 * Hook to update existing asset item
 *
 * Updates item information (assetTag, serialNumber, status, etc.).
 * Note: Status changes are typically managed automatically by loan system,
 * but can be updated manually (e.g., marking as HS or REPARATION).
 *
 * On success:
 * - Invalidates and refetches asset items cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function EditAssetItemDialog({ item }) {
 *   const updateItem = useUpdateAssetItem();
 *
 *   const handleSubmit = (data) => {
 *     updateItem.mutate(
 *       { id: item.id, data },
 *       { onSuccess: () => onClose() }
 *     );
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="assetTag" defaultValue={item.assetTag} />
 *       <Select name="status" defaultValue={item.status} />
 *       <Button>Save</Button>
 *     </Form>
 *   );
 * }
 */
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

/**
 * Hook to delete asset item
 *
 * Permanently removes an equipment item from the system.
 * Backend may enforce constraints (e.g., cannot delete if currently loaned).
 *
 * On success:
 * - Invalidates and refetches asset items cache
 * - Shows success toast
 *
 * On error:
 * - Shows detailed error message from API
 *
 * @returns Mutation object
 *
 * @example
 * function AssetItemRow({ item }) {
 *   const deleteItem = useDeleteAssetItem();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete asset ${item.assetTag}?`)) {
 *       deleteItem.mutate(item.id);
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{item.assetTag}</td>
 *       <td>{item.status}</td>
 *       <td>
 *         <Button
 *           onClick={handleDelete}
 *           disabled={item.status === 'PRETE'}
 *         >
 *           Delete
 *         </Button>
 *       </td>
 *     </tr>
 *   );
 * }
 */
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
