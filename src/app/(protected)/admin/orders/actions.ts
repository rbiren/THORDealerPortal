'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { updateOrderStatus, releaseInventory } from '@/lib/services/order'
import { createInvoiceFromOrder } from '@/lib/services/invoice'
import { ADMIN_ORDER_STATUSES, type AdminOrderStatus } from '@/lib/admin-order-statuses'

// Note: Client components should import ADMIN_ORDER_STATUSES from '@/lib/admin-order-statuses'

// Get all orders with advanced filters (admin view)
export async function getAdminOrders(options: {
  page?: number
  limit?: number
  status?: AdminOrderStatus | AdminOrderStatus[]
  dealerId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
} = {}) {
  const {
    page = 1,
    limit = 25,
    status,
    dealerId,
    search,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  // Build where clause
  const where: Record<string, unknown> = {}

  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status }
    } else {
      where.status = status
    }
  }

  if (dealerId) {
    where.dealerId = dealerId
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { poNumber: { contains: search, mode: 'insensitive' } },
      { dealer: { name: { contains: search, mode: 'insensitive' } } },
      { dealer: { code: { contains: search, mode: 'insensitive' } } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      (where.createdAt as Record<string, Date>).gte = new Date(dateFrom)
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      ;(where.createdAt as Record<string, Date>).lte = endDate
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      include: {
        dealer: {
          select: { id: true, name: true, code: true, tier: true },
        },
        items: {
          select: { id: true, quantity: true, totalPrice: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.order.count({ where: where as any }),
  ])

  type OrderQueryResult = {
    id: string
    orderNumber: string
    status: string
    poNumber: string | null
    subtotal: number
    totalAmount: number
    createdAt: Date
    submittedAt: Date | null
    dealer: { id: string; name: string; code: string; tier: string }
    items: Array<{ id: string; quantity: number; totalPrice: number }>
    _count: { items: number }
  }

  return {
    orders: orders.map((order: OrderQueryResult) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]?.label || order.status,
      statusColor: ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]?.color || 'gray',
      availableActions: ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]?.adminActions || [],
      poNumber: order.poNumber,
      dealerId: order.dealer.id,
      dealerName: order.dealer.name,
      dealerCode: order.dealer.code,
      dealerTier: order.dealer.tier,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      lineItemCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
      submittedAt: order.submittedAt?.toISOString() || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Get admin order statistics
export async function getAdminOrderStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    monthlyTotal,
    lastMonthTotal,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['submitted', 'confirmed'] } } }),
    prisma.order.count({ where: { status: 'processing' } }),
    prisma.order.count({ where: { status: 'delivered' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    }),
  ])

  const monthlyGrowth = lastMonthTotal > 0
    ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    cancelledOrders,
    monthlyOrders: monthlyTotal,
    monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
    monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
  }
}

// Bulk update order status
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: AdminOrderStatus,
  note?: string,
  changedBy?: string
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  const errors: string[] = []
  let updated = 0

  for (const orderId of orderIds) {
    const result = await updateOrderStatus(orderId, newStatus, note, changedBy)
    if (result.success) {
      updated++

      // Create invoice when confirming order
      if (newStatus === 'confirmed') {
        await createInvoiceFromOrder(orderId)
      }
    } else {
      errors.push(`Order ${orderId}: ${result.error}`)
    }
  }

  return { success: errors.length === 0, updated, errors }
}

// Get order for admin editing
export async function getAdminOrderDetail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, price: true, images: true },
          },
        },
      },
      dealer: {
        select: { id: true, name: true, code: true, tier: true },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) return null

  // Get order notes
  const orderNotes = await prisma.orderNote.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  })

  let shippingAddress = null
  let billingAddress = null

  try {
    if (order.shippingAddress) {
      shippingAddress = JSON.parse(order.shippingAddress)
    }
    if (order.billingAddress) {
      billingAddress = JSON.parse(order.billingAddress)
    }
  } catch {
    // Ignore parse errors
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]?.label || order.status,
    availableActions: ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]?.adminActions || [],
    poNumber: order.poNumber,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    totalAmount: order.totalAmount,
    shippingAddress,
    billingAddress,
    orderNotes: order.notes,
    dealer: order.dealer,
    items: order.items.map((item: { id: string; productId: string; quantity: number; unitPrice: number; totalPrice: number; product: { name: string; sku: string; price: number; images?: string[] } }) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      currentPrice: item.product.price,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      image: item.product.images?.[0] || null,
    })),
    statusHistory: order.statusHistory.map((h: { status: string; note: string | null; changedBy: string | null; createdAt: Date }) => ({
      status: h.status,
      statusLabel: ADMIN_ORDER_STATUSES[h.status as AdminOrderStatus]?.label || h.status,
      note: h.note,
      changedBy: h.changedBy,
      createdAt: h.createdAt.toISOString(),
    })),
    notes: orderNotes.map((n: { id: string; content: string; isInternal: boolean; userId: string; createdAt: Date; user?: { name: string } | null }) => ({
      id: n.id,
      content: n.content,
      isInternal: n.isInternal,
      authorName: n.user?.name || 'System',
      authorId: n.userId,
      createdAt: n.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    submittedAt: order.submittedAt?.toISOString() || null,
  }
}

// Update order item quantity
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  quantity: number,
  unitPrice?: number,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Only allow editing for certain statuses
    if (!['draft', 'submitted', 'confirmed'].includes(order.status)) {
      return { success: false, error: 'Cannot edit order in current status' }
    }

    const item = order.items.find((i: { id: string }) => i.id === itemId)
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    const newUnitPrice = unitPrice ?? item.unitPrice
    const newTotalPrice = quantity * newUnitPrice

    await prisma.$transaction([
      // Update the item
      prisma.orderItem.update({
        where: { id: itemId },
        data: {
          quantity,
          unitPrice: newUnitPrice,
          totalPrice: newTotalPrice,
        },
      }),
      // Recalculate order totals
      prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal: {
            increment: newTotalPrice - item.totalPrice,
          },
        },
      }),
      // Add status history note
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          note: `Item updated: ${item.quantity} → ${quantity}`,
          changedBy,
        },
      }),
    ])

    // Recalculate totals
    await recalculateOrderTotals(orderId)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    }
  }
}

// Remove order item
export async function removeOrderItem(
  orderId: string,
  itemId: string,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (!['draft', 'submitted', 'confirmed'].includes(order.status)) {
      return { success: false, error: 'Cannot edit order in current status' }
    }

    if (order.items.length <= 1) {
      return { success: false, error: 'Cannot remove last item. Cancel the order instead.' }
    }

    const item = order.items.find((i: { id: string }) => i.id === itemId)
    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    await prisma.$transaction([
      prisma.orderItem.delete({ where: { id: itemId } }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          note: `Item removed from order`,
          changedBy,
        },
      }),
    ])

    await recalculateOrderTotals(orderId)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item',
    }
  }
}

// Recalculate order totals
async function recalculateOrderTotals(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) return

  const subtotal = order.items.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0)
  const taxAmount = subtotal * 0.08
  const shippingAmount = subtotal > 500 ? 0 : 25
  const totalAmount = subtotal + taxAmount + shippingAmount

  await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingAmount: Math.round(shippingAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    },
  })
}

// Add order note
export async function addOrderNote(
  orderId: string,
  content: string,
  userId: string,
  isInternal: boolean = true
): Promise<{ success: boolean; noteId?: string; error?: string }> {
  try {
    const note = await prisma.orderNote.create({
      data: {
        orderId,
        userId,
        content,
        isInternal,
      },
    })

    return { success: true, noteId: note.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note',
    }
  }
}

// Delete order note
export async function deleteOrderNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.orderNote.delete({ where: { id: noteId } })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note',
    }
  }
}

// Export orders to CSV
export async function exportOrdersCsv(options: {
  status?: AdminOrderStatus | AdminOrderStatus[]
  dealerId?: string
  dateFrom?: string
  dateTo?: string
} = {}): Promise<string> {
  const result = await getAdminOrders({ ...options, limit: 10000 })

  const headers = [
    'Order Number',
    'Status',
    'Dealer Code',
    'Dealer Name',
    'PO Number',
    'Items',
    'Subtotal',
    'Total',
    'Created At',
    'Submitted At',
  ]

  type OrderExportItem = {
    orderNumber: string
    statusLabel: string
    dealerCode: string
    dealerName: string
    poNumber: string | null
    itemCount: number
    subtotal: number
    totalAmount: number
    createdAt: string
    submittedAt: string | null
  }

  const rows = result.orders.map((order: OrderExportItem) => [
    order.orderNumber,
    order.statusLabel,
    order.dealerCode,
    order.dealerName,
    order.poNumber || '',
    order.itemCount.toString(),
    order.subtotal.toFixed(2),
    order.totalAmount.toFixed(2),
    new Date(order.createdAt).toISOString(),
    order.submittedAt ? new Date(order.submittedAt).toISOString() : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
  ].join('\n')

  return csvContent
}
