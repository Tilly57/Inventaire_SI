import { useState } from 'react'
import type { AssetModel } from '@/lib/types/models.types'
import { formatDate } from '@/lib/utils/formatters'
import { AssetTypeLabels } from '@/lib/types/enums'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { AssetModelFormDialog } from './AssetModelFormDialog'
import { DeleteAssetModelDialog } from './DeleteAssetModelDialog'

interface AssetModelsTableProps {
  models: AssetModel[]
}

export function AssetModelsTable({ models }: AssetModelsTableProps) {
  const [editingModel, setEditingModel] = useState<AssetModel | null>(null)
  const [deletingModel, setDeletingModel] = useState<AssetModel | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun modèle trouvé
              </TableCell>
            </TableRow>
          ) : (
            models.map((model) => (
              <TableRow key={model.id}>
                <TableCell className="font-medium">{AssetTypeLabels[model.type] || model.type}</TableCell>
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
