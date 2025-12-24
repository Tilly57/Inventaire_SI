import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoans } from '@/lib/hooks/useLoans'
import { LoansTable } from '@/components/loans/LoansTable'
import { LoanFormDialog } from '@/components/loans/LoanFormDialog'
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
import { Plus, Search } from 'lucide-react'
import { LoanStatus } from '@/lib/types/enums'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'

export function LoansListPage() {
  const navigate = useNavigate()
  const { data: loans, isLoading, error } = useLoans()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const loansList = Array.isArray(loans) ? loans : []

  const filteredLoans = loansList.filter((loan) => {
    const matchesSearch =
      loan.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter

    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const totalItems = filteredLoans.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prêts</h1>
        <p className="text-muted-foreground mt-2">
          Gestion des prêts d'équipements aux employés
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value={LoanStatus.OPEN}>Ouvert</SelectItem>
              <SelectItem value={LoanStatus.CLOSED}>Fermé</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau prêt
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <LoansTable loans={paginatedLoans} />

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

      <LoanFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
        onSuccess={handleLoanCreated}
      />
    </div>
  )
}
