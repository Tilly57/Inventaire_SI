import { useState } from 'react'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { EmployeesTable } from '@/components/employees/EmployeesTable'
import { EmployeeFormDialog } from '@/components/employees/EmployeeFormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { formatFullName } from '@/lib/utils/formatters'

export function EmployeesListPage() {
  const { data: employees, isLoading, error } = useEmployees()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const employeesList = Array.isArray(employees) ? employees : []

  const filteredEmployees = employeesList.filter(
    (employee) =>
      formatFullName(employee.firstName, employee.lastName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.dept?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Erreur lors du chargement des employés</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Employés</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les employés qui peuvent emprunter du matériel
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel employé
        </Button>
      </div>

      <div className="border rounded-lg">
        <EmployeesTable employees={filteredEmployees} />
      </div>

      <EmployeeFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  )
}
