import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CardSkeletonProps {
  hasHeader?: boolean
  lines?: number
}

export function CardSkeleton({ hasHeader = true, lines = 3 }: CardSkeletonProps) {
  return (
    <Card>
      {hasHeader && (
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardHeader>
      )}
      <CardContent className={hasHeader ? '' : 'pt-6'}>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-muted rounded animate-pulse"
              style={{ width: `${50 + Math.random() * 50}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
