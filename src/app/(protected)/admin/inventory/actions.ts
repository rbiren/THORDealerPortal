'use server'

import { prisma } from '@/lib/prisma'

// ============================================================================
// INVENTORY DASHBOARD ACTIONS
// ============================================================================

export type InventorySummary = {
  totalProducts: number
  totalStock: number
  totalReserved: number
  totalAvailable: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

export type LocationSummary = {
  id: string
  name: string
  code: string
  type: string
  isActive: boolean
  productCount: number
  totalStock: number
  totalReserved: number
  totalAvailable: number
  totalValue: number
  lowStockCount: number
}

export type LowStockItem = {
  id: string
  product: {
    id: string
    sku: string
    name: string
    price: number
    costPrice: number | null
  }
  location: {
    id: string
    name: string
    code: string
  }
  quantity: number
  reserved: number
  available: number
  lowStockThreshold: number
  percentOfThreshold: number
}

export type InventoryByCategory = {
  categoryId: string | null
  categoryName: string
  totalStock: number
  totalValue: number
  productCount: number
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          costPrice: true,
          price: true,
        },
      },
    },
  })

  let totalStock = 0
  let totalReserved = 0
  let totalValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  const uniqueProducts = new Set<string>()

  for (const item of inventory) {
    totalStock += item.quantity
    totalReserved += item.reserved

    // Calculate value using cost price if available, otherwise use price
    const unitValue = item.product.costPrice ?? item.product.price
    totalValue += item.quantity * unitValue

    const available = item.quantity - item.reserved
    if (available <= 0) {
      outOfStockCount++
    } else if (available <= item.lowStockThreshold) {
      lowStockCount++
    }

    uniqueProducts.add(item.productId)
  }

  return {
    totalProducts: uniqueProducts.size,
    totalStock,
    totalReserved,
    totalAvailable: totalStock - totalReserved,
    totalValue,
    lowStockCount,
    outOfStockCount,
  }
}

export async function getLocationSummaries(): Promise<LocationSummary[]> {
  const locations = await prisma.inventoryLocation.findMany({
    include: {
      inventory: {
        include: {
          product: {
            select: {
              costPrice: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  type InventoryItem = {
    quantity: number
    reserved: number
    lowStockThreshold: number
    product: { costPrice: number | null; price: number }
  }

  type LocationWithInventory = {
    id: string
    name: string
    code: string
    type: string
    isActive: boolean
    inventory: InventoryItem[]
  }

  return locations.map((location: LocationWithInventory) => {
    let totalStock = 0
    let totalReserved = 0
    let totalValue = 0
    let lowStockCount = 0

    for (const item of location.inventory) {
      totalStock += item.quantity
      totalReserved += item.reserved

      const unitValue = item.product.costPrice ?? item.product.price
      totalValue += item.quantity * unitValue

      const available = item.quantity - item.reserved
      if (available > 0 && available <= item.lowStockThreshold) {
        lowStockCount++
      }
    }

    return {
      id: location.id,
      name: location.name,
      code: location.code,
      type: location.type,
      isActive: location.isActive,
      productCount: location.inventory.length,
      totalStock,
      totalReserved,
      totalAvailable: totalStock - totalReserved,
      totalValue,
      lowStockCount,
    }
  })
}

export async function getLowStockItems(limit = 20): Promise<LowStockItem[]> {
  const inventory = await prisma.inventory.findMany({
    where: {
      quantity: { gt: 0 },
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          costPrice: true,
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

  type LowStockInventory = {
    id: string
    quantity: number
    reserved: number
    lowStockThreshold: number
    product: { id: string; name: string; sku: string; price: number; costPrice: number | null }
    location: { id: string; name: string; code: string }
  }

  // Filter for low stock items and calculate percent of threshold
  const lowStockItems = inventory
    .map((item: LowStockInventory) => {
      const available = item.quantity - item.reserved
      const percentOfThreshold = item.lowStockThreshold > 0
        ? (available / item.lowStockThreshold) * 100
        : 100

      return {
        id: item.id,
        product: item.product,
        location: item.location,
        quantity: item.quantity,
        reserved: item.reserved,
        available,
        lowStockThreshold: item.lowStockThreshold,
        percentOfThreshold,
      }
    })
    .filter((item: { available: number; lowStockThreshold: number }) => item.available <= item.lowStockThreshold)
    .sort((a: { percentOfThreshold: number }, b: { percentOfThreshold: number }) => a.percentOfThreshold - b.percentOfThreshold)
    .slice(0, limit)

  return lowStockItems
}

export async function getOutOfStockItems(limit = 20): Promise<LowStockItem[]> {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          costPrice: true,
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

  type OutOfStockInventory = {
    id: string
    quantity: number
    reserved: number
    lowStockThreshold: number
    product: { id: string; name: string; sku: string; price: number; costPrice: number | null }
    location: { id: string; name: string; code: string }
  }

  // Filter for out of stock items (available <= 0)
  const outOfStockItems = inventory
    .map((item: OutOfStockInventory) => {
      const available = item.quantity - item.reserved
      return {
        id: item.id,
        product: item.product,
        location: item.location,
        quantity: item.quantity,
        reserved: item.reserved,
        available,
        lowStockThreshold: item.lowStockThreshold,
        percentOfThreshold: 0,
      }
    })
    .filter((item: { available: number }) => item.available <= 0)
    .slice(0, limit)

  return outOfStockItems
}

export async function getInventoryByCategory(): Promise<InventoryByCategory[]> {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        select: {
          categoryId: true,
          category: {
            select: {
              name: true,
            },
          },
          costPrice: true,
          price: true,
        },
      },
    },
  })

  const categoryMap = new Map<string | null, {
    categoryName: string
    totalStock: number
    totalValue: number
    products: Set<string>
  }>()

  for (const item of inventory) {
    const categoryId = item.product.categoryId
    const categoryName = item.product.category?.name ?? 'Uncategorized'

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryName,
        totalStock: 0,
        totalValue: 0,
        products: new Set(),
      })
    }

    const entry = categoryMap.get(categoryId)!
    entry.totalStock += item.quantity
    const unitValue = item.product.costPrice ?? item.product.price
    entry.totalValue += item.quantity * unitValue
    entry.products.add(item.productId)
  }

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      totalStock: data.totalStock,
      totalValue: data.totalValue,
      productCount: data.products.size,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
}

export type RecentMovement = {
  id: string
  productId: string
  productSku: string
  productName: string
  locationName: string
  change: number
  newQuantity: number
  timestamp: Date
  type: 'in' | 'out' | 'adjustment'
}

// Note: This would require an InventoryMovement model to track historical changes
// For now, we'll simulate with a placeholder that returns empty
export async function getRecentMovements(limit = 10): Promise<RecentMovement[]> {
  // TODO: Implement when InventoryMovement model is added
  return []
}

// ============================================================================
// INVENTORY LIST FILTERS
// ============================================================================

export type InventoryListFilters = {
  search?: string
  locationId?: string
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  categoryId?: string
  sortBy?: 'product' | 'location' | 'quantity' | 'available' | 'value'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type InventoryListItem = {
  id: string
  product: {
    id: string
    sku: string
    name: string
    price: number
    costPrice: number | null
    categoryId: string | null
    categoryName: string | null
  }
  location: {
    id: string
    name: string
    code: string
  }
  quantity: number
  reserved: number
  available: number
  lowStockThreshold: number
  value: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export type InventoryListResult = {
  items: InventoryListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getInventoryList(
  filters: InventoryListFilters = {}
): Promise<InventoryListResult> {
  const {
    search,
    locationId,
    status,
    categoryId,
    sortBy = 'product',
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

  // Get all matching inventory items
  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          costPrice: true,
          categoryId: true,
          category: {
            select: { name: true },
          },
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

  type FullInventoryItem = {
    id: string
    quantity: number
    reserved: number
    lowStockThreshold: number
    product: {
      id: string
      sku: string
      name: string
      price: number
      costPrice: number | null
      categoryId: string | null
      category: { name: string } | null
    }
    location: { id: string; name: string; code: string }
  }

  // Transform and filter by status
  let items: InventoryListItem[] = inventory.map((item: FullInventoryItem) => {
    const available = item.quantity - item.reserved
    const unitValue = item.product.costPrice ?? item.product.price

    let itemStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
    if (available <= 0) {
      itemStatus = 'out_of_stock'
    } else if (available <= item.lowStockThreshold) {
      itemStatus = 'low_stock'
    } else {
      itemStatus = 'in_stock'
    }

    return {
      id: item.id,
      product: {
        id: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice,
        categoryId: item.product.categoryId,
        categoryName: item.product.category?.name ?? null,
      },
      location: item.location,
      quantity: item.quantity,
      reserved: item.reserved,
      available,
      lowStockThreshold: item.lowStockThreshold,
      value: item.quantity * unitValue,
      status: itemStatus,
    }
  })

  // Filter by status
  if (status && status !== 'all') {
    items = items.filter((item) => item.status === status)
  }

  // Sort
  items.sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'product':
        comparison = a.product.name.localeCompare(b.product.name)
        break
      case 'location':
        comparison = a.location.name.localeCompare(b.location.name)
        break
      case 'quantity':
        comparison = a.quantity - b.quantity
        break
      case 'available':
        comparison = a.available - b.available
        break
      case 'value':
        comparison = a.value - b.value
        break
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const paginatedItems = items.slice(start, start + pageSize)

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ============================================================================
// INVENTORY LOCATIONS
// ============================================================================

export type InventoryLocationListItem = {
  id: string
  name: string
  code: string
  type: string
  address: string | null
  isActive: boolean
  inventoryCount: number
}

export async function getInventoryLocations(): Promise<InventoryLocationListItem[]> {
  const locations = await prisma.inventoryLocation.findMany({
    include: {
      _count: {
        select: { inventory: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  type LocationResult = {
    id: string
    name: string
    code: string
    type: string
    address: string | null
    isActive: boolean
    _count: { inventory: number }
  }

  return locations.map((location: LocationResult) => ({
    id: location.id,
    name: location.name,
    code: location.code,
    type: location.type,
    address: location.address,
    isActive: location.isActive,
    inventoryCount: location._count.inventory,
  }))
}
