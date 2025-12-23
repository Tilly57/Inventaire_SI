import { useState } from 'react'
import { useAssetItems } from '@/lib/hooks/useAssetItems'
import { useAssetModels } from '@/lib/hooks/useAssetModels'
import { AssetItemsTable } from '@/components/assets/AssetItemsTable'
import { AssetItemFormDialog } from '@/components/assets/AssetItemFormDialog'
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
import { AssetStatus } from '@/lib/types/enums'

export function AssetItemsListPage() {
  const { data: items, isLoading, error } = useAssetItems()
  const { data: models } = useAssetModels()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')

  const itemsList = Array.isArray(items) ? items : []
  const modelsList = Array.isArray(models) ? models : []

  const filteredItems = itemsList.filter((item) => {
    const matchesSearch =
      item.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.modelName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesModel = modelFilter === 'all' || item.modelId === modelFilter

    return matchesSearch && matchesStatus && matchesModel
  })

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Équipements</h1>
        <p className="text-muted-foreground mt-2">
          Gestion du parc informatique et des équipements individuels
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par tag, série, modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel équipement
          </Button>
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.values(AssetStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[200px]">
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

      <div className="border rounded-lg">
        <AssetItemsTable items={filteredItems} />
      </div>

      <AssetItemFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  )
}
