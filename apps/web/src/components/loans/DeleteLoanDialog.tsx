/** @fileoverview Dialogue de confirmation de suppression d'un pret */
import type { Loan } from '@/lib/types/models.types'
import { useDeleteLoan } from '@/lib/hooks/useLoans'
import { formatFullName } from '@/lib/utils/formatters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteLoanDialogProps {
  loan: Loan | null
  open: boolean
  onClose: () => void
}

export function DeleteLoanDialog({ loan, open, onClose }: DeleteLoanDialogProps) {
  const deleteLoan = useDeleteLoan()

  const handleDelete = async () => {
    if (!loan) return

    try {
      await deleteLoan.mutateAsync(loan.id)
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (!loan) return null

  const employeeName = loan.employee
    ? formatFullName(loan.employee.firstName, loan.employee.lastName)
    : 'Employé inconnu'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le prêt</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le prêt de{' '}
            <strong>{employeeName}</strong> ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoan.isPending}
          >
            {deleteLoan.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
