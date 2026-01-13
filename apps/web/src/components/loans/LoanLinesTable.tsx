/**
 * @fileoverview LoanLinesTable - Loan lines display with mobile/desktop views
 *
 * Displays loan lines (borrowed items) with:
 * - Mobile: Stacked cards view
 * - Desktop: Table view
 * - Add/Remove actions when loan is open
 * - Status badges and out-of-service highlighting
 *
 * Extracted from LoanDetailsPage for better maintainability - Phase 3.3
 */
import { memo } from 'react'
import type { Loan } from '@/lib/types/models.types'
import { formatDate } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface LoanLinesTableProps {
  loan: Loan
  isOpen: boolean
  onAddLine: () => void
  onRemoveLine: (lineId: string) => void
  isRemoving: boolean
}

/**
 * Get status label in French
 */
function getStatusLabel(status?: string): string {
  if (!status) return '-'
  switch (status) {
    case 'HS': return 'Hors service'
    case 'EN_STOCK': return 'En stock'
    case 'PRETE': return 'Prêté'
    case 'REPARATION': return 'Réparation'
    default: return status
  }
}

/**
 * Get badge variant for status
 */
function getStatusVariant(status?: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (!status) return 'outline'
  switch (status) {
    case 'HS': return 'destructive'
    case 'EN_STOCK': return 'default'
    case 'PRETE': return 'secondary'
    case 'REPARATION': return 'outline'
    default: return 'outline'
  }
}

/**
 * Loan lines table component
 *
 * Renders responsive table/card view of loan lines with actions.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param {LoanLinesTableProps} props - Component props
 * @returns {JSX.Element} Loan lines display
 */
function LoanLinesTableComponent({
  loan,
  isOpen,
  onAddLine,
  onRemoveLine,
  isRemoving
}: LoanLinesTableProps) {
  const { isMobile } = useMediaQuery()
  const hasLines = (loan.lines?.length || 0) > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg md:text-xl">Articles prêtés</CardTitle>
            <CardDescription>{loan.lines?.length || 0} article(s)</CardDescription>
          </div>
          {isOpen && (
            <Button onClick={onAddLine} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasLines ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun article n'a encore été ajouté à ce prêt
            </AlertDescription>
          </Alert>
        ) : isMobile ? (
          /* Vue mobile - Cards empilées */
          <div className="space-y-3">
            {loan.lines?.map((line) => {
              const isOutOfService = line.assetItem?.status === 'HS'
              return (
                <Card
                  key={line.id}
                  className={`p-4 animate-fadeIn ${isOutOfService ? 'border-destructive bg-destructive/5' : ''}`}
                >
                  <div className="space-y-3">
                    {/* En-tête avec type et article */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {line.assetItem ? 'Équipement' : 'Stock'}
                          </Badge>
                          <span className="text-sm font-semibold">x{line.quantity}</span>
                          {isOutOfService && (
                            <Badge variant="destructive">Hors service</Badge>
                          )}
                        </div>
                        <p className="font-semibold text-base">
                          {line.assetItem
                            ? `${line.assetItem.assetTag} - ${line.assetItem.assetModel?.brand} ${line.assetItem.assetModel?.modelName}`
                            : line.stockItem?.assetModel ? `${line.stockItem.assetModel.brand} ${line.stockItem.assetModel.modelName}` : 'Inconnu'}
                        </p>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">N° de série</span>
                        <p className="font-medium">{line.assetItem?.serial || '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date du prêt</span>
                        <p className="font-medium">
                          {line.addedAt ? formatDate(line.addedAt) : formatDate(loan.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {isOpen && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onRemoveLine(line.id)}
                          disabled={isRemoving}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Retirer du prêt
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Vue desktop - Tableau */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>N° de série</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Date du prêt</TableHead>
                  {isOpen && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.lines?.map((line) => {
                  const isOutOfService = line.assetItem?.status === 'HS'
                  return (
                    <TableRow
                      key={line.id}
                      className={isOutOfService ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''}
                    >
                      <TableCell>
                        <Badge variant="outline">
                          {line.assetItem ? 'Équipement' : 'Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {line.assetItem
                          ? `${line.assetItem.assetTag} - ${line.assetItem.assetModel?.brand} ${line.assetItem.assetModel?.modelName}`
                          : line.stockItem?.assetModel ? `${line.stockItem.assetModel.brand} ${line.stockItem.assetModel.modelName}` : 'Inconnu'}
                      </TableCell>
                      <TableCell>
                        {line.assetItem?.serial || '-'}
                      </TableCell>
                      <TableCell>
                        {line.assetItem ? (
                          <Badge variant={getStatusVariant(line.assetItem.status)}>
                            {getStatusLabel(line.assetItem.status)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {line.addedAt ? formatDate(line.addedAt) : formatDate(loan.createdAt)}
                      </TableCell>
                      {isOpen && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveLine(line.id)}
                            disabled={isRemoving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Memoized: Prevent unnecessary re-renders - Phase 3.3
export const LoanLinesTable = memo(LoanLinesTableComponent)
