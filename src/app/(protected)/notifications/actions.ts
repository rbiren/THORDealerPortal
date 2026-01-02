'use server'

import { prisma } from '@/lib/prisma'
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  NOTIFICATION_CONFIG,
  type NotificationType,
} from '@/lib/notifications'

// Extended notification type for UI display
export type NotificationDisplay = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: Date | null
  createdAt: Date
  icon: string
  color: string
  typeLabel: string
  relativeTime: string
}

// Format relative time for display
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Get notifications formatted for display
export async function getNotificationsForDisplay(
  userId: string,
  options?: {
    limit?: number
    unreadOnly?: boolean
    types?: NotificationType[]
  }
): Promise<NotificationDisplay[]> {
  const notifications = await getUserNotifications(userId, options)

  return notifications.map((notification) => {
    const config = NOTIFICATION_CONFIG[notification.type as NotificationType] || {
      icon: 'bell',
      color: 'gray',
      label: 'Notification',
    }

    return {
      ...notification,
      icon: config.icon,
      color: config.color,
      typeLabel: config.label,
      relativeTime: formatRelativeTime(notification.createdAt),
    }
  })
}

// Get notification summary for header badge
export async function getNotificationSummary(userId: string): Promise<{
  unreadCount: number
  latestNotifications: NotificationDisplay[]
}> {
  const [unreadCount, latestNotifications] = await Promise.all([
    getUnreadCount(userId),
    getNotificationsForDisplay(userId, { limit: 5 }),
  ])

  return {
    unreadCount,
    latestNotifications,
  }
}

// Mark single notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await markAsRead(notificationId)
}

// Mark multiple notifications as read
export async function markNotificationsAsRead(notificationIds: string[]): Promise<number> {
  return markMultipleAsRead(notificationIds)
}

// Mark all as read for current user
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  return markAllAsRead(userId)
}

// Delete notification
export async function removeNotification(notificationId: string): Promise<void> {
  await deleteNotification(notificationId)
}

// Get notification preferences
export type NotificationPreferences = {
  orderUpdates: boolean
  lowStockAlerts: boolean
  invoiceNotifications: boolean
  documentExpiry: boolean
  systemAnnouncements: boolean
  emailNotifications: boolean
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  // In a real implementation, these would be stored in a UserPreferences table
  // For now, return default preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Default preferences (all enabled)
  return {
    orderUpdates: true,
    lowStockAlerts: true,
    invoiceNotifications: true,
    documentExpiry: true,
    systemAnnouncements: true,
    emailNotifications: true,
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  // In a real implementation, this would update UserPreferences table
  // For now, just return the updated preferences
  const current = await getNotificationPreferences(userId)

  return {
    ...current,
    ...preferences,
  }
}

// Get notifications grouped by date
export type GroupedNotifications = {
  today: NotificationDisplay[]
  yesterday: NotificationDisplay[]
  thisWeek: NotificationDisplay[]
  older: NotificationDisplay[]
}

export async function getGroupedNotifications(
  userId: string
): Promise<GroupedNotifications> {
  const notifications = await getNotificationsForDisplay(userId, { limit: 100 })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  for (const notification of notifications) {
    const notificationDate = new Date(notification.createdAt)

    if (notificationDate >= today) {
      grouped.today.push(notification)
    } else if (notificationDate >= yesterday) {
      grouped.yesterday.push(notification)
    } else if (notificationDate >= weekAgo) {
      grouped.thisWeek.push(notification)
    } else {
      grouped.older.push(notification)
    }
  }

  return grouped
}

// Get notification types for filter
export function getNotificationTypes(): { value: NotificationType; label: string }[] {
  return Object.entries(NOTIFICATION_CONFIG).map(([value, config]) => ({
    value: value as NotificationType,
    label: config.label,
  }))
}
