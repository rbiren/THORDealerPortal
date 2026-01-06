'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getDealerOrders,
  getOrderStats,
} from '@/lib/services/order'
import { sendEmail } from '@/lib/services/email'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/order-statuses'

// Re-export for use by client components
export { ORDER_STATUSES, type OrderStatus }

// Get order details for display
export async function getOrder(orderIdOrNumber: string) {
  // Try by order number first (starts with ORD-)
  if (orderIdOrNumber.startsWith('ORD-')) {
    return getOrderByNumber(orderIdOrNumber)
  }
  return getOrderById(orderIdOrNumber)
}

// Update order status with validation and notifications
export async function changeOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  changedBy?: string
): Promise<{ success: boolean; error?: string }> {
  // Get current order
  const order = await getOrderById(orderId)
  if (!order) {
    return { success: false, error: 'Order not found' }
  }

  const currentStatus = order.status as OrderStatus
  const statusConfig = ORDER_STATUSES[currentStatus]

  // Validate status transition
  if (!(statusConfig.next as readonly string[]).includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${statusConfig.label} to ${ORDER_STATUSES[newStatus].label}`,
    }
  }

  // Update status
  const result = await updateOrderStatus(orderId, newStatus, note, changedBy)

  if (result.success) {
    // Send notification email
    await sendOrderStatusUpdateEmail(orderId, newStatus, note)
  }

  return result
}

// Cancel order with reason
export async function cancelDealerOrder(
  orderId: string,
  reason: string,
  cancelledBy?: string
): Promise<{ success: boolean; error?: string }> {
  const result = await cancelOrder(orderId, reason, cancelledBy)

  if (result.success) {
    await sendOrderStatusUpdateEmail(orderId, 'cancelled', reason)
  }

  return result
}

// Get orders for dealer
export async function getOrdersForDealer(
  dealerId: string,
  options: {
    status?: OrderStatus
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}
) {
  const { status, page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = options

  // Build where clause
  const where: Record<string, unknown> = { dealerId }

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { poNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.order.count({ where: where as any }),
  ])

  type OrderQueryItem = {
    id: string
    orderNumber: string
    status: string
    poNumber: string | null
    subtotal: number
    totalAmount: number
    items: Array<{ quantity: number }>
    createdAt: Date
    submittedAt: Date | null
  }

  return {
    orders: orders.map((order: OrderQueryItem) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: ORDER_STATUSES[order.status as OrderStatus]?.label || order.status,
      statusColor: ORDER_STATUSES[order.status as OrderStatus]?.color || 'gray',
      poNumber: order.poNumber,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      itemCount: order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
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

// Get order statistics
export async function getDealerOrderStats(dealerId: string) {
  return getOrderStats(dealerId)
}

// Get order status history
export async function getOrderStatusHistory(orderId: string) {
  const history = await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  })

  type HistoryEntry = {
    status: string
    note: string | null
    changedBy: string | null
    createdAt: Date
  }

  return history.map((entry: HistoryEntry) => ({
    status: entry.status,
    statusLabel: ORDER_STATUSES[entry.status as OrderStatus]?.label || entry.status,
    note: entry.note,
    changedBy: entry.changedBy,
    createdAt: entry.createdAt.toISOString(),
  }))
}

// Reorder (copy items to cart)
export async function reorderItems(orderId: string) {
  const order = await getOrderById(orderId)
  if (!order) {
    return { success: false, error: 'Order not found', items: [] }
  }

  // Return items that can be added to cart
  type ReorderItemQuery = {
    productId: string
    product: { name: string; sku: string; images?: Array<string | null> }
    quantity: number
    unitPrice: number
  }

  const items = order.items.map((item: ReorderItemQuery) => ({
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    price: item.unitPrice,
    image: item.product.images?.[0] || null,
  }))

  return { success: true, items }
}

// Send order status update email
async function sendOrderStatusUpdateEmail(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      dealer: {
        include: {
          users: {
            where: { role: { in: ['dealer_admin', 'dealer_user'] } },
            select: { email: true, name: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!order || !order.dealer.users[0]) {
    return
  }

  const recipient = order.dealer.users[0]
  const statusLabel = ORDER_STATUSES[newStatus].label

  const subject = `Order ${order.orderNumber} - ${statusLabel}`

  const statusMessages: Record<OrderStatus, string> = {
    draft: 'Your order has been saved as a draft.',
    submitted: 'Your order has been submitted and is being reviewed.',
    confirmed: 'Your order has been confirmed and will be processed shortly.',
    processing: 'Your order is now being processed and prepared for shipment.',
    shipped: 'Your order has been shipped! You should receive tracking information soon.',
    delivered: 'Your order has been delivered. Thank you for your business!',
    cancelled: 'Your order has been cancelled.',
  }

  const text = `
Hello ${recipient.name || 'Valued Customer'},

${statusMessages[newStatus]}

Order Number: ${order.orderNumber}
${order.poNumber ? `PO Number: ${order.poNumber}` : ''}
Status: ${statusLabel}
${note ? `\nNote: ${note}` : ''}

You can view your order details at any time by logging into the THOR Dealer Portal.

---
THOR Dealer Portal
`.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #556B2F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #556B2F;">Order Update</h2>
    <p>Hello ${recipient.name || 'Valued Customer'},</p>
    <p>${statusMessages[newStatus]}</p>

    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      ${order.poNumber ? `<p style="margin: 5px 0;"><strong>PO Number:</strong> ${order.poNumber}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #556B2F; font-weight: bold;">${statusLabel}</span></p>
      ${note ? `<p style="margin: 5px 0 0;"><strong>Note:</strong> ${note}</p>` : ''}
    </div>

    <p>You can view your order details at any time by logging into the THOR Dealer Portal.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  await sendEmail({ to: recipient.email, subject, text, html })
}
