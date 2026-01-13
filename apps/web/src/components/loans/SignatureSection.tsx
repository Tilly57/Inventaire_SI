/**
 * @fileoverview SignatureSection - Single signature display and management
 *
 * Reusable component for both pickup and return signatures with:
 * - Signature display with image
 * - Sign button with canvas
 * - Edit/Delete actions (admin only)
 * - Conditional rendering based on loan status
 *
 * Extracted from LoanDetailsPage for better maintainability - Phase 3.3
 */
import { memo, useState } from 'react'
import { formatDate } from '@/lib/utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignatureCanvas } from '@/components/common/SignatureCanvas'
import { LazyImage } from '@/components/common/LazyImage'
import { Pen, Trash2 } from 'lucide-react'
import { BASE_URL } from '@/lib/utils/constants'

interface SignatureSectionProps {
  title: string
  description: string
  signatureUrl?: string | null
  signedAt?: Date | string | null
  isOpen: boolean
  isAdmin: boolean
  canSign: boolean
  cannotSignReason?: string
  onSave: (dataUrl: string) => Promise<void>
  onDelete: () => Promise<void>
  isSaving: boolean
  isDeleting: boolean
}

/**
 * Signature section component
 *
 * Displays and manages a single signature (pickup or return).
 * Memoized to prevent unnecessary re-renders.
 *
 * @param {SignatureSectionProps} props - Component props
 * @returns {JSX.Element} Signature card
 */
function SignatureSectionComponent({
  title,
  description,
  signatureUrl,
  signedAt,
  isOpen,
  isAdmin,
  canSign,
  cannotSignReason,
  onSave,
  onDelete,
  isSaving,
  isDeleting
}: SignatureSectionProps) {
  const [showCanvas, setShowCanvas] = useState(false)
  const hasSignature = !!signatureUrl

  const handleSave = async (dataUrl: string) => {
    await onSave(dataUrl)
    setShowCanvas(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSignature ? (
          <div className="space-y-4">
            <LazyImage
              src={`${BASE_URL}${signatureUrl}`}
              alt={title}
              className="w-full border rounded-lg"
            />
            <p className="text-sm text-muted-foreground">
              Signée le {signedAt ? formatDate(signedAt) : '-'}
            </p>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCanvas(true)}
                  disabled={isDeleting}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        ) : isOpen ? (
          <div>
            {showCanvas ? (
              <SignatureCanvas
                onSave={handleSave}
                onCancel={() => setShowCanvas(false)}
                disabled={isSaving}
              />
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCanvas(true)}
                  disabled={isSaving || !canSign}
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Signer
                </Button>
                {!canSign && cannotSignReason && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {cannotSignReason}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune signature</p>
        )}
      </CardContent>
    </Card>
  )
}

// Memoized: Prevent unnecessary re-renders - Phase 3.3
export const SignatureSection = memo(SignatureSectionComponent)
