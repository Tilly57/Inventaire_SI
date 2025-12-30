import { useState } from 'react'
import type { AssetItem } from '@/lib/types/models.types'
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
import { StatusBadge } from './StatusBadge'
import { AssetItemFormDialog } from './AssetItemFormDialog'
import { DeleteAssetItemDialog } from './DeleteAssetItemDialog'

interface AssetItemsTableProps {
  items: AssetItem[]
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function AssetItemsTable({
  items,
  selectedItems = [],
  onSelectionChange
}: AssetItemsTableProps) {
  const [editingItem, setEditingItem] = useState<AssetItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<AssetItem | null>(null)

  const isAllSelected = items.length > 0 && selectedItems.length === items.length
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < items.length

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? items.map(item => item.id) : [])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedItems, itemId]
        : selectedItems.filter(id => id !== itemId)
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
            <TableHead>Tag</TableHead>
            <TableHead>Modèle</TableHead>
            <TableHead>N° série</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 8 : 7} className="text-center text-muted-foreground">
                Aucun équipement trouvé
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      aria-label={`Sélectionner ${item.assetTag}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{item.assetTag}</TableCell>
                <TableCell>
                  {item.assetModel
                    ? `${item.assetModel.brand} ${item.assetModel.modelName}`
                    : 'Non défini'}
                </TableCell>
                <TableCell>{item.serial || '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="max-w-xs truncate">{item.notes || '-'}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingItem(item)}
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

      <AssetItemFormDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
      />

      <DeleteAssetItemDialog
        item={deletingItem}
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
      />
    </>
  )
}
