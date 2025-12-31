import { useEquipmentByType } from '@/lib/hooks/useDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Package } from 'lucide-react'

// Palette de couleurs pour le graphique
const COLORS = [
  '#EE2722', // Orange Tilly (primary)
  '#231F20', // Noir Tilly
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
]

export function EquipmentByTypeChart() {
  const { data: equipmentByType, isLoading } = useEquipmentByType()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type</CardTitle>
          <CardDescription>Distribution des équipements par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!equipmentByType || equipmentByType.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type</CardTitle>
          <CardDescription>Distribution des équipements par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>Aucun équipement à afficher</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Préparer les données pour le graphique
  const chartData = equipmentByType.map((item, index) => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }))

  // Custom label pour afficher le pourcentage
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} équipement{data.value > 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par type</CardTitle>
        <CardDescription>Distribution des équipements par catégorie</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, _entry: any) => {
                  const item = chartData.find(d => d.name === value)
                  return `${value} (${item?.value})`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Légende détaillée */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/50">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <span className="text-muted-foreground">
                {item.value} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
