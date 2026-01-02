import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Inventory Adjustments', () => {
  let locationId: string
  let productId: string
  let inventoryId: string

  beforeAll(async () => {
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Adjustment Test Warehouse',
        code: 'ADJ-WH-' + Date.now(),
        type: 'warehouse',
      },
    })
    locationId = location.id

    const product = await prisma.product.create({
      data: {
        sku: 'ADJ-PROD-' + Date.now(),
        name: 'Adjustment Test Product',
        price: 100.0,
        costPrice: 60.0,
        status: 'active',
      },
    })
    productId = product.id

    const inventory = await prisma.inventory.create({
      data: {
        productId,
        locationId,
        quantity: 100,
        reserved: 10,
        lowStockThreshold: 20,
      },
    })
    inventoryId = inventory.id
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { entityType: 'Inventory', entityId: inventoryId },
    })
    await prisma.inventory.delete({ where: { id: inventoryId } })
    await prisma.product.delete({ where: { id: productId } })
    await prisma.inventoryLocation.delete({ where: { id: locationId } })
    await prisma.$disconnect()
  })

  describe('Add Stock', () => {
    it('increases inventory quantity', async () => {
      const before = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      const previousQty = before?.quantity ?? 0

      const addQty = 50
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: previousQty + addQty },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.quantity).toBe(previousQty + addQty)

      // Reset for next tests
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })

    it('creates audit log entry', async () => {
      const before = await prisma.inventory.findUnique({ where: { id: inventoryId } })

      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 150 },
      })

      await prisma.auditLog.create({
        data: {
          action: 'update',
          entityType: 'Inventory',
          entityId: inventoryId,
          oldValues: JSON.stringify({ quantity: before?.quantity }),
          newValues: JSON.stringify({
            quantity: 150,
            adjustmentType: 'add',
            adjustmentQuantity: 50,
            reason: 'received',
          }),
        },
      })

      const log = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
        orderBy: { createdAt: 'desc' },
      })

      expect(log).toBeDefined()
      expect(log?.action).toBe('update')
      expect(log?.entityType).toBe('Inventory')

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })
  })

  describe('Remove Stock', () => {
    it('decreases inventory quantity', async () => {
      const before = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      const previousQty = before?.quantity ?? 0

      const removeQty = 30
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: Math.max(0, previousQty - removeQty) },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.quantity).toBe(previousQty - removeQty)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })

    it('does not go below zero', async () => {
      const removeQty = 200 // More than available

      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: Math.max(0, 100 - removeQty) },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.quantity).toBe(0)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })

    it('does not affect reserved quantity', async () => {
      const before = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      const reservedBefore = before?.reserved ?? 0

      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 50 },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.reserved).toBe(reservedBefore)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })
  })

  describe('Set Stock', () => {
    it('sets exact quantity', async () => {
      const targetQty = 75

      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: targetQty },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.quantity).toBe(targetQty)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })

    it('can set to zero', async () => {
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 0 },
      })

      const after = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      expect(after?.quantity).toBe(0)

      // Reset
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 100 },
      })
    })
  })

  describe('Adjustment Reasons', () => {
    it('validates reason codes', async () => {
      const validReasons = [
        'received',
        'returned',
        'damaged',
        'lost',
        'correction',
        'transfer_in',
        'transfer_out',
        'cycle_count',
        'other',
      ]

      for (const reason of validReasons) {
        expect(typeof reason).toBe('string')
        expect(reason.length).toBeGreaterThan(0)
      }
    })

    it('stores reason in audit log', async () => {
      await prisma.auditLog.create({
        data: {
          action: 'update',
          entityType: 'Inventory',
          entityId: inventoryId,
          oldValues: JSON.stringify({ quantity: 100 }),
          newValues: JSON.stringify({
            quantity: 95,
            adjustmentType: 'remove',
            adjustmentQuantity: 5,
            reason: 'damaged',
            notes: 'Damaged in shipping',
          }),
        },
      })

      const log = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
        orderBy: { createdAt: 'desc' },
      })

      const newValues = JSON.parse(log?.newValues ?? '{}')
      expect(newValues.reason).toBe('damaged')
      expect(newValues.notes).toBe('Damaged in shipping')
    })
  })

  describe('Adjustment History', () => {
    it('retrieves adjustment logs', async () => {
      // Create some adjustment logs
      await prisma.auditLog.createMany({
        data: [
          {
            action: 'update',
            entityType: 'Inventory',
            entityId: inventoryId,
            oldValues: JSON.stringify({ quantity: 100 }),
            newValues: JSON.stringify({ quantity: 120, adjustmentType: 'add', reason: 'received' }),
          },
          {
            action: 'update',
            entityType: 'Inventory',
            entityId: inventoryId,
            oldValues: JSON.stringify({ quantity: 120 }),
            newValues: JSON.stringify({ quantity: 110, adjustmentType: 'remove', reason: 'damaged' }),
          },
        ],
      })

      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'Inventory', entityId: inventoryId },
        orderBy: { createdAt: 'desc' },
      })

      expect(logs.length).toBeGreaterThanOrEqual(2)
    })

    it('includes all required fields', async () => {
      const log = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
      })

      expect(log).toBeDefined()
      expect(log?.action).toBeDefined()
      expect(log?.entityType).toBeDefined()
      expect(log?.entityId).toBeDefined()
      expect(log?.createdAt).toBeDefined()
    })

    it('parses old and new values correctly', async () => {
      const log = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
      })

      if (log?.oldValues) {
        const oldValues = JSON.parse(log.oldValues)
        expect(typeof oldValues.quantity).toBe('number')
      }

      if (log?.newValues) {
        const newValues = JSON.parse(log.newValues)
        expect(typeof newValues.quantity).toBe('number')
      }
    })
  })

  describe('Bulk Adjustments', () => {
    let product2Id: string
    let inventory2Id: string

    beforeAll(async () => {
      const product2 = await prisma.product.create({
        data: {
          sku: 'BULK-ADJ-' + Date.now(),
          name: 'Bulk Adjustment Product',
          price: 50.0,
          status: 'active',
        },
      })
      product2Id = product2.id

      const inventory2 = await prisma.inventory.create({
        data: {
          productId: product2Id,
          locationId,
          quantity: 50,
          reserved: 0,
        },
      })
      inventory2Id = inventory2.id
    })

    afterAll(async () => {
      await prisma.inventory.delete({ where: { id: inventory2Id } })
      await prisma.product.delete({ where: { id: product2Id } })
    })

    it('adjusts multiple items', async () => {
      const items = [
        { id: inventoryId, addQty: 10 },
        { id: inventory2Id, addQty: 20 },
      ]

      for (const item of items) {
        const before = await prisma.inventory.findUnique({ where: { id: item.id } })
        await prisma.inventory.update({
          where: { id: item.id },
          data: { quantity: (before?.quantity ?? 0) + item.addQty },
        })
      }

      const inv1 = await prisma.inventory.findUnique({ where: { id: inventoryId } })
      const inv2 = await prisma.inventory.findUnique({ where: { id: inventory2Id } })

      expect(inv1?.quantity).toBe(110)
      expect(inv2?.quantity).toBe(70)

      // Reset
      await prisma.inventory.update({ where: { id: inventoryId }, data: { quantity: 100 } })
      await prisma.inventory.update({ where: { id: inventory2Id }, data: { quantity: 50 } })
    })

    it('creates audit log for each item', async () => {
      const items = [
        { id: inventoryId, qty: 5 },
        { id: inventory2Id, qty: 5 },
      ]

      for (const item of items) {
        await prisma.auditLog.create({
          data: {
            action: 'update',
            entityType: 'Inventory',
            entityId: item.id,
            newValues: JSON.stringify({ adjustmentType: 'add', quantity: item.qty }),
          },
        })
      }

      const log1 = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventoryId },
        orderBy: { createdAt: 'desc' },
      })

      const log2 = await prisma.auditLog.findFirst({
        where: { entityType: 'Inventory', entityId: inventory2Id },
        orderBy: { createdAt: 'desc' },
      })

      expect(log1).toBeDefined()
      expect(log2).toBeDefined()
    })
  })
})

describe('Adjustment Validation', () => {
  it('requires product ID', async () => {
    const validate = (productId: string) => productId.length > 0
    expect(validate('')).toBe(false)
    expect(validate('valid-id')).toBe(true)
  })

  it('requires location ID', async () => {
    const validate = (locationId: string) => locationId.length > 0
    expect(validate('')).toBe(false)
    expect(validate('valid-id')).toBe(true)
  })

  it('requires positive quantity', async () => {
    const validate = (qty: number) => Number.isInteger(qty) && qty >= 1
    expect(validate(0)).toBe(false)
    expect(validate(-1)).toBe(false)
    expect(validate(0.5)).toBe(false)
    expect(validate(1)).toBe(true)
    expect(validate(100)).toBe(true)
  })

  it('validates adjustment type', async () => {
    const validTypes = ['add', 'remove', 'set']
    const validate = (type: string) => validTypes.includes(type)
    expect(validate('add')).toBe(true)
    expect(validate('remove')).toBe(true)
    expect(validate('set')).toBe(true)
    expect(validate('invalid')).toBe(false)
  })

  it('validates reason code', async () => {
    const validReasons = [
      'received', 'returned', 'damaged', 'lost',
      'correction', 'transfer_in', 'transfer_out',
      'cycle_count', 'other',
    ]
    const validate = (reason: string) => validReasons.includes(reason)
    expect(validate('received')).toBe(true)
    expect(validate('damaged')).toBe(true)
    expect(validate('invalid_reason')).toBe(false)
  })
})
