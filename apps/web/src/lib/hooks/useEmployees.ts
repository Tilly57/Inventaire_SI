import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllEmployeesApi,
  getEmployeeApi,
  createEmployeeApi,
  updateEmployeeApi,
  deleteEmployeeApi,
} from '@/lib/api/employees.api'
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getAllEmployeesApi,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => getEmployeeApi(id),
    enabled: !!id,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateEmployeeDto) => createEmployeeApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      await queryClient.refetchQueries({ queryKey: ['employees'] })
      toast({
        title: 'Employé créé',
        description: 'L\'employé a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer l\'employé',
      })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      updateEmployeeApi(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      await queryClient.refetchQueries({ queryKey: ['employees'] })
      toast({
        title: 'Employé modifié',
        description: 'L\'employé a été modifié avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de modifier l\'employé',
      })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteEmployeeApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      await queryClient.refetchQueries({ queryKey: ['employees'] })
      toast({
        title: 'Employé supprimé',
        description: 'L\'employé a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer l\'employé',
      })
    },
  })
}
