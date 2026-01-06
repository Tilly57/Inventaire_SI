import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, User, Calendar, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditTrailProps {
  tableName: string;
  recordId: string;
  limit?: number;
}

interface AuditLog {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * AuditTrail Component
 * Displays audit history for a specific record
 */
export function AuditTrail({ tableName, recordId, limit = 20 }: AuditTrailProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', tableName, recordId],
    queryFn: async () => {
      const response = await api.get(`/audit-logs/${tableName}/${recordId}`, {
        params: { limit },
      });
      return response.data.data as AuditLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement de l'historique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Erreur lors du chargement de l'historique
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-8 text-center">
        <History className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Aucun historique disponible</p>
      </div>
    );
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { label: 'Création', color: 'bg-green-100 text-green-800' };
      case 'UPDATE':
        return { label: 'Modification', color: 'bg-blue-100 text-blue-800' };
      case 'DELETE':
        return { label: 'Suppression', color: 'bg-red-100 text-red-800' };
      default:
        return { label: action, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <History className="h-5 w-5" />
        <span>Historique des modifications</span>
      </div>

      <div className="space-y-3">
        {data.map((log) => {
          const actionInfo = getActionLabel(log.action);

          return (
            <div
              key={log.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionInfo.color}`}
                  >
                    {actionInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', {
                      locale: fr,
                    })}
                  </span>
                </div>
              </div>

              {/* User info */}
              <div className="mt-2 flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">{log.user.email}</span>
                <span className="text-gray-500">({log.user.role})</span>
              </div>

              {/* Changes details */}
              {(log.oldValues || log.newValues) && (
                <div className="mt-3 space-y-2">
                  {log.action === 'UPDATE' && log.oldValues && log.newValues && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Modifications</span>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        {Object.keys(log.newValues).map((key) => {
                          if (log.oldValues?.[key] !== log.newValues?.[key]) {
                            return (
                              <div key={key} className="flex gap-2">
                                <span className="font-medium text-gray-600">
                                  {key}:
                                </span>
                                <span className="text-red-600 line-through">
                                  {JSON.stringify(log.oldValues?.[key])}
                                </span>
                                <span>→</span>
                                <span className="text-green-600">
                                  {JSON.stringify(log.newValues?.[key])}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {log.action === 'CREATE' && log.newValues && (
                    <div className="rounded-md bg-green-50 p-3">
                      <div className="text-xs font-semibold text-green-700">
                        Nouvel enregistrement créé
                      </div>
                    </div>
                  )}

                  {log.action === 'DELETE' && log.oldValues && (
                    <div className="rounded-md bg-red-50 p-3">
                      <div className="text-xs font-semibold text-red-700">
                        Enregistrement supprimé
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IP and User Agent */}
              {(log.ipAddress || log.userAgent) && (
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  {log.ipAddress && (
                    <div>IP: {log.ipAddress}</div>
                  )}
                  {log.userAgent && (
                    <div className="truncate" title={log.userAgent}>
                      {log.userAgent}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
