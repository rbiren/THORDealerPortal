import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Inventory Dashboard', () => {
  let locationId1: string
  let locationId2: string
  let categoryId: string
  let productIds: string[] = []
  let inventoryIds: string[] = []

  beforeAll(async () => {
    // Create test locations
    const location1 = await prisma.inventoryLocation.create({
      data: {
        name: 'Main Warehouse',
        code: 'WH-MAIN-' + Date.now(),
        type: 'warehouse',
        address: '123 Warehouse St',
        isActive: true,
      },
    })
    locationId1 = location1.id

    const location2 = await prisma.inventoryLocation.create({
      data: {
        name: 'East Distribution',
        code: 'DC-EAST-' + Date.now(),
        type: 'distribution_center',
        address: '456 Distribution Ave',
        isActive: true,
      },
    })
    locationId2 = location2.id

    // Create test category
    const category = await prisma.productCategory.create({
      data: {
        name: 'Test Inventory Category',
        slug: 'test-inventory-category-' + Date.now(),
      },
    })
    categoryId = category.id

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'INV-TEST-001-' + Date.now(),
          name: 'Test Product 1',
          price: 100.0,
          costPrice: 60.0,
          status: 'active',
          categoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'INV-TEST-002-' + Date.now(),
          name: 'Test Product 2',
          price: 200.0,
          costPrice: 120.0,
          status: 'active',
          categoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'INV-TEST-003-' + Date.now(),
          name: 'Low Stock Product',
          price: 50.0,
          costPrice: 25.0,
          status: 'active',
          categoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'INV-TEST-004-' + Date.now(),
          name: 'Out of Stock Product',
          price: 75.0,
          costPrice: 40.0,
          status: 'active',
          categoryId,
        },
      }),
    ])
    productIds = products.map((p) => p.id)

    // Create inventory records
    const inventoryRecords = await Promise.all([
      // Product 1 at Location 1 - healthy stock
      prisma.inventory.create({
        data: {
          productId: productIds[0],
          locationId: locationId1,
          quantity: 100,
          reserved: 10,
          lowStockThreshold: 20,
        },
      }),
      // Product 1 at Location 2
      prisma.inventory.create({
        data: {
          productId: productIds[0],
          locationId: locationId2,
          quantity: 50,
          reserved: 5,
          lowStockThreshold: 10,
        },
      }),
      // Product 2 at Location 1
      prisma.inventory.create({
        data: {
          productId: productIds[1],
          locationId: locationId1,
          quantity: 75,
          reserved: 0,
          lowStockThreshold: 15,
        },
      }),
      // Product 3 at Location 1 - low stock
      prisma.inventory.create({
        data: {
          productId: productIds[2],
          locationId: locationId1,
          quantity: 8,
          reserved: 2,
          lowStockThreshold: 10,
        },
      }),
      // Product 4 at Location 1 - out of stock (all reserved)
      prisma.inventory.create({
        data: {
          productId: productIds[3],
          locationId: locationId1,
          quantity: 5,
          reserved: 5,
          lowStockThreshold: 10,
        },
      }),
    ])
    inventoryIds = inventoryRecords.map((i) => i.id)
  })

  afterAll(async () => {
    // Cleanup in reverse order
    await prisma.inventory.deleteMany({
      where: { id: { in: inventoryIds } },
    })
    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    })
    await prisma.productCategory.delete({
      where: { id: categoryId },
    })
    await prisma.inventoryLocation.deleteMany({
      where: { id: { in: [locationId1, locationId2] } },
    })
    await prisma.$disconnect()
  })

  describe('Inventory Summary', () => {
    it('calculates total stock across all locations', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0)
      // 100 + 50 + 75 + 8 + 5 = 238
      expect(totalStock).toBe(238)
    })

    it('calculates total reserved quantity', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const totalReserved = inventory.reduce((sum, i) => sum + i.reserved, 0)
      // 10 + 5 + 0 + 2 + 5 = 22
      expect(totalReserved).toBe(22)
    })

    it('calculates available stock (quantity - reserved)', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0)
      const totalReserved = inventory.reduce((sum, i) => sum + i.reserved, 0)
      const available = totalStock - totalReserved

      // 238 - 22 = 216
      expect(available).toBe(216)
    })

    it('calculates inventory value using cost price', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: { costPrice: true, price: true },
          },
        },
      })

      let totalValue = 0
      for (const item of inventory) {
        const unitValue = item.product.costPrice ?? item.product.price
        totalValue += item.quantity * unitValue
      }

      // Product 1: (100 + 50) * 60 = 9000
      // Product 2: 75 * 120 = 9000
      // Product 3: 8 * 25 = 200
      // Product 4: 5 * 40 = 200
      // Total: 18400
      expect(totalValue).toBe(18400)
    })

    it('counts unique products with inventory', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        select: { productId: true },
      })

      const uniqueProducts = new Set(inventory.map((i) => i.productId))
      expect(uniqueProducts.size).toBe(4)
    })
  })

  describe('Stock Status Detection', () => {
    it('identifies low stock items', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const lowStockItems = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return available > 0 && available <= item.lowStockThreshold
      })

      // Only Product 3 is low stock (available: 6, threshold: 10)
      expect(lowStockItems.length).toBe(1)
    })

    it('identifies out of stock items', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      const outOfStockItems = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return available <= 0
      })

      // Only Product 4 is out of stock (available: 0)
      expect(outOfStockItems.length).toBe(1)
    })

    it('calculates percent of threshold for low stock items', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
      })

      for (const item of inventory) {
        const available = item.quantity - item.reserved
        if (item.lowStockThreshold > 0) {
          const percentOfThreshold = (available / item.lowStockThreshold) * 100

          // Verify calculation is correct
          expect(percentOfThreshold).toBeGreaterThanOrEqual(0)
          expect(typeof percentOfThreshold).toBe('number')
        }
      }
    })
  })

  describe('Location Summary', () => {
    it('aggregates stock by location', async () => {
      const location1Inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
      })

      const location1Stock = location1Inventory.reduce((sum, i) => sum + i.quantity, 0)
      // 100 + 75 + 8 + 5 = 188
      expect(location1Stock).toBe(188)

      const location2Inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId2,
        },
      })

      const location2Stock = location2Inventory.reduce((sum, i) => sum + i.quantity, 0)
      // 50
      expect(location2Stock).toBe(50)
    })

    it('counts products per location', async () => {
      const location1Count = await prisma.inventory.count({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
      })

      expect(location1Count).toBe(4)

      const location2Count = await prisma.inventory.count({
        where: {
          id: { in: inventoryIds },
          locationId: locationId2,
        },
      })

      expect(location2Count).toBe(1)
    })

    it('calculates value per location', async () => {
      const location1Inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
        include: {
          product: {
            select: { costPrice: true, price: true },
          },
        },
      })

      let location1Value = 0
      for (const item of location1Inventory) {
        const unitValue = item.product.costPrice ?? item.product.price
        location1Value += item.quantity * unitValue
      }

      // Product 1: 100 * 60 = 6000
      // Product 2: 75 * 120 = 9000
      // Product 3: 8 * 25 = 200
      // Product 4: 5 * 40 = 200
      // Total: 15400
      expect(location1Value).toBe(15400)
    })

    it('gets location details', async () => {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id: locationId1 },
        include: {
          _count: {
            select: { inventory: true },
          },
        },
      })

      expect(location).toBeDefined()
      expect(location?.name).toBe('Main Warehouse')
      expect(location?.type).toBe('warehouse')
      expect(location?._count.inventory).toBeGreaterThan(0)
    })
  })

  describe('Inventory by Category', () => {
    it('aggregates inventory by product category', async () => {
      const inventory = await prisma.inventory.findMany({
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

      const categoryMap = new Map<string, number>()
      for (const item of inventory) {
        const catId = item.product.categoryId ?? 'uncategorized'
        categoryMap.set(catId, (categoryMap.get(catId) ?? 0) + item.quantity)
      }

      expect(categoryMap.get(categoryId)).toBe(238)
    })

    it('calculates value per category', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        include: {
          product: {
            select: {
              categoryId: true,
              costPrice: true,
              price: true,
            },
          },
        },
      })

      const categoryValueMap = new Map<string, number>()
      for (const item of inventory) {
        const catId = item.product.categoryId ?? 'uncategorized'
        const unitValue = item.product.costPrice ?? item.product.price
        const itemValue = item.quantity * unitValue
        categoryValueMap.set(catId, (categoryValueMap.get(catId) ?? 0) + itemValue)
      }

      expect(categoryValueMap.get(categoryId)).toBe(18400)
    })
  })

  describe('Inventory List Filtering', () => {
    it('filters by location', async () => {
      const inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          locationId: locationId1,
        },
      })

      expect(inventory.length).toBe(4)
      expect(inventory.every((i) => i.locationId === locationId1)).toBe(true)
    })

    it('filters by product search', async () => {
      const inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          product: {
            name: { contains: 'Low Stock' },
          },
        },
      })

      expect(inventory.length).toBe(1)
    })

    it('filters by category', async () => {
      const inventory = await prisma.inventory.findMany({
        where: {
          id: { in: inventoryIds },
          product: {
            categoryId,
          },
        },
      })

      expect(inventory.length).toBe(5)
    })

    it('sorts by quantity', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        orderBy: { quantity: 'desc' },
      })

      for (let i = 1; i < inventory.length; i++) {
        expect(inventory[i - 1].quantity).toBeGreaterThanOrEqual(inventory[i].quantity)
      }
    })

    it('paginates results', async () => {
      const page1 = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.inventory.findMany({
        where: { id: { in: inventoryIds } },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBe(2)
      expect(page2.length).toBe(2)
      expect(page1[0].id).not.toBe(page2[0].id)
    })
  })

  describe('Inventory Location Management', () => {
    it('lists all locations', async () => {
      const locations = await prisma.inventoryLocation.findMany({
        where: { id: { in: [locationId1, locationId2] } },
        orderBy: { name: 'asc' },
      })

      expect(locations.length).toBe(2)
      expect(locations[0].name).toBe('East Distribution')
      expect(locations[1].name).toBe('Main Warehouse')
    })

    it('includes inventory count per location', async () => {
      const locations = await prisma.inventoryLocation.findMany({
        where: { id: { in: [locationId1, locationId2] } },
        include: {
          _count: {
            select: { inventory: true },
          },
        },
      })

      const location1 = locations.find((l) => l.id === locationId1)
      const location2 = locations.find((l) => l.id === locationId2)

      expect(location1?._count.inventory).toBe(4)
      expect(location2?._count.inventory).toBe(1)
    })

    it('filters active locations', async () => {
      const activeLocations = await prisma.inventoryLocation.findMany({
        where: {
          id: { in: [locationId1, locationId2] },
          isActive: true,
        },
      })

      expect(activeLocations.length).toBe(2)
    })
  })
})

describe('Inventory Edge Cases', () => {
  it('handles products without inventory', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'NO-INV-' + Date.now(),
        name: 'No Inventory Product',
        price: 50.0,
        status: 'active',
      },
    })

    const inventory = await prisma.inventory.findMany({
      where: { productId: product.id },
    })

    expect(inventory.length).toBe(0)

    await prisma.product.delete({ where: { id: product.id } })
  })

  it('handles locations without inventory', async () => {
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Empty Location',
        code: 'EMPTY-' + Date.now(),
        type: 'warehouse',
        isActive: true,
      },
    })

    const inventory = await prisma.inventory.findMany({
      where: { locationId: location.id },
    })

    expect(inventory.length).toBe(0)

    await prisma.inventoryLocation.delete({ where: { id: location.id } })
  })

  it('handles products without cost price (uses regular price)', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'NO-COST-' + Date.now(),
        name: 'No Cost Price Product',
        price: 100.0,
        costPrice: null,
        status: 'active',
      },
    })

    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Test Location',
        code: 'TEST-LOC-' + Date.now(),
        type: 'warehouse',
        isActive: true,
      },
    })

    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: 10,
        reserved: 0,
        lowStockThreshold: 5,
      },
    })

    const result = await prisma.inventory.findUnique({
      where: { id: inventory.id },
      include: {
        product: {
          select: { costPrice: true, price: true },
        },
      },
    })

    // Should use price when costPrice is null
    const unitValue = result?.product.costPrice ?? result?.product.price
    expect(unitValue).toBe(100.0)

    await prisma.inventory.delete({ where: { id: inventory.id } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.inventoryLocation.delete({ where: { id: location.id } })
  })

  it('handles zero threshold (always in stock)', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'ZERO-THRESH-' + Date.now(),
        name: 'Zero Threshold Product',
        price: 50.0,
        status: 'active',
      },
    })

    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Test Location 2',
        code: 'TEST-LOC2-' + Date.now(),
        type: 'warehouse',
        isActive: true,
      },
    })

    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: 1,
        reserved: 0,
        lowStockThreshold: 0,
      },
    })

    const available = inventory.quantity - inventory.reserved
    const isLowStock = available > 0 && available <= inventory.lowStockThreshold

    // Should not be low stock because threshold is 0
    expect(isLowStock).toBe(false)

    await prisma.inventory.delete({ where: { id: inventory.id } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.inventoryLocation.delete({ where: { id: location.id } })
  })
})
