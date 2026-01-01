import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  userFilterSchema,
  createUserSchema,
  updateUserSchema,
  bulkActionSchema,
} from '@/lib/validations/user'

const prisma = new PrismaClient()

describe('User Management Validation', () => {
  describe('userFilterSchema', () => {
    it('validates with default values', () => {
      const result = userFilterSchema.safeParse({})
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
        search: 'john',
        role: 'admin' as const,
        status: 'active' as const,
        dealerId: 'dealer-123',
        page: 2,
        pageSize: 25,
        sortBy: 'email' as const,
        sortOrder: 'asc' as const,
      }
      const result = userFilterSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject(input)
      }
    })

    it('coerces page number from string', () => {
      const result = userFilterSchema.safeParse({ page: '3' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(3)
      }
    })

    it('rejects invalid role', () => {
      const result = userFilterSchema.safeParse({ role: 'invalid_role' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid status', () => {
      const result = userFilterSchema.safeParse({ status: 'unknown' })
      expect(result.success).toBe(false)
    })

    it('limits pageSize to 100', () => {
      const result = userFilterSchema.safeParse({ pageSize: 150 })
      expect(result.success).toBe(false)
    })
  })

  describe('createUserSchema', () => {
    const validUser = {
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'SecurePass123',
      role: 'dealer_user' as const,
    }

    it('validates correct user data', () => {
      const result = createUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        email: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })

    it('rejects short password', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'Short1',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without uppercase', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'allowercase123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without number', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        password: 'NoNumbersHere',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty first name', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        firstName: '',
      })
      expect(result.success).toBe(false)
    })

    it('allows optional phone', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        phone: '555-123-4567',
      })
      expect(result.success).toBe(true)
    })

    it('allows optional dealerId', () => {
      const result = createUserSchema.safeParse({
        ...validUser,
        dealerId: 'dealer-123',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateUserSchema', () => {
    it('validates with just id', () => {
      const result = updateUserSchema.safeParse({ id: 'user-123' })
      expect(result.success).toBe(true)
    })

    it('validates partial update', () => {
      const result = updateUserSchema.safeParse({
        id: 'user-123',
        firstName: 'Updated',
        status: 'suspended' as const,
      })
      expect(result.success).toBe(true)
    })

    it('allows nullable dealerId', () => {
      const result = updateUserSchema.safeParse({
        id: 'user-123',
        dealerId: null,
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing id', () => {
      const result = updateUserSchema.safeParse({ firstName: 'Test' })
      expect(result.success).toBe(false)
    })
  })

  describe('bulkActionSchema', () => {
    it('validates activate action', () => {
      const result = bulkActionSchema.safeParse({
        userIds: ['user-1', 'user-2'],
        action: 'activate',
      })
      expect(result.success).toBe(true)
    })

    it('validates deactivate action', () => {
      const result = bulkActionSchema.safeParse({
        userIds: ['user-1'],
        action: 'deactivate',
      })
      expect(result.success).toBe(true)
    })

    it('validates suspend action', () => {
      const result = bulkActionSchema.safeParse({
        userIds: ['user-1', 'user-2', 'user-3'],
        action: 'suspend',
      })
      expect(result.success).toBe(true)
    })

    it('validates delete action', () => {
      const result = bulkActionSchema.safeParse({
        userIds: ['user-1'],
        action: 'delete',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty userIds', () => {
      const result = bulkActionSchema.safeParse({
        userIds: [],
        action: 'activate',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid action', () => {
      const result = bulkActionSchema.safeParse({
        userIds: ['user-1'],
        action: 'invalid',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('User Management Integration', () => {
  let testDealerId: string
  let testUserIds: string[] = []

  beforeAll(async () => {
    // Create test dealer
    const dealer = await prisma.dealer.create({
      data: {
        code: 'USRMGMT01',
        name: 'User Management Test Dealer',
        status: 'active',
        tier: 'gold',
      },
    })
    testDealerId = dealer.id

    // Create test users
    const password = await bcrypt.hash('TestPassword123', 12)
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'user-mgmt-test1@example.com',
          passwordHash: password,
          firstName: 'Test',
          lastName: 'User1',
          role: 'dealer_user',
          status: 'active',
          dealerId: testDealerId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'user-mgmt-test2@example.com',
          passwordHash: password,
          firstName: 'Test',
          lastName: 'User2',
          role: 'dealer_admin',
          status: 'pending',
          dealerId: testDealerId,
        },
      }),
      prisma.user.create({
        data: {
          email: 'user-mgmt-admin@example.com',
          passwordHash: password,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          status: 'active',
        },
      }),
    ])
    testUserIds = users.map((u) => u.id)
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'user-mgmt-' } },
    })
    await prisma.dealer.deleteMany({
      where: { code: 'USRMGMT01' },
    })
    await prisma.$disconnect()
  })

  it('can filter users by role', async () => {
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
    })
    expect(users.every((u) => u.role === 'admin')).toBe(true)
  })

  it('can filter users by status', async () => {
    const users = await prisma.user.findMany({
      where: { status: 'pending' },
    })
    expect(users.every((u) => u.status === 'pending')).toBe(true)
  })

  it('can filter users by dealerId', async () => {
    const users = await prisma.user.findMany({
      where: { dealerId: testDealerId },
    })
    expect(users.length).toBeGreaterThanOrEqual(2)
    expect(users.every((u) => u.dealerId === testDealerId)).toBe(true)
  })

  it('can search users by email', async () => {
    const users = await prisma.user.findMany({
      where: {
        email: { contains: 'user-mgmt-test1' },
      },
    })
    expect(users.length).toBe(1)
    expect(users[0].email).toBe('user-mgmt-test1@example.com')
  })

  it('can search users by name', async () => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Admin' } },
          { lastName: { contains: 'Admin' } },
        ],
      },
    })
    expect(users.some((u) => u.firstName === 'Admin')).toBe(true)
  })

  it('can paginate users', async () => {
    const page1 = await prisma.user.findMany({
      skip: 0,
      take: 2,
      orderBy: { createdAt: 'desc' },
    })
    const page2 = await prisma.user.findMany({
      skip: 2,
      take: 2,
      orderBy: { createdAt: 'desc' },
    })
    expect(page1.length).toBeLessThanOrEqual(2)
    // Pages should not overlap
    const page1Ids = new Set(page1.map((u) => u.id))
    page2.forEach((u) => {
      expect(page1Ids.has(u.id)).toBe(false)
    })
  })

  it('can sort users', async () => {
    const usersAsc = await prisma.user.findMany({
      orderBy: { email: 'asc' },
    })
    const usersDesc = await prisma.user.findMany({
      orderBy: { email: 'desc' },
    })
    if (usersAsc.length > 1 && usersDesc.length > 1) {
      expect(usersAsc[0].id).not.toBe(usersDesc[0].id)
    }
  })

  it('can bulk update user status', async () => {
    const result = await prisma.user.updateMany({
      where: { id: { in: testUserIds.slice(0, 2) } },
      data: { status: 'suspended' },
    })
    expect(result.count).toBe(2)

    // Verify update
    const updated = await prisma.user.findMany({
      where: { id: { in: testUserIds.slice(0, 2) } },
    })
    expect(updated.every((u) => u.status === 'suspended')).toBe(true)

    // Reset
    await prisma.user.updateMany({
      where: { id: { in: testUserIds.slice(0, 2) } },
      data: { status: 'active' },
    })
  })

  it('includes dealer info in user query', async () => {
    const user = await prisma.user.findFirst({
      where: { email: 'user-mgmt-test1@example.com' },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })
    expect(user).not.toBeNull()
    expect(user?.dealer).not.toBeNull()
    expect(user?.dealer?.code).toBe('USRMGMT01')
  })
})
