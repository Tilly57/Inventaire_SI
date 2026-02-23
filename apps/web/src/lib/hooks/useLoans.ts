/**
 * @fileoverview Loans management hooks with React Query
 *
 * Provides complete loan workflow management with automatic caching,
 * cache invalidation, and toast notifications.
 *
 * Loan Workflow:
 * 1. Create loan (status: OPEN)
 * 2. Add loan lines (AssetItems or StockItems)
 * 3. Upload pickup signature (employee signs for equipment received)
 * 4. Upload return signature (employee signs for equipment returned)
 * 5. Close loan (status: CLOSED, sets closedAt timestamp)
 *
 * Features:
 * - Automatic cache management via React Query
 * - Nested cache invalidation (loans list + individual loan)
 * - Toast notifications for user feedback
 * - Error handling with user-friendly messages
 * - Digital signature upload support
 *
 * IMPORTANT: Closed loans cannot be modified. All line additions/removals
 * and signature uploads must occur while loan status is OPEN.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  getAllLoansApi,
  getLoansApiPaginated,
  getLoanApi,
  createLoanApi,
  addLoanLineApi,
  removeLoanLineApi,
  uploadPickupSignatureApi,
  uploadReturnSignatureApi,
  closeLoanApi,
  deleteLoanApi,
  batchDeleteLoansApi,
  deletePickupSignatureApi,
  deleteReturnSignatureApi,
} from '@/lib/api/loans.api'
import type {
  Loan,
  CreateLoanDto,
  AddLoanLineDto,
} from '@/lib/types/models.types'
import type { PaginationParams } from '@/lib/types/pagination.types'
import { useToast } from '@/lib/hooks/use-toast'

/**
 * Hook to fetch all loans
 *
 * Returns cached list of loans with employee information.
 * Cache key: ['loans']
 *
 * @returns React Query result object
 * @returns {Loan[] | undefined} data - Array of loans with employee relation
 * @returns {boolean} isLoading - Whether initial fetch is in progress
 * @returns {boolean} isError - Whether fetch failed
 *
 * @example
 * function LoansListPage() {
 *   const { data: loans = [], isLoading } = useLoans();
 *
 *   return (
 *     <Table>
 *       {loans.map(loan => (
 *         <Row key={loan.id}>
 *           <Cell>{loan.employee.firstName} {loan.employee.lastName}</Cell>
 *           <Cell><StatusBadge status={loan.status} /></Cell>
 *           <Cell>{loan.createdAt}</Cell>
 *         </Row>
 *       ))}
 *     </Table>
 *   );
 * }
 */
export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: getAllLoansApi,
  })
}

/**
 * Hook to fetch loans with pagination (RECOMMENDED)
 *
 * Returns paginated loans with metadata.
 * Uses keepPreviousData to show old data while new page is loading.
 * More efficient than useLoans() for large datasets.
 *
 * Query key includes all params for proper caching per page/filter combination.
 *
 * @param params - Pagination and filter parameters
 * @param params.page - Page number (default: 1)
 * @param params.pageSize - Items per page (default: 20)
 * @param params.status - Filter by status ('OPEN' or 'CLOSED')
 * @param params.employeeId - Filter by employee ID
 * @param params.sortBy - Field to sort by (default: 'openedAt')
 * @param params.sortOrder - Sort order (default: 'desc')
 * @returns React Query result with paginated data
 *
 * @example
 * function LoansListPage() {
 *   const [page, setPage] = useState(1);
 *   const [pageSize, setPageSize] = useState(20);
 *   const [status, setStatus] = useState<'OPEN' | 'CLOSED' | ''>('');
 *
 *   const { data, isLoading, isPlaceholderData } = useLoansPaginated({
 *     page,
 *     pageSize,
 *     status: status || undefined,
 *     sortBy: 'openedAt',
 *     sortOrder: 'desc'
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <>
 *       <Table data={data.data} />
 *       <Pagination
 *         page={data.pagination.page}
 *         totalPages={data.pagination.totalPages}
 *         onPageChange={setPage}
 *         disabled={isPlaceholderData}
 *       />
 *     </>
 *   );
 * }
 */
export function useLoansPaginated(
  params: PaginationParams & { status?: string; employeeId?: string } = {}
) {
  return useQuery({
    queryKey: ['loans', 'paginated', params],
    queryFn: () => getLoansApiPaginated(params),
    placeholderData: keepPreviousData, // Keep old data while fetching new page
  })
}

/**
 * Hook to fetch single loan by ID
 *
 * Returns loan with complete details:
 * - Employee information
 * - All loan lines with AssetItems/StockItems
 * - Signature URLs
 * - Status and timestamps
 *
 * Only fetches when ID is provided.
 * Cache key: ['loans', id]
 *
 * @param id - Loan ID to fetch
 * @returns React Query result object
 * @returns {Loan | undefined} data - Loan with lines[], employee, signatures
 *
 * @example
 * function LoanDetailsPage({ loanId }) {
 *   const { data: loan, isLoading } = useLoan(loanId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <h1>Loan #{loan.id}</h1>
 *       <p>Employee: {loan.employee.firstName} {loan.employee.lastName}</p>
 *       <p>Status: {loan.status}</p>
 *       <LoanLinesTable lines={loan.lines} />
 *       {loan.pickupSignatureUrl && <SignatureDisplay url={loan.pickupSignatureUrl} />}
 *       {loan.returnSignatureUrl && <SignatureDisplay url={loan.returnSignatureUrl} />}
 *     </div>
 *   );
 * }
 */
export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => getLoanApi(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new loan
 *
 * Creates a new loan with status OPEN.
 * Initial loan has no lines - use useAddLoanLine to add items.
 *
 * On success:
 * - Invalidates loans cache
 * - Refetches loans list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CreateLoanForm() {
 *   const createLoan = useCreateLoan();
 *   const { data: employees } = useEmployees();
 *
 *   const handleSubmit = (data) => {
 *     createLoan.mutate(data, {
 *       onSuccess: (loan) => navigate(`/loans/${loan.id}`)
 *     });
 *   };
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Select name="employeeId" options={employees} />
 *       <Button disabled={createLoan.isPending}>Create Loan</Button>
 *     </Form>
 *   );
 * }
 */
export function useCreateLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateLoanDto) => createLoanApi(data),
    onSuccess: async (loan: Loan) => {
      // Set the created loan data in cache immediately
      queryClient.setQueryData(['loans', loan.id], loan)

      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

/**
 * Hook to add line to loan
 *
 * Adds either an AssetItem or StockItem to the loan.
 * For AssetItems: automatically updates status to PRETE.
 * For StockItems: decrements quantity.
 *
 * IMPORTANT: Can only add lines to OPEN loans.
 *
 * On success:
 * - Invalidates both loans list and specific loan cache
 * - Refetches specific loan to show new line
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function AddLoanLineDialog({ loanId }) {
 *   const addLine = useAddLoanLine();
 *   const { data: assetItems } = useAssetItems();
 *
 *   const handleAddAsset = (assetItemId) => {
 *     addLine.mutate({
 *       loanId,
 *       data: { assetItemId }
 *     });
 *   };
 *
 *   return (
 *     <Select
 *       options={assetItems.filter(item => item.status === 'EN_STOCK')}
 *       onChange={handleAddAsset}
 *     />
 *   );
 * }
 */
export function useAddLoanLine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: AddLoanLineDto }) =>
      addLoanLineApi(loanId, data),
    onSuccess: async (_, variables) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

/**
 * Hook to remove line from loan
 *
 * Removes a loan line and reverts associated changes:
 * - AssetItem status reverts to EN_STOCK
 * - StockItem quantity is restored
 *
 * IMPORTANT: Can only remove lines from OPEN loans.
 *
 * On success:
 * - Invalidates both loans list and specific loan cache
 * - Refetches specific loan to reflect removal
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function LoanLineRow({ loanId, line }) {
 *   const removeLine = useRemoveLoanLine();
 *
 *   const handleRemove = () => {
 *     if (confirm('Remove this item from loan?')) {
 *       removeLine.mutate({ loanId, lineId: line.id });
 *     }
 *   };
 *
 *   return (
 *     <tr>
 *       <td>{line.assetItem?.assetTag || line.stockItem?.name}</td>
 *       <td><Button onClick={handleRemove}>Remove</Button></td>
 *     </tr>
 *   );
 * }
 */
export function useRemoveLoanLine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, lineId }: { loanId: string; lineId: string }) =>
      removeLoanLineApi(loanId, lineId),
    onSuccess: async (_, variables) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

/**
 * Hook to upload pickup signature
 *
 * Uploads employee signature confirming receipt of equipment.
 * File is converted to multipart/form-data and sent to backend.
 * Sets pickupSignatureUrl and pickupSignedAt on the loan.
 *
 * IMPORTANT: Required before loan can be closed.
 *
 * On success:
 * - Invalidates both loans list and specific loan cache
 * - Refetches specific loan to show signature
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function PickupSignatureCapture({ loanId }) {
 *   const uploadSignature = useUploadPickupSignature();
 *   const signaturePadRef = useRef();
 *
 *   const handleSave = async () => {
 *     const dataUrl = signaturePadRef.current.toDataURL();
 *     const blob = await fetch(dataUrl).then(r => r.blob());
 *     const file = new File([blob], 'signature.png', { type: 'image/png' });
 *
 *     uploadSignature.mutate({ loanId, file });
 *   };
 *
 *   return (
 *     <div>
 *       <SignaturePad ref={signaturePadRef} />
 *       <Button onClick={handleSave}>Save Signature</Button>
 *     </div>
 *   );
 * }
 */
export function useUploadPickupSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, signature }: { loanId: string; signature: File | string }) =>
      uploadPickupSignatureApi(loanId, signature),
    onSuccess: async (_, variables) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
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

/**
 * Hook to upload return signature
 *
 * Uploads employee signature confirming return of equipment.
 * File is converted to multipart/form-data and sent to backend.
 * Sets returnSignatureUrl and returnSignedAt on the loan.
 *
 * IMPORTANT: Can only upload after pickup signature exists.
 * Required before loan can be closed.
 *
 * On success:
 * - Invalidates both loans list and specific loan cache
 * - Refetches specific loan to show signature
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function ReturnSignatureCapture({ loanId }) {
 *   const uploadSignature = useUploadReturnSignature();
 *
 *   const handleFileUpload = (event) => {
 *     const file = event.target.files[0];
 *     if (file) {
 *       uploadSignature.mutate({ loanId, file });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" accept="image/*" onChange={handleFileUpload} />
 *     </div>
 *   );
 * }
 */
export function useUploadReturnSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ loanId, signature }: { loanId: string; signature: File | string }) =>
      uploadReturnSignatureApi(loanId, signature),
    onSuccess: async (_, variables) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] })
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

/**
 * Hook to close loan
 *
 * Closes an OPEN loan by setting status to CLOSED and closedAt timestamp.
 *
 * IMPORTANT: Backend enforces requirements:
 * - Loan must have at least one line
 * - Pickup signature must exist
 * - Return signature is optional but recommended
 *
 * Closing a loan makes it read-only - no further modifications allowed.
 *
 * On success:
 * - Invalidates both loans list and specific loan cache
 * - Refetches loans list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function CloseLoanButton({ loan }) {
 *   const closeLoan = useCloseLoan();
 *
 *   const handleClose = () => {
 *     if (!loan.pickupSignatureUrl) {
 *       alert('Pickup signature required');
 *       return;
 *     }
 *     if (loan.lines.length === 0) {
 *       alert('Loan must have at least one item');
 *       return;
 *     }
 *     if (confirm('Close this loan? This cannot be undone.')) {
 *       closeLoan.mutate(loan.id);
 *     }
 *   };
 *
 *   return (
 *     <Button onClick={handleClose} disabled={loan.status === 'CLOSED'}>
 *       Close Loan
 *     </Button>
 *   );
 * }
 */
export function useCloseLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (loanId: string) => closeLoanApi(loanId),
    onSuccess: async (_, loanId) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', loanId] })
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

/**
 * Hook to delete loan
 *
 * Permanently removes a loan from the system.
 * Reverts all associated changes:
 * - AssetItem statuses revert to EN_STOCK
 * - StockItem quantities are restored
 *
 * IMPORTANT: Backend may enforce constraints (e.g., cannot delete CLOSED loans
 * in some configurations for audit purposes).
 *
 * On success:
 * - Invalidates loans cache
 * - Refetches loans list
 * - Shows success toast
 *
 * @returns Mutation object
 *
 * @example
 * function DeleteLoanButton({ loan }) {
 *   const deleteLoan = useDeleteLoan();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete loan #${loan.id}? This will revert all item statuses.`)) {
 *       deleteLoan.mutate(loan.id, {
 *         onSuccess: () => navigate('/loans')
 *       });
 *     }
 *   };
 *
 *   return (
 *     <Button
 *       onClick={handleDelete}
 *       variant="destructive"
 *       disabled={loan.status === 'CLOSED'}
 *     >
 *       Delete Loan
 *     </Button>
 *   );
 * }
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteLoanApi(id),
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.invalidateQueries({ queryKey: ['stockItems'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

/**
 * Batch delete loans mutation (ADMIN only)
 *
 * Deletes multiple loans in a single atomic transaction.
 * Invalidates all affected query caches after successful deletion.
 *
 * @returns Mutation object with mutateAsync function
 *
 * @example
 * const batchDelete = useBatchDeleteLoans();
 * await batchDelete.mutateAsync(['id1', 'id2', 'id3']);
 */
export function useBatchDeleteLoans() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (loanIds: string[]) => batchDeleteLoansApi(loanIds),
    onSuccess: async (result) => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['assetItems'] })
      await queryClient.invalidateQueries({ queryKey: ['assetModels'] })
      await queryClient.invalidateQueries({ queryKey: ['stockItems'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      toast({
        title: 'Prêts supprimés',
        description: result.message,
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer les prêts',
      })
    },
  })
}

/**
 * Delete pickup signature mutation (ADMIN only)
 *
 * Removes the pickup signature from a loan. Only available to ADMIN users.
 * Invalidates loan cache after successful deletion.
 *
 * @returns Mutation object with mutateAsync function
 *
 * @example
 * const deletePickup = useDeletePickupSignature();
 * await deletePickup.mutateAsync('loanId123');
 */
export function useDeletePickupSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (loanId: string) => deletePickupSignatureApi(loanId),
    onSuccess: async (loan) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', loan.id] })

      toast({
        title: 'Signature supprimée',
        description: 'La signature de retrait a été supprimée',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer la signature',
      })
    },
  })
}

/**
 * Delete return signature mutation (ADMIN only)
 *
 * Removes the return signature from a loan. Only available to ADMIN users.
 * Invalidates loan cache after successful deletion.
 *
 * @returns Mutation object with mutateAsync function
 *
 * @example
 * const deleteReturn = useDeleteReturnSignature();
 * await deleteReturn.mutateAsync('loanId123');
 */
export function useDeleteReturnSignature() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (loanId: string) => deleteReturnSignatureApi(loanId),
    onSuccess: async (loan) => {
      await queryClient.invalidateQueries({ queryKey: ['loans'] })
      await queryClient.invalidateQueries({ queryKey: ['loans', loan.id] })

      toast({
        title: 'Signature supprimée',
        description: 'La signature de retour a été supprimée',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.response?.data?.error || 'Impossible de supprimer la signature',
      })
    },
  })
}
