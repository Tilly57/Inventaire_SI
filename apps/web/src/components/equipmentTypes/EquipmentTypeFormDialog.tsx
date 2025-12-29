/**
 * Equipment Type Form Dialog Component
 *
 * Dialog for creating or editing an equipment type
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateEquipmentType, useUpdateEquipmentType } from '@/lib/hooks/useEquipmentTypes';
import { equipmentTypeFormSchema, type EquipmentTypeFormData } from '@/lib/schemas/equipmentTypes.schema';
import type { EquipmentType } from '@/lib/types/models.types';

interface EquipmentTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  equipmentType?: EquipmentType | null;
}

export function EquipmentTypeFormDialog({
  open,
  onOpenChange,
  onClose,
  equipmentType,
}: EquipmentTypeFormDialogProps) {
  const isEditing = !!equipmentType;
  const createMutation = useCreateEquipmentType();
  const updateMutation = useUpdateEquipmentType();

  const form = useForm<EquipmentTypeFormData>({
    resolver: zodResolver(equipmentTypeFormSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when dialog opens/closes or equipment type changes
  useEffect(() => {
    if (open) {
      if (equipmentType) {
        form.reset({
          name: equipmentType.name,
        });
      } else {
        form.reset({
          name: '',
        });
      }
    }
  }, [open, equipmentType, form]);

  const onSubmit = async (data: EquipmentTypeFormData) => {
    try {
      if (isEditing && equipmentType) {
        await updateMutation.mutateAsync({
          id: equipmentType.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      handleClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le type d\'équipement' : 'Nouveau type d\'équipement'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations du type d\'équipement.'
              : 'Créez un nouveau type d\'équipement.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Téléphone portable"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
