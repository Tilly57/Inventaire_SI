import { useState } from 'react'
import { useStockItems } from '@/lib/hooks/useStockItems'
import { StockItemsTable } from '@/components/stock/StockItemsTable'
import { StockItemFormDialog } from '@/components/stock/StockItemFormDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { LOW_STOCK_THRESHOLD } from '@/lib/utils/constants'

export function StockItemsListPage() {
  const { data: items, isLoading, error } = useStockItems()
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const itemsList = Array.isArray(items) ? items : []

  const filteredItems = itemsList.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = itemsList.filter(item => item.quantity < LOW_STOCK_THRESHOLD)

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
          Gestion des articles en stock (consommables)
        </p>
      </div>

      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerte stock bas</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} article{lowStockItems.length > 1 ? 's ont' : ' a'} une quantité
            inférieure à {LOW_STOCK_THRESHOLD} unités.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      <div className="border rounded-lg">
        <StockItemsTable items={filteredItems} />
      </div>

      <StockItemFormDialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  )
}
