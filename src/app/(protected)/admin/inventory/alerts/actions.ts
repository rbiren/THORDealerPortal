'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SCHEMAS
// ============================================================================

const alertPreferencesSchema = z.object({
  userId: z.string().min(1),
  emailEnabled: z.boolean(),
  lowStockThreshold: z.number().int().min(0).optional(),
  criticalStockThreshold: z.number().int().min(0).optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly']),
  locationIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
})

const updateThresholdSchema = z.object({
  inventoryId: z.string().min(1),
  threshold: z.number().int().min(0),
})

// ============================================================================
// TYPES
// ============================================================================

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type StockAlert = {
  id: string
  inventoryId: string
  product: {
    id: string
    sku: string
    name: string
  }
  location: {
    id: string
    name: string
    code: string
  }
  currentStock: number
  reserved: number
  available: number
  threshold: number
  severity: AlertSeverity
  percentOfThreshold: number
  lastRestocked: Date | null
  daysAtLowStock: number
  acknowledged: boolean
  acknowledgedAt: Date | null
}

export type AlertSummary = {
  total: number
  critical: number
  warning: number
  acknowledged: number
  unacknowledged: number
}

export type AlertPreferences = {
  userId: string
  emailEnabled: boolean
  lowStockThreshold: number
  criticalStockThreshold: number
  frequency: 'immediate' | 'daily' | 'weekly'
  locationIds: string[]
  categoryIds: string[]
}

// ============================================================================
// GET STOCK ALERTS
// ============================================================================

export type AlertFilters = {
  severity?: AlertSeverity
  locationId?: string
  categoryId?: string
  acknowledged?: boolean
  search?: string
  sortBy?: 'severity' | 'product' | 'location' | 'stock' | 'threshold'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function getStockAlerts(filters: AlertFilters = {}): Promise<{
  alerts: StockAlert[]
  total: number
  page: number
  pageSize: number
}> {
  const {
    severity,
    locationId,
    categoryId,
    search,
    sortBy = 'severity',
    sortOrder = 'asc',
    page = 1,
    pageSize = 20,
  } = filters

  // Build where clause
  const where: Record<string, unknown> = {}

  if (locationId) {
    where.locationId = locationId
  }

  if (search) {
    where.product = {
      OR: [
        { sku: { contains: search } },
        { name: { contains: search } },
      ],
    }
  }

  if (categoryId) {
    where.product = {
      ...where.product as object,
      categoryId,
    }
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          categoryId: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  })

  // Find notifications for these inventory items to check acknowledged status
  const inventoryIds = inventory.map((i: { id: string }) => i.id)
  const notifications = await prisma.notification.findMany({
    where: {
      type: 'low_stock',
    },
  })

  // Build a map of acknowledged inventory IDs
  const acknowledgedMap = new Map<string, { at: Date | null }>()
  for (const notification of notifications) {
    try {
      const data = notification.data ? JSON.parse(notification.data) : {}
      if (data.inventoryId && notification.readAt) {
        acknowledgedMap.set(data.inventoryId, { at: notification.readAt })
      }
    } catch {
      // Skip invalid JSON
    }
  }

  type AlertInventoryItem = {
    id: string
    quantity: number
    reserved: number
    lowStockThreshold: number
    product: { id: string; sku: string; name: string; categoryId: string | null }
    location: { id: string; name: string; code: string }
  }

  // Transform to alerts
  let alerts: StockAlert[] = inventory
    .map((item: AlertInventoryItem) => {
      const available = item.quantity - item.reserved
      const percentOfThreshold = item.lowStockThreshold > 0
        ? (available / item.lowStockThreshold) * 100
        : 100

      // Determine severity
      let itemSeverity: AlertSeverity
      if (available <= 0) {
        itemSeverity = 'critical'
      } else if (available <= item.lowStockThreshold * 0.5) {
        itemSeverity = 'critical'
      } else if (available <= item.lowStockThreshold) {
        itemSeverity = 'warning'
      } else {
        itemSeverity = 'info'
      }

      const ackInfo = acknowledgedMap.get(item.id)

      return {
        id: item.id,
        inventoryId: item.id,
        product: item.product,
        location: item.location,
        currentStock: item.quantity,
        reserved: item.reserved,
        available,
        threshold: item.lowStockThreshold,
        severity: itemSeverity,
        percentOfThreshold,
        lastRestocked: null, // Would need movement tracking
        daysAtLowStock: 0, // Would need historical data
        acknowledged: !!ackInfo,
        acknowledgedAt: ackInfo?.at ?? null,
      }
    })
    .filter((item: { available: number; threshold: number }) => item.available <= item.threshold) // Only show items below threshold

  // Filter by severity
  if (severity) {
    alerts = alerts.filter((alert) => alert.severity === severity)
  }

  // Sort
  alerts.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'severity':
        const severityOrder = { critical: 0, warning: 1, info: 2 }
        comparison = severityOrder[a.severity] - severityOrder[b.severity]
        break
      case 'product':
        comparison = a.product.name.localeCompare(b.product.name)
        break
      case 'location':
        comparison = a.location.name.localeCompare(b.location.name)
        break
      case 'stock':
        comparison = a.available - b.available
        break
      case 'threshold':
        comparison = a.percentOfThreshold - b.percentOfThreshold
        break
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const total = alerts.length
  const start = (page - 1) * pageSize
  const paginatedAlerts = alerts.slice(start, start + pageSize)

  return {
    alerts: paginatedAlerts,
    total,
    page,
    pageSize,
  }
}

// ============================================================================
// GET ALERT SUMMARY
// ============================================================================

export async function getAlertSummary(): Promise<AlertSummary> {
  const inventory = await prisma.inventory.findMany({
    select: {
      id: true,
      quantity: true,
      reserved: true,
      lowStockThreshold: true,
    },
  })

  let critical = 0
  let warning = 0
  let acknowledged = 0
  let unacknowledged = 0

  // Get notifications to check acknowledgment
  const notifications = await prisma.notification.findMany({
    where: { type: 'low_stock' },
  })

  const acknowledgedIds = new Set<string>()
  for (const notification of notifications) {
    try {
      const data = notification.data ? JSON.parse(notification.data) : {}
      if (data.inventoryId && notification.readAt) {
        acknowledgedIds.add(data.inventoryId)
      }
    } catch {
      // Skip invalid JSON
    }
  }

  for (const item of inventory) {
    const available = item.quantity - item.reserved

    if (available > item.lowStockThreshold) {
      continue // Not an alert
    }

    if (available <= 0 || available <= item.lowStockThreshold * 0.5) {
      critical++
    } else {
      warning++
    }

    if (acknowledgedIds.has(item.id)) {
      acknowledged++
    } else {
      unacknowledged++
    }
  }

  return {
    total: critical + warning,
    critical,
    warning,
    acknowledged,
    unacknowledged,
  }
}

// ============================================================================
// ACKNOWLEDGE ALERT
// ============================================================================

export async function acknowledgeAlert(
  inventoryId: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: { select: { name: true, sku: true } },
        location: { select: { name: true } },
      },
    })

    if (!inventory) {
      return { success: false, message: 'Inventory item not found' }
    }

    // Create or update notification as read
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type: 'low_stock',
        data: { contains: inventoryId },
      },
    })

    if (existingNotification) {
      await prisma.notification.update({
        where: { id: existingNotification.id },
        data: { readAt: new Date() },
      })
    } else if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'low_stock',
          title: 'Low Stock Alert Acknowledged',
          body: `Alert for ${inventory.product.name} at ${inventory.location.name} has been acknowledged`,
          data: JSON.stringify({ inventoryId, acknowledgedAt: new Date() }),
          readAt: new Date(),
        },
      })
    }

    revalidatePath('/admin/inventory/alerts')

    return { success: true, message: 'Alert acknowledged successfully' }
  } catch (error) {
    console.error('Failed to acknowledge alert:', error)
    return { success: false, message: 'Failed to acknowledge alert' }
  }
}

// ============================================================================
// BULK ACKNOWLEDGE ALERTS
// ============================================================================

export async function bulkAcknowledgeAlerts(
  inventoryIds: string[],
  userId?: string
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let count = 0

    for (const id of inventoryIds) {
      const result = await acknowledgeAlert(id, userId)
      if (result.success) {
        count++
      }
    }

    revalidatePath('/admin/inventory/alerts')

    return {
      success: count > 0,
      message: `${count} of ${inventoryIds.length} alerts acknowledged`,
      count,
    }
  } catch (error) {
    console.error('Failed to bulk acknowledge alerts:', error)
    return {
      success: false,
      message: 'Failed to acknowledge alerts',
      count: 0,
    }
  }
}

// ============================================================================
// UPDATE THRESHOLD
// ============================================================================

export async function updateThreshold(
  inventoryId: string,
  threshold: number
): Promise<{ success: boolean; message: string }> {
  try {
    const validated = updateThresholdSchema.safeParse({ inventoryId, threshold })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Invalid input',
      }
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    })

    if (!inventory) {
      return { success: false, message: 'Inventory item not found' }
    }

    const oldThreshold = inventory.lowStockThreshold

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { lowStockThreshold: threshold },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'update',
        entityType: 'Inventory',
        entityId: inventoryId,
        oldValues: JSON.stringify({ lowStockThreshold: oldThreshold }),
        newValues: JSON.stringify({ lowStockThreshold: threshold }),
      },
    })

    revalidatePath('/admin/inventory/alerts')
    revalidatePath('/admin/inventory')

    return { success: true, message: 'Threshold updated successfully' }
  } catch (error) {
    console.error('Failed to update threshold:', error)
    return { success: false, message: 'Failed to update threshold' }
  }
}

// ============================================================================
// BULK UPDATE THRESHOLDS
// ============================================================================

export async function bulkUpdateThresholds(
  updates: Array<{ inventoryId: string; threshold: number }>
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let count = 0

    for (const update of updates) {
      const result = await updateThreshold(update.inventoryId, update.threshold)
      if (result.success) {
        count++
      }
    }

    revalidatePath('/admin/inventory/alerts')

    return {
      success: count > 0,
      message: `${count} of ${updates.length} thresholds updated`,
      count,
    }
  } catch (error) {
    console.error('Failed to bulk update thresholds:', error)
    return {
      success: false,
      message: 'Failed to update thresholds',
      count: 0,
    }
  }
}

// ============================================================================
// CREATE LOW STOCK NOTIFICATION
// ============================================================================

export async function createLowStockNotification(
  inventoryId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: { select: { name: true, sku: true } },
        location: { select: { name: true } },
      },
    })

    if (!inventory) {
      return { success: false, message: 'Inventory item not found' }
    }

    const available = inventory.quantity - inventory.reserved

    await prisma.notification.create({
      data: {
        userId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        body: `${inventory.product.name} (${inventory.product.sku}) at ${inventory.location.name} has ${available} units available (threshold: ${inventory.lowStockThreshold})`,
        data: JSON.stringify({
          inventoryId,
          productSku: inventory.product.sku,
          productName: inventory.product.name,
          locationName: inventory.location.name,
          available,
          threshold: inventory.lowStockThreshold,
        }),
      },
    })

    return { success: true, message: 'Notification created' }
  } catch (error) {
    console.error('Failed to create notification:', error)
    return { success: false, message: 'Failed to create notification' }
  }
}

// ============================================================================
// GET ALERT TRENDS
// ============================================================================

export type AlertTrend = {
  date: string
  critical: number
  warning: number
  resolved: number
}

export async function getAlertTrends(days = 30): Promise<AlertTrend[]> {
  // This would require historical alert tracking
  // For now, return sample data structure
  const trends: AlertTrend[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    trends.push({
      date: date.toISOString().split('T')[0],
      critical: 0,
      warning: 0,
      resolved: 0,
    })
  }

  return trends
}

// ============================================================================
// GET MOST CRITICAL ITEMS
// ============================================================================

export async function getMostCriticalItems(limit = 5): Promise<StockAlert[]> {
  const { alerts } = await getStockAlerts({
    severity: 'critical',
    sortBy: 'stock',
    sortOrder: 'asc',
    pageSize: limit,
  })

  return alerts
}

// ============================================================================
// EXPORT ALERTS
// ============================================================================

export async function exportAlertsToCSV(filters: AlertFilters = {}): Promise<string> {
  const { alerts } = await getStockAlerts({ ...filters, pageSize: 10000 })

  const headers = [
    'SKU',
    'Product',
    'Location',
    'Current Stock',
    'Reserved',
    'Available',
    'Threshold',
    'Severity',
    '% of Threshold',
    'Acknowledged',
  ]

  const rows = alerts.map((alert) => [
    alert.product.sku,
    alert.product.name,
    alert.location.name,
    alert.currentStock.toString(),
    alert.reserved.toString(),
    alert.available.toString(),
    alert.threshold.toString(),
    alert.severity.toUpperCase(),
    alert.percentOfThreshold.toFixed(1) + '%',
    alert.acknowledged ? 'Yes' : 'No',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return csvContent
}
