import { useState } from 'react'
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
import { Eye, Trash2 } from 'lucide-react'
import { DeleteLoanDialog } from './DeleteLoanDialog'

interface LoansTableProps {
  loans: Loan[]
  selectedLoans?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function LoansTable({ loans, selectedLoans = [], onSelectionChange }: LoansTableProps) {
  const navigate = useNavigate()
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null)

  // Multi-selection logic
  const isAllSelected = loans.length > 0 && selectedLoans.length === loans.length
  const isSomeSelected = selectedLoans.length > 0 && selectedLoans.length < loans.length

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? loans.map(loan => loan.id) : [])
    }
  }

  const handleSelectLoan = (loanId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedLoans, loanId]
        : selectedLoans.filter(id => id !== loanId)
      onSelectionChange(newSelection)
    }
  }

  const handleRowClick = (loanId: string) => {
    navigate(`/loans/${loanId}`)
  }

  const handleDeleteClick = (e: React.MouseEvent, loan: Loan) => {
    e.stopPropagation() // Empêche la navigation lors du clic sur supprimer
    setDeletingLoan(loan)
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
              <TableRow
                key={loan.id}
                onClick={() => handleRowClick(loan.id)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLoans.includes(loan.id)}
                      onCheckedChange={(checked) => handleSelectLoan(loan.id, checked as boolean)}
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
                        e.stopPropagation() // Empêche la navigation lors du clic sur voir
                        navigate(`/loans/${loan.id}`)
                      }}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, loan)}
                      title="Supprimer le prêt"
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

      <DeleteLoanDialog
        loan={deletingLoan}
        open={!!deletingLoan}
        onClose={() => setDeletingLoan(null)}
      />
    </>
  )
}
