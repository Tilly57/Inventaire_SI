/** @fileoverview Dialogue de creation/edition d'un equipement individuel avec gestion du statut */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AssetItem } from '@/lib/types/models.types'
import { AssetStatus } from '@/lib/types/enums'
import { assetItemFormSchema } from '@/lib/schemas/assetItems.schema'
import type { AssetItemFormData } from '@/lib/schemas/assetItems.schema'
import {
  useCreateAssetItem,
  useCreateAssetItemsBulk,
  usePreviewBulkCreation,
  useUpdateAssetItem
} from '@/lib/hooks/useAssetItems'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
import { BulkCreationPreview } from './BulkCreationPreview'
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
  const createItemsBulk = useCreateAssetItemsBulk()
  const updateItem = useUpdateAssetItem()
  const { data: models } = useAssetModels()

  const [isBulkMode, setIsBulkMode] = useState(false)

  const modelsList = Array.isArray(models) ? models : []

  const form = useForm<AssetItemFormData>({
    resolver: zodResolver(assetItemFormSchema),
    defaultValues: {
      quantity: 1,
      assetTag: '',
      tagPrefix: '',
      serial: '',
      status: AssetStatus.EN_STOCK,
      notes: '',
      assetModelId: '',
    },
  })

  // Watch pour détecter le mode
  const quantity = form.watch('quantity') || 1
  const tagPrefix = form.watch('tagPrefix') || ''

  useEffect(() => {
    setIsBulkMode(quantity > 1)
  }, [quantity])

  // Preview hook
  const { data: preview, isLoading: isLoadingPreview } = usePreviewBulkCreation(
    tagPrefix,
    quantity,
    isBulkMode && !!tagPrefix
  )

  useEffect(() => {
    if (item) {
      form.reset({
        quantity: 1,
        assetTag: item.assetTag,
        tagPrefix: '',
        serial: item.serial || '',
        status: item.status,
        notes: item.notes || '',
        assetModelId: item.assetModelId,
      })
      setIsBulkMode(false)
    } else if (!open) {
      form.reset({
        quantity: 1,
        assetTag: '',
        tagPrefix: '',
        serial: '',
        status: AssetStatus.EN_STOCK,
        notes: '',
        assetModelId: '',
      })
      setIsBulkMode(false)
    }
  }, [item, open, form])

  const onSubmit = async (data: AssetItemFormData) => {
    try {
      if (isEdit && item) {
        // Mode édition (inchangé)
        await updateItem.mutateAsync({
          id: item.id,
          data: {
            assetTag: data.assetTag,
            serial: data.serial,
            status: data.status,
            notes: data.notes,
            assetModelId: data.assetModelId,
          }
        })
      } else if (isBulkMode) {
        // Mode création en masse
        await createItemsBulk.mutateAsync({
          tagPrefix: data.tagPrefix!,
          quantity: data.quantity,
          assetModelId: data.assetModelId,
          status: data.status,
          notes: data.notes,
        })
      } else {
        // Mode création simple (inchangé)
        await createItem.mutateAsync({
          assetTag: data.assetTag!,
          serial: data.serial,
          assetModelId: data.assetModelId,
          status: data.status,
          notes: data.notes,
        })
      }

      form.reset()
      onClose()
    } catch (error) {
      // Errors handled by mutation hooks
    }
  }

  const isPending = createItem.isPending || createItemsBulk.isPending || updateItem.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? 'Modifier l\'équipement'
              : isBulkMode
                ? 'Créer des équipements en masse'
                : 'Créer un équipement'
            }
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations de l\'équipement'
              : isBulkMode
                ? 'Créez plusieurs équipements avec des tags auto-générés'
                : 'Ajoutez un nouvel équipement dans l\'inventaire'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Quantity field - only in create mode */}
            {!isEdit && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Asset Tag (simple) OR Tag Prefix (bulk) */}
              {isBulkMode ? (
                <FormField
                  control={form.control}
                  name="tagPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préfixe du tag *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="KB-"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase()
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
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
              )}

              {/* Serial Number - hidden in bulk mode */}
              {!isBulkMode && (
                <FormField
                  control={form.control}
                  name="serial"
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
              )}
            </div>

            {/* Bulk creation preview */}
            {isBulkMode && (
              <BulkCreationPreview
                tagPrefix={tagPrefix}
                quantity={quantity}
                preview={preview}
                isLoading={isLoadingPreview}
              />
            )}

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
                disabled={isPending || (isBulkMode && preview?.conflicts && preview.conflicts.length > 0)}
              >
                {isPending
                  ? 'Enregistrement...'
                  : isEdit
                  ? 'Modifier'
                  : isBulkMode
                  ? `Créer ${quantity} équipement(s)`
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
