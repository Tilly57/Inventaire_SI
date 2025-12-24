import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { StockItem } from '@/lib/types/models.types'
import { createStockItemSchema, updateStockItemSchema } from '@/lib/schemas/stockItems.schema'
import type { CreateStockItemFormData, UpdateStockItemFormData } from '@/lib/schemas/stockItems.schema'
import { useCreateStockItem, useUpdateStockItem } from '@/lib/hooks/useStockItems'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const { data: models } = useAssetModels()

  const modelsList = Array.isArray(models) ? models : []

  const form = useForm<CreateStockItemFormData | UpdateStockItemFormData>({
    resolver: zodResolver(isEdit ? updateStockItemSchema : createStockItemSchema),
    defaultValues: {
      assetModelId: '',
      quantity: 0,
      notes: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        assetModelId: item.assetModelId,
        quantity: item.quantity,
        notes: item.notes || '',
      })
    } else {
      form.reset({
        assetModelId: '',
        quantity: 0,
        notes: '',
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
      // Reset form after successful creation
      form.reset({
        assetModelId: '',
        quantity: 0,
        notes: '',
      })
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
              name="assetModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modèle *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un modèle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelsList.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.brand} {model.modelName} ({model.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
