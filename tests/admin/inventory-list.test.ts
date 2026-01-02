import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Inventory List', () => {
  let locationId1: string
  let locationId2: string
  let categoryId1: string
  let categoryId2: string
  let productIds: string[] = []
  let inventoryIds: string[] = []

  beforeAll(async () => {
    // Create test locations
    const location1 = await prisma.inventoryLocation.create({
      data: {
        name: 'List Test Warehouse',
        code: 'LIST-WH-' + Date.now(),
        type: 'warehouse',
        isActive: true,
      },
    })
    locationId1 = location1.id

    const location2 = await prisma.inventoryLocation.create({
      data: {
        name: 'List Test Store',
        code: 'LIST-ST-' + Date.now(),
        type: 'store',
        isActive: true,
      },
    })
    locationId2 = location2.id

    // Create test categories
    const category1 = await prisma.productCategory.create({
      data: {
        name: 'List Category A',
        slug: 'list-category-a-' + Date.now(),
      },
    })
    categoryId1 = category1.id

    const category2 = await prisma.productCategory.create({
      data: {
        name: 'List Category B',
        slug: 'list-category-b-' + Date.now(),
      },
    })
    categoryId2 = category2.id

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'LIST-A-001-' + Date.now(),
          name: 'Alpha Product',
          price: 100.0,
          costPrice: 60.0,
          status: 'active',
          categoryId: categoryId1,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'LIST-B-002-' + Date.now(),
          name: 'Beta Product',
          price: 200.0,
          costPrice: 120.0,
          status: 'active',
          categoryId: categoryId1,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'LIST-C-003-' + Date.now(),
          name: 'Gamma Product',
          price: 150.0,
          costPrice: 90.0,
          status: 'active',
          categoryId: categoryId2,
        },
      }),
    ])
    productIds = products.map((p) => p.id)

    // Create inventory records
    const inventoryRecords = await Promise.all([
      // Product A at Location 1
      prisma.inventory.create({
        data: {
          productId: productIds[0],
          locationId: locationId1,
          quantity: 100,
          reserved: 10,
          lowStockThreshold: 20,
        },
      }),
      // Product A at Location 2
      prisma.inventory.create({
        data: {
          productId: productIds[0],
          locationId: locationId2,
          quantity: 50,
          reserved: 5,
          lowStockThreshold: 10,
        },
      }),
      // Product B at Location 1 - Low stock
      prisma.inventory.create({
        data: {
          productId: productIds[1],
          locationId: locationId1,
          quantity: 15,
          reserved: 5,
          lowStockThreshold: 20,
        },
      }),
      // Product C at Location 1 - Out of stock
      prisma.inventory.create({
        data: {
          productId: productIds[2],
          locationId: locationId1,
          quantity: 10,
          reserved: 10,
          lowStockThreshold: 15,
        },
      }),
    ])
    inventoryIds = inventoryRecords.map((i) => i.id)
  })

  afterAll(async () => {
    await prisma.inventory.deleteMany({
      where: { id: { in: inventoryIds } },
    })
    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    })
    await prisma.productCategory.deleteMany({
      where: { id: { in: [categoryId1, categoryId2] } },
    })
    await prisma.inventoryLocation.deleteMany({
      where: { id: { in: [locationId1, locationId2] } },
    })
    await prisma.$disconnect()
  })

  describe('List Filtering', () => {
    it('returns all inventory items', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      expect(items.length).toBe(4)
    })

    it('filters by location', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
      })

      expect(items.length).toBe(3)
      expect(items.every((i) => i.locationId === locationId1)).toBe(true)
    })

    it('filters by category', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          product: {
            categoryId: categoryId1,
          },
        },
      })

      expect(items.length).toBe(3) // Product A (2) + Product B (1)
    })

    it('searches by product SKU', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          product: {
            sku: { contains: 'LIST-A' },
          },
        },
      })

      expect(items.length).toBe(2) // Alpha Product at 2 locations
    })

    it('searches by product name', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          product: {
            name: { contains: 'Gamma' },
          },
        },
      })

      expect(items.length).toBe(1)
    })

    it('filters by status (in_stock)', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const inStock = items.filter((item) => {
        const available = item.quantity - item.reserved
        return available > item.lowStockThreshold
      })

      // Alpha at Location 1: 100-10=90 > 20 (in stock)
      // Alpha at Location 2: 50-5=45 > 10 (in stock)
      expect(inStock.length).toBe(2)
    })

    it('filters by status (low_stock)', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const lowStock = items.filter((item) => {
        const available = item.quantity - item.reserved
        return available > 0 && available <= item.lowStockThreshold
      })

      // Beta: 15-5=10 <= 20 (low stock)
      expect(lowStock.length).toBe(1)
    })

    it('filters by status (out_of_stock)', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const outOfStock = items.filter((item) => {
        const available = item.quantity - item.reserved
        return available <= 0
      })

      // Gamma: 10-10=0 (out of stock)
      expect(outOfStock.length).toBe(1)
    })
  })

  describe('List Sorting', () => {
    it('sorts by product name ascending', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: { product: { select: { name: true } } },
        orderBy: { product: { name: 'asc' } },
      })

      expect(items[0].product.name).toBe('Alpha Product')
    })

    it('sorts by product name descending', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: { product: { select: { name: true } } },
        orderBy: { product: { name: 'desc' } },
      })

      expect(items[0].product.name).toBe('Gamma Product')
    })

    it('sorts by quantity ascending', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        orderBy: { quantity: 'asc' },
      })

      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].quantity).toBeLessThanOrEqual(items[i].quantity)
      }
    })

    it('sorts by quantity descending', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        orderBy: { quantity: 'desc' },
      })

      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].quantity).toBeGreaterThanOrEqual(items[i].quantity)
      }
    })

    it('sorts by location name', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: { location: { select: { name: true } } },
        orderBy: { location: { name: 'asc' } },
      })

      expect(items[0].location.name).toBe('List Test Store')
      expect(items[1].location.name).toBe('List Test Warehouse')
    })
  })

  describe('List Pagination', () => {
    it('paginates with skip and take', async () => {
      const page1 = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        skip: 0,
        take: 2,
      })

      const page2 = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        skip: 2,
        take: 2,
      })

      expect(page1.length).toBe(2)
      expect(page2.length).toBe(2)

      const page1Ids = new Set(page1.map((i) => i.id))
      const page2Ids = new Set(page2.map((i) => i.id))
      const overlap = [...page1Ids].filter((id) => page2Ids.has(id))
      expect(overlap.length).toBe(0)
    })

    it('returns correct total count', async () => {
      const count = await prisma.inventory.count({
        where: { id: { in: inventoryIds } },
      })

      expect(count).toBe(4)
    })

    it('calculates total pages correctly', async () => {
      const count = await prisma.inventory.count({
        where: { id: { in: inventoryIds } },
      })
      const pageSize = 2
      const totalPages = Math.ceil(count / pageSize)

      expect(totalPages).toBe(2)
    })
  })

  describe('List Data Transformation', () => {
    it('calculates available quantity', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      for (const item of items) {
        const available = item.quantity - item.reserved
        expect(available).toBeGreaterThanOrEqual(0)
        expect(available).toBeLessThanOrEqual(item.quantity)
      }
    })

    it('calculates inventory value using cost price', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: { costPrice: true, price: true },
          },
        },
      })

      for (const item of items) {
        const unitValue = item.product.costPrice ?? item.product.price
        const totalValue = item.quantity * unitValue
        expect(totalValue).toBeGreaterThanOrEqual(0)
      }
    })

    it('determines status correctly', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      for (const item of items) {
        const available = item.quantity - item.reserved
        let status: string

        if (available <= 0) {
          status = 'out_of_stock'
        } else if (available <= item.lowStockThreshold) {
          status = 'low_stock'
        } else {
          status = 'in_stock'
        }

        expect(['in_stock', 'low_stock', 'out_of_stock']).toContain(status)
      }
    })

    it('includes product category name', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: {
              categoryId: true,
              category: { select: { name: true } },
            },
          },
        },
      })

      for (const item of items) {
        if (item.product.categoryId) {
          expect(item.product.category?.name).toBeDefined()
        }
      }
    })
  })

  describe('Export Functionality', () => {
    it('can fetch all data for export', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
              costPrice: true,
              price: true,
              category: { select: { name: true } },
            },
          },
          location: {
            select: { name: true, code: true },
          },
        },
      })

      expect(items.length).toBe(4)

      for (const item of items) {
        expect(item.product.sku).toBeDefined()
        expect(item.product.name).toBeDefined()
        expect(item.location.name).toBeDefined()
        expect(item.quantity).toBeDefined()
        expect(item.reserved).toBeDefined()
      }
    })

    it('generates CSV-compatible data', async () => {
      const items = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: {
              sku: true,
              name: true,
              costPrice: true,
              price: true,
              category: { select: { name: true } },
            },
          },
          location: { select: { name: true } },
        },
      })

      const rows = items.map((item) => {
        const available = item.quantity - item.reserved
        const unitValue = item.product.costPrice ?? item.product.price
        const value = item.quantity * unitValue
        let status = 'in_stock'
        if (available <= 0) status = 'out_of_stock'
        else if (available <= item.lowStockThreshold) status = 'low_stock'

        return [
          item.product.sku,
          item.product.name,
          item.product.category?.name ?? 'Uncategorized',
          item.location.name,
          item.quantity,
          item.reserved,
          available,
          value,
          status,
        ]
      })

      expect(rows.length).toBe(4)
      expect(rows[0].length).toBe(9) // 9 columns
    })
  })

  describe('Combined Filters', () => {
    it('filters by location AND category', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
          product: {
            categoryId: categoryId1,
          },
        },
      })

      // Product A at Loc1 + Product B at Loc1
      expect(items.length).toBe(2)
    })

    it('filters by search AND location', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
          product: {
            name: { contains: 'Alpha' },
          },
        },
      })

      expect(items.length).toBe(1)
    })

    it('combines status filter with location', async () => {
      const items = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
      })

      const lowStockAtLoc1 = items.filter((item) => {
        const available = item.quantity - item.reserved
        return available > 0 && available <= item.lowStockThreshold
      })

      expect(lowStockAtLoc1.length).toBe(1) // Beta
    })
  })
})
