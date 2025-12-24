import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { StockItem } from '@/lib/types/models.types'
import { createStockItemSchema, updateStockItemSchema } from '@/lib/schemas/stockItems.schema'
import type { CreateStockItemFormData, UpdateStockItemFormData } from '@/lib/schemas/stockItems.schema'
import { useCreateStockItem, useUpdateStockItem } from '@/lib/hooks/useStockItems'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface StockItemFormDialogProps {
  item?: StockItem | null
  open: boolean
  onClose: () => void
}

export function StockItemFormDialog({ item, open, onClose }: StockItemFormDialogProps) {
  const isEdit = !!item
  const createItem = useCreateStockItem()
  const updateItem = useUpdateStockItem()

  const form = useForm<CreateStockItemFormData | UpdateStockItemFormData>({
    resolver: zodResolver(isEdit ? updateStockItemSchema : createStockItemSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        quantity: 0,
        unitPrice: 0,
      })
    }
  }, [item, form])

  const onSubmit = async (data: CreateStockItemFormData | UpdateStockItemFormData) => {
    try {
      if (isEdit && item) {
        await updateItem.mutateAsync({ id: item.id, data: data as UpdateStockItemFormData })
      } else {
        await createItem.mutateAsync(data as CreateStockItemFormData)
      }
      onClose()
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier l\'article' : 'Créer un article'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'article de stock'
              : 'Ajoutez un nouvel article dans le stock'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Câble HDMI, Souris USB..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de l'article..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createItem.isPending || updateItem.isPending}
              >
                {createItem.isPending || updateItem.isPending
                  ? 'Enregistrement...'
                  : isEdit
                  ? 'Modifier'
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
