import { useState, useEffect } from 'react'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
import { useAuth } from '@/lib/hooks/useAuth'
import { AssetModelsTable } from '@/components/assets/AssetModelsTable'
import { AssetModelFormDialog } from '@/components/assets/AssetModelFormDialog'
import { BulkDeleteAssetModelsDialog } from '@/components/assets/BulkDeleteAssetModelsDialog'
import { EquipmentTypesTable } from '@/components/equipmentTypes/EquipmentTypesTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Trash2 } from 'lucide-react'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/utils/constants'

export function AssetModelsListPage() {
  const { data: models, isLoading, error } = useAssetModels()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  const modelsList = Array.isArray(models) ? models : []

  const filteredModels = modelsList.filter(
    (model) =>
      model.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    setCurrentPage(1)
    setSelectedModelIds([])
  }, [searchTerm])

  const totalItems = filteredModels.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedModels = filteredModels.slice(startIndex, endIndex)

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
          <p className="text-destructive">Erreur lors du chargement des modèles</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modèles d'équipements</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les modèles d'équipements disponibles
        </p>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList>
          <TabsTrigger value="models">Modèles</TabsTrigger>
          {isAdmin && <TabsTrigger value="types">Types d'équipement</TabsTrigger>}
        </TabsList>

        <TabsContent value="models" className="space-y-6 mt-6">
          <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par marque, modèle ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && selectedModelIds.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleting(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selectedModelIds.length})
          </Button>
        )}
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {isAdmin && selectedModelIds.length > 0 && (
        <Alert>
          <AlertDescription>
            <strong>{selectedModelIds.length}</strong> modèle{selectedModelIds.length > 1 ? 's' : ''} sélectionné{selectedModelIds.length > 1 ? 's' : ''}
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <AssetModelsTable
          models={paginatedModels}
          selectedModels={isAdmin ? selectedModelIds : undefined}
          onSelectionChange={isAdmin ? setSelectedModelIds : undefined}
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

      <AssetModelFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />

      {isAdmin && (
        <BulkDeleteAssetModelsDialog
          models={modelsList.filter(model => selectedModelIds.includes(model.id))}
          open={isBulkDeleting}
          onClose={() => {
            setIsBulkDeleting(false)
            setSelectedModelIds([])
          }}
        />
      )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="types" className="mt-6">
            <EquipmentTypesTable />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
