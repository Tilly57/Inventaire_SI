/** @fileoverview Carte du tableau de bord listant les prets recents */
import { useNavigate } from 'react-router-dom'
import { useRecentLoans } from '@/lib/hooks/useDashboard'
import { formatDate, formatFullName } from '@/lib/utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'

export function RecentLoans() {
  const navigate = useNavigate()
  const { data: loans, isLoading } = useRecentLoans()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prêts récents</CardTitle>
          <CardDescription>Les 5 derniers prêts créés</CardDescription>
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
            <CardTitle>Prêts récents</CardTitle>
            <CardDescription>Les 5 derniers prêts créés</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/loans')}>
            Voir tout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!loans || loans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun prêt récent
          </p>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/loans/${loan.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {loan.employee
                      ? formatFullName(loan.employee.firstName, loan.employee.lastName)
                      : 'Employé supprimé'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {formatDate(loan.createdAt)}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {loan.lines?.length || 0} article{(loan.lines?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant={loan.status === 'OPEN' ? 'default' : 'secondary'}>
                  {loan.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
