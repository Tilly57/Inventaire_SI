import { useNavigate } from 'react-router-dom'
import { useOutOfServiceItems } from '@/lib/hooks/useDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

export function OutOfServiceList() {
  const navigate = useNavigate()
  const { data: items, isLoading } = useOutOfServiceItems()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Équipements hors service</CardTitle>
          <CardDescription>Appareils nécessitant réparation ou remplacement</CardDescription>
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
              Hors service
              {items && items.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {items.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Appareils hors service (HS)</CardDescription>
          </div>
          {items && items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/asset-items?status=HS')}>
              Voir tout
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Aucun équipement hors service. Tous les équipements sont opérationnels!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                onClick={() => navigate(`/asset-items/${item.id}`)}
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
                  <div className="mt-1 ml-6 space-y-1">
                    {item.assetModel && (
                      <p className="text-xs text-muted-foreground">
                        Type: {item.assetModel.type}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tag: {item.assetTag}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="destructive">HS</Badge>
              </div>
            ))}
            {items.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                + {items.length - 5} autre{items.length - 5 > 1 ? 's' : ''} équipement{items.length - 5 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
