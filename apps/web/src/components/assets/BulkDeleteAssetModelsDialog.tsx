import type { AssetModel } from '@/lib/types/models.types'
import { useBatchDeleteAssetModels } from '@/lib/hooks/useAssetModels'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface BulkDeleteAssetModelsDialogProps {
  models: AssetModel[]
  open: boolean
  onClose: () => void
}

export function BulkDeleteAssetModelsDialog({
  models,
  open,
  onClose,
}: BulkDeleteAssetModelsDialogProps) {
  const batchDelete = useBatchDeleteAssetModels()

  const handleDelete = async () => {
    if (models.length === 0) return

    try {
      await batchDelete.mutateAsync(models.map(m => m.id))
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (models.length === 0) return null

  // Calculer le nombre total d'équipements et de stock associés
  const totalAssetItems = models.reduce((sum, m) => sum + (m._count?.items || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer {models.length} modèle{models.length > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et supprimera tous les équipements et stocks associés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerte de danger */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention - Suppression en cascade</AlertTitle>
            <AlertDescription>
              Vous êtes sur le point de supprimer {models.length} modèle{models.length > 1 ? 's' : ''} et environ {totalAssetItems} équipement{totalAssetItems > 1 ? 's' : ''} associé{totalAssetItems > 1 ? 's' : ''}.
            </AlertDescription>
          </Alert>

          {/* Liste des modèles sélectionnés */}
          <div>
            <h4 className="font-medium mb-2">Modèles sélectionnés :</h4>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/20">
              <ul className="space-y-1 text-sm">
                {models.slice(0, 10).map((model) => (
                  <li key={model.id} className="flex justify-between">
                    <span>
                      <strong>{model.brand}</strong> {model.modelName}
                    </span>
                    <span className="text-muted-foreground">
                      ({model._count?.items || 0} item{model._count?.items !== 1 ? 's' : ''})
                    </span>
                  </li>
                ))}
                {models.length > 10 && (
                  <li className="text-muted-foreground italic">
                    ...et {models.length - 10} autre{models.length - 10 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Conséquences */}
          <div>
            <h4 className="font-medium mb-2">Conséquences de cette action :</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>{models.length}</strong> modèle{models.length > 1 ? 's' : ''} supprimé{models.length > 1 ? 's' : ''}
              </li>
              <li>
                <strong>Environ {totalAssetItems}</strong> équipement{totalAssetItems > 1 ? 's' : ''} (AssetItems) supprimé{totalAssetItems > 1 ? 's' : ''}
              </li>
              <li>
                <strong>Tous les articles de stock</strong> (StockItems) associés supprimés
              </li>
              <li>
                <strong className="text-destructive">Historique perdu définitivement</strong> - Cette action est irréversible
              </li>
            </ul>
          </div>

          {/* Note importante */}
          <Alert>
            <AlertDescription>
              <strong>Note :</strong> Les modèles dont les équipements sont actuellement prêtés ou dont les stocks ont des articles prêtés <strong>ne pourront pas</strong> être supprimés.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={batchDelete.isPending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={batchDelete.isPending}
          >
            {batchDelete.isPending ? 'Suppression...' : `Supprimer ${models.length} modèle${models.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
