import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import {
  dealerFilterSchema,
  createDealerSchema,
  updateDealerSchema,
  bulkDealerActionSchema,
} from '@/lib/validations/dealer'

const prisma = new PrismaClient()

describe('Dealer Management Validation', () => {
  describe('dealerFilterSchema', () => {
    it('validates with default values', () => {
      const result = dealerFilterSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(10)
        expect(result.data.sortBy).toBe('createdAt')
        expect(result.data.sortOrder).toBe('desc')
      }
    })

    it('validates full filter input', () => {
      const input = {
        search: 'DEALER',
        status: 'active' as const,
        tier: 'gold' as const,
        page: 2,
        pageSize: 25,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
      }
      const result = dealerFilterSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject(input)
      }
    })

    it('rejects invalid status', () => {
      const result = dealerFilterSchema.safeParse({ status: 'unknown' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid tier', () => {
      const result = dealerFilterSchema.safeParse({ tier: 'diamond' })
      expect(result.success).toBe(false)
    })
  })

  describe('createDealerSchema', () => {
    const validDealer = {
      code: 'NEWDLR01',
      name: 'New Dealer',
    }

    it('validates correct dealer data', () => {
      const result = createDealerSchema.safeParse(validDealer)
      expect(result.success).toBe(true)
    })

    it('sets default status and tier', () => {
      const result = createDealerSchema.safeParse(validDealer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
        expect(result.data.tier).toBe('bronze')
      }
    })

    it('rejects empty code', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        code: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects lowercase code', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        code: 'lowercase',
      })
      expect(result.success).toBe(false)
    })

    it('rejects code with special characters', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        code: 'DLR-001',
      })
      expect(result.success).toBe(false)
    })

    it('rejects code over 20 characters', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        code: 'THISISAVERYLONGDEALERCODE',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('allows optional fields', () => {
      const result = createDealerSchema.safeParse({
        ...validDealer,
        ein: '12-3456789',
        licenseNumber: 'LIC-12345',
        insurancePolicy: 'POL-67890',
        parentDealerId: 'parent-id',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateDealerSchema', () => {
    it('validates with just id', () => {
      const result = updateDealerSchema.safeParse({ id: 'dealer-123' })
      expect(result.success).toBe(true)
    })

    it('validates partial update', () => {
      const result = updateDealerSchema.safeParse({
        id: 'dealer-123',
        name: 'Updated Dealer Name',
        tier: 'gold' as const,
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = updateDealerSchema.safeParse({ name: 'Test' })
      expect(result.success).toBe(false)
    })

    it('allows nullable parentDealerId', () => {
      const result = updateDealerSchema.safeParse({
        id: 'dealer-123',
        parentDealerId: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkDealerActionSchema', () => {
    it('validates activate action', () => {
      const result = bulkDealerActionSchema.safeParse({
        dealerIds: ['dealer-1', 'dealer-2'],
        action: 'activate',
      })
      expect(result.success).toBe(true)
    })

    it('validates suspend action', () => {
      const result = bulkDealerActionSchema.safeParse({
        dealerIds: ['dealer-1'],
        action: 'suspend',
      })
      expect(result.success).toBe(true)
    })

    it('validates deactivate action', () => {
      const result = bulkDealerActionSchema.safeParse({
        dealerIds: ['dealer-1', 'dealer-2', 'dealer-3'],
        action: 'deactivate',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty dealerIds', () => {
      const result = bulkDealerActionSchema.safeParse({
        dealerIds: [],
        action: 'activate',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid action', () => {
      const result = bulkDealerActionSchema.safeParse({
        dealerIds: ['dealer-1'],
        action: 'delete',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Dealer Management Integration', () => {
  let testDealerIds: string[] = []

  beforeAll(async () => {
    // Create test dealers
    const dealers = await Promise.all([
      prisma.dealer.create({
        data: {
          code: 'DLRMGMT01',
          name: 'Management Test Dealer 1',
          status: 'active',
          tier: 'platinum',
        },
      }),
      prisma.dealer.create({
        data: {
          code: 'DLRMGMT02',
          name: 'Management Test Dealer 2',
          status: 'pending',
          tier: 'gold',
        },
      }),
      prisma.dealer.create({
        data: {
          code: 'DLRMGMT03',
          name: 'Management Test Dealer 3',
          status: 'suspended',
          tier: 'silver',
        },
      }),
    ])
    testDealerIds = dealers.map((d) => d.id)
  })

  afterAll(async () => {
    await prisma.dealer.deleteMany({
      where: { code: { startsWith: 'DLRMGMT' } },
    })
    await prisma.$disconnect()
  })

  it('can filter dealers by status', async () => {
    const dealers = await prisma.dealer.findMany({
      where: { status: 'active' },
    })
    expect(dealers.every((d) => d.status === 'active')).toBe(true)
  })

  it('can filter dealers by tier', async () => {
    const dealers = await prisma.dealer.findMany({
      where: { tier: 'platinum' },
    })
    expect(dealers.every((d) => d.tier === 'platinum')).toBe(true)
  })

  it('can search dealers by code', async () => {
    const dealers = await prisma.dealer.findMany({
      where: {
        code: { contains: 'DLRMGMT01' },
      },
    })
    expect(dealers.length).toBe(1)
    expect(dealers[0].code).toBe('DLRMGMT01')
  })

  it('can search dealers by name', async () => {
    const dealers = await prisma.dealer.findMany({
      where: {
        name: { contains: 'Management Test' },
      },
    })
    expect(dealers.length).toBeGreaterThanOrEqual(3)
  })

  it('can paginate dealers', async () => {
    const page1 = await prisma.dealer.findMany({
      skip: 0,
      take: 2,
      orderBy: { createdAt: 'desc' },
    })
    const page2 = await prisma.dealer.findMany({
      skip: 2,
      take: 2,
      orderBy: { createdAt: 'desc' },
    })
    expect(page1.length).toBeLessThanOrEqual(2)
    const page1Ids = new Set(page1.map((d) => d.id))
    page2.forEach((d) => {
      expect(page1Ids.has(d.id)).toBe(false)
    })
  })

  it('can sort dealers', async () => {
    const dealersAsc = await prisma.dealer.findMany({
      orderBy: { code: 'asc' },
    })
    const dealersDesc = await prisma.dealer.findMany({
      orderBy: { code: 'desc' },
    })
    if (dealersAsc.length > 1 && dealersDesc.length > 1) {
      expect(dealersAsc[0].id).not.toBe(dealersDesc[0].id)
    }
  })

  it('can bulk update dealer status', async () => {
    const result = await prisma.dealer.updateMany({
      where: { id: { in: testDealerIds.slice(0, 2) } },
      data: { status: 'inactive' },
    })
    expect(result.count).toBe(2)

    const updated = await prisma.dealer.findMany({
      where: { id: { in: testDealerIds.slice(0, 2) } },
    })
    expect(updated.every((d) => d.status === 'inactive')).toBe(true)

    // Reset
    await prisma.dealer.updateMany({
      where: { id: { in: testDealerIds } },
      data: { status: 'active' },
    })
  })

  it('includes user and order counts', async () => {
    const dealer = await prisma.dealer.findFirst({
      where: { code: 'DLRMGMT01' },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
          },
        },
      },
    })
    expect(dealer).not.toBeNull()
    expect(dealer?._count).toBeDefined()
    expect(dealer?._count.users).toBeGreaterThanOrEqual(0)
    expect(dealer?._count.orders).toBeGreaterThanOrEqual(0)
  })

  it('can get dealer statistics', async () => {
    const [total, active, pending, tierCounts] = await Promise.all([
      prisma.dealer.count(),
      prisma.dealer.count({ where: { status: 'active' } }),
      prisma.dealer.count({ where: { status: 'pending' } }),
      prisma.dealer.groupBy({
        by: ['tier'],
        _count: { tier: true },
      }),
    ])

    expect(total).toBeGreaterThan(0)
    expect(active).toBeLessThanOrEqual(total)
    expect(pending).toBeLessThanOrEqual(total)
    expect(tierCounts.length).toBeGreaterThan(0)
  })

  it('supports parent dealer relationships', async () => {
    const parentDealer = await prisma.dealer.findFirst({
      where: { code: 'DLRMGMT01' },
    })

    // Create child dealer
    const childDealer = await prisma.dealer.create({
      data: {
        code: 'DLRMGMTCHILD',
        name: 'Child Dealer',
        status: 'active',
        tier: 'bronze',
        parentDealerId: parentDealer!.id,
      },
    })

    // Verify relationship
    const childWithParent = await prisma.dealer.findUnique({
      where: { id: childDealer.id },
      include: {
        parentDealer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    expect(childWithParent?.parentDealer).not.toBeNull()
    expect(childWithParent?.parentDealer?.code).toBe('DLRMGMT01')

    // Clean up
    await prisma.dealer.delete({ where: { id: childDealer.id } })
  })
})

describe('Dealer CRUD Operations', () => {
  let crudDealerIds: string[] = []

  afterAll(async () => {
    if (crudDealerIds.length > 0) {
      await prisma.dealer.deleteMany({
        where: { id: { in: crudDealerIds } },
      })
    }
    await prisma.dealer.deleteMany({
      where: { code: { startsWith: 'DLRCRUD' } },
    })
    await prisma.$disconnect()
  })

  it('can create a new dealer', async () => {
    const dealer = await prisma.dealer.create({
      data: {
        code: 'DLRCRUD01',
        name: 'CRUD Test Dealer',
        status: 'pending',
        tier: 'bronze',
      },
    })
    crudDealerIds.push(dealer.id)

    expect(dealer).toBeDefined()
    expect(dealer.code).toBe('DLRCRUD01')
    expect(dealer.name).toBe('CRUD Test Dealer')
    expect(dealer.status).toBe('pending')
    expect(dealer.tier).toBe('bronze')
  })

  it('can read a dealer by id with relations', async () => {
    const dealerId = crudDealerIds[0]
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        tier: true,
        ein: true,
        licenseNumber: true,
        insurancePolicy: true,
        parentDealerId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            orders: true,
            childDealers: true,
          },
        },
      },
    })

    expect(dealer).not.toBeNull()
    expect(dealer?.code).toBe('DLRCRUD01')
    expect(dealer?._count).toBeDefined()
  })

  it('can update dealer fields', async () => {
    const dealerId = crudDealerIds[0]
    const updated = await prisma.dealer.update({
      where: { id: dealerId },
      data: {
        name: 'Updated Dealer Name',
        tier: 'gold',
        ein: '12-3456789',
        licenseNumber: 'LIC-001',
      },
    })

    expect(updated.name).toBe('Updated Dealer Name')
    expect(updated.tier).toBe('gold')
    expect(updated.ein).toBe('12-3456789')
    expect(updated.licenseNumber).toBe('LIC-001')
  })

  it('can change dealer status', async () => {
    const dealerId = crudDealerIds[0]
    const updated = await prisma.dealer.update({
      where: { id: dealerId },
      data: { status: 'active' },
    })

    expect(updated.status).toBe('active')
  })

  it('can change dealer tier', async () => {
    const dealerId = crudDealerIds[0]
    const updated = await prisma.dealer.update({
      where: { id: dealerId },
      data: { tier: 'platinum' },
    })

    expect(updated.tier).toBe('platinum')
  })

  it('enforces unique dealer code', async () => {
    await expect(
      prisma.dealer.create({
        data: {
          code: 'DLRCRUD01', // Same as existing
          name: 'Duplicate Code Dealer',
          status: 'pending',
          tier: 'bronze',
        },
      })
    ).rejects.toThrow()
  })

  it('can set parent dealer relationship', async () => {
    const childDealer = await prisma.dealer.create({
      data: {
        code: 'DLRCRUDCHILD',
        name: 'Child Dealer',
        status: 'active',
        tier: 'bronze',
        parentDealerId: crudDealerIds[0],
      },
    })
    crudDealerIds.push(childDealer.id)

    expect(childDealer.parentDealerId).toBe(crudDealerIds[0])

    // Verify parent has child count
    const parent = await prisma.dealer.findUnique({
      where: { id: crudDealerIds[0] },
      include: {
        _count: {
          select: { childDealers: true },
        },
      },
    })
    expect(parent?._count.childDealers).toBeGreaterThanOrEqual(1)
  })

  it('can remove parent dealer relationship', async () => {
    const childDealerId = crudDealerIds[1]
    const updated = await prisma.dealer.update({
      where: { id: childDealerId },
      data: { parentDealerId: null },
    })

    expect(updated.parentDealerId).toBeNull()
  })

  it('can delete a dealer without relations', async () => {
    const dealerToDelete = await prisma.dealer.create({
      data: {
        code: 'DLRTODELETE',
        name: 'Dealer to Delete',
        status: 'inactive',
        tier: 'bronze',
      },
    })

    await prisma.dealer.delete({
      where: { id: dealerToDelete.id },
    })

    const deleted = await prisma.dealer.findUnique({
      where: { id: dealerToDelete.id },
    })
    expect(deleted).toBeNull()
  })

  it('can update business details', async () => {
    const dealerId = crudDealerIds[0]
    const updated = await prisma.dealer.update({
      where: { id: dealerId },
      data: {
        ein: '98-7654321',
        licenseNumber: 'LIC-999',
        insurancePolicy: 'POL-888',
      },
    })

    expect(updated.ein).toBe('98-7654321')
    expect(updated.licenseNumber).toBe('LIC-999')
    expect(updated.insurancePolicy).toBe('POL-888')
  })

  it('can clear optional fields', async () => {
    const dealerId = crudDealerIds[0]
    const updated = await prisma.dealer.update({
      where: { id: dealerId },
      data: {
        ein: null,
        licenseNumber: null,
        insurancePolicy: null,
      },
    })

    expect(updated.ein).toBeNull()
    expect(updated.licenseNumber).toBeNull()
    expect(updated.insurancePolicy).toBeNull()
  })
})

describe('Dealer Detail Page Operations', () => {
  let testDealerId: string
  let testUserId: string
  let testOrderId: string
  let testContactId: string
  let testAddressId: string

  beforeAll(async () => {
    // Create a test dealer with related data
    const dealer = await prisma.dealer.create({
      data: {
        code: 'DLRDETAIL01',
        name: 'Detail Test Dealer',
        status: 'active',
        tier: 'gold',
        ein: '12-3456789',
        licenseNumber: 'LIC-DETAIL',
        insurancePolicy: 'POL-DETAIL',
      },
    })
    testDealerId = dealer.id

    // Create a test user for this dealer
    const user = await prisma.user.create({
      data: {
        email: 'detail-test@example.com',
        firstName: 'Detail',
        lastName: 'Tester',
        passwordHash: 'test-hash',
        role: 'dealer_user',
        status: 'active',
        dealerId: testDealerId,
      },
    })
    testUserId = user.id

    // Create a test order for this dealer
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-DETAIL-001',
        status: 'confirmed',
        totalAmount: 1500.0,
        dealerId: testDealerId,
      },
    })
    testOrderId = order.id

    // Create a test contact for this dealer
    const contact = await prisma.dealerContact.create({
      data: {
        name: 'John Contact',
        email: 'john@dealertest.com',
        phone: '555-1234',
        type: 'sales',
        isPrimary: true,
        dealerId: testDealerId,
      },
    })
    testContactId = contact.id

    // Create a test address for this dealer
    const address = await prisma.dealerAddress.create({
      data: {
        type: 'billing',
        street: '123 Main St',
        street2: 'Suite 100',
        city: 'Testville',
        state: 'TX',
        zipCode: '75001',
        country: 'USA',
        isPrimary: true,
        dealerId: testDealerId,
      },
    })
    testAddressId = address.id
  })

  afterAll(async () => {
    // Clean up in reverse order of creation
    await prisma.dealerAddress.deleteMany({ where: { dealerId: testDealerId } })
    await prisma.dealerContact.deleteMany({ where: { dealerId: testDealerId } })
    await prisma.order.deleteMany({ where: { dealerId: testDealerId } })
    await prisma.user.deleteMany({ where: { dealerId: testDealerId } })
    await prisma.dealer.delete({ where: { id: testDealerId } })
    await prisma.$disconnect()
  })

  describe('getDealerUsers functionality', () => {
    it('returns users for a dealer', async () => {
      const users = await prisma.user.findMany({
        where: { dealerId: testDealerId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      })

      expect(users.length).toBeGreaterThanOrEqual(1)
      expect(users[0].email).toBe('detail-test@example.com')
      expect(users[0].role).toBe('dealer_user')
    })

    it('returns empty array for dealer with no users', async () => {
      const emptyDealer = await prisma.dealer.create({
        data: {
          code: 'DLRNOUSERS',
          name: 'Dealer No Users',
          status: 'active',
          tier: 'bronze',
        },
      })

      const users = await prisma.user.findMany({
        where: { dealerId: emptyDealer.id },
      })

      expect(users).toEqual([])

      await prisma.dealer.delete({ where: { id: emptyDealer.id } })
    })
  })

  describe('getDealerOrders functionality', () => {
    it('returns orders for a dealer', async () => {
      const orders = await prisma.order.findMany({
        where: { dealerId: testDealerId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(orders.length).toBeGreaterThanOrEqual(1)
      expect(orders[0].orderNumber).toBe('ORD-DETAIL-001')
      expect(orders[0].totalAmount).toBe(1500.0)
    })

    it('orders are sorted by creation date descending', async () => {
      // Create additional order
      await prisma.order.create({
        data: {
          orderNumber: 'ORD-DETAIL-002',
          status: 'draft',
          totalAmount: 500.0,
          dealerId: testDealerId,
        },
      })

      const orders = await prisma.order.findMany({
        where: { dealerId: testDealerId },
        orderBy: { createdAt: 'desc' },
      })

      expect(orders.length).toBeGreaterThanOrEqual(2)
      // Newest order should be first
      expect(orders[0].orderNumber).toBe('ORD-DETAIL-002')
    })
  })

  describe('getDealerContacts functionality', () => {
    it('returns contacts for a dealer', async () => {
      const contacts = await prisma.dealerContact.findMany({
        where: { dealerId: testDealerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          type: true,
          isPrimary: true,
        },
      })

      expect(contacts.length).toBeGreaterThanOrEqual(1)
      expect(contacts[0].name).toBe('John Contact')
      expect(contacts[0].type).toBe('sales')
      expect(contacts[0].isPrimary).toBe(true)
    })

    it('can have multiple contacts', async () => {
      await prisma.dealerContact.create({
        data: {
          name: 'Jane Secondary',
          email: 'jane@dealertest.com',
          type: 'support',
          isPrimary: false,
          dealerId: testDealerId,
        },
      })

      const contacts = await prisma.dealerContact.findMany({
        where: { dealerId: testDealerId },
      })

      expect(contacts.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getDealerAddresses functionality', () => {
    it('returns addresses for a dealer', async () => {
      const addresses = await prisma.dealerAddress.findMany({
        where: { dealerId: testDealerId },
        select: {
          id: true,
          type: true,
          street: true,
          street2: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          isPrimary: true,
        },
      })

      expect(addresses.length).toBeGreaterThanOrEqual(1)
      expect(addresses[0].street).toBe('123 Main St')
      expect(addresses[0].city).toBe('Testville')
      expect(addresses[0].type).toBe('billing')
    })

    it('can have multiple addresses of different types', async () => {
      await prisma.dealerAddress.create({
        data: {
          type: 'shipping',
          street: '456 Warehouse Ave',
          city: 'Shiptown',
          state: 'TX',
          zipCode: '75002',
          country: 'USA',
          isPrimary: false,
          dealerId: testDealerId,
        },
      })

      const addresses = await prisma.dealerAddress.findMany({
        where: { dealerId: testDealerId },
      })

      expect(addresses.length).toBeGreaterThanOrEqual(2)
      const types = addresses.map((a) => a.type)
      expect(types).toContain('billing')
      expect(types).toContain('shipping')
    })
  })

  describe('Dealer detail page data aggregation', () => {
    it('can fetch all dealer detail data in parallel', async () => {
      const [dealer, users, orders, contacts, addresses] = await Promise.all([
        prisma.dealer.findUnique({
          where: { id: testDealerId },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            tier: true,
            ein: true,
            licenseNumber: true,
            insurancePolicy: true,
            createdAt: true,
            updatedAt: true,
            parentDealer: {
              select: { id: true, name: true, code: true },
            },
            _count: {
              select: {
                users: true,
                orders: true,
                childDealers: true,
              },
            },
          },
        }),
        prisma.user.findMany({
          where: { dealerId: testDealerId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
          },
        }),
        prisma.order.findMany({
          where: { dealerId: testDealerId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.dealerContact.findMany({
          where: { dealerId: testDealerId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            type: true,
            isPrimary: true,
          },
        }),
        prisma.dealerAddress.findMany({
          where: { dealerId: testDealerId },
          select: {
            id: true,
            type: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            isPrimary: true,
          },
        }),
      ])

      // Verify all data was fetched
      expect(dealer).not.toBeNull()
      expect(dealer?.code).toBe('DLRDETAIL01')
      expect(users.length).toBeGreaterThanOrEqual(1)
      expect(orders.length).toBeGreaterThanOrEqual(1)
      expect(contacts.length).toBeGreaterThanOrEqual(1)
      expect(addresses.length).toBeGreaterThanOrEqual(1)

      // Verify counts match
      expect(dealer?._count.users).toBe(users.length)
      expect(dealer?._count.orders).toBe(orders.length)
    })

    it('handles dealer with parent correctly', async () => {
      const childDealer = await prisma.dealer.create({
        data: {
          code: 'DLRCHILD01',
          name: 'Child Detail Dealer',
          status: 'active',
          tier: 'bronze',
          parentDealerId: testDealerId,
        },
      })

      const dealerWithParent = await prisma.dealer.findUnique({
        where: { id: childDealer.id },
        select: {
          id: true,
          code: true,
          name: true,
          parentDealer: {
            select: { id: true, name: true, code: true },
          },
        },
      })

      expect(dealerWithParent?.parentDealer).not.toBeNull()
      expect(dealerWithParent?.parentDealer?.code).toBe('DLRDETAIL01')

      await prisma.dealer.delete({ where: { id: childDealer.id } })
    })
  })
})
