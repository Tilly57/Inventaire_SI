import { useState, useMemo, useCallback, memo, lazy, Suspense } from 'react'
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
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

// Lazy load dialogs
const AssetItemFormDialog = lazy(() => import('./AssetItemFormDialog').then(m => ({ default: m.AssetItemFormDialog })))
const DeleteAssetItemDialog = lazy(() => import('./DeleteAssetItemDialog').then(m => ({ default: m.DeleteAssetItemDialog })))
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface AssetItemsTableProps {
  items: AssetItem[]
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Memoized Asset Item Row Component for Desktop
interface AssetItemRowProps {
  item: AssetItem
  isSelected: boolean
  onSelect: (itemId: string, checked: boolean) => void
  onEdit: (item: AssetItem) => void
  onDelete: (item: AssetItem) => void
  showCheckbox: boolean
}

const AssetItemRow = memo(({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showCheckbox
}: AssetItemRowProps) => {
  return (
    <TableRow>
      {showCheckbox && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
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
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

AssetItemRow.displayName = 'AssetItemRow'

// Memoized Asset Item Card Component for Mobile
interface AssetItemCardProps {
  item: AssetItem
  isSelected: boolean
  onSelect: (itemId: string, checked: boolean) => void
  onEdit: (item: AssetItem) => void
  onDelete: (item: AssetItem) => void
  showCheckbox: boolean
}

const AssetItemCard = memo(({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showCheckbox
}: AssetItemCardProps) => {
  return (
    <Card className="p-4 animate-fadeIn">
      <div className="space-y-3">
        {/* En-tête avec checkbox et tag */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
                aria-label={`Sélectionner ${item.assetTag}`}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-base">{item.assetTag}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {item.assetModel
                  ? `${item.assetModel.brand} ${item.assetModel.modelName}`
                  : 'Non défini'}
              </p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Informations */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">N° série</span>
            <p className="font-medium">{item.serial || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Créé le</span>
            <p className="font-medium">{formatDate(item.createdAt)}</p>
          </div>
          {item.notes && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Notes</span>
              <p className="font-medium text-sm">{item.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  )
})

AssetItemCard.displayName = 'AssetItemCard'

export function AssetItemsTable({
  items,
  selectedItems = [],
  onSelectionChange
}: AssetItemsTableProps) {
  const [editingItem, setEditingItem] = useState<AssetItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<AssetItem | null>(null)
  const { isMobile } = useMediaQuery()

  // Memoized calculations
  const isAllSelected = useMemo(
    () => items.length > 0 && selectedItems.length === items.length,
    [items.length, selectedItems.length]
  )

  const isSomeSelected = useMemo(
    () => selectedItems.length > 0 && selectedItems.length < items.length,
    [selectedItems.length, items.length]
  )

  // Memoized callbacks
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? items.map(item => item.id) : [])
    }
  }, [onSelectionChange, items])

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedItems, itemId]
        : selectedItems.filter(id => id !== itemId)
      onSelectionChange(newSelection)
    }
  }, [onSelectionChange, selectedItems])

  const handleEdit = useCallback((item: AssetItem) => {
    setEditingItem(item)
  }, [])

  const handleDelete = useCallback((item: AssetItem) => {
    setDeletingItem(item)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setEditingItem(null)
  }, [])

  const handleCloseDelete = useCallback(() => {
    setDeletingItem(null)
  }, [])

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun équipement trouvé
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
              {selectedItems.length > 0
                ? `${selectedItems.length} sélectionné(s)`
                : 'Tout sélectionner'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <AssetItemCard
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={handleSelectItem}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showCheckbox={!!onSelectionChange}
            />
          ))}
        </div>

        <Suspense fallback={null}>
          <AssetItemFormDialog
            item={editingItem}
            open={!!editingItem}
            onClose={handleCloseEdit}
          />
        </Suspense>

        <Suspense fallback={null}>
          <DeleteAssetItemDialog
            item={deletingItem}
            open={!!deletingItem}
            onClose={handleCloseDelete}
          />
        </Suspense>
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
              <AssetItemRow
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                onSelect={handleSelectItem}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showCheckbox={!!onSelectionChange}
              />
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <Suspense fallback={null}>
        <AssetItemFormDialog
          item={editingItem}
          open={!!editingItem}
          onClose={handleCloseEdit}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DeleteAssetItemDialog
          item={deletingItem}
          open={!!deletingItem}
          onClose={handleCloseDelete}
        />
      </Suspense>
    </>
  )
}
