/** @fileoverview Canvas de capture de signature manuscrite */
import { useRef, useState } from 'react'
import ReactSignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eraser, Check, X } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
  disabled?: boolean
}

export function SignatureCanvas({ onSave, onCancel, disabled }: SignatureCanvasProps) {
  const sigCanvas = useRef<ReactSignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const handleClear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="text-center text-sm text-muted-foreground mb-2">
          Dessinez votre signature ci-dessous
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <ReactSignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: 'w-full h-48 rounded-lg cursor-crosshair',
            }}
            onEnd={handleEnd}
            backgroundColor="rgb(255, 255, 255)"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled || isEmpty}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={disabled || isEmpty}
          >
            <Check className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
