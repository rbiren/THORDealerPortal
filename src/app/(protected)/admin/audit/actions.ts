'use server'

import { getAuditLogs, getAuditStats, type AuditLogFilter, type AuditLogResult } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

// Re-export types for client components
export type { AuditLogEntry, AuditLogResult } from '@/lib/audit'

export type AuditLogFilterParams = {
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

/**
 * Fetch audit logs with filters
 */
export async function fetchAuditLogs(params: AuditLogFilterParams): Promise<AuditLogResult> {
  const filter: AuditLogFilter = {
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  }

  return getAuditLogs(filter)
}

/**
 * Get audit log statistics
 */
export async function fetchAuditStats(): Promise<{
  totalLogs: number
  logsByAction: Record<string, number>
  logsByEntityType: Record<string, number>
  recentActivity: number
}> {
  return getAuditStats()
}

/**
 * Get users for filter dropdown
 */
export async function getFilterUsers(): Promise<{ id: string; name: string; email: string }[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: { lastName: 'asc' },
    take: 100,
  })

  return users.map((u: { id: string; firstName: string | null; lastName: string | null; email: string }) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
  }))
}

/**
 * Get unique entity types from audit logs
 */
export async function getEntityTypes(): Promise<string[]> {
  const result = await prisma.auditLog.findMany({
    select: { entityType: true },
    distinct: ['entityType'],
    orderBy: { entityType: 'asc' },
  })
  return result.map((r: { entityType: string }) => r.entityType)
}

/**
 * Get unique actions from audit logs
 */
export async function getActionTypes(): Promise<string[]> {
  const result = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  })
  return result.map((r: { action: string }) => r.action)
}
