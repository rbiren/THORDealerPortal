'use server'

import { prisma } from '@/lib/prisma'

// Dashboard statistics types
export type DashboardStats = {
  totalOrders: number
  pendingOrders: number
  monthlySales: number
  monthlyGrowth: number
  yearToDateSales: number
  averageOrderValue: number
  activeProducts: number
  lowStockAlerts: number
  pendingInvoices: number
  overdueInvoices: number
}

export type RecentOrder = {
  id: string
  orderNumber: string
  status: string
  statusLabel: string
  statusColor: string
  totalAmount: number
  itemCount: number
  createdAt: string
}

export type ActivityItem = {
  id: string
  type: 'order' | 'invoice' | 'status_change' | 'product'
  title: string
  description: string
  timestamp: string
  icon: string
  color: string
}

export type LowStockAlert = {
  id: string
  productId: string
  productName: string
  productSku: string
  locationName: string
  quantity: number
  threshold: number
}

const ORDER_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  submitted: { label: 'Submitted', color: 'blue' },
  confirmed: { label: 'Confirmed', color: 'olive' },
  processing: { label: 'Processing', color: 'yellow' },
  shipped: { label: 'Shipped', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const

// Get dashboard stats for a dealer
export async function getDashboardStats(dealerId: string): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Run queries in parallel
  const [
    totalOrders,
    pendingOrders,
    thisMonthOrders,
    lastMonthOrders,
    ytdOrders,
    activeProducts,
    lowStockCount,
    pendingInvoices,
    overdueInvoices,
  ] = await Promise.all([
    // Total orders for this dealer
    prisma.order.count({
      where: { dealerId, status: { not: 'cancelled' } },
    }),
    // Pending orders (submitted, confirmed, processing)
    prisma.order.count({
      where: {
        dealerId,
        status: { in: ['submitted', 'confirmed', 'processing'] },
      },
    }),
    // This month's orders
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { not: 'cancelled' },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Last month's orders (for growth calculation)
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { not: 'cancelled' },
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalAmount: true },
    }),
    // Year to date orders
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { not: 'cancelled' },
        createdAt: { gte: startOfYear },
      },
      _sum: { totalAmount: true },
    }),
    // Active products count
    prisma.product.count({
      where: { status: 'active' },
    }),
    // Low stock alerts
    prisma.inventory.count({
      where: {
        quantity: { lt: prisma.inventory.fields.lowStockThreshold },
        product: { status: 'active' },
      },
    }),
    // Pending invoices for dealer
    prisma.invoice.count({
      where: { dealerId, status: { in: ['draft', 'sent'] } },
    }),
    // Overdue invoices for dealer
    prisma.invoice.count({
      where: { dealerId, status: 'overdue' },
    }),
  ])

  const monthlySales = thisMonthOrders._sum.totalAmount || 0
  const lastMonthSales = lastMonthOrders._sum.totalAmount || 0
  const monthlyGrowth = lastMonthSales > 0
    ? Math.round(((monthlySales - lastMonthSales) / lastMonthSales) * 100)
    : 0
  const averageOrderValue = thisMonthOrders._count > 0
    ? monthlySales / thisMonthOrders._count
    : 0

  return {
    totalOrders,
    pendingOrders,
    monthlySales,
    monthlyGrowth,
    yearToDateSales: ytdOrders._sum.totalAmount || 0,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    activeProducts,
    lowStockAlerts: lowStockCount,
    pendingInvoices,
    overdueInvoices,
  }
}

// Get recent orders for dashboard
export async function getRecentOrders(
  dealerId: string,
  limit = 5
): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    where: { dealerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      _count: { select: { items: true } },
    },
  })

  type OrderQueryResult = {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: Date
    _count: { items: number }
  }

  return orders.map((order: OrderQueryResult) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status,
    statusColor: ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color || 'gray',
    totalAmount: order.totalAmount,
    itemCount: order._count.items,
    createdAt: order.createdAt.toISOString(),
  }))
}

// Get recent activity feed
export async function getActivityFeed(
  dealerId: string,
  limit = 10
): Promise<ActivityItem[]> {
  // Get recent orders and their status history
  const recentOrders = await prisma.order.findMany({
    where: { dealerId },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2),
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 2,
      },
    },
  })

  // Get recent invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: { dealerId },
    orderBy: { createdAt: 'desc' },
    take: Math.ceil(limit / 2),
  })

  const activities: ActivityItem[] = []

  // Add order activities
  for (const order of recentOrders) {
    // Order creation
    activities.push({
      id: `order-${order.id}`,
      type: 'order',
      title: `Order ${order.orderNumber}`,
      description: `Order placed for $${order.totalAmount.toFixed(2)}`,
      timestamp: order.createdAt.toISOString(),
      icon: 'shopping-cart',
      color: 'blue',
    })

    // Status changes
    for (const history of order.statusHistory.slice(0, 1)) {
      if (history.status !== 'draft') {
        activities.push({
          id: `status-${history.id}`,
          type: 'status_change',
          title: `Order ${order.orderNumber} Updated`,
          description: `Status changed to ${ORDER_STATUSES[history.status as keyof typeof ORDER_STATUSES]?.label || history.status}`,
          timestamp: history.createdAt.toISOString(),
          icon: 'refresh',
          color: ORDER_STATUSES[history.status as keyof typeof ORDER_STATUSES]?.color || 'gray',
        })
      }
    }
  }

  // Add invoice activities
  for (const invoice of recentInvoices) {
    activities.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      title: `Invoice ${invoice.invoiceNumber}`,
      description: `Invoice generated for $${invoice.totalAmount.toFixed(2)}`,
      timestamp: invoice.createdAt.toISOString(),
      icon: 'document',
      color: 'green',
    })
  }

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

// Get low stock alerts visible to dealer
export async function getLowStockAlerts(limit = 5): Promise<LowStockAlert[]> {
  // This query gets inventory where quantity is below threshold
  // Since SQLite doesn't support field references in where clauses easily,
  // we'll fetch and filter
  const inventory = await prisma.inventory.findMany({
    where: {
      product: { status: 'active' },
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      location: { select: { name: true } },
    },
    orderBy: { quantity: 'asc' },
    take: limit * 2, // Get more to filter
  })

  type InventoryQueryResult = {
    id: string
    quantity: number
    lowStockThreshold: number
    product: { id: string; name: string; sku: string }
    location: { name: string }
  }

  return inventory
    .filter((inv: InventoryQueryResult) => inv.quantity < inv.lowStockThreshold)
    .slice(0, limit)
    .map((inv: InventoryQueryResult) => ({
      id: inv.id,
      productId: inv.product.id,
      productName: inv.product.name,
      productSku: inv.product.sku,
      locationName: inv.location.name,
      quantity: inv.quantity,
      threshold: inv.lowStockThreshold,
    }))
}

// Get quick stats summary for header
export async function getQuickStats(dealerId: string) {
  const [cartItemCount, unreadNotifications] = await Promise.all([
    prisma.cartItem.count({
      where: {
        cart: { dealerId, isSaved: false },
      },
    }),
    prisma.notification.count({
      where: {
        user: { dealerId },
        readAt: null,
      },
    }),
  ])

  return {
    cartItemCount,
    unreadNotifications,
  }
}
