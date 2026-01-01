'use server'

import { prisma } from '@/lib/prisma'

// Notification Types
export type NotificationType =
  | 'order_update'
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'low_stock'
  | 'invoice_created'
  | 'invoice_overdue'
  | 'document_expiry'
  | 'system'
  | 'announcement'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  priority?: NotificationPriority
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: Date | null
  createdAt: Date
}

// Icon and color mappings for notification types
export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  order_update: { icon: 'refresh', color: 'blue', label: 'Order Update' },
  order_placed: { icon: 'shopping-cart', color: 'green', label: 'Order Placed' },
  order_shipped: { icon: 'truck', color: 'purple', label: 'Order Shipped' },
  order_delivered: { icon: 'check-circle', color: 'green', label: 'Order Delivered' },
  low_stock: { icon: 'alert-triangle', color: 'orange', label: 'Low Stock' },
  invoice_created: { icon: 'document', color: 'blue', label: 'New Invoice' },
  invoice_overdue: { icon: 'alert-circle', color: 'red', label: 'Invoice Overdue' },
  document_expiry: { icon: 'clock', color: 'yellow', label: 'Document Expiring' },
  system: { icon: 'settings', color: 'gray', label: 'System' },
  announcement: { icon: 'megaphone', color: 'olive', label: 'Announcement' },
}

// Create a notification
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ? JSON.stringify(input.data) : null,
    },
  })

  return parseNotification(notification)
}

// Create notifications for multiple users
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<number> {
  const result = await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ? JSON.stringify(input.data) : null,
    })),
  })

  return result.count
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    unreadOnly?: boolean
    types?: NotificationType[]
  }
): Promise<Notification[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
      ...(options?.types ? { type: { in: options.types } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  })

  return notifications.map(parseNotification)
}

// Get unread notification count
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  })
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<Notification> {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })

  return parseNotification(notification)
}

// Mark multiple notifications as read
export async function markMultipleAsRead(notificationIds: string[]): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return result.count
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return result.count
}

// Delete a notification
export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId },
  })
}

// Delete old notifications (cleanup)
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      readAt: { not: null }, // Only delete read notifications
    },
  })

  return result.count
}

// Helper to parse notification from database
function parseNotification(
  notification: {
    id: string
    userId: string
    type: string
    title: string
    body: string
    data: string | null
    readAt: Date | null
    createdAt: Date
  }
): Notification {
  return {
    ...notification,
    data: notification.data ? JSON.parse(notification.data) : null,
  }
}

// Notification templates for common events

export async function notifyOrderPlaced(
  userId: string,
  orderNumber: string,
  totalAmount: number
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'order_placed',
    title: 'Order Placed Successfully',
    body: `Your order ${orderNumber} for $${totalAmount.toFixed(2)} has been placed.`,
    data: { orderNumber },
  })
}

export async function notifyOrderStatusChange(
  userId: string,
  orderNumber: string,
  newStatus: string
): Promise<Notification> {
  const statusMessages: Record<string, string> = {
    confirmed: 'has been confirmed and is being processed',
    processing: 'is being prepared for shipment',
    shipped: 'has been shipped and is on its way',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled',
  }

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`

  return createNotification({
    userId,
    type: newStatus === 'shipped' ? 'order_shipped' : newStatus === 'delivered' ? 'order_delivered' : 'order_update',
    title: `Order ${orderNumber} Update`,
    body: `Your order ${orderNumber} ${message}.`,
    data: { orderNumber, status: newStatus },
  })
}

export async function notifyLowStock(
  userId: string,
  productName: string,
  productSku: string,
  quantity: number,
  threshold: number
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'low_stock',
    title: 'Low Stock Alert',
    body: `${productName} (${productSku}) has ${quantity} units remaining, below the threshold of ${threshold}.`,
    data: { productSku, quantity, threshold },
  })
}

export async function notifyInvoiceCreated(
  userId: string,
  invoiceNumber: string,
  amount: number,
  dueDate: Date
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'invoice_created',
    title: 'New Invoice Created',
    body: `Invoice ${invoiceNumber} for $${amount.toFixed(2)} has been created. Due: ${dueDate.toLocaleDateString()}.`,
    data: { invoiceNumber, amount, dueDate: dueDate.toISOString() },
  })
}

export async function notifyInvoiceOverdue(
  userId: string,
  invoiceNumber: string,
  amount: number,
  daysPastDue: number
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'invoice_overdue',
    title: 'Invoice Overdue',
    body: `Invoice ${invoiceNumber} for $${amount.toFixed(2)} is ${daysPastDue} days past due.`,
    data: { invoiceNumber, amount, daysPastDue },
    priority: 'high',
  })
}

export async function createSystemAnnouncement(
  userIds: string[],
  title: string,
  body: string
): Promise<number> {
  const inputs = userIds.map((userId) => ({
    userId,
    type: 'announcement' as NotificationType,
    title,
    body,
  }))

  return createNotifications(inputs)
}
