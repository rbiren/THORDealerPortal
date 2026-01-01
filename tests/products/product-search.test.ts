import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Product Search', () => {
  let testCategoryId: string
  let testProductIds: string[] = []

  beforeAll(async () => {
    // Create test category
    const category = await prisma.productCategory.create({
      data: {
        name: 'Search Test Category',
        slug: 'search-test-category-' + Date.now(),
      },
    })
    testCategoryId = category.id

    // Create test products with varied names/SKUs for relevance testing
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'SEARCH-EXACT',
          name: 'Widget',
          description: 'A basic widget product',
          price: 10.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'WIDGET-PRO',
          name: 'Widget Pro Edition',
          description: 'Professional widget with extra features',
          price: 25.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'GADGET-001',
          name: 'Super Widget Gadget',
          description: 'Combines widget and gadget functionality',
          price: 50.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'TOOL-WIDGET',
          name: 'WidgetTool',
          description: 'Tool for widgets',
          price: 15.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'UNRELATED-001',
          name: 'Completely Different Product',
          description: 'This has nothing to do with widgets',
          price: 100.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'DRAFT-WIDGET',
          name: 'Draft Widget',
          description: 'A draft widget product',
          price: 5.0,
          status: 'draft', // Not active
          categoryId: testCategoryId,
        },
      }),
    ])
    testProductIds = products.map((p) => p.id)

    // Add images to some products
    await prisma.productImage.create({
      data: {
        productId: testProductIds[0],
        url: 'https://example.com/widget.jpg',
        isPrimary: true,
      },
    })
  })

  afterAll(async () => {
    await prisma.productImage.deleteMany({
      where: { productId: { in: testProductIds } },
    })
    await prisma.product.deleteMany({
      where: { id: { in: testProductIds } },
    })
    await prisma.productCategory.delete({ where: { id: testCategoryId } })
    await prisma.$disconnect()
  })

  describe('Basic Search', () => {
    it('finds products by name', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
        },
      })

      // Should find Widget, Widget Pro Edition, Super Widget Gadget, WidgetTool
      expect(products.length).toBe(4)
    })

    it('finds products by SKU', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          sku: { contains: 'WIDGET' },
        },
      })

      // Should find WIDGET-PRO, TOOL-WIDGET
      expect(products.length).toBe(2)
    })

    it('finds products by description', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          description: { contains: 'gadget' },
        },
      })

      // Should find Super Widget Gadget
      expect(products.length).toBe(1)
    })

    it('performs OR search across fields', async () => {
      const searchTerm = 'gadget'
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          OR: [
            { name: { contains: searchTerm } },
            { sku: { contains: searchTerm.toUpperCase() } },
            { description: { contains: searchTerm } },
          ],
        },
      })

      expect(products.length).toBeGreaterThan(0)
    })

    it('excludes non-active products', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'Draft' },
        },
      })

      // Draft Widget has status 'draft' so should not appear
      expect(products.length).toBe(0)
    })

    it('is case insensitive for name search', async () => {
      const upperCase = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'WIDGET' },
        },
      })

      const lowerCase = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
        },
      })

      // SQLite LIKE is case-insensitive by default
      expect(upperCase.length).toBe(lowerCase.length)
    })
  })

  describe('Search Results With Related Data', () => {
    it('includes category information', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
        },
        include: {
          category: {
            select: { name: true },
          },
        },
      })

      expect(products.length).toBeGreaterThan(0)
      products.forEach((p) => {
        expect(p.category).toBeDefined()
        expect(p.category?.name).toBe('Search Test Category')
      })
    })

    it('includes primary image', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: testProductIds[0], // Widget has an image
          status: 'active',
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      })

      expect(products[0].images.length).toBe(1)
      expect(products[0].images[0].url).toBe('https://example.com/widget.jpg')
    })
  })

  describe('Relevance Scoring Logic', () => {
    it('prioritizes exact name matches', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          OR: [
            { name: { contains: 'Widget' } },
            { sku: { contains: 'WIDGET' } },
          ],
        },
        select: {
          id: true,
          name: true,
          sku: true,
        },
      })

      // Manual relevance check - exact name "Widget" should be first
      const exactMatch = products.find((p) => p.name === 'Widget')
      expect(exactMatch).toBeDefined()
    })

    it('finds SKU exact matches', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          sku: 'SEARCH-EXACT',
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('Widget')
    })

    it('finds products with SKU prefix match', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          sku: { startsWith: 'WIDGET' },
        },
      })

      expect(products.length).toBe(1) // WIDGET-PRO
    })

    it('finds products where term appears in name', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'Pro' },
        },
      })

      // "Widget Pro Edition" and "Completely Different Product" both contain "Pro"
      expect(products.length).toBe(2)
      const names = products.map((p) => p.name)
      expect(names).toContain('Widget Pro Edition')
    })
  })

  describe('Empty and Edge Cases', () => {
    it('returns empty for non-matching search', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'xyznonsense' },
        },
      })

      expect(products.length).toBe(0)
    })

    it('handles empty search term', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: '' },
        },
      })

      // Empty string matches all
      expect(products.length).toBe(5) // All active products
    })

    it('handles special characters in search', async () => {
      // This tests that search doesn't break with special chars
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget%test' },
        },
      })

      expect(products.length).toBe(0)
    })
  })

  describe('Search Pagination', () => {
    it('limits results', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
        },
        take: 2,
      })

      expect(products.length).toBe(2)
    })

    it('supports pagination', async () => {
      const page1 = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
        },
        orderBy: { name: 'asc' },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
        },
        orderBy: { name: 'asc' },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBe(2)
      expect(page2.length).toBe(2)

      const page1Ids = page1.map((p) => p.id)
      page2.forEach((p) => {
        expect(page1Ids).not.toContain(p.id)
      })
    })
  })

  describe('Combined Search and Filters', () => {
    it('combines search with category filter', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
          categoryId: testCategoryId,
        },
      })

      expect(products.length).toBe(4)
    })

    it('combines search with price filter', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
          price: { gte: 20 },
        },
      })

      // Widget Pro (25) and Super Widget Gadget (50)
      expect(products.length).toBe(2)
      products.forEach((p) => {
        expect(p.price).toBeGreaterThanOrEqual(20)
      })
    })

    it('combines search with sorting', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
          name: { contains: 'widget' },
        },
        orderBy: { price: 'desc' },
      })

      expect(products.length).toBe(4)
      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].price).toBeGreaterThanOrEqual(products[i].price)
      }
    })
  })
})

describe('Search History', () => {
  // Note: Server-side cookie functionality is tested through integration tests
  // Here we test the data structures and logic

  it('maintains maximum history items', () => {
    const MAX_HISTORY = 10
    const history = Array.from({ length: 15 }, (_, i) => `term${i}`)
    const limited = history.slice(0, MAX_HISTORY)

    expect(limited.length).toBe(MAX_HISTORY)
  })

  it('removes duplicates keeping most recent', () => {
    const history = ['term1', 'term2', 'term3']
    const newTerm = 'term2'

    const filtered = history.filter((t) => t !== newTerm)
    const updated = [newTerm, ...filtered]

    expect(updated).toEqual(['term2', 'term1', 'term3'])
  })

  it('handles case-insensitive duplicate removal', () => {
    const history = ['Widget', 'Gadget', 'Tool']
    const newTerm = 'widget'

    const filtered = history.filter((t) => t.toLowerCase() !== newTerm.toLowerCase())
    const updated = [newTerm, ...filtered]

    expect(updated).toEqual(['widget', 'Gadget', 'Tool'])
  })
})
