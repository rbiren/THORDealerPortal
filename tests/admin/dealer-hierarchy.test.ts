import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Dealer Hierarchy', () => {
  const testDealerIds: string[] = []

  beforeAll(async () => {
    // Create a hierarchy of dealers for testing
    // Root dealers
    const root1 = await prisma.dealer.create({
      data: {
        code: 'HIERROOT1',
        name: 'Hierarchy Root 1',
        status: 'active',
        tier: 'platinum',
      },
    })
    testDealerIds.push(root1.id)

    const root2 = await prisma.dealer.create({
      data: {
        code: 'HIERROOT2',
        name: 'Hierarchy Root 2',
        status: 'active',
        tier: 'gold',
      },
    })
    testDealerIds.push(root2.id)

    // Level 1 children
    const child1a = await prisma.dealer.create({
      data: {
        code: 'HIERCHILD1A',
        name: 'Child 1A',
        status: 'active',
        tier: 'gold',
        parentDealerId: root1.id,
      },
    })
    testDealerIds.push(child1a.id)

    const child1b = await prisma.dealer.create({
      data: {
        code: 'HIERCHILD1B',
        name: 'Child 1B',
        status: 'pending',
        tier: 'silver',
        parentDealerId: root1.id,
      },
    })
    testDealerIds.push(child1b.id)

    // Level 2 grandchildren
    const grandchild1 = await prisma.dealer.create({
      data: {
        code: 'HIERGRAND1',
        name: 'Grandchild 1',
        status: 'active',
        tier: 'bronze',
        parentDealerId: child1a.id,
      },
    })
    testDealerIds.push(grandchild1.id)
  })

  afterAll(async () => {
    // Clean up in reverse order to handle foreign key constraints
    for (let i = testDealerIds.length - 1; i >= 0; i--) {
      await prisma.dealer.delete({ where: { id: testDealerIds[i] } })
    }
    await prisma.$disconnect()
  })

  describe('Tree Building', () => {
    it('identifies root dealers (no parent)', async () => {
      const rootDealers = await prisma.dealer.findMany({
        where: {
          parentDealerId: null,
          code: { startsWith: 'HIER' },
        },
      })

      expect(rootDealers.length).toBe(2)
      expect(rootDealers.map((d) => d.code)).toContain('HIERROOT1')
      expect(rootDealers.map((d) => d.code)).toContain('HIERROOT2')
    })

    it('finds direct children of a dealer', async () => {
      const root1 = await prisma.dealer.findUnique({
        where: { code: 'HIERROOT1' },
      })

      const children = await prisma.dealer.findMany({
        where: { parentDealerId: root1!.id },
      })

      expect(children.length).toBe(2)
      expect(children.map((d) => d.code)).toContain('HIERCHILD1A')
      expect(children.map((d) => d.code)).toContain('HIERCHILD1B')
    })

    it('finds grandchildren', async () => {
      const child1a = await prisma.dealer.findUnique({
        where: { code: 'HIERCHILD1A' },
      })

      const grandchildren = await prisma.dealer.findMany({
        where: { parentDealerId: child1a!.id },
      })

      expect(grandchildren.length).toBe(1)
      expect(grandchildren[0].code).toBe('HIERGRAND1')
    })

    it('correctly builds hierarchy structure', async () => {
      // Fetch all test dealers
      const allDealers = await prisma.dealer.findMany({
        where: { code: { startsWith: 'HIER' } },
        select: {
          id: true,
          code: true,
          name: true,
          parentDealerId: true,
        },
      })

      // Build tree
      type TreeNode = {
        id: string
        code: string
        name: string
        children: TreeNode[]
      }

      const dealerMap = new Map<string, TreeNode>()
      const rootNodes: TreeNode[] = []

      allDealers.forEach((dealer) => {
        dealerMap.set(dealer.id, { id: dealer.id, code: dealer.code, name: dealer.name, children: [] })
      })

      allDealers.forEach((dealer) => {
        const node = dealerMap.get(dealer.id)!
        if (dealer.parentDealerId) {
          const parent = dealerMap.get(dealer.parentDealerId)
          if (parent) {
            parent.children.push(node)
          }
        } else {
          rootNodes.push(node)
        }
      })

      expect(rootNodes.length).toBe(2)

      const root1 = rootNodes.find((n) => n.code === 'HIERROOT1')
      expect(root1).toBeDefined()
      expect(root1?.children.length).toBe(2)

      const child1a = root1?.children.find((n) => n.code === 'HIERCHILD1A')
      expect(child1a?.children.length).toBe(1)
      expect(child1a?.children[0].code).toBe('HIERGRAND1')
    })
  })

  describe('Ancestor Traversal', () => {
    it('finds all ancestors for a grandchild', async () => {
      const grandchild = await prisma.dealer.findUnique({
        where: { code: 'HIERGRAND1' },
      })

      const ancestors: { id: string; code: string }[] = []
      let currentParentId = grandchild!.parentDealerId

      while (currentParentId) {
        const parent = await prisma.dealer.findUnique({
          where: { id: currentParentId },
          select: { id: true, code: true, parentDealerId: true },
        })
        if (parent) {
          ancestors.unshift({ id: parent.id, code: parent.code })
          currentParentId = parent.parentDealerId
        } else {
          break
        }
      }

      expect(ancestors.length).toBe(2)
      expect(ancestors[0].code).toBe('HIERROOT1')
      expect(ancestors[1].code).toBe('HIERCHILD1A')
    })

    it('returns empty ancestors for root dealer', async () => {
      const root = await prisma.dealer.findUnique({
        where: { code: 'HIERROOT1' },
      })

      const ancestors: { id: string; code: string }[] = []
      let currentParentId = root!.parentDealerId

      while (currentParentId) {
        const parent = await prisma.dealer.findUnique({
          where: { id: currentParentId },
        })
        if (parent) {
          ancestors.unshift({ id: parent.id, code: parent.code })
          currentParentId = parent.parentDealerId
        } else {
          break
        }
      }

      expect(ancestors.length).toBe(0)
    })
  })

  describe('Descendant Traversal', () => {
    it('finds all descendants for root dealer', async () => {
      const root = await prisma.dealer.findUnique({
        where: { code: 'HIERROOT1' },
      })

      async function getDescendantCount(parentId: string): Promise<number> {
        const children = await prisma.dealer.findMany({
          where: { parentDealerId: parentId },
          select: { id: true },
        })

        let count = children.length
        for (const child of children) {
          count += await getDescendantCount(child.id)
        }
        return count
      }

      const descendantCount = await getDescendantCount(root!.id)
      expect(descendantCount).toBe(3) // child1a, child1b, grandchild1
    })

    it('calculates tree depth correctly', async () => {
      async function getMaxDepth(parentId: string | null, currentDepth = 0): Promise<number> {
        const children = await prisma.dealer.findMany({
          where: {
            parentDealerId: parentId,
            code: { startsWith: 'HIER' },
          },
          select: { id: true },
        })

        if (children.length === 0) return currentDepth

        const childDepths = await Promise.all(
          children.map((child) => getMaxDepth(child.id, currentDepth + 1))
        )
        return Math.max(...childDepths)
      }

      const maxDepth = await getMaxDepth(null)
      expect(maxDepth).toBe(3) // root -> child -> grandchild = 3 levels
    })
  })

  describe('Hierarchy Queries with Counts', () => {
    it('includes user and order counts in hierarchy', async () => {
      const dealersWithCounts = await prisma.dealer.findMany({
        where: { code: { startsWith: 'HIER' } },
        select: {
          id: true,
          code: true,
          _count: {
            select: {
              users: true,
              orders: true,
              childDealers: true,
            },
          },
        },
      })

      const root1 = dealersWithCounts.find((d) => d.code === 'HIERROOT1')
      expect(root1?._count.childDealers).toBe(2)

      const grandchild = dealersWithCounts.find((d) => d.code === 'HIERGRAND1')
      expect(grandchild?._count.childDealers).toBe(0)
    })
  })

  describe('Parent Relationship Validation', () => {
    it('prevents circular references', async () => {
      // Get a grandchild
      const grandchild = await prisma.dealer.findUnique({
        where: { code: 'HIERGRAND1' },
      })
      // Get its grandparent
      const root = await prisma.dealer.findUnique({
        where: { code: 'HIERROOT1' },
      })

      // Trying to make root a child of grandchild would create a cycle
      // This is a business logic check, not enforced by DB
      const wouldCreateCycle = async (dealerId: string, newParentId: string): Promise<boolean> => {
        if (dealerId === newParentId) return true

        let currentId: string | null = newParentId
        while (currentId) {
          if (currentId === dealerId) return true
          const parent = await prisma.dealer.findUnique({
            where: { id: currentId },
            select: { parentDealerId: true },
          })
          currentId = parent?.parentDealerId || null
        }
        return false
      }

      const hasCycle = await wouldCreateCycle(root!.id, grandchild!.id)
      expect(hasCycle).toBe(true)
    })

    it('allows valid parent changes', async () => {
      const child1b = await prisma.dealer.findUnique({
        where: { code: 'HIERCHILD1B' },
      })
      const root2 = await prisma.dealer.findUnique({
        where: { code: 'HIERROOT2' },
      })

      // Moving child1b to root2 is valid (no cycle)
      const wouldCreateCycle = async (dealerId: string, newParentId: string): Promise<boolean> => {
        if (dealerId === newParentId) return true

        let currentId: string | null = newParentId
        while (currentId) {
          if (currentId === dealerId) return true
          const parent = await prisma.dealer.findUnique({
            where: { id: currentId },
            select: { parentDealerId: true },
          })
          currentId = parent?.parentDealerId || null
        }
        return false
      }

      const hasCycle = await wouldCreateCycle(child1b!.id, root2!.id)
      expect(hasCycle).toBe(false)
    })
  })
})
