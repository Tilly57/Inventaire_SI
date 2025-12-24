import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AssetModel } from '@/lib/types/models.types'
import { AssetType } from '@/lib/types/enums'
import { createAssetModelSchema, updateAssetModelSchema } from '@/lib/schemas/assetModels.schema'
import type { CreateAssetModelFormData, UpdateAssetModelFormData } from '@/lib/schemas/assetModels.schema'
import { useCreateAssetModel, useUpdateAssetModel } from '@/lib/hooks/useAssetModels'
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
import { Button } from '@/components/ui/button'

interface AssetModelFormDialogProps {
  model?: AssetModel | null
  open: boolean
  onClose: () => void
}

export function AssetModelFormDialog({ model, open, onClose }: AssetModelFormDialogProps) {
  const isEdit = !!model
  const createModel = useCreateAssetModel()
  const updateModel = useUpdateAssetModel()

  const form = useForm<CreateAssetModelFormData | UpdateAssetModelFormData>({
    resolver: zodResolver(isEdit ? updateAssetModelSchema : createAssetModelSchema),
    defaultValues: {
      type: AssetType.LAPTOP,
      brand: '',
      modelName: '',
      quantity: undefined,
    },
  })

  useEffect(() => {
    if (model) {
      form.reset({
        type: model.type,
        brand: model.brand,
        modelName: model.modelName,
        quantity: undefined,
      })
    } else {
      form.reset({
        type: AssetType.LAPTOP,
        brand: '',
        modelName: '',
        quantity: undefined,
      })
    }
  }, [model, form])

  const onSubmit = async (data: CreateAssetModelFormData | UpdateAssetModelFormData) => {
    try {
      if (isEdit && model) {
        await updateModel.mutateAsync({ id: model.id, data: data as UpdateAssetModelFormData })
      } else {
        await createModel.mutateAsync(data as CreateAssetModelFormData)
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
            {isEdit ? 'Modifier le modèle' : 'Créer un modèle'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations du modèle d\'équipement'
              : 'Ajoutez un nouveau modèle d\'équipement'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssetType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marque</FormLabel>
                  <FormControl>
                    <Input placeholder="Dell, HP, Apple..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du modèle</FormLabel>
                  <FormControl>
                    <Input placeholder="Latitude 7490, ThinkPad X1..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Créer automatiquement des équipements..."
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Si renseigné, crée automatiquement des équipements avec tags auto-générés
                    </p>
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createModel.isPending || updateModel.isPending}
              >
                {createModel.isPending || updateModel.isPending
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
