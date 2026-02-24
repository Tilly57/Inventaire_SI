/** @fileoverview Page de gestion des biens individuels avec filtres, recherche et actions CRUD */
import { useState, useEffect, useDeferredValue, useMemo, lazy, Suspense } from 'react'
import { useAssetItems, useDeleteAssetItem } from '@/lib/hooks/useAssetItems'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
import { AssetItemsTable } from '@/components/assets/AssetItemsTable'

// Lazy load dialog
const AssetItemFormDialog = lazy(() => import('@/components/assets/AssetItemFormDialog').then(m => ({ default: m.AssetItemFormDialog })))
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Trash2 } from 'lucide-react'
import { AssetStatus, AssetStatusLabels } from '@/lib/types/enums'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'
import { useToast } from '@/lib/hooks/use-toast'

export function AssetItemsListPage() {
  const { data: items, isLoading, error } = useAssetItems()
  const { data: models } = useAssetModels()
  const deleteItem = useDeleteAssetItem()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const itemsList = Array.isArray(items) ? items : []
  const modelsList = Array.isArray(models) ? models : []

  // Defer search term to avoid blocking UI during typing
  const deferredSearchTerm = useDeferredValue(searchTerm)

  // Use deferred search term for filtering with useMemo
  const filteredItems = useMemo(
    () =>
      itemsList.filter((item) => {
        const matchesSearch =
          item.assetTag?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          item.serial?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          item.assetModel?.brand?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
          item.assetModel?.modelName?.toLowerCase().includes(deferredSearchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const matchesModel = modelFilter === 'all' || item.assetModelId === modelFilter

        return matchesSearch && matchesStatus && matchesModel
      }),
    [itemsList, deferredSearchTerm, statusFilter, modelFilter]
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchTerm, statusFilter, modelFilter])

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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer ${selectedItems.length} équipement(s) ? Cette action est irréversible.`
    )

    if (!confirmed) return

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const itemId of selectedItems) {
      try {
        await deleteItem.mutateAsync(itemId)
        successCount++
      } catch (error: any) {
        errorCount++
        const errorMsg = error.response?.data?.error || 'Erreur inconnue'
        errors.push(errorMsg)
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Suppression réussie',
        description: `${successCount} équipement(s) supprimé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`,
      })
    }

    if (errorCount > 0 && successCount === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur de suppression',
        description: errors[0] || 'Impossible de supprimer les équipements sélectionnés',
      })
    } else if (errorCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Certaines suppressions ont échoué',
        description: `${errorCount} équipement(s) n'ont pas pu être supprimés`,
      })
    }

    setSelectedItems([])
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
          <p className="text-destructive">Erreur lors du chargement des équipements</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Équipements</h1>
        <p className="text-muted-foreground mt-2">
          Gestion du parc informatique et des équipements individuels
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par tag, série, modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedItems.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer ({selectedItems.length})
            </Button>
          )}
          {/* <Button onClick={() => setIsCreating(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel équipement
          </Button> */}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.values(AssetStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {AssetStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modèles</SelectItem>
              {modelsList.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.brand} {model.modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{selectedItems.length}</strong> équipement(s) sélectionné(s)
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <AssetItemsTable
          items={paginatedItems}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
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

      <Suspense fallback={null}>
        <AssetItemFormDialog
          open={isCreating}
          onClose={() => setIsCreating(false)}
        />
      </Suspense>
    </div>
  )
}

export default AssetItemsListPage
