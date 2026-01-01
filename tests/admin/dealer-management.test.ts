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
