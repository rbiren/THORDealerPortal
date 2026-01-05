'use server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Types for order creation
export type OrderItemInput = {
  productId: string
  quantity: number
  unitPrice: number
}

export type CreateOrderInput = {
  dealerId: string
  items: OrderItemInput[]
  shippingAddress: string // JSON string
  billingAddress?: string // JSON string
  poNumber?: string
  notes?: string
  paymentMethod?: string
}

export type OrderResult = {
  success: boolean
  orderId?: string
  orderNumber?: string
  error?: string
}

export type OrderValidationResult = {
  isValid: boolean
  issues: Array<{
    productId: string
    productName: string
    issue: string
    type: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'unavailable'
  }>
}

// Generate unique order number (e.g., ORD-2026-XXXXXX)
function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const id = nanoid(8).toUpperCase()
  return `ORD-${year}-${id}`
}

// Calculate order totals
function calculateTotals(items: Array<{ quantity: number; unitPrice: number }>) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxRate = 0.08 // 8% tax
  const taxAmount = subtotal * taxRate
  const shippingAmount = subtotal > 500 ? 0 : 25 // Free shipping over $500
  const totalAmount = subtotal + taxAmount + shippingAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  }
}

// Validate order items (check stock, prices, availability)
export async function validateOrderItems(
  items: OrderItemInput[]
): Promise<OrderValidationResult> {
  const issues: OrderValidationResult['issues'] = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        inventory: true,
      },
    })

    if (!product) {
      issues.push({
        productId: item.productId,
        productName: 'Unknown Product',
        issue: 'Product no longer available',
        type: 'unavailable',
      })
      continue
    }

    if (product.status !== 'active') {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: 'Product is no longer available',
        type: 'unavailable',
      })
      continue
    }

    // Check total stock across all locations
    const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0)

    if (totalStock === 0) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: 'Product is out of stock',
        type: 'out_of_stock',
      })
    } else if (totalStock < item.quantity) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: `Only ${totalStock} available (requested ${item.quantity})`,
        type: 'insufficient_stock',
      })
    }

    // Check if price has changed significantly (>1%)
    const priceChange = Math.abs(product.price - item.unitPrice) / item.unitPrice
    if (priceChange > 0.01) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: `Price has changed from $${item.unitPrice.toFixed(2)} to $${product.price.toFixed(2)}`,
        type: 'price_changed',
      })
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

// Reserve inventory for an order (reduce available stock)
export async function reserveInventory(
  items: OrderItemInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use transaction to ensure all-or-nothing reservation
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        // Get inventory ordered by quantity (take from largest stock first)
        const inventoryRecords = await tx.inventory.findMany({
          where: {
            productId: item.productId,
            quantity: { gt: 0 },
          },
          orderBy: { quantity: 'desc' },
        })

        let remainingToReserve = item.quantity

        for (const inv of inventoryRecords) {
          if (remainingToReserve <= 0) break

          const toDeduct = Math.min(inv.quantity, remainingToReserve)

          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: inv.quantity - toDeduct,
              reserved: inv.reserved + toDeduct,
            },
          })

          remainingToReserve -= toDeduct
        }

        if (remainingToReserve > 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`)
        }
      }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reserve inventory',
    }
  }
}

// Release reserved inventory (when order is cancelled)
export async function releaseInventory(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        // Get inventory records and release reserved quantity
        const inventoryRecords = await tx.inventory.findMany({
          where: {
            productId: item.productId,
            reserved: { gt: 0 },
          },
        })

        let remainingToRelease = item.quantity

        for (const inv of inventoryRecords) {
          if (remainingToRelease <= 0) break

          const toRelease = Math.min(inv.reserved, remainingToRelease)

          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              quantity: inv.quantity + toRelease,
              reserved: inv.reserved - toRelease,
            },
          })

          remainingToRelease -= toRelease
        }
      }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release inventory',
    }
  }
}

// Create a new order
export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  try {
    // Validate items first
    const validation = await validateOrderItems(input.items)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Order validation failed: ${validation.issues.map((i) => i.issue).join(', ')}`,
      }
    }

    // Reserve inventory
    const reservation = await reserveInventory(input.items)
    if (!reservation.success) {
      return {
        success: false,
        error: reservation.error || 'Failed to reserve inventory',
      }
    }

    // Calculate totals
    const totals = calculateTotals(input.items)

    // Create the order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        dealerId: input.dealerId,
        status: 'submitted',
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        shippingAmount: totals.shippingAmount,
        totalAmount: totals.totalAmount,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress || input.shippingAddress,
        poNumber: input.poNumber,
        notes: input.notes,
        submittedAt: new Date(),
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
        statusHistory: {
          create: {
            status: 'submitted',
            note: 'Order submitted by dealer',
          },
        },
      },
    })

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    }
  } catch (error) {
    // Try to release inventory on failure
    // Note: This is a best-effort cleanup
    console.error('Order creation failed:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    }
  }
}

// Get order by ID
export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      },
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// Get order by order number
export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      },
      dealer: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// Update order status with real-time notification
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validStatuses = [
      'draft',
      'submitted',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ]

    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status: ${status}` }
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const previousStatus = order.status

    // Get timestamp field for this status
    const timestampField = getTimestampField(status)

    await prisma.$transaction([
      // Update order status
      prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(timestampField ? { [timestampField]: new Date() } : {}),
        },
      }),
      // Add status history entry
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note,
          changedBy,
        },
      }),
    ])

    // If cancelled, release inventory
    if (status === 'cancelled') {
      await releaseInventory(orderId)
    }

    // Emit real-time order update
    try {
      const { emitOrderUpdate } = await import('@/lib/services/realtime')
      emitOrderUpdate(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status,
          previousStatus,
          updatedBy: changedBy,
        },
        order.dealerId
      )
    } catch (e) {
      // Don't fail the update if real-time emission fails
      console.error('Failed to emit real-time order update:', e)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    }
  }
}

function getTimestampField(status: string): string | null {
  const mapping: Record<string, string> = {
    submitted: 'submittedAt',
    confirmed: 'confirmedAt',
    shipped: 'shippedAt',
    delivered: 'deliveredAt',
    cancelled: 'cancelledAt',
  }
  return mapping[status] || null
}

// Get orders for a dealer
export async function getDealerOrders(
  dealerId: string,
  options: {
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}
) {
  const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const where = {
    dealerId,
    ...(status ? { status } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Cancel an order
export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy?: string
): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  // Only allow cancellation for certain statuses
  const cancellableStatuses = ['draft', 'submitted', 'confirmed']
  if (!cancellableStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Cannot cancel order with status: ${order.status}`,
    }
  }

  return updateOrderStatus(orderId, 'cancelled', reason, cancelledBy)
}

// Get order summary stats for a dealer
export async function getOrderStats(dealerId: string) {
  const [totalOrders, pendingOrders, completedOrders, totalSpent] = await Promise.all([
    prisma.order.count({ where: { dealerId } }),
    prisma.order.count({
      where: {
        dealerId,
        status: { in: ['submitted', 'confirmed', 'processing'] },
      },
    }),
    prisma.order.count({
      where: { dealerId, status: 'delivered' },
    }),
    prisma.order.aggregate({
      where: { dealerId, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalSpent: totalSpent._sum.totalAmount || 0,
  }
}
