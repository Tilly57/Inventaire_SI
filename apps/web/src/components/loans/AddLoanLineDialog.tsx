import { useEffect, useMemo, useCallback, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLoanLineSchema } from '@/lib/schemas/loans.schema'
import type { AddLoanLineFormData } from '@/lib/schemas/loans.schema'
import { useAddLoanLine } from '@/lib/hooks/useLoans'
import { useAssetItems } from '@/lib/hooks/useAssetItems'
import { AssetStatus } from '@/lib/types/enums'
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
import { Button } from '@/components/ui/button'

interface AddLoanLineDialogProps {
  loanId: string
  open: boolean
  onClose: () => void
}

function AddLoanLineDialogComponent({ loanId, open, onClose }: AddLoanLineDialogProps) {
  const addLine = useAddLoanLine()
  const { data: assets } = useAssetItems()

  // Memoized: Filter available assets only when assets data changes
  const assetsList = useMemo(() => {
    return Array.isArray(assets) ? assets.filter(a => a.status === AssetStatus.EN_STOCK) : []
  }, [assets])

  const form = useForm<AddLoanLineFormData>({
    resolver: zodResolver(addLoanLineSchema),
    defaultValues: {
      assetItemId: undefined,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        assetItemId: undefined,
      })
    }
  }, [open, form])

  // Memoized: Prevent function recreation on every render
  const onSubmit = useCallback(async (data: AddLoanLineFormData) => {
    try {
      await addLine.mutateAsync({ loanId, data: { assetItemId: data.assetItemId } })
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }, [addLine, loanId, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un équipement au prêt</DialogTitle>
          <DialogDescription>
            Sélectionnez un équipement disponible en stock
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assetItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un équipement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetsList.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Aucun équipement disponible en stock
                        </div>
                      ) : (
                        assetsList.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.assetTag} - {asset.assetModel?.brand} {asset.assetModel?.modelName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={addLine.isPending}>
                {addLine.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Memoized: Prevent unnecessary re-renders when parent component re-renders
// Only re-render if props (loanId, open, onClose) change
export const AddLoanLineDialog = memo(AddLoanLineDialogComponent)
