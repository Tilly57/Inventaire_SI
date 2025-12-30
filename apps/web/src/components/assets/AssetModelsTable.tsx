import { useState } from 'react'
import type { AssetModel } from '@/lib/types/models.types'
import { formatDate } from '@/lib/utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { AssetModelFormDialog } from './AssetModelFormDialog'
import { DeleteAssetModelDialog } from './DeleteAssetModelDialog'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface AssetModelsTableProps {
  models: AssetModel[]
  selectedModels?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function AssetModelsTable({ models, selectedModels, onSelectionChange }: AssetModelsTableProps) {
  const [editingModel, setEditingModel] = useState<AssetModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<AssetModel | null>(null)
  const { isMobile } = useMediaQuery()

  const isAllSelected = models.length > 0 && selectedModels?.length === models.length
  const isSomeSelected = selectedModels && selectedModels.length > 0 && selectedModels.length < models.length

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? models.map(model => model.id) : [])
    }
  }

  const handleSelectModel = (modelId: string, checked: boolean) => {
    if (onSelectionChange && selectedModels) {
      const newSelection = checked
        ? [...selectedModels, modelId]
        : selectedModels.filter(id => id !== modelId)
      onSelectionChange(newSelection)
    }
  }

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (models.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun modèle trouvé
        </div>
      )
    }

    return (
      <>
        {/* Sélection globale en mobile */}
        {onSelectionChange && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              checked={isSomeSelected ? 'indeterminate' : isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Sélectionner tout"
            />
            <span className="text-sm font-medium">
              {selectedModels && selectedModels.length > 0
                ? `${selectedModels.length} sélectionné(s)`
                : 'Tout sélectionner'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {models.map((model) => (
            <Card key={model.id} className="p-4 animate-fadeIn">
              <div className="space-y-3">
                {/* En-tête avec checkbox et type */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {onSelectionChange && (
                      <Checkbox
                        checked={selectedModels?.includes(model.id) || false}
                        onCheckedChange={(checked) => handleSelectModel(model.id, checked as boolean)}
                        aria-label={`Sélectionner ${model.brand} ${model.modelName}`}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-base">{model.brand} {model.modelName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{model.type}</p>
                    </div>
                  </div>
                </div>

                {/* Informations */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantité</span>
                    <p className="font-medium">{model._count?.items || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le</span>
                    <p className="font-medium">{formatDate(model.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingModel(model)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingModel(model)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <AssetModelFormDialog
          model={editingModel}
          open={!!editingModel}
          onClose={() => setEditingModel(null)}
        />

        <DeleteAssetModelDialog
          model={deletingModel}
          open={!!deletingModel}
          onClose={() => setDeletingModel(null)}
        />
      </>
    )
  }

  // Vue desktop - Tableau
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            <TableHead>Type</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead>Modèle</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 7 : 6} className="text-center text-muted-foreground">
                Aucun modèle trouvé
              </TableCell>
            </TableRow>
          ) : (
            models.map((model) => (
              <TableRow key={model.id}>
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedModels?.includes(model.id) || false}
                      onCheckedChange={(checked) => handleSelectModel(model.id, checked as boolean)}
                      aria-label={`Sélectionner ${model.brand} ${model.modelName}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{model.type}</TableCell>
                <TableCell>{model.brand}</TableCell>
                <TableCell>{model.modelName}</TableCell>
                <TableCell>{model._count?.items || 0}</TableCell>
                <TableCell>{formatDate(model.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingModel(model)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingModel(model)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <AssetModelFormDialog
        model={editingModel}
        open={!!editingModel}
        onClose={() => setEditingModel(null)}
      />

      <DeleteAssetModelDialog
        model={deletingModel}
        open={!!deletingModel}
        onClose={() => setDeletingModel(null)}
      />
    </>
  )
}
