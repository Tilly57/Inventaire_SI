import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { read, utils } from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/lib/hooks/use-toast'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { createEmployeeApi } from '@/lib/api/employees.api'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react'

interface ImportEmployeesDialogProps {
  open: boolean
  onClose: () => void
}

interface EmployeeRow {
  Société?: string
  Agence?: string
  Civilité?: string
  Nom?: string
  Prénom?: string
}

interface ImportResult {
  success: number
  skipped: number
  errors: { row: number; name: string; error: string }[]
}

export function ImportEmployeesDialog({ open, onClose }: ImportEmployeesDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: existingEmployees = [] } = useEmployees()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  // Sanitize string for email (remove accents, spaces, special chars)
  const sanitizeForEmail = (str: string): string => {
    return str
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
      .trim()
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier Excel',
      })
      return
    }

    setIsImporting(true)
    const importResult: ImportResult = { success: 0, skipped: 0, errors: [] }

    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: EmployeeRow[] = utils.sheet_to_json(worksheet)

      // Build set of existing emails for fast lookup
      const existingEmails = new Set(
        existingEmployees.map(emp => emp.email.toLowerCase())
      )

      // Import each employee
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = i + 2 // +2 because Excel starts at 1 and has header row

        try {
          // Validate required fields
          if (!row.Nom || !row.Prénom) {
            importResult.errors.push({
              row: rowNumber,
              name: `${row.Prénom || ''} ${row.Nom || ''}`.trim() || 'Inconnu',
              error: 'Nom ou Prénom manquant',
            })
            continue
          }

          // Generate clean email
          const firstName = sanitizeForEmail(row.Prénom)
          const lastName = sanitizeForEmail(row.Nom)
          const email = `${firstName}.${lastName}@groupetilly.com`

          // Check if employee already exists
          if (existingEmails.has(email.toLowerCase())) {
            importResult.skipped++
            continue
          }

          // Create employee
          await createEmployeeApi({
            firstName: row.Prénom.trim(),
            lastName: row.Nom.trim(),
            email: email,
            dept: row.Agence?.trim() || undefined,
          })

          importResult.success++
        } catch (error: any) {
          importResult.errors.push({
            row: rowNumber,
            name: `${row.Prénom} ${row.Nom}`,
            error: error.response?.data?.error || error.message || 'Erreur inconnue',
          })
        }
      }

      setResult(importResult)
      queryClient.invalidateQueries({ queryKey: ['employees'] })

      if (importResult.errors.length === 0) {
        const message = importResult.skipped > 0
          ? `${importResult.success} nouveau(x) employé(s) importé(s), ${importResult.skipped} déjà existant(s)`
          : `${importResult.success} employé(s) importé(s) avec succès`

        toast({
          title: 'Import réussi',
          description: message,
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de lire le fichier Excel',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des employés depuis Excel</DialogTitle>
          <DialogDescription>
            Format attendu: Société | Agence | Civilité | Nom | Prénom
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload */}
          <div>
            <label htmlFor="excel-file" className="block text-sm font-medium mb-2">
              Fichier Excel (.xlsx, .xls)
            </label>
            <div className="flex gap-2">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              {file && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="whitespace-nowrap"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </>
                  )}
                </Button>
              )}
            </div>
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {/* Import results */}
          {result && (
            <div className="space-y-3">
              {/* Success summary */}
              {result.success > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>{result.success}</strong> nouveau(x) employé(s) importé(s) avec succès
                  </AlertDescription>
                </Alert>
              )}

              {/* Skipped (already exists) */}
              {result.skipped > 0 && (
                <Alert>
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong>{result.skipped}</strong> employé(s) ignoré(s) (déjà existants)
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div>
                      <strong>{result.errors.length}</strong> erreur(s) détectée(s):
                    </div>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="text-xs">
                          <strong>Ligne {err.row}:</strong> {err.name} - {err.error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Template info */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm">
                <strong>Format du fichier Excel:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Société</strong> - Nom de la société (optionnel)</li>
                  <li><strong>Agence</strong> - Département/Agence de l'employé</li>
                  <li><strong>Civilité</strong> - Mr/Mme/Mlle (optionnel)</li>
                  <li><strong>Nom</strong> - Nom de famille (requis)</li>
                  <li><strong>Prénom</strong> - Prénom (requis)</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Note: L'email sera généré automatiquement au format: prenom.nom@groupetilly.com
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
