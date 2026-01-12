/**
 * @fileoverview Audit Logs API client
 *
 * Provides functions to interact with /api/audit-logs endpoints.
 */

import apiClient from './client'

interface AuditLog {
  id: string
  action: string
  tableName: string
  recordId: string
  oldValues: Record<string, any> | null
  newValues: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    email: string
    role: string
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * Get audit logs for a specific record
 */
export const getAuditLogs = async (
  tableName: string,
  recordId: string,
  limit: number = 50
): Promise<AuditLog[]> => {
  const response = await apiClient.get<ApiResponse<AuditLog[]>>(
    `/audit-logs/${tableName}/${recordId}`,
    {
      params: { limit },
    }
  )
  return response.data.data
}

/**
 * Get all audit logs (filtered)
 */
export const getAllAuditLogs = async (params?: {
  tableName?: string
  recordId?: string
  userId?: string
  limit?: number
}): Promise<AuditLog[]> => {
  const response = await apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs', {
    params,
  })
  return response.data.data
}
