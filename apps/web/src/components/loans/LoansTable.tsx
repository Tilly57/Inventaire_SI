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
import { Eye, Trash2 } from 'lucide-react'
import { DeleteLoanDialog } from './DeleteLoanDialog'

interface LoansTableProps {
  loans: Loan[]
}

export function LoansTable({ loans }: LoansTableProps) {
  const navigate = useNavigate()
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Aucun prêt trouvé
              </TableCell>
            </TableRow>
          ) : (
            loans.map((loan) => (
              <TableRow key={loan.id}>
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
                      onClick={() => navigate(`/loans/${loan.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingLoan(loan)}
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
