import type { StockItem } from '@/lib/types/models.types'
import { useDeleteStockItem } from '@/lib/hooks/useStockItems'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteStockItemDialogProps {
  item: StockItem | null
  open: boolean
  onClose: () => void
}

export function DeleteStockItemDialog({ item, open, onClose }: DeleteStockItemDialogProps) {
  const deleteItem = useDeleteStockItem()

  const handleDelete = async () => {
    if (!item) return

    try {
      await deleteItem.mutateAsync(item.id)
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'article</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'article{' '}
            <strong>
              {item.assetModel
                ? `${item.assetModel.brand} ${item.assetModel.modelName}`
                : 'Modèle inconnu'}
            </strong> ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteItem.isPending}
          >
            {deleteItem.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
