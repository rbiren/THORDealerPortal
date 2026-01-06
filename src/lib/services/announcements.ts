'use server'

import { prisma } from '@/lib/prisma'
import { createNotifications, type NotificationType } from '@/lib/notifications'
import { sendSystemAnnouncementEmail } from './email'
import { getUsersForEmailNotification } from './notification-preferences'

// ============================================================================
// SYSTEM ANNOUNCEMENTS
// ============================================================================

export type AnnouncementType = 'info' | 'warning' | 'alert' | 'maintenance'
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical'

export interface CreateAnnouncementInput {
  title: string
  body: string
  type?: AnnouncementType
  priority?: AnnouncementPriority
  targetAll?: boolean
  targetRoles?: string[]
  targetTiers?: string[]
  isDismissible?: boolean
  showAsBanner?: boolean
  publishAt?: Date
  expiresAt?: Date
  createdBy?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  priority: AnnouncementPriority
  targetAll: boolean
  targetRoles: string[] | null
  targetTiers: string[] | null
  isDismissible: boolean
  showAsBanner: boolean
  publishAt: Date
  expiresAt: Date | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AnnouncementWithStats extends Announcement {
  readCount: number
  dismissedCount: number
  totalTargeted: number
}

/**
 * Create a new system announcement
 */
export async function createAnnouncement(
  input: CreateAnnouncementInput
): Promise<Announcement> {
  const announcement = await prisma.systemAnnouncement.create({
    data: {
      title: input.title,
      body: input.body,
      type: input.type || 'info',
      priority: input.priority || 'normal',
      targetAll: input.targetAll ?? true,
      targetRoles: input.targetRoles ? JSON.stringify(input.targetRoles) : null,
      targetTiers: input.targetTiers ? JSON.stringify(input.targetTiers) : null,
      isDismissible: input.isDismissible ?? true,
      showAsBanner: input.showAsBanner ?? false,
      publishAt: input.publishAt || new Date(),
      expiresAt: input.expiresAt,
      createdBy: input.createdBy,
    },
  })

  return parseAnnouncement(announcement)
}

/**
 * Get a single announcement by ID
 */
export async function getAnnouncement(id: string): Promise<AnnouncementWithStats | null> {
  const announcement = await prisma.systemAnnouncement.findUnique({
    where: { id },
    include: {
      readReceipts: true,
    },
  })

  if (!announcement) return null

  const readCount = announcement.readReceipts.length
  const dismissedCount = announcement.readReceipts.filter((r: { dismissed: boolean }) => r.dismissed).length
  const totalTargeted = await countTargetedUsers(announcement)

  return {
    ...parseAnnouncement(announcement),
    readCount,
    dismissedCount,
    totalTargeted,
  }
}

/**
 * Get all announcements (admin view)
 */
export async function getAnnouncements(options?: {
  isActive?: boolean
  type?: AnnouncementType
  limit?: number
  offset?: number
}): Promise<{ announcements: AnnouncementWithStats[]; total: number }> {
  const where = {
    ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
    ...(options?.type ? { type: options.type } : {}),
  }

  const [announcements, total] = await Promise.all([
    prisma.systemAnnouncement.findMany({
      where,
      include: { readReceipts: true },
      orderBy: { publishAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.systemAnnouncement.count({ where }),
  ])

  type AnnouncementQueryResult = {
    id: string
    title: string
    body: string
    type: string
    priority: string
    targetAll: boolean
    targetRoles: string | null
    targetTiers: string | null
    isDismissible: boolean
    showAsBanner: boolean
    publishAt: Date
    expiresAt: Date | null
    isActive: boolean
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
    readReceipts: Array<{ dismissed: boolean }>
  }

  const announcementsWithStats = await Promise.all(
    announcements.map(async (ann: AnnouncementQueryResult) => {
      const totalTargeted = await countTargetedUsers(ann)
      return {
        ...parseAnnouncement(ann),
        readCount: ann.readReceipts.length,
        dismissedCount: ann.readReceipts.filter((r: { dismissed: boolean }) => r.dismissed).length,
        totalTargeted,
      }
    })
  )

  return { announcements: announcementsWithStats, total }
}

/**
 * Get active announcements for a user
 */
export async function getActiveAnnouncementsForUser(
  userId: string,
  userRole: string,
  dealerTier?: string | null
): Promise<Announcement[]> {
  const now = new Date()

  const announcements = await prisma.systemAnnouncement.findMany({
    where: {
      isActive: true,
      publishAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    include: {
      readReceipts: {
        where: { userId },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { publishAt: 'desc' },
    ],
  })

  // Filter by targeting and not dismissed
  type UserAnnouncementQueryResult = {
    id: string
    title: string
    body: string
    type: string
    priority: string
    targetAll: boolean
    targetRoles: string | null
    targetTiers: string | null
    isDismissible: boolean
    showAsBanner: boolean
    publishAt: Date
    expiresAt: Date | null
    isActive: boolean
    createdBy: string | null
    createdAt: Date
    updatedAt: Date
    readReceipts: Array<{ dismissed: boolean }>
  }

  return announcements
    .filter((ann: UserAnnouncementQueryResult) => {
      // Skip if user dismissed this announcement
      const receipt = ann.readReceipts[0]
      if (receipt?.dismissed) return false

      // Check targeting
      if (ann.targetAll) return true

      // Check role targeting
      if (ann.targetRoles) {
        const roles: string[] = JSON.parse(ann.targetRoles)
        if (roles.includes(userRole)) return true
      }

      // Check tier targeting
      if (ann.targetTiers && dealerTier) {
        const tiers: string[] = JSON.parse(ann.targetTiers)
        if (tiers.includes(dealerTier)) return true
      }

      return false
    })
    .map(parseAnnouncement)
}

/**
 * Get banner announcements (for top-of-page display)
 */
export async function getBannerAnnouncements(
  userId: string,
  userRole: string,
  dealerTier?: string | null
): Promise<Announcement[]> {
  const announcements = await getActiveAnnouncementsForUser(userId, userRole, dealerTier)
  return announcements.filter((ann) => ann.showAsBanner)
}

/**
 * Mark announcement as read by user
 */
export async function markAnnouncementAsRead(
  announcementId: string,
  userId: string
): Promise<void> {
  await prisma.announcementReadReceipt.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      announcementId,
      userId,
      readAt: new Date(),
    },
  })
}

/**
 * Dismiss announcement (user won't see it again)
 */
export async function dismissAnnouncement(
  announcementId: string,
  userId: string
): Promise<void> {
  await prisma.announcementReadReceipt.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    update: {
      dismissed: true,
    },
    create: {
      announcementId,
      userId,
      dismissed: true,
    },
  })
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementInput> & { isActive?: boolean }
): Promise<Announcement> {
  const data: Record<string, unknown> = {}

  if (updates.title !== undefined) data.title = updates.title
  if (updates.body !== undefined) data.body = updates.body
  if (updates.type !== undefined) data.type = updates.type
  if (updates.priority !== undefined) data.priority = updates.priority
  if (updates.targetAll !== undefined) data.targetAll = updates.targetAll
  if (updates.targetRoles !== undefined) data.targetRoles = updates.targetRoles ? JSON.stringify(updates.targetRoles) : null
  if (updates.targetTiers !== undefined) data.targetTiers = updates.targetTiers ? JSON.stringify(updates.targetTiers) : null
  if (updates.isDismissible !== undefined) data.isDismissible = updates.isDismissible
  if (updates.showAsBanner !== undefined) data.showAsBanner = updates.showAsBanner
  if (updates.publishAt !== undefined) data.publishAt = updates.publishAt
  if (updates.expiresAt !== undefined) data.expiresAt = updates.expiresAt
  if (updates.isActive !== undefined) data.isActive = updates.isActive

  const announcement = await prisma.systemAnnouncement.update({
    where: { id },
    data,
  })

  return parseAnnouncement(announcement)
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  await prisma.systemAnnouncement.delete({
    where: { id },
  })
}

/**
 * Publish announcement and send notifications
 */
export async function publishAnnouncement(
  announcementId: string,
  options?: {
    sendInAppNotifications?: boolean
    sendEmailNotifications?: boolean
  }
): Promise<{ notificationsSent: number; emailsSent: number }> {
  const announcement = await prisma.systemAnnouncement.findUnique({
    where: { id: announcementId },
  })

  if (!announcement) {
    throw new Error('Announcement not found')
  }

  // Activate the announcement
  await prisma.systemAnnouncement.update({
    where: { id: announcementId },
    data: {
      isActive: true,
      publishAt: new Date(),
    },
  })

  let notificationsSent = 0
  let emailsSent = 0

  // Get targeted users
  const targetedUsers = await getTargetedUsers(announcement)

  // Send in-app notifications
  if (options?.sendInAppNotifications !== false) {
    const notificationInputs = targetedUsers.map((userId) => ({
      userId,
      type: 'announcement' as NotificationType,
      title: announcement.title,
      body: announcement.body,
      data: { announcementId },
    }))

    notificationsSent = await createNotifications(notificationInputs)
  }

  // Send email notifications
  if (options?.sendEmailNotifications) {
    const emailUsers = await getUsersForEmailNotification(
      'emailSystemAnnouncements',
      targetedUsers
    )

    for (const user of emailUsers) {
      const result = await sendSystemAnnouncementEmail(
        user.email,
        announcement.title,
        announcement.body,
        announcement.type as 'info' | 'warning' | 'alert' | 'maintenance'
      )
      if (result.success) emailsSent++
    }
  }

  return { notificationsSent, emailsSent }
}

/**
 * Get announcement statistics
 */
export async function getAnnouncementStats(): Promise<{
  total: number
  active: number
  scheduled: number
  expired: number
  byType: Record<string, number>
  avgReadRate: number
}> {
  const now = new Date()

  const [total, active, scheduled, expired, announcements] = await Promise.all([
    prisma.systemAnnouncement.count(),
    prisma.systemAnnouncement.count({
      where: {
        isActive: true,
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.systemAnnouncement.count({
      where: {
        isActive: true,
        publishAt: { gt: now },
      },
    }),
    prisma.systemAnnouncement.count({
      where: {
        expiresAt: { lt: now },
      },
    }),
    prisma.systemAnnouncement.findMany({
      include: { readReceipts: true },
    }),
  ])

  const byType: Record<string, number> = {
    info: 0,
    warning: 0,
    alert: 0,
    maintenance: 0,
  }

  let totalReadRate = 0
  let announcementsWithReads = 0

  for (const ann of announcements) {
    byType[ann.type]++

    const targetedCount = await countTargetedUsers(ann)
    if (targetedCount > 0) {
      const readRate = ann.readReceipts.length / targetedCount
      totalReadRate += readRate
      announcementsWithReads++
    }
  }

  const avgReadRate = announcementsWithReads > 0 ? totalReadRate / announcementsWithReads : 0

  return {
    total,
    active,
    scheduled,
    expired,
    byType,
    avgReadRate,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseAnnouncement(ann: {
  id: string
  title: string
  body: string
  type: string
  priority: string
  targetAll: boolean
  targetRoles: string | null
  targetTiers: string | null
  isDismissible: boolean
  showAsBanner: boolean
  publishAt: Date
  expiresAt: Date | null
  isActive: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}): Announcement {
  return {
    id: ann.id,
    title: ann.title,
    body: ann.body,
    type: ann.type as AnnouncementType,
    priority: ann.priority as AnnouncementPriority,
    targetAll: ann.targetAll,
    targetRoles: ann.targetRoles ? JSON.parse(ann.targetRoles) : null,
    targetTiers: ann.targetTiers ? JSON.parse(ann.targetTiers) : null,
    isDismissible: ann.isDismissible,
    showAsBanner: ann.showAsBanner,
    publishAt: ann.publishAt,
    expiresAt: ann.expiresAt,
    isActive: ann.isActive,
    createdBy: ann.createdBy,
    createdAt: ann.createdAt,
    updatedAt: ann.updatedAt,
  }
}

async function getTargetedUsers(announcement: {
  targetAll: boolean
  targetRoles: string | null
  targetTiers: string | null
}): Promise<string[]> {
  if (announcement.targetAll) {
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
    })
    return users.map((u: { id: string }) => u.id)
  }

  const userIds = new Set<string>()

  // Get users by role
  if (announcement.targetRoles) {
    const roles: string[] = JSON.parse(announcement.targetRoles)
    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        role: { in: roles },
      },
      select: { id: true },
    })
    users.forEach((u: { id: string }) => userIds.add(u.id))
  }

  // Get users by dealer tier
  if (announcement.targetTiers) {
    const tiers: string[] = JSON.parse(announcement.targetTiers)
    const users = await prisma.user.findMany({
      where: {
        status: 'active',
        dealer: {
          tier: { in: tiers },
        },
      },
      select: { id: true },
    })
    users.forEach((u: { id: string }) => userIds.add(u.id))
  }

  return Array.from(userIds)
}

async function countTargetedUsers(announcement: {
  targetAll: boolean
  targetRoles: string | null
  targetTiers: string | null
}): Promise<number> {
  const users = await getTargetedUsers(announcement)
  return users.length
}
