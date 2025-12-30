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
import { Pencil, Trash2 } from 'lucide-react'
import { AssetModelFormDialog } from './AssetModelFormDialog'
import { DeleteAssetModelDialog } from './DeleteAssetModelDialog'

interface AssetModelsTableProps {
  models: AssetModel[]
  selectedModels?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function AssetModelsTable({ models, selectedModels, onSelectionChange }: AssetModelsTableProps) {
  const [editingModel, setEditingModel] = useState<AssetModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<AssetModel | null>(null)

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

  return (
    <>
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
