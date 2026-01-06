'use server'

import { prisma } from '@/lib/prisma'

// Types
export type InventoryValueSummary = {
  totalValue: number
  totalCost: number
  potentialProfit: number
  totalItems: number
  totalQuantity: number
  averageValue: number
}

export type InventoryByLocation = {
  locationId: string
  locationName: string
  locationType: string
  itemCount: number
  totalQuantity: number
  totalValue: number
  totalCost: number
}

export type InventoryByCategory = {
  categoryId: string
  categoryName: string
  itemCount: number
  totalQuantity: number
  totalValue: number
  percentage: number
}

export type TurnoverData = {
  productId: string
  productName: string
  productSku: string
  category: string | null
  currentStock: number
  soldQuantity: number
  turnoverRate: number
  daysOfSupply: number
}

export type AgingData = {
  productId: string
  productName: string
  productSku: string
  locationName: string
  quantity: number
  lastUpdated: string
  ageInDays: number
  ageBucket: string
  value: number
}

export type AgingSummary = {
  bucket: string
  itemCount: number
  quantity: number
  value: number
  percentage: number
}

// Get inventory value summary
export async function getInventoryValueSummary(): Promise<InventoryValueSummary> {
  const inventory = await prisma.inventory.findMany({
    where: {
      product: { status: 'active' },
      quantity: { gt: 0 },
    },
    include: {
      product: {
        select: { price: true, costPrice: true },
      },
    },
  })

  let totalValue = 0
  let totalCost = 0
  let totalQuantity = 0

  for (const item of inventory) {
    const value = item.quantity * item.product.price
    const cost = item.quantity * (item.product.costPrice || item.product.price * 0.6)
    totalValue += value
    totalCost += cost
    totalQuantity += item.quantity
  }

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    potentialProfit: Math.round((totalValue - totalCost) * 100) / 100,
    totalItems: inventory.length,
    totalQuantity,
    averageValue: inventory.length > 0 ? Math.round((totalValue / inventory.length) * 100) / 100 : 0,
  }
}

// Get inventory value by location
export async function getInventoryByLocation(): Promise<InventoryByLocation[]> {
  const inventory = await prisma.inventory.findMany({
    where: {
      product: { status: 'active' },
      quantity: { gt: 0 },
    },
    include: {
      product: {
        select: { price: true, costPrice: true },
      },
      location: {
        select: { id: true, name: true, type: true },
      },
    },
  })

  const locationMap = new Map<string, {
    name: string
    type: string
    items: number
    quantity: number
    value: number
    cost: number
  }>()

  for (const item of inventory) {
    const existing = locationMap.get(item.locationId) || {
      name: item.location.name,
      type: item.location.type,
      items: 0,
      quantity: 0,
      value: 0,
      cost: 0,
    }

    existing.items++
    existing.quantity += item.quantity
    existing.value += item.quantity * item.product.price
    existing.cost += item.quantity * (item.product.costPrice || item.product.price * 0.6)

    locationMap.set(item.locationId, existing)
  }

  return Array.from(locationMap.entries())
    .map(([locationId, data]) => ({
      locationId,
      locationName: data.name,
      locationType: data.type,
      itemCount: data.items,
      totalQuantity: data.quantity,
      totalValue: Math.round(data.value * 100) / 100,
      totalCost: Math.round(data.cost * 100) / 100,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

// Get inventory value by category
export async function getInventoryByCategory(): Promise<InventoryByCategory[]> {
  const inventory = await prisma.inventory.findMany({
    where: {
      product: { status: 'active' },
      quantity: { gt: 0 },
    },
    include: {
      product: {
        select: {
          price: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      },
    },
  })

  const categoryMap = new Map<string, {
    name: string
    items: number
    quantity: number
    value: number
  }>()

  let totalValue = 0

  for (const item of inventory) {
    const categoryId = item.product.categoryId || 'uncategorized'
    const categoryName = item.product.category?.name || 'Uncategorized'
    const value = item.quantity * item.product.price

    const existing = categoryMap.get(categoryId) || {
      name: categoryName,
      items: 0,
      quantity: 0,
      value: 0,
    }

    existing.items++
    existing.quantity += item.quantity
    existing.value += value
    totalValue += value

    categoryMap.set(categoryId, existing)
  }

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      itemCount: data.items,
      totalQuantity: data.quantity,
      totalValue: Math.round(data.value * 100) / 100,
      percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

// Get inventory turnover data
export async function getInventoryTurnover(options: {
  periodDays?: number
  limit?: number
} = {}): Promise<TurnoverData[]> {
  const { periodDays = 90, limit = 50 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get all active products with their current inventory
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: {
      category: { select: { name: true } },
      inventory: {
        select: { quantity: true },
      },
    },
  })

  // Get sales for period
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { notIn: ['draft', 'cancelled'] },
        submittedAt: { gte: startDate },
      },
    },
    select: {
      productId: true,
      quantity: true,
    },
  })

  // Calculate sold quantities
  const soldMap = new Map<string, number>()
  for (const item of orderItems) {
    soldMap.set(item.productId, (soldMap.get(item.productId) || 0) + item.quantity)
  }

  // Calculate turnover for each product
  type ProductTurnoverItem = {
    id: string
    name: string
    sku: string
    category: { name: string } | null
    inventory: Array<{ quantity: number }>
  }

  const turnoverData: TurnoverData[] = products.map((product: ProductTurnoverItem) => {
    const currentStock = product.inventory.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0)
    const soldQuantity = soldMap.get(product.id) || 0
    const avgInventory = currentStock + soldQuantity / 2 // Simplified average
    const turnoverRate = avgInventory > 0 ? (soldQuantity / avgInventory) * (365 / periodDays) : 0
    const dailySales = soldQuantity / periodDays
    const daysOfSupply = dailySales > 0 ? Math.round(currentStock / dailySales) : 999

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      category: product.category?.name || null,
      currentStock,
      soldQuantity,
      turnoverRate: Math.round(turnoverRate * 100) / 100,
      daysOfSupply: Math.min(daysOfSupply, 999), // Cap at 999
    }
  })

  // Sort by turnover rate descending
  return turnoverData
    .sort((a, b) => b.turnoverRate - a.turnoverRate)
    .slice(0, limit)
}

// Get slow-moving inventory (low turnover)
export async function getSlowMovingInventory(options: {
  periodDays?: number
  limit?: number
} = {}): Promise<TurnoverData[]> {
  const { periodDays = 90, limit = 20 } = options

  const allTurnover = await getInventoryTurnover({ periodDays, limit: 1000 })

  // Filter for slow movers (turnover rate < 2 and has stock)
  return allTurnover
    .filter((item) => item.currentStock > 0 && item.turnoverRate < 2)
    .sort((a, b) => a.turnoverRate - b.turnoverRate)
    .slice(0, limit)
}

// Get inventory aging data
export async function getInventoryAging(): Promise<AgingData[]> {
  const inventory = await prisma.inventory.findMany({
    where: {
      product: { status: 'active' },
      quantity: { gt: 0 },
    },
    include: {
      product: {
        select: { id: true, name: true, sku: true, price: true },
      },
      location: {
        select: { name: true },
      },
    },
  })

  const now = new Date()

  type InventoryAgingItem = {
    quantity: number
    updatedAt: Date
    product: { id: string; name: string; sku: string; price: number }
    location: { name: string }
  }

  return inventory.map((item: InventoryAgingItem) => {
    const lastUpdated = item.updatedAt
    const ageInDays = Math.floor((now.getTime() - lastUpdated.getTime()) / 86400000)

    let ageBucket: string
    if (ageInDays <= 30) ageBucket = '0-30 days'
    else if (ageInDays <= 60) ageBucket = '31-60 days'
    else if (ageInDays <= 90) ageBucket = '61-90 days'
    else if (ageInDays <= 120) ageBucket = '91-120 days'
    else ageBucket = '120+ days'

    return {
      productId: item.product.id,
      productName: item.product.name,
      productSku: item.product.sku,
      locationName: item.location.name,
      quantity: item.quantity,
      lastUpdated: lastUpdated.toISOString(),
      ageInDays,
      ageBucket,
      value: Math.round(item.quantity * item.product.price * 100) / 100,
    }
  }).sort((a: { ageInDays: number }, b: { ageInDays: number }) => b.ageInDays - a.ageInDays)
}

// Get aging summary by bucket
export async function getAgingSummary(): Promise<AgingSummary[]> {
  const agingData = await getInventoryAging()

  const bucketMap = new Map<string, { items: number; quantity: number; value: number }>()
  let totalValue = 0

  for (const item of agingData) {
    const existing = bucketMap.get(item.ageBucket) || { items: 0, quantity: 0, value: 0 }
    existing.items++
    existing.quantity += item.quantity
    existing.value += item.value
    totalValue += item.value
    bucketMap.set(item.ageBucket, existing)
  }

  const bucketOrder = ['0-30 days', '31-60 days', '61-90 days', '91-120 days', '120+ days']

  return bucketOrder.map((bucket) => {
    const data = bucketMap.get(bucket) || { items: 0, quantity: 0, value: 0 }
    return {
      bucket,
      itemCount: data.items,
      quantity: data.quantity,
      value: Math.round(data.value * 100) / 100,
      percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 1000) / 10 : 0,
    }
  })
}
