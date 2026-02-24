/** @fileoverview Dialogue de confirmation de suppression d'un modele d'equipement */
import type { AssetModel } from '@/lib/types/models.types'
import { useDeleteAssetModel } from '@/lib/hooks/useAssetModels'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteAssetModelDialogProps {
  model: AssetModel | null
  open: boolean
  onClose: () => void
}

export function DeleteAssetModelDialog({ model, open, onClose }: DeleteAssetModelDialogProps) {
  const deleteModel = useDeleteAssetModel()

  const handleDelete = async () => {
    if (!model) return

    try {
      await deleteModel.mutateAsync(model.id)
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (!model) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le modèle</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le modèle{' '}
            <strong>{model.brand} {model.modelName}</strong> ?
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
            disabled={deleteModel.isPending}
          >
            {deleteModel.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
