/** @fileoverview Carte de statistique avec icone, valeur et tendance */
import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
}

export const StatsCard = memo(function StatsCard({ title, value, icon: Icon, description, color = 'primary' }: StatsCardProps) {
  return (
    <Card className="border-accent-top stat-card group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
