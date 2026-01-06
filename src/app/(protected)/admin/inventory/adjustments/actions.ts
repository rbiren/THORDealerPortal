'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { adjustmentReasons, type AdjustmentReason } from '@/lib/inventory-utils'

// Re-export type for client use
export type { AdjustmentReason } from '@/lib/inventory-utils'

// ============================================================================
// SCHEMAS
// ============================================================================

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  locationId: z.string().min(1, 'Location is required'),
  type: z.enum(['add', 'remove', 'set']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.enum(adjustmentReasons),
  notes: z.string().max(500).optional(),
})

type AdjustmentInput = z.infer<typeof adjustmentSchema>

// ============================================================================
// TYPES
// ============================================================================

export type InventoryAdjustment = {
  id: string
  inventoryId: string
  productId: string
  productSku: string
  productName: string
  locationId: string
  locationName: string
  type: 'add' | 'remove' | 'set'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  notes: string | null
  adjustedBy: string | null
  adjustedAt: Date
}

type AdjustmentState = {
  success: boolean
  message: string
  adjustment?: InventoryAdjustment
  errors?: Record<string, string[]>
}

// Note: For a full implementation, we'd add an InventoryAdjustment model to the schema
// For now, we'll store adjustments in the audit log and update inventory directly

// ============================================================================
// ADJUST INVENTORY
// ============================================================================

export async function adjustInventory(input: AdjustmentInput): Promise<AdjustmentState> {
  try {
    const validated = adjustmentSchema.safeParse(input)
    if (!validated.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validated.error.flatten().fieldErrors,
      }
    }

    const { productId, locationId, type, quantity, reason, notes } = validated.data

    // Get or create inventory record
    let inventory = await prisma.inventory.findUnique({
      where: {
        productId_locationId: { productId, locationId },
      },
      include: {
        product: { select: { sku: true, name: true } },
        location: { select: { name: true } },
      },
    })

    const previousQuantity = inventory?.quantity ?? 0
    let newQuantity: number

    switch (type) {
      case 'add':
        newQuantity = previousQuantity + quantity
        break
      case 'remove':
        newQuantity = Math.max(0, previousQuantity - quantity)
        break
      case 'set':
        newQuantity = quantity
        break
    }

    if (inventory) {
      // Update existing inventory
      inventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { name: true } },
        },
      })
    } else {
      // Create new inventory record
      inventory = await prisma.inventory.create({
        data: {
          productId,
          locationId,
          quantity: newQuantity,
          reserved: 0,
          lowStockThreshold: 10,
        },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { name: true } },
        },
      })
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'update',
        entityType: 'Inventory',
        entityId: inventory.id,
        oldValues: JSON.stringify({ quantity: previousQuantity }),
        newValues: JSON.stringify({
          quantity: newQuantity,
          adjustmentType: type,
          adjustmentQuantity: quantity,
          reason,
          notes,
        }),
      },
    })

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/inventory/list')
    revalidatePath('/admin/inventory/adjustments')

    return {
      success: true,
      message: `Inventory ${type === 'add' ? 'increased' : type === 'remove' ? 'decreased' : 'set'} successfully`,
      adjustment: {
        id: inventory.id + '-' + Date.now(),
        inventoryId: inventory.id,
        productId,
        productSku: inventory.product.sku,
        productName: inventory.product.name,
        locationId,
        locationName: inventory.location.name,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        notes: notes ?? null,
        adjustedBy: null, // Would come from session
        adjustedAt: new Date(),
      },
    }
  } catch (error) {
    console.error('Failed to adjust inventory:', error)
    return {
      success: false,
      message: 'Failed to adjust inventory',
    }
  }
}

// ============================================================================
// BULK ADJUSTMENT
// ============================================================================

export type BulkAdjustmentItem = {
  productId: string
  locationId: string
  quantity: number
}

export async function bulkAdjustInventory(
  items: BulkAdjustmentItem[],
  type: 'add' | 'remove' | 'set',
  reason: AdjustmentReason,
  notes?: string
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    let successCount = 0

    for (const item of items) {
      const result = await adjustInventory({
        productId: item.productId,
        locationId: item.locationId,
        type,
        quantity: item.quantity,
        reason,
        notes,
      })

      if (result.success) {
        successCount++
      }
    }

    revalidatePath('/admin/inventory')

    return {
      success: successCount > 0,
      message: `${successCount} of ${items.length} items adjusted successfully`,
      count: successCount,
    }
  } catch (error) {
    console.error('Failed to bulk adjust inventory:', error)
    return {
      success: false,
      message: 'Failed to process bulk adjustment',
      count: 0,
    }
  }
}

// ============================================================================
// GET ADJUSTMENT HISTORY
// ============================================================================

export type AdjustmentHistoryFilters = {
  productId?: string
  locationId?: string
  reason?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

export type AdjustmentHistoryItem = {
  id: string
  inventoryId: string
  productSku: string
  productName: string
  locationName: string
  type: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  notes: string | null
  adjustedAt: Date
}

export async function getAdjustmentHistory(
  filters: AdjustmentHistoryFilters = {}
): Promise<{ items: AdjustmentHistoryItem[]; total: number }> {
  const { productId, locationId, startDate, endDate, page = 1, pageSize = 20 } = filters

  // Get audit logs for inventory adjustments
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: 'Inventory',
      action: 'update',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await prisma.auditLog.count({
    where: {
      entityType: 'Inventory',
      action: 'update',
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    },
  })

  // Fetch inventory details for each log
  const items: AdjustmentHistoryItem[] = []

  for (const log of logs) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: log.entityId ?? '' },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    })

    if (!inventory) continue

    // Filter by product/location if specified
    if (productId && inventory.product.id !== productId) continue
    if (locationId && inventory.location.id !== locationId) continue

    const oldValues = log.oldValues ? JSON.parse(log.oldValues) : {}
    const newValues = log.newValues ? JSON.parse(log.newValues) : {}

    items.push({
      id: log.id,
      inventoryId: log.entityId ?? '',
      productSku: inventory.product.sku,
      productName: inventory.product.name,
      locationName: inventory.location.name,
      type: newValues.adjustmentType ?? 'update',
      quantity: newValues.adjustmentQuantity ?? 0,
      previousQuantity: oldValues.quantity ?? 0,
      newQuantity: newValues.quantity ?? 0,
      reason: newValues.reason ?? 'unknown',
      notes: newValues.notes ?? null,
      adjustedAt: log.createdAt,
    })
  }

  return { items, total }
}
