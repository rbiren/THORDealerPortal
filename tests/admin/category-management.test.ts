import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Category Management', () => {
  const createdCategoryIds: string[] = []

  afterAll(async () => {
    // Clean up in reverse order (children first, then parents)
    for (let i = createdCategoryIds.length - 1; i >= 0; i--) {
      try {
        await prisma.productCategory.delete({
          where: { id: createdCategoryIds[i] },
        })
      } catch {
        // Ignore - may already be deleted
      }
    }
    await prisma.$disconnect()
  })

  describe('Create Category', () => {
    it('creates a category with required fields', async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Test Category',
          slug: 'test-category-' + Date.now(),
        },
      })
      createdCategoryIds.push(category.id)

      expect(category.id).toBeDefined()
      expect(category.name).toBe('Test Category')
      expect(category.parentId).toBeNull()
    })

    it('creates a category with description', async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Described Category',
          slug: 'described-category-' + Date.now(),
          description: 'A category with a description',
        },
      })
      createdCategoryIds.push(category.id)

      expect(category.description).toBe('A category with a description')
    })

    it('creates a child category', async () => {
      const parent = await prisma.productCategory.create({
        data: {
          name: 'Parent Category',
          slug: 'parent-category-' + Date.now(),
        },
      })
      createdCategoryIds.push(parent.id)

      const child = await prisma.productCategory.create({
        data: {
          name: 'Child Category',
          slug: 'child-category-' + Date.now(),
          parentId: parent.id,
        },
      })
      createdCategoryIds.push(child.id)

      expect(child.parentId).toBe(parent.id)
    })

    it('enforces unique slug constraint', async () => {
      const slug = 'unique-slug-' + Date.now()

      const first = await prisma.productCategory.create({
        data: { name: 'First', slug },
      })
      createdCategoryIds.push(first.id)

      await expect(
        prisma.productCategory.create({
          data: { name: 'Second', slug },
        })
      ).rejects.toThrow()
    })

    it('sets sortOrder', async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Sorted Category',
          slug: 'sorted-category-' + Date.now(),
          sortOrder: 5,
        },
      })
      createdCategoryIds.push(category.id)

      expect(category.sortOrder).toBe(5)
    })
  })

  describe('Read Category', () => {
    let testCategoryId: string
    let childCategoryId: string

    beforeAll(async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Read Test Category',
          slug: 'read-test-category-' + Date.now(),
          description: 'For read tests',
        },
      })
      testCategoryId = category.id
      createdCategoryIds.push(category.id)

      const child = await prisma.productCategory.create({
        data: {
          name: 'Read Test Child',
          slug: 'read-test-child-' + Date.now(),
          parentId: testCategoryId,
        },
      })
      childCategoryId = child.id
      createdCategoryIds.push(child.id)

      // Add a product to the category
      const product = await prisma.product.create({
        data: {
          sku: 'CAT-TEST-001',
          name: 'Category Test Product',
          price: 10.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      })
      // We'll need to clean this up too
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('fetches category by ID', async () => {
      const category = await prisma.productCategory.findUnique({
        where: { id: testCategoryId },
      })

      expect(category).toBeDefined()
      expect(category?.name).toBe('Read Test Category')
    })

    it('fetches category by slug', async () => {
      const category = await prisma.productCategory.findFirst({
        where: { id: testCategoryId },
      })

      const bySlug = await prisma.productCategory.findUnique({
        where: { slug: category!.slug },
      })

      expect(bySlug?.id).toBe(testCategoryId)
    })

    it('includes parent relationship', async () => {
      const child = await prisma.productCategory.findUnique({
        where: { id: childCategoryId },
        include: { parent: true },
      })

      expect(child?.parent).toBeDefined()
      expect(child?.parent?.id).toBe(testCategoryId)
    })

    it('includes children relationship', async () => {
      const parent = await prisma.productCategory.findUnique({
        where: { id: testCategoryId },
        include: { children: true },
      })

      expect(parent?.children.length).toBeGreaterThan(0)
      expect(parent?.children.some((c) => c.id === childCategoryId)).toBe(true)
    })

    it('counts products in category', async () => {
      // Create a product
      const product = await prisma.product.create({
        data: {
          sku: 'CAT-COUNT-001',
          name: 'Count Test Product',
          price: 10.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      })

      const category = await prisma.productCategory.findUnique({
        where: { id: testCategoryId },
        include: {
          _count: { select: { products: true } },
        },
      })

      expect(category?._count.products).toBeGreaterThanOrEqual(1)

      // Cleanup
      await prisma.product.delete({ where: { id: product.id } })
    })
  })

  describe('Update Category', () => {
    let updateCategoryId: string

    beforeAll(async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Update Test Category',
          slug: 'update-test-category-' + Date.now(),
        },
      })
      updateCategoryId = category.id
      createdCategoryIds.push(category.id)
    })

    it('updates category name', async () => {
      const updated = await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { name: 'Updated Category Name' },
      })

      expect(updated.name).toBe('Updated Category Name')
    })

    it('updates category slug', async () => {
      const newSlug = 'updated-slug-' + Date.now()
      const updated = await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { slug: newSlug },
      })

      expect(updated.slug).toBe(newSlug)
    })

    it('updates category description', async () => {
      const updated = await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { description: 'Updated description' },
      })

      expect(updated.description).toBe('Updated description')
    })

    it('updates parent category', async () => {
      const newParent = await prisma.productCategory.create({
        data: {
          name: 'New Parent',
          slug: 'new-parent-' + Date.now(),
        },
      })
      createdCategoryIds.push(newParent.id)

      const updated = await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { parentId: newParent.id },
      })

      expect(updated.parentId).toBe(newParent.id)

      // Reset parent
      await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { parentId: null },
      })
    })

    it('updates sortOrder', async () => {
      const updated = await prisma.productCategory.update({
        where: { id: updateCategoryId },
        data: { sortOrder: 99 },
      })

      expect(updated.sortOrder).toBe(99)
    })
  })

  describe('Delete Category', () => {
    it('deletes an empty category', async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'To Delete',
          slug: 'to-delete-' + Date.now(),
        },
      })

      await prisma.productCategory.delete({ where: { id: category.id } })

      const deleted = await prisma.productCategory.findUnique({
        where: { id: category.id },
      })

      expect(deleted).toBeNull()
    })

    it('counts products before deletion', async () => {
      const category = await prisma.productCategory.create({
        data: {
          name: 'Has Products',
          slug: 'has-products-' + Date.now(),
        },
      })
      createdCategoryIds.push(category.id)

      const product = await prisma.product.create({
        data: {
          sku: 'CAT-DEL-' + Date.now(),
          name: 'Blocking Product',
          price: 10.0,
          status: 'active',
          categoryId: category.id,
        },
      })

      // Verify we can check product count before deletion
      const categoryWithCount = await prisma.productCategory.findUnique({
        where: { id: category.id },
        include: { _count: { select: { products: true } } },
      })

      expect(categoryWithCount?._count.products).toBe(1)

      // Cleanup
      await prisma.product.delete({ where: { id: product.id } })
    })

    it('counts children before deletion', async () => {
      const parent = await prisma.productCategory.create({
        data: {
          name: 'Has Children',
          slug: 'has-children-' + Date.now(),
        },
      })
      createdCategoryIds.push(parent.id)

      const child = await prisma.productCategory.create({
        data: {
          name: 'Child',
          slug: 'child-' + Date.now(),
          parentId: parent.id,
        },
      })
      createdCategoryIds.push(child.id)

      // Verify we can check children count before deletion
      const parentWithCount = await prisma.productCategory.findUnique({
        where: { id: parent.id },
        include: { _count: { select: { children: true } } },
      })

      expect(parentWithCount?._count.children).toBe(1)
    })
  })

  describe('Category Hierarchy', () => {
    let level1Id: string
    let level2Id: string
    let level3Id: string

    beforeAll(async () => {
      const level1 = await prisma.productCategory.create({
        data: {
          name: 'Level 1',
          slug: 'level-1-' + Date.now(),
        },
      })
      level1Id = level1.id
      createdCategoryIds.push(level1.id)

      const level2 = await prisma.productCategory.create({
        data: {
          name: 'Level 2',
          slug: 'level-2-' + Date.now(),
          parentId: level1Id,
        },
      })
      level2Id = level2.id
      createdCategoryIds.push(level2.id)

      const level3 = await prisma.productCategory.create({
        data: {
          name: 'Level 3',
          slug: 'level-3-' + Date.now(),
          parentId: level2Id,
        },
      })
      level3Id = level3.id
      createdCategoryIds.push(level3.id)
    })

    it('supports 3 levels of nesting', async () => {
      const level3 = await prisma.productCategory.findUnique({
        where: { id: level3Id },
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      })

      expect(level3?.parent?.id).toBe(level2Id)
      expect(level3?.parent?.parent?.id).toBe(level1Id)
    })

    it('builds tree structure from flat data', async () => {
      const categories = await prisma.productCategory.findMany({
        where: {
          OR: [
            { id: level1Id },
            { id: level2Id },
            { id: level3Id },
          ],
        },
        orderBy: { name: 'asc' },
      })

      // Build tree
      type TreeNode = { id: string; parentId: string | null; children: TreeNode[] }
      const map = new Map<string, TreeNode>()
      const roots: TreeNode[] = []

      categories.forEach((c) => {
        map.set(c.id, { id: c.id, parentId: c.parentId, children: [] })
      })

      categories.forEach((c) => {
        const node = map.get(c.id)!
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId)!.children.push(node)
        } else if (!c.parentId) {
          roots.push(node)
        }
      })

      expect(roots.length).toBe(1)
      expect(roots[0].children.length).toBe(1)
      expect(roots[0].children[0].children.length).toBe(1)
    })

    it('gets depth of a category', async () => {
      const getDepth = async (id: string): Promise<number> => {
        const cat = await prisma.productCategory.findUnique({
          where: { id },
          select: { parentId: true },
        })
        if (!cat || !cat.parentId) return 1
        return 1 + (await getDepth(cat.parentId))
      }

      expect(await getDepth(level1Id)).toBe(1)
      expect(await getDepth(level2Id)).toBe(2)
      expect(await getDepth(level3Id)).toBe(3)
    })
  })

  describe('Category Sorting', () => {
    it('sorts categories by sortOrder', async () => {
      const cat1 = await prisma.productCategory.create({
        data: { name: 'Sort C', slug: 'sort-c-' + Date.now(), sortOrder: 3 },
      })
      const cat2 = await prisma.productCategory.create({
        data: { name: 'Sort A', slug: 'sort-a-' + Date.now(), sortOrder: 1 },
      })
      const cat3 = await prisma.productCategory.create({
        data: { name: 'Sort B', slug: 'sort-b-' + Date.now(), sortOrder: 2 },
      })
      createdCategoryIds.push(cat1.id, cat2.id, cat3.id)

      const sorted = await prisma.productCategory.findMany({
        where: { id: { in: [cat1.id, cat2.id, cat3.id] } },
        orderBy: { sortOrder: 'asc' },
      })

      expect(sorted[0].name).toBe('Sort A')
      expect(sorted[1].name).toBe('Sort B')
      expect(sorted[2].name).toBe('Sort C')
    })

    it('sorts by name when sortOrder is equal', async () => {
      const cat1 = await prisma.productCategory.create({
        data: { name: 'Zebra', slug: 'zebra-' + Date.now(), sortOrder: 0 },
      })
      const cat2 = await prisma.productCategory.create({
        data: { name: 'Apple', slug: 'apple-' + Date.now(), sortOrder: 0 },
      })
      createdCategoryIds.push(cat1.id, cat2.id)

      const sorted = await prisma.productCategory.findMany({
        where: { id: { in: [cat1.id, cat2.id] } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      })

      expect(sorted[0].name).toBe('Apple')
      expect(sorted[1].name).toBe('Zebra')
    })
  })
})
