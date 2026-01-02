import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Product Catalog', () => {
  let testCategoryId: string
  let testProductIds: string[] = []
  let testLocationId: string

  beforeAll(async () => {
    // Create a test category
    const category = await prisma.productCategory.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for testing',
      },
    })
    testCategoryId = category.id

    // Create an inventory location
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Test Warehouse',
        code: 'TEST-WH',
        type: 'warehouse',
        isActive: true,
      },
    })
    testLocationId = location.id

    // Create test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'TEST-PROD-001',
          name: 'Test Product One',
          description: 'First test product',
          categoryId: testCategoryId,
          price: 99.99,
          costPrice: 50.0,
          status: 'active',
        },
      }),
      prisma.product.create({
        data: {
          sku: 'TEST-PROD-002',
          name: 'Test Product Two',
          description: 'Second test product',
          categoryId: testCategoryId,
          price: 149.99,
          costPrice: 75.0,
          status: 'active',
        },
      }),
      prisma.product.create({
        data: {
          sku: 'TEST-PROD-003',
          name: 'Draft Product',
          description: 'A draft product',
          price: 199.99,
          status: 'draft',
        },
      }),
      prisma.product.create({
        data: {
          sku: 'TEST-PROD-004',
          name: 'Discontinued Product',
          description: 'A discontinued product',
          price: 249.99,
          status: 'discontinued',
        },
      }),
      prisma.product.create({
        data: {
          sku: 'TEST-PROD-005',
          name: 'Expensive Product',
          description: 'High price product',
          categoryId: testCategoryId,
          price: 999.99,
          costPrice: 500.0,
          status: 'active',
        },
      }),
    ])
    testProductIds = products.map((p) => p.id)

    // Add inventory for some products
    await prisma.inventory.createMany({
      data: [
        { productId: testProductIds[0], locationId: testLocationId, quantity: 100, reserved: 10 },
        { productId: testProductIds[1], locationId: testLocationId, quantity: 5, reserved: 0 },
        { productId: testProductIds[2], locationId: testLocationId, quantity: 0, reserved: 0 },
        { productId: testProductIds[4], locationId: testLocationId, quantity: 50, reserved: 5 },
      ],
    })

    // Add images for some products
    await prisma.productImage.createMany({
      data: [
        { productId: testProductIds[0], url: 'https://example.com/image1.jpg', isPrimary: true },
        { productId: testProductIds[1], url: 'https://example.com/image2.jpg', isPrimary: true },
      ],
    })
  })

  afterAll(async () => {
    // Clean up in order due to foreign key constraints
    await prisma.inventory.deleteMany({
      where: { locationId: testLocationId },
    })
    await prisma.inventoryLocation.delete({ where: { id: testLocationId } })
    await prisma.productImage.deleteMany({
      where: { productId: { in: testProductIds } },
    })
    await prisma.product.deleteMany({
      where: { id: { in: testProductIds } },
    })
    await prisma.productCategory.delete({ where: { id: testCategoryId } })
    await prisma.$disconnect()
  })

  describe('Product Listing', () => {
    it('lists all products', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
      })

      expect(products.length).toBe(5)
    })

    it('includes category information', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds }, categoryId: testCategoryId },
        include: { category: true },
      })

      expect(products.length).toBeGreaterThan(0)
      products.forEach((p) => {
        expect(p.category).toBeDefined()
        expect(p.category?.name).toBe('Test Category')
      })
    })

    it('includes primary image', async () => {
      const products = await prisma.product.findMany({
        where: { id: testProductIds[0] },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      })

      expect(products[0].images.length).toBe(1)
      expect(products[0].images[0].url).toBe('https://example.com/image1.jpg')
    })

    it('includes inventory information', async () => {
      const products = await prisma.product.findMany({
        where: { id: testProductIds[0] },
        include: {
          inventory: {
            select: { quantity: true, reserved: true },
          },
        },
      })

      expect(products[0].inventory.length).toBe(1)
      expect(products[0].inventory[0].quantity).toBe(100)
      expect(products[0].inventory[0].reserved).toBe(10)
    })
  })

  describe('Search', () => {
    it('searches by product name', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          name: { contains: 'Expensive' },
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].name).toBe('Expensive Product')
    })

    it('searches by SKU', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          sku: { contains: 'TEST-PROD-001' },
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].sku).toBe('TEST-PROD-001')
    })

    it('searches by description', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          description: { contains: 'First' },
        },
      })

      expect(products.length).toBe(1)
    })

    it('searches across multiple fields with OR', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          OR: [
            { name: { contains: 'Draft' } },
            { sku: { contains: '001' } },
          ],
        },
      })

      expect(products.length).toBe(2)
    })
  })

  describe('Filter By Category', () => {
    it('filters by category ID', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          categoryId: testCategoryId,
        },
      })

      expect(products.length).toBe(3)
      products.forEach((p) => {
        expect(p.categoryId).toBe(testCategoryId)
      })
    })

    it('returns products without category when no category filter', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          categoryId: null,
        },
      })

      expect(products.length).toBe(2) // Draft and Discontinued
    })
  })

  describe('Filter By Status', () => {
    it('filters by active status', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'active',
        },
      })

      expect(products.length).toBe(3)
      products.forEach((p) => {
        expect(p.status).toBe('active')
      })
    })

    it('filters by draft status', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'draft',
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].status).toBe('draft')
    })

    it('filters by discontinued status', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          status: 'discontinued',
        },
      })

      expect(products.length).toBe(1)
      expect(products[0].status).toBe('discontinued')
    })
  })

  describe('Filter By Price', () => {
    it('filters by minimum price', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          price: { gte: 200 },
        },
      })

      expect(products.length).toBe(2)
      products.forEach((p) => {
        expect(p.price).toBeGreaterThanOrEqual(200)
      })
    })

    it('filters by maximum price', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          price: { lte: 150 },
        },
      })

      expect(products.length).toBe(2)
      products.forEach((p) => {
        expect(p.price).toBeLessThanOrEqual(150)
      })
    })

    it('filters by price range', async () => {
      const products = await prisma.product.findMany({
        where: {
          id: { in: testProductIds },
          price: { gte: 100, lte: 250 },
        },
      })

      // Products in range: Test Product Two ($149.99), Draft ($199.99), Discontinued ($249.99)
      expect(products.length).toBe(3)
      products.forEach((p) => {
        expect(p.price).toBeGreaterThanOrEqual(100)
        expect(p.price).toBeLessThanOrEqual(250)
      })
    })
  })

  describe('Sorting', () => {
    it('sorts by name ascending', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { name: 'asc' },
      })

      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].name.localeCompare(products[i].name)).toBeLessThanOrEqual(0)
      }
    })

    it('sorts by name descending', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { name: 'desc' },
      })

      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].name.localeCompare(products[i].name)).toBeGreaterThanOrEqual(0)
      }
    })

    it('sorts by price ascending', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { price: 'asc' },
      })

      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].price).toBeLessThanOrEqual(products[i].price)
      }
    })

    it('sorts by price descending', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { price: 'desc' },
      })

      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].price).toBeGreaterThanOrEqual(products[i].price)
      }
    })

    it('sorts by creation date', async () => {
      const products = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { createdAt: 'desc' },
      })

      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          products[i].createdAt.getTime()
        )
      }
    })
  })

  describe('Pagination', () => {
    it('supports skip and take', async () => {
      const page1 = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { name: 'asc' },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.product.findMany({
        where: { id: { in: testProductIds } },
        orderBy: { name: 'asc' },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBe(2)
      expect(page2.length).toBe(2)

      // No overlap
      const page1Ids = page1.map((p) => p.id)
      page2.forEach((p) => {
        expect(page1Ids).not.toContain(p.id)
      })
    })

    it('counts total products', async () => {
      const count = await prisma.product.count({
        where: { id: { in: testProductIds } },
      })

      expect(count).toBe(5)
    })

    it('counts with filters', async () => {
      const count = await prisma.product.count({
        where: {
          id: { in: testProductIds },
          status: 'active',
        },
      })

      expect(count).toBe(3)
    })
  })

  describe('Product Statistics', () => {
    it('counts products by status', async () => {
      const [active, draft, discontinued] = await Promise.all([
        prisma.product.count({ where: { id: { in: testProductIds }, status: 'active' } }),
        prisma.product.count({ where: { id: { in: testProductIds }, status: 'draft' } }),
        prisma.product.count({ where: { id: { in: testProductIds }, status: 'discontinued' } }),
      ])

      expect(active).toBe(3)
      expect(draft).toBe(1)
      expect(discontinued).toBe(1)
    })

    it('calculates available stock', async () => {
      const inventory = await prisma.inventory.findMany({
        where: { productId: testProductIds[0] },
      })

      const available = inventory.reduce(
        (sum, inv) => sum + (inv.quantity - inv.reserved),
        0
      )

      expect(available).toBe(90) // 100 - 10
    })
  })
})

describe('Product Categories', () => {
  let rootCategoryId: string
  let childCategoryId: string

  beforeAll(async () => {
    // Create hierarchical categories with unique slugs
    const rootCategory = await prisma.productCategory.create({
      data: {
        name: 'Test Electronics',
        slug: 'test-electronics-' + Date.now(),
        description: 'Electronic products for testing',
        sortOrder: 1,
      },
    })
    rootCategoryId = rootCategory.id

    const childCategory = await prisma.productCategory.create({
      data: {
        name: 'Test Computers',
        slug: 'test-computers-' + Date.now(),
        description: 'Computer products for testing',
        parentId: rootCategoryId,
        sortOrder: 1,
      },
    })
    childCategoryId = childCategory.id
  })

  afterAll(async () => {
    if (childCategoryId) {
      await prisma.productCategory.delete({ where: { id: childCategoryId } }).catch(() => {})
    }
    if (rootCategoryId) {
      await prisma.productCategory.delete({ where: { id: rootCategoryId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('gets all categories', async () => {
    const categories = await prisma.productCategory.findMany({
      where: {
        OR: [{ id: rootCategoryId }, { id: childCategoryId }],
      },
    })

    expect(categories.length).toBe(2)
  })

  it('includes parent category', async () => {
    const category = await prisma.productCategory.findUnique({
      where: { id: childCategoryId },
      include: { parent: true },
    })

    expect(category?.parent).toBeDefined()
    expect(category?.parent?.name).toBe('Test Electronics')
  })

  it('includes child categories', async () => {
    const category = await prisma.productCategory.findUnique({
      where: { id: rootCategoryId },
      include: { children: true },
    })

    expect(category?.children.length).toBe(1)
    expect(category?.children[0].name).toBe('Test Computers')
  })

  it('counts products in category', async () => {
    const category = await prisma.productCategory.findUnique({
      where: { id: rootCategoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    expect(category?._count.products).toBeDefined()
  })

  it('gets categories sorted by order', async () => {
    const categories = await prisma.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    expect(categories.length).toBeGreaterThan(0)
  })
})

describe('Product Validation', () => {
  it('requires unique SKU', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'UNIQUE-SKU-TEST',
        name: 'Unique SKU Product',
        price: 10.0,
        status: 'draft',
      },
    })

    await expect(
      prisma.product.create({
        data: {
          sku: 'UNIQUE-SKU-TEST',
          name: 'Duplicate SKU Product',
          price: 20.0,
          status: 'draft',
        },
      })
    ).rejects.toThrow()

    await prisma.product.delete({ where: { id: product.id } })
  })

  it('requires unique category slug', async () => {
    const category = await prisma.productCategory.create({
      data: {
        name: 'Unique Slug Category',
        slug: 'unique-slug-test',
      },
    })

    await expect(
      prisma.productCategory.create({
        data: {
          name: 'Another Category',
          slug: 'unique-slug-test',
        },
      })
    ).rejects.toThrow()

    await prisma.productCategory.delete({ where: { id: category.id } })
  })
})
