import { memo } from 'react'
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
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface StockItemsTableProps {
  items: AssetModel[]
}

function StockItemsTableComponent({ items }: StockItemsTableProps) {
  const { isMobile } = useMediaQuery()

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun modèle d'équipement trouvé
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {items.map((model) => {
          const quantity = model._count?.items || 0
          const isLowStock = quantity < LOW_STOCK_THRESHOLD

          return (
            <Card key={model.id} className="p-4 animate-fadeIn">
              <div className="space-y-3">
                {/* En-tête avec type et stock */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-base">{model.brand} {model.modelName}</p>
                    <p className="text-sm text-muted-foreground mt-1">{model.type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-lg font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                      {quantity}
                    </span>
                    {isLowStock && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Stock bas
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Informations */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{model.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le</span>
                    <p className="font-medium">{formatDate(model.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    )
  }

  // Vue desktop - Tableau
  return (
    <div className="overflow-x-auto">
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
    </div>
  )
}

// Memoized: Prevent unnecessary re-renders - Phase 3.3
export const StockItemsTable = memo(StockItemsTableComponent)
