/** @fileoverview Vue d'impression de l'historique des prets */
import { useEffect } from 'react'
import type { Loan } from '@/lib/types/models.types'
import { formatDate, formatFullName } from '@/lib/utils/formatters'

interface LoansPrintViewProps {
  loans: Loan[]
  employeeName?: string
  onPrintComplete: () => void
}

export function LoansPrintView({ loans, employeeName, onPrintComplete }: LoansPrintViewProps) {
  useEffect(() => {
    // Trigger print dialog after component renders
    const timer = setTimeout(() => {
      window.print()
      onPrintComplete()
    }, 500)

    return () => clearTimeout(timer)
  }, [onPrintComplete])

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto print:block">
      <div className="max-w-5xl mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold mb-2">
            Historique des Prêts
          </h1>
          {employeeName && (
            <p className="text-lg">
              Employé : <span className="font-semibold">{employeeName}</span>
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Imprimé le : {today}
          </p>
          <p className="text-sm text-gray-600">
            Nombre total de prêts : {loans.length}
          </p>
        </div>

        {/* Loans List */}
        <div className="space-y-6">
          {loans.map((loan, index) => (
            <div key={loan.id} className="border border-gray-300 rounded-lg p-4 break-inside-avoid">
              <div className="flex justify-between items-start mb-3 pb-2 border-b">
                <div>
                  <h3 className="font-bold text-lg">
                    Prêt #{index + 1}
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {loan.id}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      loan.status === 'OPEN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {loan.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Employé</p>
                  <p className="font-medium">
                    {loan.employee
                      ? formatFullName(loan.employee.firstName, loan.employee.lastName)
                      : 'Employé supprimé'}
                  </p>
                  {loan.employee?.email && (
                    <p className="text-sm text-gray-600">{loan.employee.email}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Dates</p>
                  <p className="text-sm">
                    <span className="font-medium">Ouvert :</span> {formatDate(loan.createdAt)}
                  </p>
                  {loan.closedAt && (
                    <p className="text-sm">
                      <span className="font-medium">Fermé :</span> {formatDate(loan.closedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Loan Lines */}
              {loan.lines && loan.lines.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">
                    Articles prêtés ({loan.lines.length}) :
                  </p>
                  <div className="space-y-1">
                    {loan.lines.map((line) => (
                      <div key={line.id} className="text-sm pl-4">
                        {line.assetItem && (
                          <div>
                            <span className="font-medium">
                              {line.assetItem.assetModel?.type} {line.assetItem.assetModel?.brand}{' '}
                              {line.assetItem.assetModel?.modelName}
                            </span>
                            {line.assetItem.assetTag && (
                              <span className="text-gray-600"> - Tag: {line.assetItem.assetTag}</span>
                            )}
                            {line.assetItem.serial && (
                              <span className="text-gray-600"> - S/N: {line.assetItem.serial}</span>
                            )}
                          </div>
                        )}
                        {line.stockItem && (
                          <div>
                            <span className="font-medium">
                              {line.stockItem.assetModel?.type} {line.stockItem.assetModel?.brand}{' '}
                              {line.stockItem.assetModel?.modelName}
                            </span>
                            <span className="text-gray-600"> - Quantité: {line.quantity}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  {loan.pickupSignedAt ? (
                    <>
                      <p className="text-gray-600">Signature de retrait</p>
                      <p className="font-medium">{formatDate(loan.pickupSignedAt)}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Pas de signature de retrait</p>
                  )}
                </div>
                <div>
                  {loan.returnSignedAt ? (
                    <>
                      <p className="text-gray-600">Signature de retour</p>
                      <p className="font-medium">{formatDate(loan.returnSignedAt)}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Pas de signature de retour</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun prêt trouvé</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black text-sm text-gray-600">
          <p>Document généré automatiquement - Système de gestion d'inventaire</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}
