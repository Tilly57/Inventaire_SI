/**
 * @fileoverview LoanInfoCard - Loan information display component
 *
 * Displays basic loan information including:
 * - Employee name and email
 * - Creation date
 * - Closure date (if closed)
 *
 * Extracted from LoanDetailsPage for better maintainability - Phase 3.3
 */
import { memo } from 'react'
import type { Loan } from '@/lib/types/models.types'
import { formatDate, formatFullName } from '@/lib/utils/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LoanInfoCardProps {
  loan: Loan
}

/**
 * Loan information card component
 *
 * Displays employee and date information for a loan.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param {LoanInfoCardProps} props - Component props
 * @returns {JSX.Element} Loan information card
 */
function LoanInfoCardComponent({ loan }: LoanInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Employé</p>
            <p className="font-medium">
              {loan.employee
                ? formatFullName(loan.employee.firstName, loan.employee.lastName)
                : 'Inconnu'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{loan.employee?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Créé le</p>
            <p className="font-medium">{formatDate(loan.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fermé le</p>
            <p className="font-medium">{loan.closedAt ? formatDate(loan.closedAt) : '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoized: Prevent unnecessary re-renders - Phase 3.3
export const LoanInfoCard = memo(LoanInfoCardComponent)
