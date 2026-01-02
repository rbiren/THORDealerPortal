import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Inventory Locations', () => {
  const createdLocationIds: string[] = []

  afterAll(async () => {
    // Clean up created locations
    for (const id of createdLocationIds) {
      try {
        await prisma.inventoryLocation.delete({ where: { id } })
      } catch {
        // Ignore - may already be deleted
      }
    }
    await prisma.$disconnect()
  })

  describe('Create Location', () => {
    it('creates a location with required fields', async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Test Warehouse',
          code: 'TEST-WH-' + Date.now(),
          type: 'warehouse',
          isActive: true,
        },
      })
      createdLocationIds.push(location.id)

      expect(location.id).toBeDefined()
      expect(location.name).toBe('Test Warehouse')
      expect(location.type).toBe('warehouse')
      expect(location.isActive).toBe(true)
    })

    it('creates a location with address', async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Test Store',
          code: 'TEST-ST-' + Date.now(),
          type: 'store',
          address: '123 Main St, City, State 12345',
          isActive: true,
        },
      })
      createdLocationIds.push(location.id)

      expect(location.address).toBe('123 Main St, City, State 12345')
    })

    it('creates different location types', async () => {
      const warehouse = await prisma.inventoryLocation.create({
        data: {
          name: 'Type Warehouse',
          code: 'TYPE-WH-' + Date.now(),
          type: 'warehouse',
        },
      })
      createdLocationIds.push(warehouse.id)

      const store = await prisma.inventoryLocation.create({
        data: {
          name: 'Type Store',
          code: 'TYPE-ST-' + Date.now(),
          type: 'store',
        },
      })
      createdLocationIds.push(store.id)

      const dc = await prisma.inventoryLocation.create({
        data: {
          name: 'Type DC',
          code: 'TYPE-DC-' + Date.now(),
          type: 'distribution_center',
        },
      })
      createdLocationIds.push(dc.id)

      expect(warehouse.type).toBe('warehouse')
      expect(store.type).toBe('store')
      expect(dc.type).toBe('distribution_center')
    })

    it('enforces unique code constraint', async () => {
      const code = 'UNIQUE-CODE-' + Date.now()

      const first = await prisma.inventoryLocation.create({
        data: {
          name: 'First Location',
          code,
          type: 'warehouse',
        },
      })
      createdLocationIds.push(first.id)

      await expect(
        prisma.inventoryLocation.create({
          data: {
            name: 'Second Location',
            code,
            type: 'store',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Read Location', () => {
    let testLocationId: string

    beforeAll(async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Read Test Location',
          code: 'READ-TEST-' + Date.now(),
          type: 'warehouse',
          address: 'Test Address',
          isActive: true,
        },
      })
      testLocationId = location.id
      createdLocationIds.push(location.id)
    })

    it('fetches location by ID', async () => {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id: testLocationId },
      })

      expect(location).toBeDefined()
      expect(location?.name).toBe('Read Test Location')
    })

    it('fetches location by code', async () => {
      const location = await prisma.inventoryLocation.findFirst({
        where: { id: testLocationId },
      })

      const byCode = await prisma.inventoryLocation.findUnique({
        where: { code: location!.code },
      })

      expect(byCode?.id).toBe(testLocationId)
    })

    it('includes inventory count', async () => {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id: testLocationId },
        include: {
          _count: {
            select: { inventory: true },
          },
        },
      })

      expect(location?._count.inventory).toBeDefined()
      expect(typeof location?._count.inventory).toBe('number')
    })

    it('lists all locations', async () => {
      const locations = await prisma.inventoryLocation.findMany({
        orderBy: { name: 'asc' },
      })

      expect(locations.length).toBeGreaterThan(0)
    })

    it('filters by active status', async () => {
      const activeLocations = await prisma.inventoryLocation.findMany({
        where: { isActive: true },
      })

      expect(activeLocations.every((l) => l.isActive)).toBe(true)
    })

    it('filters by type', async () => {
      const warehouses = await prisma.inventoryLocation.findMany({
        where: { type: 'warehouse' },
      })

      expect(warehouses.every((l) => l.type === 'warehouse')).toBe(true)
    })
  })

  describe('Update Location', () => {
    let updateLocationId: string

    beforeAll(async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Update Test Location',
          code: 'UPDATE-TEST-' + Date.now(),
          type: 'warehouse',
        },
      })
      updateLocationId = location.id
      createdLocationIds.push(location.id)
    })

    it('updates location name', async () => {
      const updated = await prisma.inventoryLocation.update({
        where: { id: updateLocationId },
        data: { name: 'Updated Location Name' },
      })

      expect(updated.name).toBe('Updated Location Name')
    })

    it('updates location type', async () => {
      const updated = await prisma.inventoryLocation.update({
        where: { id: updateLocationId },
        data: { type: 'store' },
      })

      expect(updated.type).toBe('store')
    })

    it('updates location address', async () => {
      const updated = await prisma.inventoryLocation.update({
        where: { id: updateLocationId },
        data: { address: 'New Address' },
      })

      expect(updated.address).toBe('New Address')
    })

    it('toggles active status', async () => {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id: updateLocationId },
      })

      const toggled = await prisma.inventoryLocation.update({
        where: { id: updateLocationId },
        data: { isActive: !location!.isActive },
      })

      expect(toggled.isActive).toBe(!location!.isActive)
    })
  })

  describe('Delete Location', () => {
    it('deletes an empty location', async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'To Delete',
          code: 'DELETE-' + Date.now(),
          type: 'warehouse',
        },
      })

      await prisma.inventoryLocation.delete({
        where: { id: location.id },
      })

      const deleted = await prisma.inventoryLocation.findUnique({
        where: { id: location.id },
      })

      expect(deleted).toBeNull()
    })

    it('checks inventory count before deletion', async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Has Inventory',
          code: 'HAS-INV-' + Date.now(),
          type: 'warehouse',
        },
      })
      createdLocationIds.push(location.id)

      const product = await prisma.product.create({
        data: {
          sku: 'LOC-DEL-' + Date.now(),
          name: 'Test Product',
          price: 10.0,
          status: 'active',
        },
      })

      await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantity: 10,
        },
      })

      const locationWithCount = await prisma.inventoryLocation.findUnique({
        where: { id: location.id },
        include: { _count: { select: { inventory: true } } },
      })

      expect(locationWithCount?._count.inventory).toBe(1)

      // Cleanup
      await prisma.inventory.deleteMany({ where: { productId: product.id } })
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  describe('Location with Inventory', () => {
    let locationId: string
    let productId: string

    beforeAll(async () => {
      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Inventory Location',
          code: 'INV-LOC-' + Date.now(),
          type: 'warehouse',
        },
      })
      locationId = location.id
      createdLocationIds.push(location.id)

      const product = await prisma.product.create({
        data: {
          sku: 'LOC-PROD-' + Date.now(),
          name: 'Location Test Product',
          price: 100.0,
          costPrice: 60.0,
          status: 'active',
        },
      })
      productId = product.id

      await prisma.inventory.create({
        data: {
          productId,
          locationId,
          quantity: 50,
          reserved: 10,
        },
      })
    })

    afterAll(async () => {
      await prisma.inventory.deleteMany({ where: { productId } })
      await prisma.product.delete({ where: { id: productId } })
    })

    it('calculates total stock for location', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { locationId },
      })

      const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0)
      expect(totalStock).toBe(50)
    })

    it('calculates total value for location', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { locationId },
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

      expect(totalValue).toBe(3000) // 50 * 60
    })

    it('counts products at location', async () => {
      const count = await prisma.inventory.count({
        where: { locationId },
      })

      expect(count).toBe(1)
    })
  })
})

describe('Location Validation', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('rejects empty name', async () => {
    // This would be handled by application validation
    // Testing that empty strings are caught
    const validateName = (name: string) => name.trim().length > 0
    expect(validateName('')).toBe(false)
    expect(validateName('  ')).toBe(false)
    expect(validateName('Valid Name')).toBe(true)
  })

  it('rejects empty code', async () => {
    const validateCode = (code: string) => code.trim().length > 0
    expect(validateCode('')).toBe(false)
    expect(validateCode('VALID-CODE')).toBe(true)
  })

  it('validates code format', async () => {
    const validateCodeFormat = (code: string) => /^[A-Z0-9-]+$/i.test(code)
    expect(validateCodeFormat('VALID-CODE-123')).toBe(true)
    expect(validateCodeFormat('invalid code')).toBe(false)
    expect(validateCodeFormat('invalid_code')).toBe(false)
    expect(validateCodeFormat('valid-code')).toBe(true)
  })

  it('validates location type', async () => {
    const validTypes = ['warehouse', 'store', 'distribution_center']
    const validateType = (type: string) => validTypes.includes(type)

    expect(validateType('warehouse')).toBe(true)
    expect(validateType('store')).toBe(true)
    expect(validateType('distribution_center')).toBe(true)
    expect(validateType('invalid')).toBe(false)
  })
})
