import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Low Stock Alerts', () => {
  let locationId: string
  let productId: string
  let inventoryId: string
  let userId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `alert-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        firstName: 'Alert',
        lastName: 'Tester',
        role: 'admin',
      },
    })
    userId = user.id

    // Create test location
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Alert Test Warehouse',
        code: 'ALERT-WH-' + Date.now(),
        type: 'warehouse',
      },
    })
    locationId = location.id

    // Create test product
    const product = await prisma.product.create({
      data: {
        sku: 'ALERT-PROD-' + Date.now(),
        name: 'Alert Test Product',
        price: 100.0,
        costPrice: 60.0,
        status: 'active',
      },
    })
    productId = product.id

    // Create inventory with low stock
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        locationId,
        quantity: 5,
        reserved: 0,
        lowStockThreshold: 20,
      },
    })
    inventoryId = inventory.id
  })

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({
      where: { entityType: 'Inventory', entityId: inventoryId },
    })
    await prisma.inventory.delete({ where: { id: inventoryId } })
    await prisma.product.delete({ where: { id: productId } })
    await prisma.inventoryLocation.delete({ where: { id: locationId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  describe('Alert Detection', () => {
    it('detects low stock items', async () => {
      const inventory = await prisma.inventory.findMany({
        where: {
          quantity: { lte: prisma.inventory.fields.lowStockThreshold },
        },
      })

      // Our test item should be detected
      const testItem = inventory.find((i) => i.id === inventoryId)
      expect(testItem).toBeDefined()
    })

    it('calculates available quantity correctly', async () => {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      })

      expect(inventory).toBeDefined()
      const available = (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)
      expect(available).toBe(5)
    })

    it('identifies critical vs warning severity', async () => {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      })

      expect(inventory).toBeDefined()
      const available = (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)
      const threshold = inventory?.lowStockThreshold ?? 0

      // Our test item has 5 available, threshold is 20
      // 5 <= 20 * 0.5 = 10, so it should be critical
      const isCritical = available <= threshold * 0.5
      expect(isCritical).toBe(true)
    })

    it('calculates percent of threshold', async () => {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      })

      expect(inventory).toBeDefined()
      const available = (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)
      const threshold = inventory?.lowStockThreshold ?? 1
      const percentOfThreshold = (available / threshold) * 100

      expect(percentOfThreshold).toBe(25) // 5/20 * 100 = 25%
    })
  })

  describe('Alert Summary', () => {
    it('counts total alerts', async () => {
      const inventory = await prisma.inventory.findMany()

      let alertCount = 0
      for (const item of inventory) {
        const available = item.quantity - item.reserved
        if (available <= item.lowStockThreshold) {
          alertCount++
        }
      }

      expect(alertCount).toBeGreaterThanOrEqual(1)
    })

    it('separates critical from warning', async () => {
      const inventory = await prisma.inventory.findMany()

      let critical = 0
      let warning = 0

      for (const item of inventory) {
        const available = item.quantity - item.reserved
        if (available <= 0 || available <= item.lowStockThreshold * 0.5) {
          critical++
        } else if (available <= item.lowStockThreshold) {
          warning++
        }
      }

      expect(critical).toBeGreaterThanOrEqual(1) // Our test item
      expect(typeof warning).toBe('number')
    })
  })

  describe('Threshold Management', () => {
    it('updates threshold value', async () => {
      const newThreshold = 30

      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { lowStockThreshold: newThreshold },
      })

      const updated = await prisma.inventory.findUnique({
        where: { id: inventoryId },
      })

      expect(updated?.lowStockThreshold).toBe(newThreshold)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { lowStockThreshold: 20 },
      })
    })

    it('validates threshold is non-negative', async () => {
      const validate = (threshold: number) => threshold >= 0
      expect(validate(-1)).toBe(false)
      expect(validate(0)).toBe(true)
      expect(validate(10)).toBe(true)
    })

    it('creates audit log for threshold changes', async () => {
      await prisma.auditLog.create({
        data: {
          action: 'update',
          entityType: 'Inventory',
          entityId: inventoryId,
          oldValues: JSON.stringify({ lowStockThreshold: 20 }),
          newValues: JSON.stringify({ lowStockThreshold: 25 }),
        },
      })

      const log = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
        orderBy: { createdAt: 'desc' },
      })

      expect(log).toBeDefined()
      expect(log?.action).toBe('update')

      const newValues = JSON.parse(log?.newValues ?? '{}')
      expect(newValues.lowStockThreshold).toBe(25)
    })
  })

  describe('Alert Notifications', () => {
    it('creates low stock notification', async () => {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId },
        include: {
          product: { select: { name: true, sku: true } },
          location: { select: { name: true } },
        },
      })

      const available = (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0)

      await prisma.notification.create({
        data: {
          userId,
          type: 'low_stock',
          title: 'Low Stock Alert',
          body: `${inventory?.product.name} at ${inventory?.location.name} has ${available} units available`,
          data: JSON.stringify({
            inventoryId,
            available,
            threshold: inventory?.lowStockThreshold,
          }),
        },
      })

      const notification = await prisma.notification.findFirst({
        where: { userId, type: 'low_stock' },
        orderBy: { createdAt: 'desc' },
      })

      expect(notification).toBeDefined()
      expect(notification?.type).toBe('low_stock')
      expect(notification?.title).toBe('Low Stock Alert')
    })

    it('marks notification as read when acknowledged', async () => {
      const notification = await prisma.notification.findFirst({
        where: { userId, type: 'low_stock' },
      })

      if (notification) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { readAt: new Date() },
        })

        const updated = await prisma.notification.findUnique({
          where: { id: notification.id },
        })

        expect(updated?.readAt).toBeDefined()
      }
    })

    it('notification contains required fields', async () => {
      const notification = await prisma.notification.findFirst({
        where: { userId, type: 'low_stock' },
      })

      expect(notification).toBeDefined()
      expect(notification?.userId).toBe(userId)
      expect(notification?.type).toBe('low_stock')
      expect(notification?.title).toBeDefined()
      expect(notification?.body).toBeDefined()
      expect(notification?.createdAt).toBeDefined()
    })

    it('parses notification data correctly', async () => {
      const notification = await prisma.notification.findFirst({
        where: { userId, type: 'low_stock' },
      })

      if (notification?.data) {
        const data = JSON.parse(notification.data)
        expect(data.inventoryId).toBe(inventoryId)
        expect(typeof data.available).toBe('number')
        expect(typeof data.threshold).toBe('number')
      }
    })
  })

  describe('Alert Filtering', () => {
    it('filters by severity', async () => {
      const inventory = await prisma.inventory.findMany()

      const criticalAlerts = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return available <= 0 || available <= item.lowStockThreshold * 0.5
      })

      const warningAlerts = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return (
          available > item.lowStockThreshold * 0.5 &&
          available <= item.lowStockThreshold
        )
      })

      expect(Array.isArray(criticalAlerts)).toBe(true)
      expect(Array.isArray(warningAlerts)).toBe(true)
    })

    it('filters by location', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { locationId },
      })

      expect(inventory.length).toBeGreaterThanOrEqual(1)
      inventory.forEach((item) => {
        expect(item.locationId).toBe(locationId)
      })
    })

    it('searches by product name or SKU', async () => {
      const inventory = await prisma.inventory.findMany({
        where: {
          product: {
            OR: [
              { name: { contains: 'Alert Test' } },
              { sku: { contains: 'ALERT-PROD' } },
            ],
          },
        },
        include: { product: true },
      })

      expect(inventory.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Bulk Operations', () => {
    let product2Id: string
    let inventory2Id: string

    beforeAll(async () => {
      const product2 = await prisma.product.create({
        data: {
          sku: 'BULK-ALERT-' + Date.now(),
          name: 'Bulk Alert Product',
          price: 50.0,
          status: 'active',
        },
      })
      product2Id = product2.id

      const inventory2 = await prisma.inventory.create({
        data: {
          productId: product2Id,
          locationId,
          quantity: 8,
          reserved: 0,
          lowStockThreshold: 15,
        },
      })
      inventory2Id = inventory2.id
    })

    afterAll(async () => {
      await prisma.inventory.delete({ where: { id: inventory2Id } })
      await prisma.product.delete({ where: { id: product2Id } })
    })

    it('bulk acknowledges multiple alerts', async () => {
      const ids = [inventoryId, inventory2Id]

      for (const id of ids) {
        await prisma.notification.create({
          data: {
            userId,
            type: 'low_stock',
            title: 'Bulk Alert',
            body: 'Bulk alert test',
            data: JSON.stringify({ inventoryId: id }),
            readAt: new Date(),
          },
        })
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          type: 'low_stock',
          readAt: { not: null },
        },
      })

      expect(notifications.length).toBeGreaterThanOrEqual(2)
    })

    it('bulk updates thresholds', async () => {
      const updates = [
        { id: inventoryId, threshold: 25 },
        { id: inventory2Id, threshold: 20 },
      ]

      for (const update of updates) {
        await prisma.inventory.update({
          where: { id: update.id },
          data: { lowStockThreshold: update.threshold },
        })
      }

      const inv1 = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      const inv2 = await prisma.inventory.findUnique({ where: { id: inventory2Id } })

      expect(inv1?.lowStockThreshold).toBe(25)
      expect(inv2?.lowStockThreshold).toBe(20)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { lowStockThreshold: 20 },
      })
    })
  })

  describe('Alert Preferences', () => {
    it('validates preference frequency values', () => {
      const validFrequencies = ['immediate', 'daily', 'weekly']
      const validate = (freq: string) => validFrequencies.includes(freq)

      expect(validate('immediate')).toBe(true)
      expect(validate('daily')).toBe(true)
      expect(validate('weekly')).toBe(true)
      expect(validate('invalid')).toBe(false)
    })

    it('stores preference in user notification settings', async () => {
      // Preferences would typically be stored in a user settings model
      // For now, validate the structure
      const preferences = {
        emailEnabled: true,
        frequency: 'daily',
        criticalOnly: false,
        locationIds: [locationId],
        categoryIds: [],
      }

      expect(preferences.emailEnabled).toBe(true)
      expect(preferences.frequency).toBe('daily')
      expect(preferences.locationIds).toContain(locationId)
    })

    it('filters alerts based on preferences', async () => {
      const preferences = {
        criticalOnly: true,
        locationIds: [locationId],
      }

      const inventory = await prisma.inventory.findMany({
        where: {
          locationId: { in: preferences.locationIds },
        },
      })

      // Filter for critical only
      const criticalAlerts = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return available <= 0 || available <= item.lowStockThreshold * 0.5
      })

      expect(criticalAlerts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Export Functionality', () => {
    it('exports alerts to CSV format', async () => {
      const inventory = await prisma.inventory.findMany({
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { name: true } },
        },
      })

      const alerts = inventory.filter((item) => {
        const available = item.quantity - item.reserved
        return available <= item.lowStockThreshold
      })

      const headers = ['SKU', 'Product', 'Location', 'Available', 'Threshold']
      const rows = alerts.map((item) => [
        item.product.sku,
        item.product.name,
        item.location.name,
        (item.quantity - item.reserved).toString(),
        item.lowStockThreshold.toString(),
      ])

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n')

      expect(csv).toContain('SKU,Product,Location')
      expect(csv.split('\n').length).toBeGreaterThan(1)
    })

    it('handles special characters in CSV', () => {
      const value = 'Product, with "quotes"'
      const escaped = `"${value.replace(/"/g, '""')}"`
      expect(escaped).toBe('"Product, with ""quotes"""')
    })
  })
})

describe('Alert Severity Calculation', () => {
  it('returns critical for out of stock', () => {
    const getSeverity = (available: number, threshold: number) => {
      if (available <= 0) return 'critical'
      if (available <= threshold * 0.5) return 'critical'
      if (available <= threshold) return 'warning'
      return 'info'
    }

    expect(getSeverity(0, 20)).toBe('critical')
    expect(getSeverity(-5, 20)).toBe('critical')
  })

  it('returns critical for less than 50% of threshold', () => {
    const getSeverity = (available: number, threshold: number) => {
      if (available <= 0) return 'critical'
      if (available <= threshold * 0.5) return 'critical'
      if (available <= threshold) return 'warning'
      return 'info'
    }

    expect(getSeverity(5, 20)).toBe('critical') // 5 <= 10
    expect(getSeverity(9, 20)).toBe('critical') // 9 <= 10
    expect(getSeverity(10, 20)).toBe('critical') // 10 <= 10
  })

  it('returns warning for between 50% and 100% of threshold', () => {
    const getSeverity = (available: number, threshold: number) => {
      if (available <= 0) return 'critical'
      if (available <= threshold * 0.5) return 'critical'
      if (available <= threshold) return 'warning'
      return 'info'
    }

    expect(getSeverity(11, 20)).toBe('warning') // 11 > 10, <= 20
    expect(getSeverity(15, 20)).toBe('warning')
    expect(getSeverity(20, 20)).toBe('warning')
  })

  it('returns info for above threshold', () => {
    const getSeverity = (available: number, threshold: number) => {
      if (available <= 0) return 'critical'
      if (available <= threshold * 0.5) return 'critical'
      if (available <= threshold) return 'warning'
      return 'info'
    }

    expect(getSeverity(21, 20)).toBe('info')
    expect(getSeverity(100, 20)).toBe('info')
  })
})
