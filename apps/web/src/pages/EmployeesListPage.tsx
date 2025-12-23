import { useState, useEffect } from 'react'
import { useEmployees, useDeleteEmployee } from '@/lib/hooks/useEmployees'
import { EmployeesTable } from '@/components/employees/EmployeesTable'
import { EmployeeFormDialog } from '@/components/employees/EmployeeFormDialog'
import { ImportEmployeesDialog } from '@/components/employees/ImportEmployeesDialog'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Upload, Trash2 } from 'lucide-react'
import { formatFullName } from '@/lib/utils/formatters'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'
import { useToast } from '@/lib/hooks/use-toast'

export function EmployeesListPage() {
  const { data: employees, isLoading, error } = useEmployees()
  const deleteEmployee = useDeleteEmployee()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const employeesList = Array.isArray(employees) ? employees : []

  // Debug logs
  console.log('🔍 DEBUG - employees:', employees)
  console.log('🔍 DEBUG - employeesList length:', employeesList.length)
  console.log('🔍 DEBUG - isLoading:', isLoading)
  console.log('🔍 DEBUG - error:', error)

  const filteredEmployees = employeesList.filter(
    (employee) =>
      formatFullName(employee.firstName, employee.lastName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.dept?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate pagination
  const totalItems = filteredEmployees.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${selectedEmployees.length} employé(s) ? Cette action est irréversible.`
    )

    if (!confirmed) return

    let successCount = 0
    let errorCount = 0

    for (const employeeId of selectedEmployees) {
      try {
        await deleteEmployee.mutateAsync(employeeId)
        successCount++
      } catch (error) {
        errorCount++
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Suppression réussie',
        description: `${successCount} employé(s) supprimé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`,
      })
    }

    if (errorCount > 0 && successCount === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de supprimer les employés sélectionnés`,
      })
    }

    setSelectedEmployees([])
  }

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
        {selectedEmployees.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selectedEmployees.length})
          </Button>
        )}
        <Button variant="outline" onClick={() => setIsImporting(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer Excel
        </Button>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel employé
        </Button>
      </div>

      {selectedEmployees.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{selectedEmployees.length}</strong> employé(s) sélectionné(s)
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <EmployeesTable
          employees={paginatedEmployees}
          selectedEmployees={selectedEmployees}
          onSelectionChange={setSelectedEmployees}
        />

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}
      </div>

      <EmployeeFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />

      <ImportEmployeesDialog
        open={isImporting}
        onClose={() => setIsImporting(false)}
      />
    </div>
  )
}
