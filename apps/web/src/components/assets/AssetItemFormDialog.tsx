import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AssetItem } from '@/lib/types/models.types'
import { AssetStatus } from '@/lib/types/enums'
import { createAssetItemSchema, updateAssetItemSchema } from '@/lib/schemas/assetItems.schema'
import type { CreateAssetItemFormData, UpdateAssetItemFormData } from '@/lib/schemas/assetItems.schema'
import { useCreateAssetItem, useUpdateAssetItem } from '@/lib/hooks/useAssetItems'
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

interface AssetItemFormDialogProps {
  item?: AssetItem | null
  open: boolean
  onClose: () => void
}

export function AssetItemFormDialog({ item, open, onClose }: AssetItemFormDialogProps) {
  const isEdit = !!item
  const createItem = useCreateAssetItem()
  const updateItem = useUpdateAssetItem()
  const { data: models } = useAssetModels()

  const modelsList = Array.isArray(models) ? models : []

  const form = useForm<CreateAssetItemFormData | UpdateAssetItemFormData>({
    resolver: zodResolver(isEdit ? updateAssetItemSchema : createAssetItemSchema),
    defaultValues: {
      assetTag: '',
      serialNumber: '',
      status: AssetStatus.EN_STOCK,
      notes: '',
      assetModelId: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        assetTag: item.assetTag,
        serialNumber: item.serialNumber || '',
        status: item.status,
        notes: item.notes || '',
        assetModelId: item.modelId,
      })
    } else {
      form.reset({
        assetTag: '',
        serialNumber: '',
        status: AssetStatus.EN_STOCK,
        notes: '',
        assetModelId: '',
      })
    }
  }, [item, form])

  const onSubmit = async (data: CreateAssetItemFormData | UpdateAssetItemFormData) => {
    try {
      if (isEdit && item) {
        await updateItem.mutateAsync({ id: item.id, data: data as UpdateAssetItemFormData })
      } else {
        await createItem.mutateAsync(data as CreateAssetItemFormData)
      }
      onClose()
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier l\'équipement' : 'Créer un équipement'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'équipement'
              : 'Ajoutez un nouvel équipement dans l\'inventaire'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag d'actif *</FormLabel>
                    <FormControl>
                      <Input placeholder="IT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de série</FormLabel>
                    <FormControl>
                      <Input placeholder="SN123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssetStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
