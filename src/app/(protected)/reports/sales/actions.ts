'use server'

import { prisma } from '@/lib/prisma'
import { type DateRange } from '@/lib/date-utils'

// Re-export type for client use (types are allowed in use server files)
export type { DateRange } from '@/lib/date-utils'

export type SalesSummary = {
  totalSales: number
  orderCount: number
  averageOrderValue: number
  itemsSold: number
  topCategory: string | null
  growth: number
}

export type SalesByPeriod = {
  period: string
  sales: number
  orders: number
  date: string
}

export type ProductSales = {
  productId: string
  productName: string
  productSku: string
  category: string | null
  quantitySold: number
  totalRevenue: number
  orderCount: number
}

export type CategorySales = {
  categoryId: string
  categoryName: string
  totalRevenue: number
  quantitySold: number
  productCount: number
  percentage: number
}

export type SalesComparison = {
  current: {
    period: string
    sales: number
    orders: number
    avgOrderValue: number
  }
  previous: {
    period: string
    sales: number
    orders: number
    avgOrderValue: number
  }
  changes: {
    salesChange: number
    ordersChange: number
    avgOrderChange: number
  }
}

// Get sales summary for a date range
export async function getSalesSummary(
  dealerId: string,
  dateRange: DateRange
): Promise<SalesSummary> {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  endDate.setHours(23, 59, 59, 999)

  // Calculate previous period for growth comparison
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - periodDays)
  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)
  prevEndDate.setHours(23, 59, 59, 999)

  const [currentPeriod, previousPeriod, itemsAggregate] = await Promise.all([
    // Current period orders
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // Previous period orders for growth
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: { totalAmount: true },
    }),
    // Items sold aggregate
    prisma.orderItem.aggregate({
      where: {
        order: {
          dealerId,
          status: { notIn: ['draft', 'cancelled'] },
          submittedAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { quantity: true },
    }),
  ])

  const totalSales = currentPeriod._sum.totalAmount || 0
  const prevSales = previousPeriod._sum.totalAmount || 0
  const growth = prevSales > 0 ? Math.round(((totalSales - prevSales) / prevSales) * 100) : 0

  // Get top category
  const topCategoryResult = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate, lte: endDate },
      },
    },
    _sum: { totalPrice: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: 1,
  })

  let topCategory: string | null = null
  if (topCategoryResult.length > 0) {
    const product = await prisma.product.findUnique({
      where: { id: topCategoryResult[0].productId },
      include: { category: true },
    })
    topCategory = product?.category?.name || null
  }

  return {
    totalSales,
    orderCount: currentPeriod._count,
    averageOrderValue: currentPeriod._count > 0 ? totalSales / currentPeriod._count : 0,
    itemsSold: itemsAggregate._sum.quantity || 0,
    topCategory,
    growth,
  }
}

// Get sales by time period (daily, weekly, monthly)
export async function getSalesByPeriod(
  dealerId: string,
  dateRange: DateRange,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<SalesByPeriod[]> {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  endDate.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      dealerId,
      status: { notIn: ['draft', 'cancelled'] },
      submittedAt: { gte: startDate, lte: endDate },
    },
    select: { submittedAt: true, totalAmount: true },
    orderBy: { submittedAt: 'asc' },
  })

  // Group orders by period
  const periodMap = new Map<string, { sales: number; orders: number; date: string }>()

  for (const order of orders) {
    if (!order.submittedAt) continue

    let periodKey: string
    const date = new Date(order.submittedAt)

    if (groupBy === 'day') {
      periodKey = date.toISOString().split('T')[0]
    } else if (groupBy === 'week') {
      // Get ISO week
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      periodKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      periodKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    }

    const existing = periodMap.get(periodKey) || { sales: 0, orders: 0, date: order.submittedAt.toISOString() }
    existing.sales += order.totalAmount
    existing.orders += 1
    periodMap.set(periodKey, existing)
  }

  return Array.from(periodMap.entries()).map(([period, data]) => ({
    period,
    sales: Math.round(data.sales * 100) / 100,
    orders: data.orders,
    date: data.date,
  }))
}

// Get product sales breakdown
export async function getProductSales(
  dealerId: string,
  dateRange: DateRange,
  options: { limit?: number; sortBy?: 'revenue' | 'quantity' } = {}
): Promise<ProductSales[]> {
  const { limit = 20, sortBy = 'revenue' } = options
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  endDate.setHours(23, 59, 59, 999)

  const productSales = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate, lte: endDate },
      },
    },
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    _count: {
      orderId: true,
    },
    orderBy: sortBy === 'revenue'
      ? { _sum: { totalPrice: 'desc' } }
      : { _sum: { quantity: 'desc' } },
    take: limit,
  })

  // Get product details
  type ProductSalesGroup = {
    productId: string
    _sum: { quantity: number | null; totalPrice: number | null }
    _count: { orderId: number }
  }

  const productIds = productSales.map((p: ProductSalesGroup) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  })

  type ProductWithCategory = {
    id: string
    name: string
    sku: string
    category: { name: string } | null
  }

  const productMap = new Map<string, ProductWithCategory>(products.map((p: ProductWithCategory) => [p.id, p]))

  return productSales.map((ps: ProductSalesGroup) => {
    const product = productMap.get(ps.productId)
    return {
      productId: ps.productId,
      productName: product?.name || 'Unknown Product',
      productSku: product?.sku || '',
      category: product?.category?.name || null,
      quantitySold: ps._sum.quantity || 0,
      totalRevenue: ps._sum.totalPrice || 0,
      orderCount: ps._count.orderId,
    }
  })
}

// Get sales by category
export async function getCategorySales(
  dealerId: string,
  dateRange: DateRange
): Promise<CategorySales[]> {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)
  endDate.setHours(23, 59, 59, 999)

  // Get all order items with product and category info
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate, lte: endDate },
      },
    },
    include: {
      product: {
        include: { category: true },
      },
    },
  })

  // Group by category
  const categoryMap = new Map<string, {
    name: string
    revenue: number
    quantity: number
    products: Set<string>
  }>()

  let totalRevenue = 0

  for (const item of orderItems) {
    const categoryId = item.product.categoryId || 'uncategorized'
    const categoryName = item.product.category?.name || 'Uncategorized'

    const existing = categoryMap.get(categoryId) || {
      name: categoryName,
      revenue: 0,
      quantity: 0,
      products: new Set<string>(),
    }

    existing.revenue += item.totalPrice
    existing.quantity += item.quantity
    existing.products.add(item.productId)
    totalRevenue += item.totalPrice

    categoryMap.set(categoryId, existing)
  }

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      totalRevenue: Math.round(data.revenue * 100) / 100,
      quantitySold: data.quantity,
      productCount: data.products.size,
      percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

// Compare two time periods
export async function getSalesComparison(
  dealerId: string,
  currentRange: DateRange,
  previousRange: DateRange
): Promise<SalesComparison> {
  const currentStart = new Date(currentRange.startDate)
  const currentEnd = new Date(currentRange.endDate)
  currentEnd.setHours(23, 59, 59, 999)

  const prevStart = new Date(previousRange.startDate)
  const prevEnd = new Date(previousRange.endDate)
  prevEnd.setHours(23, 59, 59, 999)

  const [current, previous] = await Promise.all([
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: currentStart, lte: currentEnd },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        dealerId,
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: prevStart, lte: prevEnd },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ])

  const currentSales = current._sum.totalAmount || 0
  const previousSales = previous._sum.totalAmount || 0
  const currentOrders = current._count
  const previousOrders = previous._count
  const currentAvg = currentOrders > 0 ? currentSales / currentOrders : 0
  const previousAvg = previousOrders > 0 ? previousSales / previousOrders : 0

  const calcChange = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0

  return {
    current: {
      period: `${currentRange.startDate} - ${currentRange.endDate}`,
      sales: currentSales,
      orders: currentOrders,
      avgOrderValue: Math.round(currentAvg * 100) / 100,
    },
    previous: {
      period: `${previousRange.startDate} - ${previousRange.endDate}`,
      sales: previousSales,
      orders: previousOrders,
      avgOrderValue: Math.round(previousAvg * 100) / 100,
    },
    changes: {
      salesChange: calcChange(currentSales, previousSales),
      ordersChange: calcChange(currentOrders, previousOrders),
      avgOrderChange: calcChange(currentAvg, previousAvg),
    },
  }
}
