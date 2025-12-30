import { useState } from 'react'
import type { Employee } from '@/lib/types/models.types'
import { formatDate, formatFullName } from '@/lib/utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { EmployeeFormDialog } from './EmployeeFormDialog'
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface EmployeesTableProps {
  employees: Employee[]
  selectedEmployees?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export function EmployeesTable({
  employees,
  selectedEmployees = [],
  onSelectionChange
}: EmployeesTableProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const { isMobile } = useMediaQuery()

  const isAllSelected = employees.length > 0 && selectedEmployees.length === employees.length
  const isSomeSelected = selectedEmployees.length > 0 && selectedEmployees.length < employees.length

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? employees.map(e => e.id) : [])
    }
  }

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedEmployees, employeeId]
        : selectedEmployees.filter(id => id !== employeeId)
      onSelectionChange(newSelection)
    }
  }

  // Vue mobile - Cards empilées
  if (isMobile) {
    if (employees.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Aucun employé trouvé
        </div>
      )
    }

    return (
      <>
        {/* Sélection globale en mobile */}
        {onSelectionChange && (
          <div className="flex items-center gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              checked={isSomeSelected ? 'indeterminate' : isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Sélectionner tout"
            />
            <span className="text-sm font-medium">
              {selectedEmployees.length > 0
                ? `${selectedEmployees.length} sélectionné(s)`
                : 'Tout sélectionner'}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {employees.map((employee) => (
            <Card key={employee.id} className="p-4 animate-fadeIn">
              <div className="space-y-3">
                {/* En-tête avec checkbox et nom */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {onSelectionChange && (
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                        aria-label={`Sélectionner ${formatFullName(employee.firstName, employee.lastName)}`}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-base">
                        {formatFullName(employee.firstName, employee.lastName)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{employee.email}</p>
                    </div>
                  </div>
                </div>

                {/* Informations */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Département</span>
                    <p className="font-medium">{employee.dept || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le</span>
                    <p className="font-medium">{formatDate(employee.createdAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingEmployee(employee)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeletingEmployee(employee)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <EmployeeFormDialog
          employee={editingEmployee}
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
        />

        <DeleteEmployeeDialog
          employee={deletingEmployee}
          open={!!deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
        />
      </>
    )
  }

  // Vue desktop - Tableau
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isSomeSelected ? 'indeterminate' : isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
            )}
            <TableHead>Nom complet</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 6 : 5} className="text-center text-muted-foreground">
                Aucun employé trouvé
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                      aria-label={`Sélectionner ${formatFullName(employee.firstName, employee.lastName)}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {formatFullName(employee.firstName, employee.lastName)}
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.dept || '-'}</TableCell>
                <TableCell>{formatDate(employee.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingEmployee(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingEmployee(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <EmployeeFormDialog
        employee={editingEmployee}
        open={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
      />

      <DeleteEmployeeDialog
        employee={deletingEmployee}
        open={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
      />
    </>
  )
}
