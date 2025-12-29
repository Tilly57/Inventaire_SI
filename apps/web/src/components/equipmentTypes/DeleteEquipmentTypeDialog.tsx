/**
 * Delete Equipment Type Dialog Component
 *
 * Confirmation dialog for deleting an equipment type
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteEquipmentType } from '@/lib/hooks/useEquipmentTypes';
import type { EquipmentType } from '@/lib/types/models.types';

interface DeleteEquipmentTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  equipmentType: EquipmentType | null;
}

export function DeleteEquipmentTypeDialog({
  open,
  onOpenChange,
  onClose,
  equipmentType,
}: DeleteEquipmentTypeDialogProps) {
  const deleteMutation = useDeleteEquipmentType();

  const handleDelete = async () => {
    if (!equipmentType) return;

    try {
      await deleteMutation.mutateAsync(equipmentType.id);
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  if (!equipmentType) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le type "{equipmentType.name}" ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            <strong>Attention :</strong> Ce type ne peut être supprimé que s'il n'est utilisé par aucun modèle d'équipement.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={deleteMutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
