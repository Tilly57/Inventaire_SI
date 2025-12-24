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
import { Pencil, Trash2 } from 'lucide-react'
import { EmployeeFormDialog } from './EmployeeFormDialog'
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog'

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

  return (
    <>
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
