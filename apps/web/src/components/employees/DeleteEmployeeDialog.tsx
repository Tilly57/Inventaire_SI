/** @fileoverview Dialogue de confirmation de suppression d'un employe */
import type { Employee } from '@/lib/types/models.types'
import { formatFullName } from '@/lib/utils/formatters'
import { useDeleteEmployee } from '@/lib/hooks/useEmployees'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteEmployeeDialogProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
}

export function DeleteEmployeeDialog({ employee, open, onClose }: DeleteEmployeeDialogProps) {
  const deleteEmployee = useDeleteEmployee()

  const handleDelete = async () => {
    if (!employee) return

    try {
      await deleteEmployee.mutateAsync(employee.id)
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'employé</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'employé{' '}
            <strong>{formatFullName(employee.firstName, employee.lastName)}</strong> ?
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
            disabled={deleteEmployee.isPending}
          >
            {deleteEmployee.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
