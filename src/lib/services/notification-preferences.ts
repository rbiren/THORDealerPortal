'use server'

import { prisma } from '@/lib/prisma'

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export interface NotificationPreferences {
  // In-app notification preferences
  orderUpdates: boolean
  lowStockAlerts: boolean
  invoiceNotifications: boolean
  documentExpiry: boolean
  systemAnnouncements: boolean
  warrantyUpdates: boolean

  // Email notification preferences
  emailOrderUpdates: boolean
  emailInvoices: boolean
  emailDocumentExpiry: boolean
  emailSystemAnnouncements: boolean
  emailDigestFrequency: 'instant' | 'daily' | 'weekly' | 'never'
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orderUpdates: true,
  lowStockAlerts: true,
  invoiceNotifications: true,
  documentExpiry: true,
  systemAnnouncements: true,
  warrantyUpdates: true,
  emailOrderUpdates: true,
  emailInvoices: true,
  emailDocumentExpiry: true,
  emailSystemAnnouncements: false,
  emailDigestFrequency: 'instant',
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  if (!prefs) {
    return DEFAULT_PREFERENCES
  }

  return {
    orderUpdates: prefs.orderUpdates,
    lowStockAlerts: prefs.lowStockAlerts,
    invoiceNotifications: prefs.invoiceNotifications,
    documentExpiry: prefs.documentExpiry,
    systemAnnouncements: prefs.systemAnnouncements,
    warrantyUpdates: prefs.warrantyUpdates,
    emailOrderUpdates: prefs.emailOrderUpdates,
    emailInvoices: prefs.emailInvoices,
    emailDocumentExpiry: prefs.emailDocumentExpiry,
    emailSystemAnnouncements: prefs.emailSystemAnnouncements,
    emailDigestFrequency: prefs.emailDigestFrequency as NotificationPreferences['emailDigestFrequency'],
  }
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
      ...updates,
    },
  })

  return {
    orderUpdates: prefs.orderUpdates,
    lowStockAlerts: prefs.lowStockAlerts,
    invoiceNotifications: prefs.invoiceNotifications,
    documentExpiry: prefs.documentExpiry,
    systemAnnouncements: prefs.systemAnnouncements,
    warrantyUpdates: prefs.warrantyUpdates,
    emailOrderUpdates: prefs.emailOrderUpdates,
    emailInvoices: prefs.emailInvoices,
    emailDocumentExpiry: prefs.emailDocumentExpiry,
    emailSystemAnnouncements: prefs.emailSystemAnnouncements,
    emailDigestFrequency: prefs.emailDigestFrequency as NotificationPreferences['emailDigestFrequency'],
  }
}

/**
 * Check if a user wants to receive a specific notification type
 */
export async function shouldSendNotification(
  userId: string,
  type: keyof Pick<NotificationPreferences,
    | 'orderUpdates'
    | 'lowStockAlerts'
    | 'invoiceNotifications'
    | 'documentExpiry'
    | 'systemAnnouncements'
    | 'warrantyUpdates'
  >
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId)
  return prefs[type]
}

/**
 * Check if a user wants to receive a specific email notification type
 */
export async function shouldSendEmail(
  userId: string,
  type: keyof Pick<NotificationPreferences,
    | 'emailOrderUpdates'
    | 'emailInvoices'
    | 'emailDocumentExpiry'
    | 'emailSystemAnnouncements'
  >
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId)

  // Check if email digest is set to 'never'
  if (prefs.emailDigestFrequency === 'never') {
    return false
  }

  return prefs[type]
}

/**
 * Get users who should receive a specific notification type
 */
export async function getUsersForNotificationType(
  type: keyof Pick<NotificationPreferences,
    | 'orderUpdates'
    | 'lowStockAlerts'
    | 'invoiceNotifications'
    | 'documentExpiry'
    | 'systemAnnouncements'
    | 'warrantyUpdates'
  >,
  userIds?: string[]
): Promise<string[]> {
  // Get all preferences where this type is enabled
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      [type]: true,
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    select: { userId: true },
  })

  const usersWithPrefs = new Set(prefs.map((p) => p.userId))

  // If userIds provided, filter to only those users
  // Users without preferences get default (enabled)
  if (userIds) {
    const usersWithoutPrefs = userIds.filter((id) => !usersWithPrefs.has(id))
    // These users have no preferences, so they get defaults (enabled)
    return [...usersWithPrefs, ...usersWithoutPrefs]
  }

  // For queries without specific userIds, we need to consider default preferences
  // This requires getting all users and checking if they have disabled the notification
  const disabledPrefs = await prisma.notificationPreference.findMany({
    where: { [type]: false },
    select: { userId: true },
  })

  const disabledUserIds = new Set(disabledPrefs.map((p) => p.userId))

  // Get all active users
  const allUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true },
  })

  return allUsers
    .filter((u) => !disabledUserIds.has(u.id))
    .map((u) => u.id)
}

/**
 * Get users who should receive email for a specific notification type
 */
export async function getUsersForEmailNotification(
  type: keyof Pick<NotificationPreferences,
    | 'emailOrderUpdates'
    | 'emailInvoices'
    | 'emailDocumentExpiry'
    | 'emailSystemAnnouncements'
  >,
  userIds?: string[]
): Promise<Array<{ userId: string; email: string }>> {
  // Get preferences where this email type is enabled
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      [type]: true,
      emailDigestFrequency: { not: 'never' },
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    select: { userId: true },
  })

  const enabledUserIds = prefs.map((p) => p.userId)

  // Get users with their emails
  const users = await prisma.user.findMany({
    where: {
      id: { in: enabledUserIds },
      status: 'active',
    },
    select: {
      id: true,
      email: true,
    },
  })

  return users.map((u) => ({ userId: u.id, email: u.email }))
}

/**
 * Reset notification preferences to defaults
 */
export async function resetNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  await prisma.notificationPreference.upsert({
    where: { userId },
    update: DEFAULT_PREFERENCES,
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
    },
  })

  return DEFAULT_PREFERENCES
}

/**
 * Get notification preferences summary for admin
 */
export async function getNotificationPreferencesSummary(): Promise<{
  totalUsers: number
  usersWithCustomPrefs: number
  emailDigestBreakdown: Record<string, number>
  notificationTypeDisabled: Record<string, number>
}> {
  const [totalUsers, usersWithCustomPrefs, allPrefs] = await Promise.all([
    prisma.user.count({ where: { status: 'active' } }),
    prisma.notificationPreference.count(),
    prisma.notificationPreference.findMany(),
  ])

  const emailDigestBreakdown: Record<string, number> = {
    instant: 0,
    daily: 0,
    weekly: 0,
    never: 0,
  }

  const notificationTypeDisabled: Record<string, number> = {
    orderUpdates: 0,
    lowStockAlerts: 0,
    invoiceNotifications: 0,
    documentExpiry: 0,
    systemAnnouncements: 0,
    warrantyUpdates: 0,
  }

  for (const pref of allPrefs) {
    emailDigestBreakdown[pref.emailDigestFrequency]++

    if (!pref.orderUpdates) notificationTypeDisabled.orderUpdates++
    if (!pref.lowStockAlerts) notificationTypeDisabled.lowStockAlerts++
    if (!pref.invoiceNotifications) notificationTypeDisabled.invoiceNotifications++
    if (!pref.documentExpiry) notificationTypeDisabled.documentExpiry++
    if (!pref.systemAnnouncements) notificationTypeDisabled.systemAnnouncements++
    if (!pref.warrantyUpdates) notificationTypeDisabled.warrantyUpdates++
  }

  return {
    totalUsers,
    usersWithCustomPrefs,
    emailDigestBreakdown,
    notificationTypeDisabled,
  }
}
