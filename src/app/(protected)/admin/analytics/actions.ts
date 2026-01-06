'use server'

import { prisma } from '@/lib/prisma'

// Query result types
type DealerWithOrders = {
  id: string
  code: string
  name: string
  tier: string
  orders: Array<{
    totalAmount: number
    submittedAt: Date | null
  }>
}

// Types
export type NetworkStats = {
  totalDealers: number
  activeDealers: number
  pendingDealers: number
  totalOrders: number
  totalRevenue: number
  monthlyRevenue: number
  monthlyGrowth: number
  avgOrderValue: number
  totalProducts: number
  activeProducts: number
  lowStockItems: number
}

export type DealerPerformance = {
  dealerId: string
  dealerCode: string
  dealerName: string
  tier: string
  orderCount: number
  totalRevenue: number
  avgOrderValue: number
  lastOrderDate: string | null
  growth: number
}

export type TierDistribution = {
  tier: string
  count: number
  percentage: number
  totalRevenue: number
}

export type OrderStatusDistribution = {
  status: string
  count: number
  percentage: number
}

export type TopProduct = {
  productId: string
  productName: string
  productSku: string
  unitsSold: number
  revenue: number
  orderCount: number
}

export type SystemUsage = {
  activeUsers: number
  loginsToday: number
  ordersToday: number
  cartsActive: number
  avgSessionDuration: number
}

// Get network-wide statistics
export async function getNetworkStats(): Promise<NetworkStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalDealers,
    activeDealers,
    pendingDealers,
    totalOrders,
    revenueData,
    thisMonthRevenue,
    lastMonthRevenue,
    productCounts,
    lowStockCount,
  ] = await Promise.all([
    prisma.dealer.count(),
    prisma.dealer.count({ where: { status: 'active' } }),
    prisma.dealer.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: { notIn: ['draft', 'cancelled'] } } }),
    prisma.order.aggregate({
      where: { status: { notIn: ['draft', 'cancelled'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalAmount: true },
    }),
    prisma.product.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.inventory.count({
      where: {
        quantity: { lt: 10 }, // Simple threshold
        product: { status: 'active' },
      },
    }),
  ])

  const totalRevenue = revenueData._sum.totalAmount || 0
  const monthlyRevenue = thisMonthRevenue._sum.totalAmount || 0
  const lastMonthTotal = lastMonthRevenue._sum.totalAmount || 0
  const monthlyGrowth = lastMonthTotal > 0
    ? Math.round(((monthlyRevenue - lastMonthTotal) / lastMonthTotal) * 100)
    : 0

  const totalProducts = productCounts.reduce((sum: number, p: { status: string; _count: number }) => sum + p._count, 0)
  const activeProducts = productCounts.find((p: { status: string; _count: number }) => p.status === 'active')?._count || 0

  return {
    totalDealers,
    activeDealers,
    pendingDealers,
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    monthlyGrowth,
    avgOrderValue: revenueData._count > 0
      ? Math.round((totalRevenue / revenueData._count) * 100) / 100
      : 0,
    totalProducts,
    activeProducts,
    lowStockItems: lowStockCount,
  }
}

// Get dealer performance comparison
export async function getDealerPerformance(options: {
  periodDays?: number
  sortBy?: 'revenue' | 'orders' | 'growth'
  limit?: number
} = {}): Promise<DealerPerformance[]> {
  const { periodDays = 90, sortBy = 'revenue', limit = 20 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const previousStartDate = new Date()
  previousStartDate.setDate(previousStartDate.getDate() - periodDays * 2)
  const previousEndDate = new Date()
  previousEndDate.setDate(previousEndDate.getDate() - periodDays - 1)

  // Get all active dealers with their orders
  const dealers = await prisma.dealer.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      code: true,
      name: true,
      tier: true,
      orders: {
        where: {
          status: { notIn: ['draft', 'cancelled'] },
          submittedAt: { gte: startDate },
        },
        select: {
          totalAmount: true,
          submittedAt: true,
        },
      },
    },
  })

  // Get previous period orders for growth
  const previousOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ['draft', 'cancelled'] },
      submittedAt: { gte: previousStartDate, lte: previousEndDate },
    },
    select: { dealerId: true, totalAmount: true },
  })

  const previousMap = new Map<string, number>()
  for (const order of previousOrders) {
    previousMap.set(order.dealerId, (previousMap.get(order.dealerId) || 0) + order.totalAmount)
  }

  const performance: DealerPerformance[] = dealers.map((dealer: DealerWithOrders) => {
    const totalRevenue = dealer.orders.reduce((sum: number, o) => sum + o.totalAmount, 0)
    const orderCount = dealer.orders.length
    const lastOrder = dealer.orders.sort((a, b) =>
      (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0)
    )[0]
    const previousRevenue = previousMap.get(dealer.id) || 0
    const growth = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0

    return {
      dealerId: dealer.id,
      dealerCode: dealer.code,
      dealerName: dealer.name,
      tier: dealer.tier,
      orderCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue: orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0,
      lastOrderDate: lastOrder?.submittedAt?.toISOString() || null,
      growth,
    }
  })

  // Sort
  const sorted = performance.sort((a, b) => {
    switch (sortBy) {
      case 'orders':
        return b.orderCount - a.orderCount
      case 'growth':
        return b.growth - a.growth
      default:
        return b.totalRevenue - a.totalRevenue
    }
  })

  return sorted.slice(0, limit)
}

// Get tier distribution
export async function getTierDistribution(): Promise<TierDistribution[]> {
  const dealers = await prisma.dealer.findMany({
    where: { status: 'active' },
    select: {
      tier: true,
      orders: {
        where: { status: { notIn: ['draft', 'cancelled'] } },
        select: { totalAmount: true },
      },
    },
  })

  const tierMap = new Map<string, { count: number; revenue: number }>()

  for (const dealer of dealers) {
    const revenue = dealer.orders.reduce((sum: number, o: { totalAmount: number }) => sum + o.totalAmount, 0)
    const existing = tierMap.get(dealer.tier) || { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += revenue
    tierMap.set(dealer.tier, existing)
  }

  const totalDealers = dealers.length
  const tierOrder = ['platinum', 'gold', 'silver', 'bronze']

  return tierOrder.map((tier) => {
    const data = tierMap.get(tier) || { count: 0, revenue: 0 }
    return {
      tier,
      count: data.count,
      percentage: totalDealers > 0 ? Math.round((data.count / totalDealers) * 100) : 0,
      totalRevenue: Math.round(data.revenue * 100) / 100,
    }
  })
}

// Get order status distribution
export async function getOrderStatusDistribution(): Promise<OrderStatusDistribution[]> {
  const orderCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  })

  const total = orderCounts.reduce((sum: number, o: { status: string; _count: number }) => sum + o._count, 0)

  const statusOrder = ['submitted', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

  return statusOrder.map((status) => {
    const found = orderCounts.find((o: { status: string; _count: number }) => o.status === status)
    const count = found?._count || 0
    return {
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }
  })
}

// Get top products network-wide
export async function getTopProducts(options: {
  periodDays?: number
  limit?: number
} = {}): Promise<TopProduct[]> {
  const { periodDays = 30, limit = 10 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const productSales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    _count: { orderId: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: limit,
  })

  const productIds = productSales.map((p: { productId: string }) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  type ProductInfo = { id: string; name: string; sku: string }
  const productMap = new Map<string, ProductInfo>(products.map((p: ProductInfo) => [p.id, p]))

  return productSales.map((ps: { productId: string; _sum: { quantity: number | null; totalPrice: number | null }; _count: { orderId: number } }) => {
    const product = productMap.get(ps.productId)
    return {
      productId: ps.productId,
      productName: product?.name || 'Unknown',
      productSku: product?.sku || '',
      unitsSold: ps._sum.quantity || 0,
      revenue: Math.round((ps._sum.totalPrice || 0) * 100) / 100,
      orderCount: ps._count.orderId,
    }
  })
}

// Get system usage statistics
export async function getSystemUsage(): Promise<SystemUsage> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [activeUsers, loginsToday, ordersToday, cartsActive] = await Promise.all([
    // Users active in last 7 days (based on session)
    prisma.session.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo } },
    }).then((s: Array<{ userId: string }>) => s.length),
    // Logins today
    prisma.session.count({
      where: { createdAt: { gte: todayStart } },
    }),
    // Orders today
    prisma.order.count({
      where: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: todayStart },
      },
    }),
    // Active carts (non-empty, not saved)
    prisma.cart.count({
      where: {
        isSaved: false,
        items: { some: {} },
      },
    }),
  ])

  return {
    activeUsers,
    loginsToday,
    ordersToday,
    cartsActive,
    avgSessionDuration: 0, // Placeholder - would need actual session tracking
  }
}

// Get monthly revenue trend
export async function getMonthlyRevenueTrend(months = 12): Promise<Array<{
  month: string
  revenue: number
  orders: number
}>> {
  const results: Array<{ month: string; revenue: number; orders: number }> = []

  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const data = await prisma.order.aggregate({
      where: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
      _count: true,
    })

    results.push({
      month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      revenue: Math.round((data._sum.totalAmount || 0) * 100) / 100,
      orders: data._count,
    })
  }

  return results
}
