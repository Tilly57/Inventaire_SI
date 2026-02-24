/** @fileoverview Page de consultation des journaux d'audit avec filtres et export CSV */
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { User, Calendar, FileText, Download, Filter } from 'lucide-react'
import { getAllAuditLogs } from '@/lib/api/auditLogs.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

/**
 * AuditLogsPage - Page dédiée à la visualisation de l'audit trail complet
 *
 * Features:
 * - Liste complète des audit logs
 * - Filtres par action (CREATE, UPDATE, DELETE)
 * - Filtres par table
 * - Recherche par utilisateur
 * - Export CSV (à implémenter)
 */
export function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [searchUser, setSearchUser] = useState<string>('')

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['auditLogs', 'all'],
    queryFn: () => getAllAuditLogs({ limit: 100 }), // Get last 100 logs
  })

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Création'
      case 'UPDATE':
        return 'Modification'
      case 'DELETE':
        return 'Suppression'
      default:
        return action
    }
  }

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      User: 'Utilisateur',
      Employee: 'Employé',
      AssetModel: 'Modèle',
      AssetItem: 'Équipement',
      StockItem: 'Stock',
      Loan: 'Prêt',
      LoanLine: 'Ligne de prêt',
    }
    return labels[tableName] || tableName
  }

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!logs) return []

    return logs.filter((log: any) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesTable = tableFilter === 'all' || log.tableName === tableFilter
      const matchesUser = !searchUser ||
        log.user?.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchUser.toLowerCase())

      return matchesAction && matchesTable && matchesUser
    })
  }, [logs, actionFilter, tableFilter, searchUser])

  // Get unique tables for filter
  const uniqueTables = useMemo(() => {
    if (!logs) return []
    const tables = new Set(logs.map((log: any) => log.tableName))
    return Array.from(tables).sort()
  }, [logs])

  const handleExportCSV = () => {
    // Simple CSV export
    if (!filteredLogs || filteredLogs.length === 0) return

    const headers = ['Date', 'Action', 'Table', 'Enregistrement', 'Utilisateur', 'Adresse IP']
    const rows = filteredLogs.map((log: any) => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.tableName,
      log.recordId.slice(0, 8),
      log.user?.username || 'N/A',
      log.ipAddress || 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Audit Trail</h1>
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des audit logs
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground mt-2">
            Historique complet des modifications (derniers 100 logs)
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-muted/50 p-4 rounded-lg">
        <Filter className="h-5 w-5 text-muted-foreground" />

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes actions</SelectItem>
            <SelectItem value="CREATE">Création</SelectItem>
            <SelectItem value="UPDATE">Modification</SelectItem>
            <SelectItem value="DELETE">Suppression</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes tables</SelectItem>
            {uniqueTables.map((table: string) => (
              <SelectItem key={table} value={table}>
                {getTableLabel(table)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Rechercher utilisateur..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="w-full sm:w-[250px]"
        />

        {(actionFilter !== 'all' || tableFilter !== 'all' || searchUser) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter('all')
              setTableFilter('all')
              setSearchUser('')
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredLogs.length} résultat(s) sur {logs?.length || 0} logs
      </div>

      {/* Audit Logs List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Table</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Enregistrement</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun log trouvé
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {getTableLabel(log.tableName)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {log.recordId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {log.user?.username || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AuditLogsPage
