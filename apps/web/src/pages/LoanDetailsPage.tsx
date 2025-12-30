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
 * Features:
 * - Real-time data via React Query hooks
 * - Signature image upload with preview
 * - Conditional actions based on loan status (OPEN/CLOSED)
 * - Validation before closing (requires pickup signature and items)
 * - Employee information display
 *
 * Loan Workflow UI:
 * 1. Add equipment to loan (Add button → AddLoanLineDialog)
 * 2. Upload pickup signature when employee receives equipment
 * 3. Employee uses equipment
 * 4. Upload return signature when equipment returned
 * 5. Close loan (button enabled only after signatures uploaded)
 *
 * Business Rules:
 * - Can only add/remove items when loan is OPEN
 * - Pickup signature requires at least one item
 * - Return signature requires pickup signature first
 * - Close button requires: items + pickup signature
 * - Closed loans are read-only (no edits allowed)
 *
 * Route: /loans/:id
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLoan, useRemoveLoanLine, useUploadPickupSignature, useUploadReturnSignature, useCloseLoan } from '@/lib/hooks/useLoans'
import { formatDate, formatFullName } from '@/lib/utils/formatters'
import { AddLoanLineDialog } from '@/components/loans/AddLoanLineDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Plus, Trash2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { API_URL } from '@/lib/utils/constants'

/**
 * Loan details page component
 *
 * Displays complete loan information including employee details, borrowed items,
 * signatures, and management actions. Adapts UI based on loan status (OPEN/CLOSED).
 *
 * @returns {JSX.Element} Loan details page with all loan information and actions
 *
 * @example
 * // Route configuration
 * <Route path="/loans/:id" element={<LoanDetailsPage />} />
 *
 * @example
 * // Navigation from loans list
 * navigate(`/loans/${loanId}`)
 */
export function LoanDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: loan, isLoading } = useLoan(id || '')
  const removeLine = useRemoveLoanLine()
  const uploadPickup = useUploadPickupSignature()
  const uploadReturn = useUploadReturnSignature()
  const closeLoan = useCloseLoan()

  const [isAddingLine, setIsAddingLine] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Prêt non trouvé</p>
      </div>
    )
  }

  const isOpen = loan.status === 'OPEN'
  const hasLines = (loan.lines?.length || 0) > 0
  const hasPickupSignature = !!loan.pickupSignatureUrl
  const hasReturnSignature = !!loan.returnSignatureUrl

  const handleRemoveLine = async (lineId: string) => {
    if (!confirm('Voulez-vous vraiment retirer cet article du prêt?')) return
    await removeLine.mutateAsync({ loanId: loan.id, lineId })
  }

  const handlePickupSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadPickup.mutateAsync({ loanId: loan.id, file })
    }
  }

  const handleReturnSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadReturn.mutateAsync({ loanId: loan.id, file })
    }
  }

  const handleCloseLoan = async () => {
    if (!confirm('Voulez-vous vraiment fermer ce prêt? Cette action est irréversible.')) return
    await closeLoan.mutateAsync(loan.id)
  }

  const canClose = isOpen && hasLines && hasPickupSignature

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/loans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Détails du prêt</h1>
        </div>
        <Badge variant={isOpen ? 'default' : 'secondary'} className="text-lg px-4 py-2">
          {isOpen ? 'Ouvert' : 'Fermé'}
        </Badge>
      </div>

      {/* Info employé */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Employé</p>
              <p className="font-medium">
                {loan.employee
                  ? formatFullName(loan.employee.firstName, loan.employee.lastName)
                  : 'Inconnu'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{loan.employee?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créé le</p>
              <p className="font-medium">{formatDate(loan.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fermé le</p>
              <p className="font-medium">{loan.closedAt ? formatDate(loan.closedAt) : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles prêtés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Articles prêtés</CardTitle>
              <CardDescription>{loan.lines?.length || 0} article(s)</CardDescription>
            </div>
            {isOpen && (
              <Button onClick={() => setIsAddingLine(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasLines ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun article n'a encore été ajouté à ce prêt
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Date du prêt</TableHead>
                  {isOpen && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.lines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {line.assetItem ? 'Équipement' : 'Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {line.assetItem
                        ? `${line.assetItem.assetTag} - ${line.assetItem.assetModel?.brand} ${line.assetItem.assetModel?.modelName}`
                        : line.stockItem?.assetModel ? `${line.stockItem.assetModel.brand} ${line.stockItem.assetModel.modelName}` : 'Inconnu'}
                    </TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {line.addedAt ? formatDate(line.addedAt) : formatDate(loan.openedAt)}
                    </TableCell>
                    {isOpen && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(line.id)}
                          disabled={removeLine.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Signature retrait */}
        <Card>
          <CardHeader>
            <CardTitle>Signature de retrait</CardTitle>
            <CardDescription>Signature de l'employé au retrait</CardDescription>
          </CardHeader>
          <CardContent>
            {hasPickupSignature ? (
              <div className="space-y-4">
                <img
                  src={`${API_URL}${loan.pickupSignatureUrl}`}
                  alt="Signature retrait"
                  className="w-full border rounded-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Signée le {loan.pickupSignedAt ? formatDate(loan.pickupSignedAt) : '-'}
                </p>
              </div>
            ) : isOpen ? (
              <div>
                <input
                  type="file"
                  id="pickup-signature"
                  accept="image/*"
                  onChange={handlePickupSignature}
                  className="hidden"
                  disabled={uploadPickup.isPending || !hasLines}
                />
                <label htmlFor="pickup-signature">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('pickup-signature')?.click()}
                    disabled={uploadPickup.isPending || !hasLines}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadPickup.isPending ? 'Upload...' : 'Télécharger signature'}
                    </span>
                  </Button>
                </label>
                {!hasLines && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez d'abord des articles au prêt
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune signature</p>
            )}
          </CardContent>
        </Card>

        {/* Signature retour */}
        <Card>
          <CardHeader>
            <CardTitle>Signature de retour</CardTitle>
            <CardDescription>Signature de l'employé au retour</CardDescription>
          </CardHeader>
          <CardContent>
            {hasReturnSignature ? (
              <div className="space-y-4">
                <img
                  src={`${API_URL}${loan.returnSignatureUrl}`}
                  alt="Signature retour"
                  className="w-full border rounded-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Signée le {loan.returnSignedAt ? formatDate(loan.returnSignedAt) : '-'}
                </p>
              </div>
            ) : isOpen ? (
              <div>
                <input
                  type="file"
                  id="return-signature"
                  accept="image/*"
                  onChange={handleReturnSignature}
                  className="hidden"
                  disabled={uploadReturn.isPending || !hasPickupSignature}
                />
                <label htmlFor="return-signature">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('return-signature')?.click()}
                    disabled={uploadReturn.isPending || !hasPickupSignature}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadReturn.isPending ? 'Upload...' : 'Télécharger signature'}
                    </span>
                  </Button>
                </label>
                {!hasPickupSignature && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Ajoutez d'abord la signature de retrait
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune signature</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fermer le prêt */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Fermer le prêt</CardTitle>
            <CardDescription>
              Fermez le prêt une fois tous les articles retournés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCloseLoan}
              disabled={!canClose || closeLoan.isPending}
              variant="default"
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

      <AddLoanLineDialog
        loanId={loan.id}
        open={isAddingLine}
        onClose={() => setIsAddingLine(false)}
      />
    </div>
  )
}
