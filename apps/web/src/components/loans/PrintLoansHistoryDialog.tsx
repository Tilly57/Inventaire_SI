/** @fileoverview Dialogue d'impression de l'historique des prets avec filtres */
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer } from 'lucide-react'
import type { Employee } from '@/lib/types/models.types'

interface PrintLoansHistoryDialogProps {
  open: boolean
  onClose: () => void
  employees: Employee[]
  onPrint: (employeeId?: string) => void
}

export function PrintLoansHistoryDialog({
  open,
  onClose,
  employees,
  onPrint,
}: PrintLoansHistoryDialogProps) {
  const [printType, setPrintType] = useState<'all' | 'employee'>('all')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const handlePrint = () => {
    if (printType === 'all') {
      onPrint()
    } else {
      if (!selectedEmployeeId) {
        return
      }
      onPrint(selectedEmployeeId)
    }
    onClose()
  }

  const canPrint = printType === 'all' || (printType === 'employee' && selectedEmployeeId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Imprimer l'historique des prêts
          </DialogTitle>
          <DialogDescription>
            Choisissez ce que vous souhaitez imprimer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={printType} onValueChange={(value) => setPrintType(value as 'all' | 'employee')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal cursor-pointer">
                Tout l'historique des prêts
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="employee" id="employee" />
              <Label htmlFor="employee" className="font-normal cursor-pointer">
                Historique d'un employé spécifique
              </Label>
            </div>
          </RadioGroup>

          {printType === 'employee' && (
            <div className="space-y-2">
              <Label htmlFor="employee-select">Sélectionner un employé</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choisir un employé..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                      {employee.email && ` (${employee.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handlePrint} disabled={!canPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
