import type { AssetModel } from '@/lib/types/models.types'
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
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface StockItemsTableProps {
  items: AssetModel[]
}

export function StockItemsTable({ items }: StockItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Marque</TableHead>
          <TableHead>Modèle</TableHead>
          <TableHead>Quantité</TableHead>
          <TableHead>Créé le</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Aucun modèle d'équipement trouvé
            </TableCell>
          </TableRow>
        ) : (
          items.map((model) => {
            const quantity = model._count?.items || 0
            const isLowStock = quantity < LOW_STOCK_THRESHOLD

            return (
              <TableRow key={model.id}>
                <TableCell className="font-medium">
                  {model.type}
                </TableCell>
                <TableCell>{model.brand}</TableCell>
                <TableCell>{model.modelName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={isLowStock ? 'text-destructive font-semibold' : ''}>
                      {quantity}
                    </span>
                    {isLowStock && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Stock bas
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(model.createdAt)}</TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
