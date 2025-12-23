import type { User } from '@/lib/types/models.types'
import { useDeleteUser } from '@/lib/hooks/useUsers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteUserDialogProps {
  user: User | null
  open: boolean
  onClose: () => void
}

export function DeleteUserDialog({ user, open, onClose }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser()

  const handleDelete = async () => {
    if (!user) return

    try {
      await deleteUser.mutateAsync(user.id)
      onClose()
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'utilisateur</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.username}</strong> ?
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
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
