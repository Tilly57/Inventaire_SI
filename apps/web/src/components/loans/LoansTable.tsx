/** @fileoverview Tableau des prets avec filtrage par statut, tri et navigation vers le detail */
import { useState, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Loan } from '@/lib/types/models.types'
import { formatDate, formatFullName } from '@/lib/utils/formatters'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Eye, Trash2 } from 'lucide-react'
import { DeleteLoanDialog } from './DeleteLoanDialog'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface LoansTableProps {
  loans: Loan[]
  selectedLoans?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Memoized Loan Row Component for Desktop
interface LoanRowProps {
  loan: Loan
  isSelected: boolean
  onSelect: (loanId: string, checked: boolean) => void
  onView: (loanId: string) => void
  onDelete: (e: React.MouseEvent, loan: Loan) => void
  showCheckbox: boolean
}

const LoanRow = memo(({
  loan,
  isSelected,
  onSelect,
  onView,
  onDelete,
  showCheckbox
}: LoanRowProps) => {
  return (
    <TableRow
      onClick={() => onView(loan.id)}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
    >
      {showCheckbox && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(loan.id, checked as boolean)}
            aria-label={`Sélectionner ${loan.employee?.firstName || 'prêt'}`}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        {loan.employee
          ? formatFullName(loan.employee.firstName, loan.employee.lastName)
          : 'Employé supprimé'}
      </TableCell>
      <TableCell>
        <Badge variant={loan.status === 'OPEN' ? 'default' : 'secondary'}>
          {loan.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
        </Badge>
      </TableCell>
      <TableCell>{loan.lines?.length || 0}</TableCell>
      <TableCell>{formatDate(loan.createdAt)}</TableCell>
      <TableCell>{loan.closedAt ? formatDate(loan.closedAt) : '-'}</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onView(loan.id)
            }}
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => onDelete(e, loan)}
            title="Supprimer le prêt"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

LoanRow.displayName = 'LoanRow'

// Memoized Loan Card Component for Mobile
interface LoanCardProps {
  loan: Loan
  isSelected: boolean
  onSelect: (loanId: string, checked: boolean) => void
  onView: (loanId: string) => void
  onDelete: (loan: Loan) => void
  showCheckbox: boolean
}

const LoanCard = memo(({
  loan,
  isSelected,
  onSelect,
  onView,
  onDelete,
  showCheckbox
}: LoanCardProps) => {
  return (
    <Card
      className="p-4 animate-fadeIn cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onView(loan.id)}
    >
      <div className="space-y-3">
        {/* En-tête avec checkbox et employé */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(loan.id, checked as boolean)}
                aria-label={`Sélectionner ${loan.employee?.firstName || 'prêt'}`}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-base">
                {loan.employee
                  ? formatFullName(loan.employee.firstName, loan.employee.lastName)
                  : 'Employé supprimé'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={loan.status === 'OPEN' ? 'default' : 'secondary'}>
                  {loan.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {loan.lines?.length || 0} article(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Créé le</span>
            <p className="font-medium">{formatDate(loan.createdAt)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Fermé le</span>
            <p className="font-medium">{loan.closedAt ? formatDate(loan.closedAt) : '-'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onView(loan.id)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(loan)
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  )
})

LoanCard.displayName = 'LoanCard'

export function LoansTable({ loans, selectedLoans = [], onSelectionChange }: LoansTableProps) {
  const navigate = useNavigate()
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null)
  const { isMobile } = useMediaQuery()

  // Memoized calculations
  const isAllSelected = useMemo(
    () => loans.length > 0 && selectedLoans.length === loans.length,
    [loans.length, selectedLoans.length]
  )

  const isSomeSelected = useMemo(
    () => selectedLoans.length > 0 && selectedLoans.length < loans.length,
    [selectedLoans.length, loans.length]
  )

  // Memoized callbacks
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? loans.map(loan => loan.id) : [])
    }
  }, [onSelectionChange, loans])

  const handleSelectLoan = useCallback((loanId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedLoans, loanId]
        : selectedLoans.filter(id => id !== loanId)
      onSelectionChange(newSelection)
    }
  }, [onSelectionChange, selectedLoans])

  const handleRowClick = useCallback((loanId: string) => {
    navigate(`/loans/${loanId}`)
  }, [navigate])

  const handleDeleteClick = useCallback((e: React.MouseEvent, loan: Loan) => {
    e.stopPropagation()
    setDeletingLoan(loan)
  }, [])

  const handleDeleteLoan = useCallback((loan: Loan) => {
    setDeletingLoan(loan)
  }, [])

  const handleCloseDelete = useCallback(() => {
    setDeletingLoan(null)
  }, [])

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (loans.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun prêt trouvé
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
              {selectedLoans.length > 0
                ? `${selectedLoans.length} sélectionné(s)`
                : 'Tout sélectionner'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              isSelected={selectedLoans.includes(loan.id)}
              onSelect={handleSelectLoan}
              onView={handleRowClick}
              onDelete={handleDeleteLoan}
              showCheckbox={!!onSelectionChange}
            />
          ))}
        </div>

        <DeleteLoanDialog
          loan={deletingLoan}
          open={!!deletingLoan}
          onClose={handleCloseDelete}
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
            <TableHead>Employé</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Fermé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 7 : 6} className="text-center text-muted-foreground">
                Aucun prêt trouvé
              </TableCell>
            </TableRow>
          ) : (
            loans.map((loan) => (
              <LoanRow
                key={loan.id}
                loan={loan}
                isSelected={selectedLoans.includes(loan.id)}
                onSelect={handleSelectLoan}
                onView={handleRowClick}
                onDelete={handleDeleteClick}
                showCheckbox={!!onSelectionChange}
              />
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <DeleteLoanDialog
        loan={deletingLoan}
        open={!!deletingLoan}
        onClose={handleCloseDelete}
      />
    </>
  )
}
