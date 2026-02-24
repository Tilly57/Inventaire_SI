/**
 * @fileoverview Stock Items management hooks with React Query
 *
 * Provides CRUD operations for consumable stock items with automatic caching,
 * cache invalidation, and toast notifications.
 *
 * Stock Items represent consumable materials (cables, adapters, peripherals)
 * tracked by quantity rather than individual units. Unlike AssetItems which
 * are unique and trackable, StockItems are fungible and measured by count.
 *
 * Features:
 * - Automatic cache management via React Query
 * - Optimistic UI updates with cache invalidation and refetch
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 * - Quantity management and low stock tracking
 *
 * Low stock threshold: Items with quantity < 5 trigger alerts.
 */

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
import { getErrorMessage } from '@/lib/utils/getErrorMessage'

/**
 * Hook to fetch all stock items
 *
 * Returns cached list of consumable items with current quantities.
 * Cache key: ['stockItems']
 *
 * @returns React Query result object
 * @returns {StockItem[] | undefined} data - Array of stock items
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function StockItemsListPage() {
 *   const { data: items = [], isLoading } = useStockItems();
 *
 *   return (
 *     <Table>
 *       {items.map(item => (
 *         <Row key={item.id}>
 *           <Cell>{item.name}</Cell>
 *           <Cell>{item.quantity} {item.unit}</Cell>
 *           <Cell>
 *             {item.quantity < 5 && <LowStockBadge />}
 *           </Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   );
 * }
 */
export function useStockItems() {
  return useQuery({
    queryKey: ['stockItems'],
    queryFn: getAllStockItemsApi,
  })
}

/**
 * Hook to fetch single stock item by ID
 *
 * Returns item with full details.
 * Only fetches when ID is provided.
 * Cache key: ['stockItems', id]
 *
 * @param id - Stock item ID to fetch
 * @returns React Query result object
 * @returns {StockItem | undefined} data - Stock item object
 *
 * @example
 * function StockItemDetailsPage({ itemId }) {
 *   const { data: item, isLoading } = useStockItem(itemId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <h1>{item.name}</h1>
 *       <p>Quantity: {item.quantity} {item.unit}</p>
 *       <p>Reference: {item.reference}</p>
 *       {item.quantity < 5 && <Alert>Low stock!</Alert>}
 *     </div>
 *   );
 * }
 */
export function useStockItem(id: string) {
  return useQuery({
    queryKey: ['stockItems', id],
    queryFn: () => getStockItemApi(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new stock item
 *
 * Creates a new consumable item with initial quantity.
 * Unit field specifies measurement (pcs, meters, kg, etc.).
 *
 * On success:
 * - Invalidates stock items cache
 * - Refetches items list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CreateStockItemForm() {
 *   const createItem = useCreateStockItem();
 *
 *   const handleSubmit = (data) => {
 *     createItem.mutate(data, {
 *       onSuccess: () => navigate('/stock')
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Input name="name" placeholder="HDMI Cable" />
 *       <Input name="reference" placeholder="HDMI-2M-BLK" />
 *       <Input name="quantity" type="number" min="0" />
 *       <Input name="unit" placeholder="pcs" />
 *       <Button disabled={createItem.isPending}>Create</Button>
 *     </Form>
 *   );
 * }
 */
export function useCreateStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateStockItemDto) => createStockItemApi(data),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.resetQueries({ queryKey: ['stockItems'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Article créé',
        description: 'L\'article de stock a été créé avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de créer l\'article'),
      })
    },
  })
}

/**
 * Hook to update existing stock item
 *
 * Updates item information (name, reference, quantity, unit).
 * Quantity can be adjusted manually or through loan operations.
 *
 * On success:
 * - Invalidates and refetches stock items cache
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function EditStockItemDialog({ item }) {
 *   const updateItem = useUpdateStockItem();
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
 *       <Input name="name" defaultValue={item.name} />
 *       <Input name="quantity" type="number" defaultValue={item.quantity} />
 *       <Button>Save</Button>
 *     </Form>
 *   );
 * }
 */
export function useUpdateStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockItemDto }) =>
      updateStockItemApi(id, data),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.resetQueries({ queryKey: ['stockItems'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Article modifié',
        description: 'L\'article de stock a été modifié avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de modifier l\'article'),
      })
    },
  })
}

/**
 * Hook to delete stock item
 *
 * Permanently removes a consumable item from inventory.
 * Backend may enforce constraints (e.g., cannot delete if referenced in loans).
 *
 * On success:
 * - Invalidates and refetches stock items cache
 * - Shows success toast
 *
 * On error:
 * - Shows detailed error message from API
 *
 * @returns Mutation object
 *
 * @example
 * function StockItemRow({ item }) {
 *   const deleteItem = useDeleteStockItem();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete stock item ${item.name}?`)) {
 *       deleteItem.mutate(item.id);
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{item.name}</td>
 *       <td>{item.quantity} {item.unit}</td>
 *       <td>
 *         <Button onClick={handleDelete}>Delete</Button>
 *       </td>
 *     </tr>
 *   );
 * }
 */
export function useDeleteStockItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteStockItemApi(id),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.resetQueries({ queryKey: ['stockItems'] })
      await queryClient.resetQueries({ queryKey: ['dashboard'] })
      toast({
        title: 'Article supprimé',
        description: 'L\'article de stock a été supprimé avec succès',
      })
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: getErrorMessage(error, 'Impossible de supprimer l\'article'),
      })
    },
  })
}
