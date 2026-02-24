/**
 * Equipment Types React Query hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllEquipmentTypesApi,
  getEquipmentTypeByIdApi,
  createEquipmentTypeApi,
  updateEquipmentTypeApi,
  deleteEquipmentTypeApi,
} from '../api/equipmentTypes.api';
import type { CreateEquipmentTypeDto, UpdateEquipmentTypeDto } from '../types/models.types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/getErrorMessage';

// Query keys
export const equipmentTypesKeys = {
  all: ['equipmentTypes'] as const,
  lists: () => [...equipmentTypesKeys.all, 'list'] as const,
  list: () => [...equipmentTypesKeys.lists()] as const,
  details: () => [...equipmentTypesKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentTypesKeys.details(), id] as const,
};

/**
 * Hook to get all equipment types
 */
export function useEquipmentTypes() {
  return useQuery({
    queryKey: equipmentTypesKeys.list(),
    queryFn: getAllEquipmentTypesApi,
  });
}

/**
 * Hook to get equipment type by ID
 */
export function useEquipmentType(id: string) {
  return useQuery({
    queryKey: equipmentTypesKeys.detail(id),
    queryFn: () => getEquipmentTypeByIdApi(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new equipment type
 */
export function useCreateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipmentTypeDto) => createEquipmentTypeApi(data),
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: equipmentTypesKeys.lists() });
      toast.success('Type d\'équipement créé avec succès');
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Erreur lors de la création du type');
      toast.error(message);
    },
  });
}

/**
 * Hook to update an equipment type
 */
export function useUpdateEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentTypeDto }) =>
      updateEquipmentTypeApi(id, data),
    onSuccess: async (_, { id }) => {
      await queryClient.resetQueries({ queryKey: equipmentTypesKeys.lists() });
      await queryClient.resetQueries({ queryKey: equipmentTypesKeys.detail(id) });
      toast.success('Type d\'équipement modifié avec succès');
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Erreur lors de la modification du type');
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an equipment type
 */
export function useDeleteEquipmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEquipmentTypeApi(id),
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: equipmentTypesKeys.lists() });
      toast.success('Type d\'équipement supprimé avec succès');
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Erreur lors de la suppression du type');
      toast.error(message);
    },
  });
}
