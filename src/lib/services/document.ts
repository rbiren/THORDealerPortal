'use server'

import { prisma } from '@/lib/prisma'

// ============================================================================
// DOCUMENT VERSION CONTROL
// ============================================================================

export interface DocumentVersion {
  id: string
  name: string
  version: number
  url: string
  size: number
  mimeType: string
  uploadedBy: string | null
  createdAt: Date
}

/**
 * Upload a new version of an existing document
 */
export async function uploadDocumentVersion(
  parentDocumentId: string,
  data: {
    name: string
    mimeType: string
    size: number
    url: string
    uploadedBy?: string
  }
): Promise<{ id: string; version: number }> {
  // Get the parent document to find current max version
  const parentDoc = await prisma.document.findUnique({
    where: { id: parentDocumentId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { version: true }
      }
    }
  })

  if (!parentDoc) {
    throw new Error('Parent document not found')
  }

  // Calculate new version number
  const currentMaxVersion = parentDoc.versions[0]?.version ?? parentDoc.version
  const newVersion = currentMaxVersion + 1

  // Create the new version as a child document
  const newDoc = await prisma.document.create({
    data: {
      name: data.name,
      category: parentDoc.category,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      version: newVersion,
      isPublic: parentDoc.isPublic,
      accessLevel: parentDoc.accessLevel,
      allowedRoles: parentDoc.allowedRoles,
      allowedUsers: parentDoc.allowedUsers,
      dealerId: parentDoc.dealerId,
      expiresAt: parentDoc.expiresAt,
      uploadedBy: data.uploadedBy,
      parentDocumentId: parentDocumentId,
    }
  })

  // Update the parent document's version to match latest
  await prisma.document.update({
    where: { id: parentDocumentId },
    data: {
      version: newVersion,
      updatedAt: new Date()
    }
  })

  return { id: newDoc.id, version: newVersion }
}

/**
 * Get all versions of a document
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  // First get the document and check if it's a parent or child
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { parentDocumentId: true }
  })

  if (!doc) {
    throw new Error('Document not found')
  }

  // If this is a child document, get the parent's ID
  const parentId = doc.parentDocumentId || documentId

  // Get the parent document
  const parentDoc = await prisma.document.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      name: true,
      version: true,
      url: true,
      size: true,
      mimeType: true,
      uploadedBy: true,
      createdAt: true,
    }
  })

  if (!parentDoc) {
    throw new Error('Parent document not found')
  }

  // Get all child versions
  const childVersions = await prisma.document.findMany({
    where: { parentDocumentId: parentId },
    select: {
      id: true,
      name: true,
      version: true,
      url: true,
      size: true,
      mimeType: true,
      uploadedBy: true,
      createdAt: true,
    },
    orderBy: { version: 'desc' }
  })

  // Combine parent (original version 1) with child versions
  const allVersions: DocumentVersion[] = [
    ...childVersions,
    {
      id: parentDoc.id,
      name: parentDoc.name,
      version: 1, // Original is always version 1
      url: parentDoc.url,
      size: parentDoc.size,
      mimeType: parentDoc.mimeType,
      uploadedBy: parentDoc.uploadedBy,
      createdAt: parentDoc.createdAt,
    }
  ]

  return allVersions.sort((a, b) => b.version - a.version)
}

/**
 * Restore a previous version as the current version
 */
export async function restoreDocumentVersion(
  documentId: string,
  versionId: string,
  uploadedBy?: string
): Promise<{ id: string; version: number }> {
  // Get the version to restore
  const versionToRestore = await prisma.document.findUnique({
    where: { id: versionId },
    select: {
      name: true,
      url: true,
      size: true,
      mimeType: true,
    }
  })

  if (!versionToRestore) {
    throw new Error('Version not found')
  }

  // Create a new version that copies the old version
  return uploadDocumentVersion(documentId, {
    name: versionToRestore.name,
    mimeType: versionToRestore.mimeType,
    size: versionToRestore.size,
    url: versionToRestore.url,
    uploadedBy,
  })
}

// ============================================================================
// DOCUMENT ACCESS CONTROL
// ============================================================================

export type AccessLevel = 'public' | 'dealer' | 'role' | 'user'

export interface AccessControlConfig {
  accessLevel: AccessLevel
  allowedRoles?: string[]
  allowedUsers?: string[]
}

/**
 * Check if a user has access to a document
 */
export async function checkDocumentAccess(
  documentId: string,
  userId: string,
  userRole: string,
  userDealerId?: string | null
): Promise<boolean> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      isPublic: true,
      accessLevel: true,
      allowedRoles: true,
      allowedUsers: true,
      dealerId: true,
    }
  })

  if (!doc) {
    return false
  }

  // Public documents are accessible to all
  if (doc.isPublic || doc.accessLevel === 'public') {
    return true
  }

  // Super admin and admin have access to all
  if (userRole === 'super_admin' || userRole === 'admin') {
    return true
  }

  // Check by access level
  switch (doc.accessLevel) {
    case 'dealer':
      // User must belong to the same dealer
      return doc.dealerId === userDealerId

    case 'role':
      // Check if user's role is in allowed roles
      if (doc.allowedRoles) {
        const allowedRoles: string[] = JSON.parse(doc.allowedRoles)
        return allowedRoles.includes(userRole)
      }
      return false

    case 'user':
      // Check if user is in allowed users list
      if (doc.allowedUsers) {
        const allowedUsers: string[] = JSON.parse(doc.allowedUsers)
        return allowedUsers.includes(userId)
      }
      return false

    default:
      // Default to dealer access
      return doc.dealerId === userDealerId
  }
}

/**
 * Update document access control settings
 */
export async function updateDocumentAccess(
  documentId: string,
  config: AccessControlConfig
): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: {
      accessLevel: config.accessLevel,
      allowedRoles: config.allowedRoles ? JSON.stringify(config.allowedRoles) : null,
      allowedUsers: config.allowedUsers ? JSON.stringify(config.allowedUsers) : null,
      isPublic: config.accessLevel === 'public',
    }
  })
}

/**
 * Log document access
 */
export async function logDocumentAccess(
  documentId: string,
  userId: string,
  action: 'view' | 'download' | 'share' | 'edit',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.documentAccessLog.create({
    data: {
      documentId,
      userId,
      action,
      ipAddress,
      userAgent,
    }
  })
}

/**
 * Get document access history
 */
export async function getDocumentAccessHistory(
  documentId: string,
  options?: {
    limit?: number
    offset?: number
    action?: 'view' | 'download' | 'share' | 'edit'
  }
): Promise<{
  logs: Array<{
    id: string
    userId: string
    action: string
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
  }>
  total: number
}> {
  const where = {
    documentId,
    ...(options?.action ? { action: options.action } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.documentAccessLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.documentAccessLog.count({ where }),
  ])

  return { logs, total }
}

// ============================================================================
// DOCUMENT EXPIRATION TRACKING
// ============================================================================

/**
 * Get documents expiring within a given number of days
 */
export async function getExpiringDocuments(
  daysAhead: number = 30,
  dealerId?: string
): Promise<Array<{
  id: string
  name: string
  category: string
  expiresAt: Date
  daysUntilExpiry: number
  dealerName?: string
}>> {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const documents = await prisma.document.findMany({
    where: {
      expiresAt: {
        gte: now,
        lte: futureDate,
      },
      parentDocumentId: null, // Only get parent documents
      ...(dealerId ? { dealerId } : {}),
    },
    include: {
      dealer: { select: { name: true } },
    },
    orderBy: { expiresAt: 'asc' },
  })

  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    expiresAt: doc.expiresAt!,
    daysUntilExpiry: Math.ceil((doc.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    dealerName: doc.dealer?.name,
  }))
}

/**
 * Get expired documents
 */
export async function getExpiredDocuments(
  dealerId?: string
): Promise<Array<{
  id: string
  name: string
  category: string
  expiresAt: Date
  daysExpired: number
  dealerName?: string
}>> {
  const now = new Date()

  const documents = await prisma.document.findMany({
    where: {
      expiresAt: { lt: now },
      parentDocumentId: null,
      ...(dealerId ? { dealerId } : {}),
    },
    include: {
      dealer: { select: { name: true } },
    },
    orderBy: { expiresAt: 'desc' },
  })

  return documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    expiresAt: doc.expiresAt!,
    daysExpired: Math.ceil((now.getTime() - doc.expiresAt!.getTime()) / (24 * 60 * 60 * 1000)),
    dealerName: doc.dealer?.name,
  }))
}

/**
 * Set up expiry reminder for a document
 */
export async function createExpiryReminder(
  documentId: string,
  userId: string,
  reminderDays: number = 30
): Promise<{ id: string }> {
  const reminder = await prisma.documentExpiryReminder.upsert({
    where: {
      documentId_userId_reminderDays: {
        documentId,
        userId,
        reminderDays,
      }
    },
    update: {
      sentAt: null,
      acknowledged: false,
    },
    create: {
      documentId,
      userId,
      reminderDays,
    }
  })

  return { id: reminder.id }
}

/**
 * Get pending expiry reminders that need to be sent
 */
export async function getPendingExpiryReminders(): Promise<Array<{
  id: string
  documentId: string
  documentName: string
  userId: string
  reminderDays: number
  expiresAt: Date
}>> {
  const now = new Date()

  // Find reminders that haven't been sent and the document is within the reminder window
  const reminders = await prisma.documentExpiryReminder.findMany({
    where: {
      sentAt: null,
      acknowledged: false,
    },
    include: {
      document: {
        select: {
          name: true,
          expiresAt: true,
        }
      }
    }
  })

  return reminders.filter((reminder) => {
    if (!reminder.document.expiresAt) return false
    const daysUntilExpiry = Math.ceil(
      (reminder.document.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )
    return daysUntilExpiry <= reminder.reminderDays && daysUntilExpiry > 0
  }).map((reminder) => ({
    id: reminder.id,
    documentId: reminder.documentId,
    documentName: reminder.document.name,
    userId: reminder.userId,
    reminderDays: reminder.reminderDays,
    expiresAt: reminder.document.expiresAt!,
  }))
}

/**
 * Mark expiry reminder as sent
 */
export async function markExpiryReminderSent(reminderId: string): Promise<void> {
  await prisma.documentExpiryReminder.update({
    where: { id: reminderId },
    data: { sentAt: new Date() },
  })
}

/**
 * Acknowledge expiry reminder (user dismissed it)
 */
export async function acknowledgeExpiryReminder(reminderId: string): Promise<void> {
  await prisma.documentExpiryReminder.update({
    where: { id: reminderId },
    data: { acknowledged: true },
  })
}

/**
 * Update document expiration date
 */
export async function updateDocumentExpiration(
  documentId: string,
  expiresAt: Date | null
): Promise<void> {
  await prisma.document.update({
    where: { id: documentId },
    data: { expiresAt },
  })

  // Reset any expiry reminders if expiration date changed
  if (expiresAt) {
    await prisma.documentExpiryReminder.updateMany({
      where: { documentId },
      data: { sentAt: null, acknowledged: false },
    })
  }
}

/**
 * Get document expiration statistics
 */
export async function getDocumentExpirationStats(dealerId?: string): Promise<{
  totalWithExpiry: number
  expired: number
  expiringIn30Days: number
  expiringIn60Days: number
  expiringIn90Days: number
}> {
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const where = {
    expiresAt: { not: null },
    parentDocumentId: null,
    ...(dealerId ? { dealerId } : {}),
  }

  const [totalWithExpiry, expired, expiringIn30Days, expiringIn60Days, expiringIn90Days] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.count({ where: { ...where, expiresAt: { lt: now } } }),
    prisma.document.count({ where: { ...where, expiresAt: { gte: now, lte: in30Days } } }),
    prisma.document.count({ where: { ...where, expiresAt: { gte: now, lte: in60Days } } }),
    prisma.document.count({ where: { ...where, expiresAt: { gte: now, lte: in90Days } } }),
  ])

  return {
    totalWithExpiry,
    expired,
    expiringIn30Days,
    expiringIn60Days,
    expiringIn90Days,
  }
}
