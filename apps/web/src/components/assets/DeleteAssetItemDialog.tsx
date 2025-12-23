import type { AssetItem } from '@/lib/types/models.types'
import { useDeleteAssetItem } from '@/lib/hooks/useAssetItems'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteAssetItemDialogProps {
  item: AssetItem | null
  open: boolean
  onClose: () => void
}

export function DeleteAssetItemDialog({ item, open, onClose }: DeleteAssetItemDialogProps) {
  const deleteItem = useDeleteAssetItem()

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
          <DialogTitle>Supprimer l'équipement</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'équipement{' '}
            <strong>{item.assetTag}</strong> ?
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
