import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addLoanLineSchema } from '@/lib/schemas/loans.schema'
import type { AddLoanLineFormData } from '@/lib/schemas/loans.schema'
import { useAddLoanLine } from '@/lib/hooks/useLoans'
import { useAssetItems } from '@/lib/hooks/useAssetItems'
import { useStockItems } from '@/lib/hooks/useStockItems'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AddLoanLineDialogProps {
  loanId: string
  open: boolean
  onClose: () => void
}

export function AddLoanLineDialog({ loanId, open, onClose }: AddLoanLineDialogProps) {
  const addLine = useAddLoanLine()
  const { data: assets } = useAssetItems()
  const { data: stock } = useStockItems()
  const [lineType, setLineType] = useState<'asset' | 'stock'>('asset')

  const assetsList = Array.isArray(assets) ? assets.filter(a => a.status === AssetStatus.EN_STOCK) : []
  const stockList = Array.isArray(stock) ? stock : []

  const form = useForm<AddLoanLineFormData>({
    resolver: zodResolver(addLoanLineSchema),
    defaultValues: {
      assetItemId: undefined,
      stockItemId: undefined,
      quantity: 1,
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        assetItemId: undefined,
        stockItemId: undefined,
        quantity: 1,
      })
      setLineType('asset')
    }
  }, [open, form])

  const onSubmit = async (data: AddLoanLineFormData) => {
    try {
      const payload = lineType === 'asset'
        ? { assetItemId: data.assetItemId }
        : { stockItemId: data.stockItemId, quantity: data.quantity || 1 }

      await addLine.mutateAsync({ loanId, data: payload })
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un article au prêt</DialogTitle>
          <DialogDescription>
            Sélectionnez un équipement ou un article de stock
          </DialogDescription>
        </DialogHeader>

        <Tabs value={lineType} onValueChange={(v) => setLineType(v as 'asset' | 'stock')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="asset">Équipement</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="asset" className="space-y-4 mt-0">
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
                                {asset.assetTag} - {asset.model?.brand} {asset.model?.modelName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="stockItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article de stock *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un article" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stockList.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} (Stock: {item.quantity})
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
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
