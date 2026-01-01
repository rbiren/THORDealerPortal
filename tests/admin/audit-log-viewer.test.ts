import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// These tests verify the audit log viewer server actions and data queries
describe('Audit Log Viewer', () => {
  let testUserId: string
  let auditLogIds: string[] = []

  beforeAll(async () => {
    // Create a test user for audit logs
    const user = await prisma.user.create({
      data: {
        email: 'audit-viewer-test@example.com',
        firstName: 'Audit',
        lastName: 'Viewer',
        passwordHash: 'test-hash',
        role: 'admin',
        status: 'active',
      },
    })
    testUserId = user.id

    // Create sample audit logs for testing
    const logs = await Promise.all([
      prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'create',
          entityType: 'Dealer',
          entityId: 'dealer-viewer-1',
          newValues: JSON.stringify({ name: 'Test Dealer 1' }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'update',
          entityType: 'Dealer',
          entityId: 'dealer-viewer-1',
          oldValues: JSON.stringify({ status: 'pending' }),
          newValues: JSON.stringify({ status: 'active' }),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'login',
          entityType: 'Session',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'delete',
          entityType: 'User',
          entityId: 'user-deleted-1',
          oldValues: JSON.stringify({ email: 'deleted@test.com' }),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'create',
          entityType: 'Product',
          entityId: 'product-1',
          newValues: JSON.stringify({ name: 'System Created Product' }),
        },
      }),
    ])
    auditLogIds = logs.map((l) => l.id)
  })

  afterAll(async () => {
    // Clean up audit logs
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { id: { in: auditLogIds } },
        ],
      },
    })
    // Clean up test user
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  describe('Filter By User', () => {
    it('filters logs by user ID', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: testUserId },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.userId).toBe(testUserId)
      })
    })

    it('returns logs without user for system actions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: null, entityType: 'Product' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.userId).toBeNull()
      })
    })
  })

  describe('Filter By Action', () => {
    it('filters by create action', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'create' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.action).toBe('create')
      })
    })

    it('filters by update action', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'update' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.action).toBe('update')
      })
    })

    it('filters by delete action', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'delete' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.action).toBe('delete')
      })
    })

    it('filters by login action', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { action: 'login' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.action).toBe('login')
      })
    })
  })

  describe('Filter By Entity Type', () => {
    it('filters by Dealer entity type', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'Dealer' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.entityType).toBe('Dealer')
      })
    })

    it('filters by User entity type', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'User' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.entityType).toBe('User')
      })
    })

    it('filters by Session entity type', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'Session' },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.entityType).toBe('Session')
      })
    })
  })

  describe('Filter By Entity ID', () => {
    it('finds logs for a specific entity', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityId: 'dealer-viewer-1' },
      })

      expect(logs.length).toBe(2) // create and update
    })

    it('combines entity type and ID filters', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Dealer',
          entityId: 'dealer-viewer-1',
        },
      })

      expect(logs.length).toBe(2)
      logs.forEach((log) => {
        expect(log.entityType).toBe('Dealer')
        expect(log.entityId).toBe('dealer-viewer-1')
      })
    })
  })

  describe('Filter By Date Range', () => {
    it('filters by start date', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const logs = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: yesterday },
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(yesterday.getTime())
      })
    })

    it('filters by end date', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const logs = await prisma.auditLog.findMany({
        where: {
          createdAt: { lte: tomorrow },
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.createdAt.getTime()).toBeLessThanOrEqual(tomorrow.getTime())
      })
    })

    it('filters by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const logs = await prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: yesterday,
            lte: tomorrow,
          },
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(yesterday.getTime())
        expect(log.createdAt.getTime()).toBeLessThanOrEqual(tomorrow.getTime())
      })
    })
  })

  describe('Combined Filters', () => {
    it('combines user and action filters', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          userId: testUserId,
          action: 'create',
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.userId).toBe(testUserId)
        expect(log.action).toBe('create')
      })
    })

    it('combines entity type and action filters', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Dealer',
          action: 'update',
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.entityType).toBe('Dealer')
        expect(log.action).toBe('update')
      })
    })

    it('combines all filters', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const logs = await prisma.auditLog.findMany({
        where: {
          userId: testUserId,
          action: 'create',
          entityType: 'Dealer',
          createdAt: { gte: yesterday },
        },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.userId).toBe(testUserId)
        expect(log.action).toBe('create')
        expect(log.entityType).toBe('Dealer')
        expect(log.createdAt.getTime()).toBeGreaterThanOrEqual(yesterday.getTime())
      })
    })
  })

  describe('Pagination', () => {
    it('supports pagination with skip and take', async () => {
      const page1 = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBeLessThanOrEqual(2)
      const page1Ids = page1.map((l) => l.id)
      page2.forEach((log) => {
        expect(page1Ids).not.toContain(log.id)
      })
    })

    it('maintains ordering across pages', async () => {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(logs[i].createdAt.getTime())
      }
    })
  })

  describe('User Information', () => {
    it('includes user details in log query', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: testUserId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: 1,
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].user).toBeDefined()
      expect(logs[0].user?.email).toBe('audit-viewer-test@example.com')
      expect(logs[0].user?.firstName).toBe('Audit')
      expect(logs[0].user?.lastName).toBe('Viewer')
    })
  })

  describe('Distinct Values for Filters', () => {
    it('gets distinct entity types', async () => {
      const result = await prisma.auditLog.findMany({
        select: { entityType: true },
        distinct: ['entityType'],
        orderBy: { entityType: 'asc' },
      })

      expect(result.length).toBeGreaterThan(0)
      const types = result.map((r) => r.entityType)
      expect(types).toContain('Dealer')
      expect(types).toContain('User')
    })

    it('gets distinct actions', async () => {
      const result = await prisma.auditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      })

      expect(result.length).toBeGreaterThan(0)
      const actions = result.map((r) => r.action)
      expect(actions).toContain('create')
      expect(actions).toContain('update')
    })
  })

  describe('Log Detail Expansion', () => {
    it('retrieves full log details including JSON values', async () => {
      const log = await prisma.auditLog.findFirst({
        where: {
          entityId: 'dealer-viewer-1',
          action: 'update',
        },
      })

      expect(log).toBeDefined()
      expect(log?.oldValues).toBeDefined()
      expect(log?.newValues).toBeDefined()

      const oldValues = JSON.parse(log!.oldValues!)
      const newValues = JSON.parse(log!.newValues!)

      expect(oldValues.status).toBe('pending')
      expect(newValues.status).toBe('active')
    })

    it('retrieves IP address and user agent', async () => {
      const log = await prisma.auditLog.findFirst({
        where: {
          entityId: 'dealer-viewer-1',
          action: 'create',
        },
      })

      expect(log).toBeDefined()
      expect(log?.ipAddress).toBe('192.168.1.1')
      expect(log?.userAgent).toBe('Mozilla/5.0 Test Browser')
    })
  })

  describe('Statistics', () => {
    it('counts total logs', async () => {
      const count = await prisma.auditLog.count()
      expect(count).toBeGreaterThan(0)
    })

    it('counts logs by action', async () => {
      const byAction = await prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
      })

      expect(byAction.length).toBeGreaterThan(0)
      byAction.forEach((item) => {
        expect(item._count.action).toBeGreaterThan(0)
      })
    })

    it('counts logs by entity type', async () => {
      const byEntityType = await prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
      })

      expect(byEntityType.length).toBeGreaterThan(0)
    })

    it('counts recent activity', async () => {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const recentCount = await prisma.auditLog.count({
        where: {
          createdAt: { gte: last24Hours },
        },
      })

      expect(recentCount).toBeGreaterThan(0)
    })
  })

  describe('Empty Results', () => {
    it('returns empty array for no matches', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityId: 'non-existent-entity-id-123' },
      })

      expect(logs).toEqual([])
    })

    it('returns zero count for no matches', async () => {
      const count = await prisma.auditLog.count({
        where: { entityId: 'non-existent-entity-id-123' },
      })

      expect(count).toBe(0)
    })
  })
})

describe('Audit Log Filter Users', () => {
  let testUserId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'filter-users-test@example.com',
        firstName: 'Filter',
        lastName: 'Test',
        passwordHash: 'test-hash',
        role: 'dealer',
        status: 'active',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  it('gets users for filter dropdown', async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: 'asc' },
      take: 100,
    })

    expect(users.length).toBeGreaterThan(0)
    const testUser = users.find((u) => u.id === testUserId)
    expect(testUser).toBeDefined()
    expect(testUser?.firstName).toBe('Filter')
    expect(testUser?.lastName).toBe('Test')
  })
})
