import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useBatchDeleteLoans } from '@/lib/hooks/useLoans'
import type { Loan } from '@/lib/types/models.types'
import { formatFullName } from '@/lib/utils/formatters'

interface BulkDeleteLoansDialogProps {
  loans: Loan[]
  open: boolean
  onClose: () => void
}

export function BulkDeleteLoansDialog({
  loans,
  open,
  onClose,
}: BulkDeleteLoansDialogProps) {
  const batchDelete = useBatchDeleteLoans()

  const openCount = loans.filter(l => l.status === 'OPEN').length
  const closedCount = loans.filter(l => l.status === 'CLOSED').length
  const hasClosedLoans = closedCount > 0

  // Liste employés (max 10, puis "et X autres")
  const employeeNames = loans
    .map(l => {
      if (!l.employee) return 'Employé supprimé'
      return formatFullName(l.employee.firstName, l.employee.lastName)
    })
    .filter((name, index, self) => self.indexOf(name) === index) // unique
  const displayedEmployees = employeeNames.slice(0, 10)
  const remainingCount = employeeNames.length - 10

  const handleDelete = async () => {
    const loanIds = loans.map(l => l.id)
    await batchDelete.mutateAsync(loanIds)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer {loans.length} prêt(s)
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et aura des conséquences importantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Décompte par statut */}
          <div className="flex gap-2">
            {openCount > 0 && (
              <Badge variant="default">{openCount} ouvert{openCount > 1 ? 's' : ''}</Badge>
            )}
            {closedCount > 0 && (
              <Badge variant="secondary">{closedCount} fermé{closedCount > 1 ? 's' : ''}</Badge>
            )}
          </div>

          {/* Avertissement prêts fermés */}
          {hasClosedLoans && (
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Vous êtes sur le point de supprimer des prêts fermés avec signatures.
                L'historique sera définitivement perdu.
              </AlertDescription>
            </Alert>
          )}

          {/* Liste employés */}
          <div>
            <p className="text-sm font-medium mb-2">Employés concernés :</p>
            <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-1 bg-muted/50">
              {displayedEmployees.map((name, index) => (
                <div key={index} className="text-sm">
                  {name}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="text-sm text-muted-foreground italic">
                  et {remainingCount} autre{remainingCount > 1 ? 's' : ''}...
                </div>
              )}
            </div>
          </div>

          {/* Conséquences */}
          <div>
            <p className="text-sm font-medium mb-2">Conséquences :</p>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Les équipements prêtés seront remis EN_STOCK</li>
              <li>Les quantités d'articles de stock seront restaurées</li>
              <li>Les fichiers de signatures seront supprimés du serveur</li>
              <li>L'historique des prêts sera définitivement perdu</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={batchDelete.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={batchDelete.isPending}
          >
            {batchDelete.isPending ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
