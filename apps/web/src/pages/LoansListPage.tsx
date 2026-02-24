/** @fileoverview Page de gestion des prêts avec pagination serveur, filtres et suppression groupée */
import { useState, useEffect, useDeferredValue, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoansPaginated, useLoans } from '@/lib/hooks/useLoans'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { LoansTable } from '@/components/loans/LoansTable'

// Lazy load dialogs and print view
const LoanFormDialog = lazy(() => import('@/components/loans/LoanFormDialog').then(m => ({ default: m.LoanFormDialog })))
const BulkDeleteLoansDialog = lazy(() => import('@/components/loans/BulkDeleteLoansDialog').then(m => ({ default: m.BulkDeleteLoansDialog })))
const PrintLoansHistoryDialog = lazy(() => import('@/components/loans/PrintLoansHistoryDialog').then(m => ({ default: m.PrintLoansHistoryDialog })))
const LoansPrintView = lazy(() => import('@/components/loans/LoansPrintView').then(m => ({ default: m.LoansPrintView })))
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Trash2, Printer } from 'lucide-react'
import { LoanStatus } from '@/lib/types/enums'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'
import { formatFullName } from '@/lib/utils/formatters'

export function LoansListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: employees = [] } = useEmployees()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [printEmployeeId, setPrintEmployeeId] = useState<string | undefined>()
  const [showPrintView, setShowPrintView] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  // Debounce search to avoid excessive API calls
  const deferredSearch = useDeferredValue(searchTerm)

  // Server-side paginated query
  const { data: paginatedData, isLoading, error } = useLoansPaginated({
    page: currentPage,
    pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: deferredSearch.length >= 2 ? deferredSearch : undefined,
    sortBy: 'openedAt',
    sortOrder: 'desc',
  })

  // For print feature: fetch all loans (only when print view is needed)
  const { data: allLoans } = useLoans()

  const loans = paginatedData?.data ?? []
  const pagination = paginatedData?.pagination

  // Reset to page 1 and clear selection when filters change
  useEffect(() => {
    setCurrentPage(1)
    setSelectedLoanIds([])
  }, [deferredSearch, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleLoanCreated = (loanId: string) => {
    navigate(`/loans/${loanId}`)
  }

  const handlePrint = (employeeId?: string) => {
    setPrintEmployeeId(employeeId)
    setShowPrintView(true)
  }

  const handlePrintComplete = () => {
    setShowPrintView(false)
    setPrintEmployeeId(undefined)
  }

  // Get loans to print (filtered by employee if specified)
  const allLoansList = Array.isArray(allLoans) ? allLoans : []
  const loansToPrint = printEmployeeId
    ? allLoansList.filter(loan => loan.employeeId === printEmployeeId)
    : allLoansList

  const printEmployeeName = printEmployeeId
    ? (() => {
        const employee = employees.find(e => e.id === printEmployeeId)
        return employee ? formatFullName(employee.firstName, employee.lastName) : undefined
      })()
    : undefined

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
          <p className="text-destructive">Erreur lors du chargement des prêts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Prêts</h1>
        <p className="text-muted-foreground mt-2">
          Gestion des prêts d'équipements aux employés
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value={LoanStatus.OPEN}>Ouvert</SelectItem>
              <SelectItem value={LoanStatus.CLOSED}>Fermé</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isAdmin && selectedLoanIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleting(true)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer ({selectedLoanIds.length})
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setIsPrintDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer l'historique
              </Button>
            )}
            <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau prêt
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <LoansTable
          loans={loans}
          selectedLoans={isAdmin ? selectedLoanIds : undefined}
          onSelectionChange={isAdmin ? setSelectedLoanIds : undefined}
        />

        {pagination && pagination.totalItems > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        )}
      </div>

      <Suspense fallback={null}>
        <LoanFormDialog
          open={isCreating}
          onClose={() => setIsCreating(false)}
          onSuccess={handleLoanCreated}
        />
      </Suspense>

      {isAdmin && (
        <Suspense fallback={null}>
          <BulkDeleteLoansDialog
            loans={loans.filter(loan => selectedLoanIds.includes(loan.id))}
            open={isBulkDeleting}
            onClose={() => {
              setIsBulkDeleting(false)
              setSelectedLoanIds([])
            }}
          />
        </Suspense>
      )}

      {isAdmin && (
        <Suspense fallback={null}>
          <PrintLoansHistoryDialog
            open={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
            employees={employees}
            onPrint={handlePrint}
          />
        </Suspense>
      )}

      {showPrintView && (
        <Suspense fallback={null}>
          <LoansPrintView
            loans={loansToPrint}
            employeeName={printEmployeeName}
            onPrintComplete={handlePrintComplete}
          />
        </Suspense>
      )}
    </div>
  )
}

export default LoansListPage
