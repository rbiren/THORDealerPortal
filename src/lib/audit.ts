import { prisma } from './prisma'
import { headers } from 'next/headers'
import { auth } from './auth'

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset'

export type AuditEntityType = 'User' | 'Dealer' | 'Order' | 'Product' | 'Category' | 'Session' | 'DealerContact' | 'DealerAddress'

export type AuditLogInput = {
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  userId?: string
}

/**
 * Get the client IP address from request headers
 */
async function getClientIp(): Promise<string | undefined> {
  try {
    const headersList = await headers()
    return (
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      undefined
    )
  } catch {
    return undefined
  }
}

/**
 * Get the user agent from request headers
 */
async function getUserAgent(): Promise<string | undefined> {
  try {
    const headersList = await headers()
    return headersList.get('user-agent') || undefined
  } catch {
    return undefined
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const [session, ipAddress, userAgent] = await Promise.all([
    input.userId ? Promise.resolve(null) : auth(),
    getClientIp(),
    getUserAgent(),
  ])

  const userId = input.userId || session?.user?.id

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
        newValues: input.newValues ? JSON.stringify(input.newValues) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Log a create operation
 */
export async function logCreate(
  entityType: AuditEntityType,
  entityId: string,
  newValues: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action: 'create',
    entityType,
    entityId,
    newValues,
  })
}

/**
 * Log an update operation with before/after values
 */
export async function logUpdate(
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): Promise<void> {
  // Only log fields that actually changed
  const changedOld: Record<string, unknown> = {}
  const changedNew: Record<string, unknown> = {}

  for (const key of Object.keys(newValues)) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedOld[key] = oldValues[key]
      changedNew[key] = newValues[key]
    }
  }

  // Only create log if there are actual changes
  if (Object.keys(changedNew).length > 0) {
    await createAuditLog({
      action: 'update',
      entityType,
      entityId,
      oldValues: changedOld,
      newValues: changedNew,
    })
  }
}

/**
 * Log a delete operation
 */
export async function logDelete(
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action: 'delete',
    entityType,
    entityId,
    oldValues,
  })
}

/**
 * Log a login event
 */
export async function logLogin(userId: string, success: boolean): Promise<void> {
  await createAuditLog({
    action: success ? 'login' : 'login_failed',
    entityType: 'Session',
    userId,
  })
}

/**
 * Log a logout event
 */
export async function logLogout(userId: string): Promise<void> {
  await createAuditLog({
    action: 'logout',
    entityType: 'Session',
    userId,
  })
}

/**
 * Log a password change event
 */
export async function logPasswordChange(userId: string): Promise<void> {
  await createAuditLog({
    action: 'password_change',
    entityType: 'User',
    entityId: userId,
    userId,
  })
}

/**
 * Log a password reset event
 */
export async function logPasswordReset(userId: string): Promise<void> {
  await createAuditLog({
    action: 'password_reset',
    entityType: 'User',
    entityId: userId,
    userId,
  })
}

// Query types
export type AuditLogEntry = {
  id: string
  userId: string | null
  user: {
    email: string
    firstName: string
    lastName: string
  } | null
  action: string
  entityType: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export type AuditLogFilter = {
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export type AuditLogResult = {
  logs: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Query audit logs with filtering and pagination
 */
export async function getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogResult> {
  const { userId, action, entityType, entityId, startDate, endDate, page = 1, pageSize = 20 } = filter

  // Build where clause
  const where: Record<string, unknown> = {}

  if (userId) {
    where.userId = userId
  }

  if (action) {
    where.action = action
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (entityId) {
    where.entityId = entityId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      (where.createdAt as Record<string, Date>).gte = startDate
    }
    if (endDate) {
      (where.createdAt as Record<string, Date>).lte = endDate
    }
  }

  // Get total count
  const total = await prisma.auditLog.count({ where })

  // Get paginated results
  const logs = await prisma.auditLog.findMany({
    where,
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      action: true,
      entityType: true,
      entityId: true,
      oldValues: true,
      newValues: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Parse JSON values
  type AuditLogQueryResult = {
    id: string
    action: string
    entityType: string
    entityId: string
    description: string | null
    oldValues: string | null
    newValues: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    user: { id: string; firstName: string; lastName: string; email: string } | null
    dealer: { id: string; companyName: string; code: string } | null
  }

  const parsedLogs: AuditLogEntry[] = logs.map((log: AuditLogQueryResult) => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
  }))

  return {
    logs: parsedLogs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      action: true,
      entityType: true,
      entityId: true,
      oldValues: true,
      newValues: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  type EntityAuditLogQueryResult = {
    id: string
    action: string
    entityType: string
    entityId: string
    oldValues: string | null
    newValues: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    user: { id: string; firstName: string; lastName: string } | null
  }

  return logs.map((log: EntityAuditLogQueryResult) => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
  }))
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      action: true,
      entityType: true,
      entityId: true,
      oldValues: true,
      newValues: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  type UserAuditLogQueryResult = {
    id: string
    action: string
    entityType: string
    entityId: string
    oldValues: string | null
    newValues: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    dealer: { id: string; companyName: string } | null
  }

  return logs.map((log: UserAuditLogQueryResult) => ({
    ...log,
    oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
  }))
}

/**
 * Get audit statistics
 */
export async function getAuditStats(): Promise<{
  totalLogs: number
  logsByAction: Record<string, number>
  logsByEntityType: Record<string, number>
  recentActivity: number
}> {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [totalLogs, recentActivity, byAction, byEntityType] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: last24Hours } },
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: { action: true },
    }),
    prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: { entityType: true },
    }),
  ])

  const logsByAction: Record<string, number> = {}
  byAction.forEach((item: { action: string; _count: { action: number } }) => {
    logsByAction[item.action] = item._count.action
  })

  const logsByEntityType: Record<string, number> = {}
  byEntityType.forEach((item: { entityType: string; _count: { entityType: number } }) => {
    logsByEntityType[item.entityType] = item._count.entityType
  })

  return {
    totalLogs,
    logsByAction,
    logsByEntityType,
    recentActivity,
  }
}
