/**
 * @fileoverview LoanDetailsPage - Detailed view of a single loan
 *
 * This page provides:
 * - Loan overview (employee, status, dates)
 * - Loan lines management (add/remove equipment)
 * - Pickup signature upload and display
 * - Return signature upload and display
 * - Loan closure functionality
 *
 * Refactored in Phase 3.3 to use sub-components for better maintainability.
 * Reduced from 566 lines to ~200 lines.
 *
 * Sub-components:
 * - LoanInfoCard - Employee and date information
 * - LoanLinesTable - Borrowed items table/cards
 * - SignatureSection - Signature display and management
 *
 * Route: /loans/:id
 */
import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useLoan,
  useRemoveLoanLine,
  useUploadPickupSignature,
  useUploadReturnSignature,
  useCloseLoan,
  useDeletePickupSignature,
  useDeleteReturnSignature
} from '@/lib/hooks/useLoans'

// Sub-components - Phase 3.3
import { LoanInfoCard } from '@/components/loans/LoanInfoCard'
import { LoanLinesTable } from '@/components/loans/LoanLinesTable'
import { SignatureSection } from '@/components/loans/SignatureSection'

// Lazy load dialog
const AddLoanLineDialog = lazy(() => import('@/components/loans/AddLoanLineDialog').then(m => ({ default: m.AddLoanLineDialog })))

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'
import { UserRole } from '@/lib/types/enums'

/**
 * Loan details page component
 *
 * Displays complete loan information including employee details, borrowed items,
 * signatures, and management actions. Adapts UI based on loan status (OPEN/CLOSED).
 *
 * @returns {JSX.Element} Loan details page with all loan information and actions
 */
export function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Data fetching
  const { data: loan, isLoading } = useLoan(id || '')

  // Mutations
  const removeLine = useRemoveLoanLine()
  const uploadPickup = useUploadPickupSignature()
  const uploadReturn = useUploadReturnSignature()
  const closeLoan = useCloseLoan()
  const deletePickup = useDeletePickupSignature()
  const deleteReturn = useDeleteReturnSignature()

  // Local state
  const [isAddingLine, setIsAddingLine] = useState(false)
  const { confirm, dialogProps } = useConfirmDialog()

  // Computed values
  const isAdmin = user?.role === UserRole.ADMIN
  const isOpen = loan?.status === 'OPEN'
  const hasLines = (loan?.lines?.length || 0) > 0
  const hasPickupSignature = !!loan?.pickupSignatureUrl
  const canClose = isOpen && hasLines && hasPickupSignature

  // Event handlers
  const handleRemoveLine = async (lineId: string) => {
    if (!await confirm({ title: 'Retirer l\'article', description: 'Voulez-vous vraiment retirer cet article du prêt ?' })) return
    await removeLine.mutateAsync({ loanId: loan!.id, lineId })
  }

  const handleSavePickupSignature = async (dataUrl: string) => {
    await uploadPickup.mutateAsync({ loanId: loan!.id, signature: dataUrl })
  }

  const handleSaveReturnSignature = async (dataUrl: string) => {
    await uploadReturn.mutateAsync({ loanId: loan!.id, signature: dataUrl })
  }

  const handleCloseLoan = async () => {
    if (!await confirm({ title: 'Fermer le prêt', description: 'Voulez-vous vraiment fermer ce prêt ? Cette action est irréversible.' })) return
    await closeLoan.mutateAsync(loan!.id)
  }

  const handleDeletePickupSignature = async () => {
    if (!await confirm({ title: 'Supprimer la signature', description: 'Voulez-vous vraiment supprimer la signature de retrait ?' })) return
    await deletePickup.mutateAsync(loan!.id)
  }

  const handleDeleteReturnSignature = async () => {
    if (!await confirm({ title: 'Supprimer la signature', description: 'Voulez-vous vraiment supprimer la signature de retour ?' })) return
    await deleteReturn.mutateAsync(loan!.id)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not found state
  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Prêt non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/loans')} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Détails du prêt</h1>
        </div>
        <Badge variant={isOpen ? 'default' : 'secondary'} className="text-base sm:text-lg px-4 py-2">
          {isOpen ? 'Ouvert' : 'Fermé'}
        </Badge>
      </div>

      {/* Employee Info - Phase 3.3 */}
      <LoanInfoCard loan={loan} />

      {/* Loan Lines - Phase 3.3 */}
      <LoanLinesTable
        loan={loan}
        isOpen={isOpen || false}
        onAddLine={() => setIsAddingLine(true)}
        onRemoveLine={handleRemoveLine}
        isRemoving={removeLine.isPending}
      />

      {/* Signatures - Phase 3.3 */}
      <div className="grid md:grid-cols-2 gap-6">
        <SignatureSection
          title="Signature de retrait"
          description="Signature de l'employé au retrait"
          signatureUrl={loan.pickupSignatureUrl}
          signedAt={loan.pickupSignedAt}
          isOpen={isOpen || false}
          isAdmin={isAdmin}
          canSign={hasLines}
          cannotSignReason="Ajoutez d'abord des articles au prêt"
          onSave={handleSavePickupSignature}
          onDelete={handleDeletePickupSignature}
          isSaving={uploadPickup.isPending}
          isDeleting={deletePickup.isPending}
        />

        <SignatureSection
          title="Signature de retour"
          description="Signature de l'employé au retour"
          signatureUrl={loan.returnSignatureUrl}
          signedAt={loan.returnSignedAt}
          isOpen={isOpen || false}
          isAdmin={isAdmin}
          canSign={hasPickupSignature}
          cannotSignReason="Ajoutez d'abord la signature de retrait"
          onSave={handleSaveReturnSignature}
          onDelete={handleDeleteReturnSignature}
          isSaving={uploadReturn.isPending}
          isDeleting={deleteReturn.isPending}
        />
      </div>

      {/* Close Loan */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Fermer le prêt</CardTitle>
            <CardDescription>
              Fermez le prêt une fois tous les articles retournés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCloseLoan}
              disabled={!canClose || closeLoan.isPending}
              variant="default"
              className="w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {closeLoan.isPending ? 'Fermeture...' : 'Fermer le prêt'}
            </Button>
            {!canClose && (
              <p className="text-sm text-muted-foreground mt-2">
                {!hasLines && 'Ajoutez des articles au prêt. '}
                {!hasPickupSignature && 'Ajoutez la signature de retrait.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Line Dialog */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <AddLoanLineDialog
            loanId={loan.id}
            open={isAddingLine}
            onClose={() => setIsAddingLine(false)}
          />
        </Suspense>
      </ErrorBoundary>

      <ConfirmDialog {...dialogProps} />
    </div>
  )
}

export default LoanDetailsPage
