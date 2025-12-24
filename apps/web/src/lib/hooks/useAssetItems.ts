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
  createAssetItemsBulkApi,
  previewBulkCreationApi,
  updateAssetItemApi,
  deleteAssetItemApi,
} from '@/lib/api/assetItems.api'
import type {
  CreateAssetItemDto,
  CreateBulkAssetItemsDto,
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

/**
 * Hook to preview bulk asset creation
 *
 * Returns generated tags and conflicts before actual bulk creation.
 * Useful for UI preview and validation. Cache is never stale (refetch on every call).
 *
 * Cache key: ['assetItems', 'bulk-preview', tagPrefix, quantity]
 *
 * @param tagPrefix - Tag prefix for generation (e.g., "KB-", "LAPTOP-")
 * @param quantity - Number of items to create
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with preview data
 * @returns {string[]} data.tags - Array of tags that will be generated
 * @returns {string[]} data.conflicts - Array of tags that already exist
 * @returns {number} data.startNumber - Starting number for the sequence
 *
 * @example
 * function BulkForm() {
 *   const [prefix, setPrefix] = useState('KB-');
 *   const [quantity, setQuantity] = useState(5);
 *
 *   const { data: preview, isLoading } = usePreviewBulkCreation(
 *     prefix,
 *     quantity,
 *     !!prefix && quantity > 0
 *   );
 *
 *   if (preview?.conflicts.length > 0) {
 *     return <Alert>Conflits détectés: {preview.conflicts.join(', ')}</Alert>;
 *   }
 *
 *   return <div>Tags: {preview?.tags.join(', ')}</div>;
 * }
 */
export function usePreviewBulkCreation(
  tagPrefix: string,
  quantity: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['assetItems', 'bulk-preview', tagPrefix, quantity],
    queryFn: () => previewBulkCreationApi(tagPrefix, quantity),
    enabled: enabled && !!tagPrefix && quantity > 0,
    staleTime: 0, // Always fetch fresh data
  })
}

/**
 * Hook to create multiple asset items in bulk
 *
 * Creates multiple equipment items with auto-generated sequential tags.
 * On success:
 * - Invalidates and refetches asset items cache
 * - Shows success toast with count
 *
 * On error:
 * - Shows detailed error toast
 * - For 409 conflicts: Special message with suggestion to try another prefix
 *
 * @returns React Query mutation with createAssetItemsBulk function
 * @returns {Function} mutation.mutateAsync - Async function to trigger bulk creation
 * @returns {boolean} mutation.isPending - Loading state
 *
 * @example
 * function BulkCreateForm() {
 *   const createBulk = useCreateAssetItemsBulk();
 *
 *   const handleSubmit = async (data) => {
 *     await createBulk.mutateAsync({
 *       assetModelId: 'modelId123',
 *       tagPrefix: 'KB-',
 *       quantity: 20,
 *       status: 'EN_STOCK',
 *       notes: 'Commande 2025-01'
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <Button disabled={createBulk.isPending}>
 *         {createBulk.isPending ? 'Création...' : 'Créer 20 équipements'}
 *       </Button>
 *     </form>
 *   );
 * }
 */
export function useCreateAssetItemsBulk() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateBulkAssetItemsDto) => createAssetItemsBulkApi(data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.refetchQueries({ queryKey: ['assetItems'] })
      toast({
        title: 'Équipements créés',
        description: `${data.length} équipement(s) créé(s) avec succès`,
      })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Impossible de créer les équipements'

      if (error.response?.status === 409) {
        toast({
          variant: 'destructive',
          title: 'Tags déjà existants',
          description: message + ' Essayez un autre préfixe.',
          duration: 7000,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: message,
        })
      }
    },
  })
}
