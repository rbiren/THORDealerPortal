import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Category Navigation', () => {
  let parentCategoryId: string
  let childCategory1Id: string
  let childCategory2Id: string
  let grandchildCategoryId: string
  let productIds: string[] = []

  beforeAll(async () => {
    // Create hierarchical categories
    const parentCategory = await prisma.productCategory.create({
      data: {
        name: 'Electronics',
        slug: 'electronics-nav-' + Date.now(),
        description: 'Electronic devices and accessories',
      },
    })
    parentCategoryId = parentCategory.id

    const childCategory1 = await prisma.productCategory.create({
      data: {
        name: 'Computers',
        slug: 'computers-nav-' + Date.now(),
        parentId: parentCategoryId,
      },
    })
    childCategory1Id = childCategory1.id

    const childCategory2 = await prisma.productCategory.create({
      data: {
        name: 'Phones',
        slug: 'phones-nav-' + Date.now(),
        parentId: parentCategoryId,
      },
    })
    childCategory2Id = childCategory2.id

    const grandchildCategory = await prisma.productCategory.create({
      data: {
        name: 'Laptops',
        slug: 'laptops-nav-' + Date.now(),
        parentId: childCategory1Id,
      },
    })
    grandchildCategoryId = grandchildCategory.id

    // Create products in various categories
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'NAV-ELEC-001',
          name: 'Generic Electronic',
          price: 50.0,
          status: 'active',
          categoryId: parentCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'NAV-COMP-001',
          name: 'Desktop Computer',
          price: 999.0,
          status: 'active',
          categoryId: childCategory1Id,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'NAV-COMP-002',
          name: 'Workstation',
          price: 1999.0,
          status: 'active',
          categoryId: childCategory1Id,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'NAV-PHONE-001',
          name: 'Smartphone',
          price: 799.0,
          status: 'active',
          categoryId: childCategory2Id,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'NAV-LAP-001',
          name: 'Gaming Laptop',
          price: 1499.0,
          status: 'active',
          categoryId: grandchildCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'NAV-LAP-002',
          name: 'Business Laptop',
          price: 1199.0,
          status: 'active',
          categoryId: grandchildCategoryId,
        },
      }),
    ])
    productIds = products.map((p) => p.id)
  })

  afterAll(async () => {
    // Clean up in reverse order of dependencies
    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    })
    await prisma.productCategory.delete({
      where: { id: grandchildCategoryId },
    })
    await prisma.productCategory.delete({
      where: { id: childCategory1Id },
    })
    await prisma.productCategory.delete({
      where: { id: childCategory2Id },
    })
    await prisma.productCategory.delete({
      where: { id: parentCategoryId },
    })
    await prisma.$disconnect()
  })

  describe('Hierarchical Categories', () => {
    it('fetches categories with parent-child relationships', async () => {
      const categories = await prisma.productCategory.findMany({
        where: {
          OR: [
            { id: parentCategoryId },
            { parentId: parentCategoryId },
            { parentId: childCategory1Id },
          ],
        },
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      })

      const parent = categories.find((c) => c.id === parentCategoryId)
      const children = categories.filter((c) => c.parentId === parentCategoryId)
      const grandchildren = categories.filter((c) => c.parentId === childCategory1Id)

      expect(parent).toBeDefined()
      expect(parent?.parentId).toBeNull()
      expect(children.length).toBe(2)
      expect(grandchildren.length).toBe(1)
    })

    it('supports 3 levels of nesting', async () => {
      const grandchild = await prisma.productCategory.findUnique({
        where: { id: grandchildCategoryId },
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      })

      expect(grandchild).toBeDefined()
      expect(grandchild?.parent).toBeDefined()
      expect(grandchild?.parent?.parent).toBeDefined()
      expect(grandchild?.parent?.parent?.id).toBe(parentCategoryId)
    })
  })

  describe('Product Counts', () => {
    it('counts products in a category', async () => {
      const counts = await prisma.productCategory.findMany({
        where: { id: { in: [parentCategoryId, childCategory1Id, childCategory2Id, grandchildCategoryId] } },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      })

      const countMap = new Map(counts.map((c) => [c.id, c._count.products]))

      expect(countMap.get(parentCategoryId)).toBe(1) // Just "Generic Electronic"
      expect(countMap.get(childCategory1Id)).toBe(2) // "Desktop Computer", "Workstation"
      expect(countMap.get(childCategory2Id)).toBe(1) // "Smartphone"
      expect(countMap.get(grandchildCategoryId)).toBe(2) // "Gaming Laptop", "Business Laptop"
    })

    it('calculates total products including children recursively', async () => {
      // For display, we need to show total products in category + all descendants
      const categories = await prisma.productCategory.findMany({
        where: {
          OR: [
            { id: parentCategoryId },
            { parentId: parentCategoryId },
            { parentId: childCategory1Id },
          ],
        },
        select: {
          id: true,
          name: true,
          parentId: true,
          _count: {
            select: { products: true },
          },
        },
      })

      // Helper to calculate total products recursively
      function getTotalProducts(categoryId: string): number {
        const cat = categories.find((c) => c.id === categoryId)
        if (!cat) return 0

        let total = cat._count.products
        const children = categories.filter((c) => c.parentId === categoryId)
        for (const child of children) {
          total += getTotalProducts(child.id)
        }
        return total
      }

      // Electronics: 1 (direct) + 2 (Computers) + 2 (Laptops) + 1 (Phones) = 6
      expect(getTotalProducts(parentCategoryId)).toBe(6)

      // Computers: 2 (direct) + 2 (Laptops) = 4
      expect(getTotalProducts(childCategory1Id)).toBe(4)

      // Phones: 1 (direct)
      expect(getTotalProducts(childCategory2Id)).toBe(1)

      // Laptops: 2 (direct, no children)
      expect(getTotalProducts(grandchildCategoryId)).toBe(2)
    })
  })

  describe('Category Filtering', () => {
    it('filters products by category', async () => {
      const products = await prisma.product.findMany({
        where: {
          categoryId: childCategory1Id,
        },
      })

      expect(products.length).toBe(2)
      expect(products.every((p) => p.categoryId === childCategory1Id)).toBe(true)
    })

    it('finds products in parent category only (not children)', async () => {
      const products = await prisma.product.findMany({
        where: {
          categoryId: parentCategoryId,
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('Generic Electronic')
    })

    it('can filter to include all descendants', async () => {
      // Get all category IDs in the hierarchy
      const allCategoryIds = [
        parentCategoryId,
        childCategory1Id,
        childCategory2Id,
        grandchildCategoryId,
      ]

      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: allCategoryIds },
        },
      })

      expect(products.length).toBe(6)
    })
  })

  describe('Category Tree Building', () => {
    it('builds a tree structure from flat data', async () => {
      const categories = await prisma.productCategory.findMany({
        where: {
          OR: [
            { id: parentCategoryId },
            { parentId: parentCategoryId },
            { parentId: childCategory1Id },
          ],
        },
        select: {
          id: true,
          name: true,
          parentId: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      })

      type CategoryNode = {
        id: string
        name: string
        parentId: string | null
        _count: { products: number }
        children: CategoryNode[]
      }

      // Build tree
      const categoryMap = new Map<string, CategoryNode>()
      const rootCategories: CategoryNode[] = []

      // First pass: create map with empty children
      categories.forEach((cat) => {
        categoryMap.set(cat.id, { ...cat, children: [] })
      })

      // Second pass: build tree
      categories.forEach((cat) => {
        const node = categoryMap.get(cat.id)!
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          categoryMap.get(cat.parentId)!.children.push(node)
        } else if (!cat.parentId) {
          rootCategories.push(node)
        }
      })

      // Verify tree structure
      expect(rootCategories.length).toBe(1) // Only Electronics is root
      expect(rootCategories[0].name).toBe('Electronics')
      expect(rootCategories[0].children.length).toBe(2) // Computers and Phones

      const computers = rootCategories[0].children.find((c) => c.name === 'Computers')
      expect(computers).toBeDefined()
      expect(computers!.children.length).toBe(1) // Laptops
      expect(computers!.children[0].name).toBe('Laptops')
    })
  })

  describe('Category Navigation State', () => {
    it('finds ancestors of a category for expand state', async () => {
      // To expand ancestors of Laptops, we need to find the path
      const laptop = await prisma.productCategory.findUnique({
        where: { id: grandchildCategoryId },
        select: { id: true, parentId: true },
      })

      const ancestors: string[] = []
      let currentId = laptop?.parentId

      while (currentId) {
        ancestors.push(currentId)
        const parent = await prisma.productCategory.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        })
        currentId = parent?.parentId ?? null
      }

      // Laptops -> Computers -> Electronics
      expect(ancestors).toContain(childCategory1Id)
      expect(ancestors).toContain(parentCategoryId)
      expect(ancestors.length).toBe(2)
    })

    it('supports sorting by sortOrder', async () => {
      // Update sort orders
      await prisma.productCategory.update({
        where: { id: childCategory2Id },
        data: { sortOrder: 1 },
      })
      await prisma.productCategory.update({
        where: { id: childCategory1Id },
        data: { sortOrder: 2 },
      })

      const children = await prisma.productCategory.findMany({
        where: { parentId: parentCategoryId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, sortOrder: true },
      })

      expect(children[0].name).toBe('Phones') // sortOrder: 1
      expect(children[1].name).toBe('Computers') // sortOrder: 2

      // Reset sort orders
      await prisma.productCategory.updateMany({
        where: { id: { in: [childCategory1Id, childCategory2Id] } },
        data: { sortOrder: 0 },
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles categories without products', async () => {
      const emptyCategory = await prisma.productCategory.create({
        data: {
          name: 'Empty Category',
          slug: 'empty-category-' + Date.now(),
        },
      })

      const category = await prisma.productCategory.findUnique({
        where: { id: emptyCategory.id },
        select: {
          _count: {
            select: { products: true },
          },
        },
      })

      expect(category?._count.products).toBe(0)

      await prisma.productCategory.delete({ where: { id: emptyCategory.id } })
    })

    it('handles orphaned products (no category)', async () => {
      const orphanProduct = await prisma.product.create({
        data: {
          sku: 'ORPHAN-001',
          name: 'Orphan Product',
          price: 10.0,
          status: 'active',
          categoryId: null,
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: orphanProduct.id },
        include: { category: true },
      })

      expect(product?.categoryId).toBeNull()
      expect(product?.category).toBeNull()

      await prisma.product.delete({ where: { id: orphanProduct.id } })
    })

    it('handles deeply nested categories', async () => {
      // Create a 4-level deep structure
      const level1 = await prisma.productCategory.create({
        data: { name: 'Level 1', slug: 'level1-' + Date.now() },
      })
      const level2 = await prisma.productCategory.create({
        data: { name: 'Level 2', slug: 'level2-' + Date.now(), parentId: level1.id },
      })
      const level3 = await prisma.productCategory.create({
        data: { name: 'Level 3', slug: 'level3-' + Date.now(), parentId: level2.id },
      })
      const level4 = await prisma.productCategory.create({
        data: { name: 'Level 4', slug: 'level4-' + Date.now(), parentId: level3.id },
      })

      // Verify the chain
      const deepest = await prisma.productCategory.findUnique({
        where: { id: level4.id },
        include: {
          parent: {
            include: {
              parent: {
                include: {
                  parent: true,
                },
              },
            },
          },
        },
      })

      expect(deepest?.parent?.parent?.parent?.id).toBe(level1.id)

      // Cleanup
      await prisma.productCategory.delete({ where: { id: level4.id } })
      await prisma.productCategory.delete({ where: { id: level3.id } })
      await prisma.productCategory.delete({ where: { id: level2.id } })
      await prisma.productCategory.delete({ where: { id: level1.id } })
    })
  })
})

describe('Category Actions', () => {
  let testCategoryId: string

  beforeAll(async () => {
    const category = await prisma.productCategory.create({
      data: {
        name: 'Action Test Category',
        slug: 'action-test-' + Date.now(),
      },
    })
    testCategoryId = category.id
  })

  afterAll(async () => {
    await prisma.productCategory.delete({
      where: { id: testCategoryId },
    })
    await prisma.$disconnect()
  })

  it('fetches all root categories', async () => {
    const rootCategories = await prisma.productCategory.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    expect(rootCategories.length).toBeGreaterThan(0)
    expect(rootCategories.some((c) => c.id === testCategoryId)).toBe(true)
  })

  it('fetches category with children', async () => {
    const child1 = await prisma.productCategory.create({
      data: {
        name: 'Child Action 1',
        slug: 'child-action-1-' + Date.now(),
        parentId: testCategoryId,
      },
    })
    const child2 = await prisma.productCategory.create({
      data: {
        name: 'Child Action 2',
        slug: 'child-action-2-' + Date.now(),
        parentId: testCategoryId,
      },
    })

    const categoryWithChildren = await prisma.productCategory.findUnique({
      where: { id: testCategoryId },
      include: {
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    expect(categoryWithChildren?.children.length).toBe(2)

    // Cleanup
    await prisma.productCategory.deleteMany({
      where: { id: { in: [child1.id, child2.id] } },
    })
  })
})
