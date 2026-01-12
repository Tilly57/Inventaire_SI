import { useState, useMemo, useCallback, memo, lazy, Suspense } from 'react'
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

// Lazy load dialogs
const EmployeeFormDialog = lazy(() => import('./EmployeeFormDialog').then(m => ({ default: m.EmployeeFormDialog })))
const DeleteEmployeeDialog = lazy(() => import('./DeleteEmployeeDialog').then(m => ({ default: m.DeleteEmployeeDialog })))
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

interface EmployeesTableProps {
  employees: Employee[]
  selectedEmployees?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Memoized Employee Row Component for Desktop
interface EmployeeRowProps {
  employee: Employee
  isSelected: boolean
  onSelect: (employeeId: string, checked: boolean) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  showCheckbox: boolean
}

const EmployeeRow = memo(({
  employee,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showCheckbox
}: EmployeeRowProps) => {
  return (
    <TableRow>
      {showCheckbox && (
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(employee.id, checked as boolean)}
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
            onClick={() => onEdit(employee)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(employee)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

EmployeeRow.displayName = 'EmployeeRow'

// Memoized Employee Card Component for Mobile
interface EmployeeCardProps {
  employee: Employee
  isSelected: boolean
  onSelect: (employeeId: string, checked: boolean) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  showCheckbox: boolean
}

const EmployeeCard = memo(({
  employee,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  showCheckbox
}: EmployeeCardProps) => {
  return (
    <Card className="p-4 animate-fadeIn">
      <div className="space-y-3">
        {/* En-tête avec checkbox et nom */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(employee.id, checked as boolean)}
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
            onClick={() => onEdit(employee)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(employee)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  )
})

EmployeeCard.displayName = 'EmployeeCard'

export function EmployeesTable({
  employees,
  selectedEmployees = [],
  onSelectionChange
}: EmployeesTableProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const { isMobile } = useMediaQuery()

  // Memoized calculations
  const isAllSelected = useMemo(
    () => employees.length > 0 && selectedEmployees.length === employees.length,
    [employees.length, selectedEmployees.length]
  )

  const isSomeSelected = useMemo(
    () => selectedEmployees.length > 0 && selectedEmployees.length < employees.length,
    [selectedEmployees.length, employees.length]
  )

  // Memoized callbacks
  const handleSelectAll = useCallback((checked: boolean | 'indeterminate') => {
    if (onSelectionChange) {
      onSelectionChange(checked === true ? employees.map(e => e.id) : [])
    }
  }, [onSelectionChange, employees])

  const handleSelectEmployee = useCallback((employeeId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedEmployees, employeeId]
        : selectedEmployees.filter(id => id !== employeeId)
      onSelectionChange(newSelection)
    }
  }, [onSelectionChange, selectedEmployees])

  const handleEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee)
  }, [])

  const handleDelete = useCallback((employee: Employee) => {
    setDeletingEmployee(employee)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setEditingEmployee(null)
  }, [])

  const handleCloseDelete = useCallback(() => {
    setDeletingEmployee(null)
  }, [])

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
            <EmployeeCard
              key={employee.id}
              employee={employee}
              isSelected={selectedEmployees.includes(employee.id)}
              onSelect={handleSelectEmployee}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showCheckbox={!!onSelectionChange}
            />
          ))}
        </div>

        <Suspense fallback={null}>
          <EmployeeFormDialog
            employee={editingEmployee}
            open={!!editingEmployee}
            onClose={handleCloseEdit}
          />
        </Suspense>

        <Suspense fallback={null}>
          <DeleteEmployeeDialog
            employee={deletingEmployee}
            open={!!deletingEmployee}
            onClose={handleCloseDelete}
          />
        </Suspense>
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
              <EmployeeRow
                key={employee.id}
                employee={employee}
                isSelected={selectedEmployees.includes(employee.id)}
                onSelect={handleSelectEmployee}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showCheckbox={!!onSelectionChange}
              />
            ))
          )}
        </TableBody>
      </Table>
      </div>

      <Suspense fallback={null}>
        <EmployeeFormDialog
          employee={editingEmployee}
          open={!!editingEmployee}
          onClose={handleCloseEdit}
        />
      </Suspense>

      <Suspense fallback={null}>
        <DeleteEmployeeDialog
          employee={deletingEmployee}
          open={!!deletingEmployee}
          onClose={handleCloseDelete}
        />
      </Suspense>
    </>
  )
}
