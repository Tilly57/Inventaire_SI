import { useState, useEffect } from 'react'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
import { StockItemsTable } from '@/components/stock/StockItemsTable'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { LOW_STOCK_THRESHOLD, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'
import { useNavigate } from 'react-router-dom'

export function StockItemsListPage() {
  const { data: models, isLoading, error } = useAssetModels()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const itemsList = Array.isArray(models) ? models : []

  const filteredItems = itemsList.filter(
    (model) =>
      model.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = itemsList.filter(item => (item._count?.items || 0) < LOW_STOCK_THRESHOLD)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const totalItems = filteredItems.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
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
          <p className="text-destructive">Erreur lors du chargement du stock</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock</h1>
        <p className="text-muted-foreground mt-2">
          Vue consolidée de tous les équipements et consommables
        </p>
      </div>

      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerte stock bas</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} modèle{lowStockItems.length > 1 ? 's ont' : ' a'} une quantité
            inférieure à {LOW_STOCK_THRESHOLD} unités.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par type, marque ou modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* <Button onClick={() => navigate('/asset-models')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modèle
        </Button> */}
      </div>

      <div className="border rounded-lg">
        <StockItemsTable items={paginatedItems} />

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
    </div>
  )
}
