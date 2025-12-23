import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllLoansApi,
  getLoanApi,
  createLoanApi,
  addLoanLineApi,
  removeLoanLineApi,
  uploadPickupSignatureApi,
  uploadReturnSignatureApi,
  closeLoanApi,
  deleteLoanApi,
} from '@/lib/api/loans.api'
import type {
  CreateLoanDto,
  AddLoanLineDto,
} from '@/lib/types/models.types'
import { useToast } from '@/lib/hooks/use-toast'

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: getAllLoansApi,
  })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => getLoanApi(id),
    enabled: !!id,
  })
}

export function useCreateLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateLoanDto) => createLoanApi(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.refetchQueries({ queryKey: ['loans'] })
      toast({
        title: 'Prêt créé',
        description: 'Le prêt a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de créer le prêt',
      })
    },
  })
}

export function useAddLoanLine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: AddLoanLineDto }) =>
      addLoanLineApi(loanId, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.refetchQueries({ queryKey: ['loans', variables.loanId] })
      toast({
        title: 'Ligne ajoutée',
        description: 'La ligne a été ajoutée au prêt',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible d\'ajouter la ligne',
      })
    },
  })
}

export function useRemoveLoanLine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, lineId }: { loanId: string; lineId: string }) =>
      removeLoanLineApi(loanId, lineId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.refetchQueries({ queryKey: ['loans', variables.loanId] })
      toast({
        title: 'Ligne supprimée',
        description: 'La ligne a été retirée du prêt',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer la ligne',
      })
    },
  })
}

export function useUploadPickupSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, file }: { loanId: string; file: File }) =>
      uploadPickupSignatureApi(loanId, file),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.refetchQueries({ queryKey: ['loans', variables.loanId] })
      toast({
        title: 'Signature enregistrée',
        description: 'La signature de retrait a été enregistrée',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible d\'enregistrer la signature',
      })
    },
  })
}

export function useUploadReturnSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, file }: { loanId: string; file: File }) =>
      uploadReturnSignatureApi(loanId, file),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.refetchQueries({ queryKey: ['loans', variables.loanId] })
      toast({
        title: 'Signature enregistrée',
        description: 'La signature de retour a été enregistrée',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible d\'enregistrer la signature',
      })
    },
  })
}

export function useCloseLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (loanId: string) => closeLoanApi(loanId),
    onSuccess: async (_, loanId) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', loanId] })
      await queryClient.refetchQueries({ queryKey: ['loans'] })
      toast({
        title: 'Prêt fermé',
        description: 'Le prêt a été fermé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de fermer le prêt',
      })
    },
  })
}

export function useDeleteLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteLoanApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.refetchQueries({ queryKey: ['loans'] })
      toast({
        title: 'Prêt supprimé',
        description: 'Le prêt a été supprimé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer le prêt',
      })
    },
  })
}
