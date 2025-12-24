import { useState } from 'react'
import type { StockItem } from '@/lib/types/models.types'
import { formatDate } from '@/lib/utils/formatters'
import { LOW_STOCK_THRESHOLD } from '@/lib/utils/constants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { StockItemFormDialog } from './StockItemFormDialog'
import { DeleteStockItemDialog } from './DeleteStockItemDialog'

interface StockItemsTableProps {
  items: StockItem[]
}

export function StockItemsTable({ items }: StockItemsTableProps) {
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead>Modèle</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Prêté</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Aucun article de stock trouvé
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const isLowStock = item.quantity < LOW_STOCK_THRESHOLD

              return (
                <TableRow key={item.id}>
                  <TableCell>{item.assetModel?.type || '-'}</TableCell>
                  <TableCell className="font-medium">
                    {item.assetModel?.brand || '-'}
                  </TableCell>
                  <TableCell>{item.assetModel?.modelName || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={isLowStock ? 'text-destructive font-semibold' : ''}>
                        {item.quantity}
                      </span>
                      {isLowStock && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Stock bas
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.loaned || 0}</TableCell>
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
              )
            })
          )}
        </TableBody>
      </Table>

      <StockItemFormDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
      />

      <DeleteStockItemDialog
        item={deletingItem}
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
      />
    </>
  )
}
