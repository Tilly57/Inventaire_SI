import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertCircle, CheckCircle } from 'lucide-react'

interface BulkCreationPreviewProps {
  tagPrefix: string
  quantity: number
  preview?: {
    tags: string[]
    conflicts: string[]
    startNumber: number
  }
  isLoading?: boolean
}

export function BulkCreationPreview({
  tagPrefix,
  quantity,
  preview,
  isLoading
}: BulkCreationPreviewProps) {
  if (!tagPrefix || quantity < 2) {
    return null
  }

  if (isLoading) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Vérification des tags disponibles...</AlertDescription>
      </Alert>
    )
  }

  if (!preview) {
    return null
  }

  const { tags, conflicts, startNumber } = preview
  const hasConflicts = conflicts.length > 0

  if (hasConflicts) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">
            {conflicts.length} tag(s) existent déjà
          </div>
          <div className="text-xs mt-1">
            Conflits: {conflicts.join(', ')}
          </div>
          <div className="text-xs mt-1">
            Choisissez un autre préfixe ou supprimez les équipements existants.
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const firstFiveTags = tags.slice(0, 5)
  const lastTag = tags[tags.length - 1]

  return (
    <Alert>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription>
        <div className="font-medium mb-1">
          {quantity} équipement(s) seront créés
        </div>
        <div className="text-xs text-muted-foreground">
          Tags: {firstFiveTags.join(', ')}
          {tags.length > 5 && ` ... ${lastTag}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Numérotation de {String(startNumber).padStart(3, '0')} à {String(startNumber + quantity - 1).padStart(3, '0')}
        </div>
      </AlertDescription>
    </Alert>
  )
}
