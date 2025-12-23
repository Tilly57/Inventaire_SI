import { AssetStatus } from '@/lib/types/enums'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: AssetStatus
}

const statusConfig = {
  [AssetStatus.EN_STOCK]: {
    label: 'En stock',
    variant: 'default' as const,
  },
  [AssetStatus.PRETE]: {
    label: 'Prêté',
    variant: 'secondary' as const,
  },
  [AssetStatus.HS]: {
    label: 'Hors service',
    variant: 'destructive' as const,
  },
  [AssetStatus.REPARATION]: {
    label: 'En réparation',
    variant: 'outline' as const,
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}
