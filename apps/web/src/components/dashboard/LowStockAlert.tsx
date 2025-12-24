import { useNavigate } from 'react-router-dom'
import { useLowStockItems } from '@/lib/hooks/useDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, ArrowRight, Package } from 'lucide-react'

const LOW_STOCK_THRESHOLD = 5

export function LowStockAlert() {
  const navigate = useNavigate()
  const { data: items, isLoading } = useLowStockItems()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes stock bas</CardTitle>
          <CardDescription>Articles avec stock insuffisant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Alertes stock bas
              {items && items.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {items.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Articles avec stock {'<'} {LOW_STOCK_THRESHOLD}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/stock')}>
            Voir tout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Aucun article en stock bas. Tout va bien!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                onClick={() => navigate('/stock')}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="font-medium">
                      {item.assetModel
                        ? `${item.assetModel.brand} ${item.assetModel.modelName}`
                        : 'Modèle inconnu'}
                    </p>
                  </div>
                  {item.assetModel && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Type: {item.assetModel.type}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="font-mono">
                    {item.quantity}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">restant{item.quantity > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
