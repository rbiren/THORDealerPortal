import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Audit Log Service', () => {
  let testUserId: string

  beforeAll(async () => {
    // Create a test user for audit logs
    const user = await prisma.user.create({
      data: {
        email: 'audit-test@example.com',
        firstName: 'Audit',
        lastName: 'Tester',
        passwordHash: 'test-hash',
        role: 'admin',
        status: 'active',
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Clean up audit logs
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { entityType: 'TestEntity' },
        ],
      },
    })
    // Clean up test user
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  describe('Creating Audit Logs', () => {
    it('creates a basic audit log entry', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'create',
          entityType: 'TestEntity',
          entityId: 'test-entity-1',
          newValues: JSON.stringify({ name: 'Test Entity' }),
        },
      })

      expect(log).toBeDefined()
      expect(log.action).toBe('create')
      expect(log.entityType).toBe('TestEntity')
      expect(log.entityId).toBe('test-entity-1')
    })

    it('creates audit log with old and new values', async () => {
      const oldValues = { status: 'pending', tier: 'bronze' }
      const newValues = { status: 'active', tier: 'gold' }

      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'update',
          entityType: 'TestEntity',
          entityId: 'test-entity-2',
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(newValues),
        },
      })

      expect(log.oldValues).toBe(JSON.stringify(oldValues))
      expect(log.newValues).toBe(JSON.stringify(newValues))

      // Parse and verify
      const parsedOld = JSON.parse(log.oldValues!)
      const parsedNew = JSON.parse(log.newValues!)
      expect(parsedOld.status).toBe('pending')
      expect(parsedNew.status).toBe('active')
    })

    it('creates audit log with IP and user agent', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'login',
          entityType: 'Session',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Browser)',
        },
      })

      expect(log.ipAddress).toBe('192.168.1.100')
      expect(log.userAgent).toBe('Mozilla/5.0 (Test Browser)')
    })

    it('creates audit log without user (system actions)', async () => {
      const log = await prisma.auditLog.create({
        data: {
          action: 'create',
          entityType: 'TestEntity',
          entityId: 'system-entity-1',
          newValues: JSON.stringify({ source: 'system' }),
        },
      })

      expect(log.userId).toBeNull()
      expect(log.entityId).toBe('system-entity-1')
    })
  })

  describe('Querying Audit Logs', () => {
    beforeAll(async () => {
      // Create multiple audit logs for query testing
      await prisma.auditLog.createMany({
        data: [
          {
            userId: testUserId,
            action: 'create',
            entityType: 'Dealer',
            entityId: 'dealer-1',
            newValues: JSON.stringify({ name: 'Dealer 1' }),
          },
          {
            userId: testUserId,
            action: 'update',
            entityType: 'Dealer',
            entityId: 'dealer-1',
            oldValues: JSON.stringify({ status: 'pending' }),
            newValues: JSON.stringify({ status: 'active' }),
          },
          {
            userId: testUserId,
            action: 'create',
            entityType: 'User',
            entityId: 'user-1',
            newValues: JSON.stringify({ email: 'new@user.com' }),
          },
          {
            userId: testUserId,
            action: 'delete',
            entityType: 'Dealer',
            entityId: 'dealer-2',
            oldValues: JSON.stringify({ name: 'Deleted Dealer' }),
          },
        ],
      })
    })

    it('queries logs by user ID', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: testUserId },
      })

      expect(logs.length).toBeGreaterThan(0)
      logs.forEach((log) => {
        expect(log.userId).toBe(testUserId)
      })
    })

    it('queries logs by action type', async () => {
      const createLogs = await prisma.auditLog.findMany({
        where: { action: 'create' },
      })

      expect(createLogs.length).toBeGreaterThan(0)
      createLogs.forEach((log) => {
        expect(log.action).toBe('create')
      })
    })

    it('queries logs by entity type', async () => {
      const dealerLogs = await prisma.auditLog.findMany({
        where: { entityType: 'Dealer' },
      })

      expect(dealerLogs.length).toBeGreaterThan(0)
      dealerLogs.forEach((log) => {
        expect(log.entityType).toBe('Dealer')
      })
    })

    it('queries logs by entity ID', async () => {
      const entityLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'Dealer',
          entityId: 'dealer-1',
        },
      })

      expect(entityLogs.length).toBe(2) // create and update
    })

    it('queries logs with date range', async () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const recentLogs = await prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: oneHourAgo,
            lte: now,
          },
        },
      })

      expect(recentLogs.length).toBeGreaterThan(0)
    })

    it('supports pagination', async () => {
      const page1 = await prisma.auditLog.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.auditLog.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBeLessThanOrEqual(2)
      // Ensure no overlap
      const page1Ids = page1.map((l) => l.id)
      page2.forEach((log) => {
        expect(page1Ids).not.toContain(log.id)
      })
    })

    it('orders logs by creation date descending', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(logs[i].createdAt.getTime())
      }
    })
  })

  describe('Audit Log Statistics', () => {
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

  describe('Audit Log with User Relation', () => {
    it('includes user information in query', async () => {
      const logsWithUser = await prisma.auditLog.findMany({
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

      expect(logsWithUser.length).toBeGreaterThan(0)
      expect(logsWithUser[0].user).toBeDefined()
      expect(logsWithUser[0].user?.email).toBe('audit-test@example.com')
    })
  })

  describe('Action Types', () => {
    it('supports all expected action types', async () => {
      const actions = ['create', 'update', 'delete', 'login', 'logout', 'login_failed', 'password_change', 'password_reset']

      for (const action of actions) {
        const log = await prisma.auditLog.create({
          data: {
            userId: testUserId,
            action,
            entityType: 'TestEntity',
            entityId: `test-action-${action}`,
          },
        })
        expect(log.action).toBe(action)
      }
    })
  })

  describe('Entity Types', () => {
    it('supports all expected entity types', async () => {
      const entityTypes = ['User', 'Dealer', 'Order', 'Product', 'Category', 'Session', 'DealerContact', 'DealerAddress']

      for (const entityType of entityTypes) {
        const log = await prisma.auditLog.create({
          data: {
            userId: testUserId,
            action: 'create',
            entityType,
            entityId: `test-${entityType.toLowerCase()}-1`,
          },
        })
        expect(log.entityType).toBe(entityType)
      }
    })
  })

  describe('JSON Value Handling', () => {
    it('handles complex nested objects', async () => {
      const complexValue = {
        name: 'Complex Entity',
        settings: {
          notifications: {
            email: true,
            sms: false,
          },
          preferences: ['option1', 'option2'],
        },
        metadata: {
          createdBy: 'admin',
          tags: ['important', 'urgent'],
        },
      }

      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'create',
          entityType: 'TestEntity',
          entityId: 'complex-entity-1',
          newValues: JSON.stringify(complexValue),
        },
      })

      const parsed = JSON.parse(log.newValues!)
      expect(parsed.settings.notifications.email).toBe(true)
      expect(parsed.metadata.tags).toContain('important')
    })

    it('handles null values in objects', async () => {
      const valueWithNulls = {
        name: 'Entity',
        optionalField: null,
        anotherNull: null,
      }

      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'update',
          entityType: 'TestEntity',
          entityId: 'null-values-entity',
          newValues: JSON.stringify(valueWithNulls),
        },
      })

      const parsed = JSON.parse(log.newValues!)
      expect(parsed.optionalField).toBeNull()
    })

    it('handles empty objects', async () => {
      const log = await prisma.auditLog.create({
        data: {
          userId: testUserId,
          action: 'update',
          entityType: 'TestEntity',
          entityId: 'empty-values',
          oldValues: JSON.stringify({}),
          newValues: JSON.stringify({}),
        },
      })

      const parsedOld = JSON.parse(log.oldValues!)
      const parsedNew = JSON.parse(log.newValues!)
      expect(Object.keys(parsedOld).length).toBe(0)
      expect(Object.keys(parsedNew).length).toBe(0)
    })
  })
})
