/** @fileoverview Tableau de bord principal avec statistiques, alertes de stock bas et graphiques */
import { lazy, Suspense, useState } from 'react'
import { useDashboardStats } from '@/lib/hooks/useDashboard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentLoans } from '@/components/dashboard/RecentLoans'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'
import { OutOfServiceList } from '@/components/dashboard/OutOfServiceList'

// Lazy load chart component (heavy dependency on recharts)
const EquipmentByTypeChart = lazy(() => import('@/components/dashboard/EquipmentByTypeChart').then(m => ({ default: m.EquipmentByTypeChart })))
import { Users, Laptop, FileText, TrendingUp, AlertTriangle, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportDashboard } from '@/lib/api/export.api'
import { useToast } from '@/lib/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils/getErrorMessage'

export function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats()
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportDashboard()
      toast({
        title: 'Export réussi',
        description: 'Dashboard complet exporté vers Excel (multi-feuilles)',
      })
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erreur d\'export',
        description: getErrorMessage(error, 'Impossible d\'exporter le dashboard'),
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des statistiques. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble des statistiques et activités récentes
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Export...' : 'Exporter Dashboard Complet'}
        </Button>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="animate-slideIn" style={{ animationDelay: '100ms' }}>
            <StatsCard
              title="Employés"
              value={stats.totalEmployees}
              icon={Users}
              color="primary"
              description="Total des employés"
            />
          </div>
          <div className="animate-slideIn" style={{ animationDelay: '200ms' }}>
            <StatsCard
              title="Équipements"
              value={stats.totalAssets}
              icon={Laptop}
              color="info"
              description="Total des équipements"
            />
          </div>
          <div className="animate-slideIn" style={{ animationDelay: '300ms' }}>
            <StatsCard
              title="Prêts actifs"
              value={stats.activeLoans}
              icon={FileText}
              color="success"
              description="Prêts en cours"
            />
          </div>
          <div className="animate-slideIn" style={{ animationDelay: '400ms' }}>
            <StatsCard
              title="Articles prêtés"
              value={stats.loanedAssets}
              icon={TrendingUp}
              color="warning"
              description="Actuellement en prêt"
            />
          </div>
          <div className="animate-slideIn" style={{ animationDelay: '500ms' }}>
            <StatsCard
              title="Hors service"
              value={stats.outOfServiceAssets}
              icon={AlertTriangle}
              color="danger"
              description="Appareils hors service"
            />
          </div>
        </div>
      ) : null}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentLoans />
        <LowStockAlert />
      </div>

      {/* Additional Widgets - Hors Service & Equipment Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <OutOfServiceList />
        <Suspense fallback={
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="font-semibold mb-4">Répartition par type</h3>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        }>
          <EquipmentByTypeChart />
        </Suspense>
      </div>
    </div>
  )
}

export default DashboardPage
