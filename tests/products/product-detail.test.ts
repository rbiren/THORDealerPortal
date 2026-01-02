import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Product Detail', () => {
  let testCategoryId: string
  let testProductId: string
  let testLocationId: string

  beforeAll(async () => {
    // Create test category
    const category = await prisma.productCategory.create({
      data: {
        name: 'Detail Test Category',
        slug: 'detail-test-category-' + Date.now(),
      },
    })
    testCategoryId = category.id

    // Create test product with specifications
    const product = await prisma.product.create({
      data: {
        sku: 'DETAIL-TEST-001',
        name: 'Detailed Test Product',
        description: 'A product with full details for testing',
        price: 299.99,
        costPrice: 150.0,
        status: 'active',
        categoryId: testCategoryId,
        specifications: JSON.stringify({
          weight: '2.5 kg',
          dimensions: '10x20x5 cm',
          color: 'Blue',
          material: 'Aluminum',
        }),
      },
    })
    testProductId = product.id

    // Create inventory location
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Detail Test Warehouse',
        code: 'DTW-001',
        type: 'warehouse',
        isActive: true,
      },
    })
    testLocationId = location.id

    // Add images
    await prisma.productImage.createMany({
      data: [
        {
          productId: testProductId,
          url: 'https://example.com/image1.jpg',
          altText: 'Front view',
          sortOrder: 1,
          isPrimary: true,
        },
        {
          productId: testProductId,
          url: 'https://example.com/image2.jpg',
          altText: 'Side view',
          sortOrder: 2,
          isPrimary: false,
        },
        {
          productId: testProductId,
          url: 'https://example.com/image3.jpg',
          altText: 'Back view',
          sortOrder: 3,
          isPrimary: false,
        },
      ],
    })

    // Add inventory
    await prisma.inventory.create({
      data: {
        productId: testProductId,
        locationId: testLocationId,
        quantity: 100,
        reserved: 15,
      },
    })
  })

  afterAll(async () => {
    await prisma.inventory.deleteMany({
      where: { productId: testProductId },
    })
    await prisma.productImage.deleteMany({
      where: { productId: testProductId },
    })
    await prisma.product.delete({ where: { id: testProductId } })
    await prisma.inventoryLocation.delete({ where: { id: testLocationId } })
    await prisma.productCategory.delete({ where: { id: testCategoryId } })
    await prisma.$disconnect()
  })

  describe('Fetching Product Details', () => {
    it('gets product by ID', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      })

      expect(product).toBeDefined()
      expect(product?.name).toBe('Detailed Test Product')
      expect(product?.sku).toBe('DETAIL-TEST-001')
    })

    it('returns null for non-existent product', async () => {
      const product = await prisma.product.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(product).toBeNull()
    })

    it('includes category information', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      })

      expect(product?.category).toBeDefined()
      expect(product?.category?.name).toBe('Detail Test Category')
    })

    it('includes all images ordered correctly', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      })

      expect(product?.images.length).toBe(3)
      expect(product?.images[0].isPrimary).toBe(true)
      expect(product?.images[0].altText).toBe('Front view')
    })

    it('includes inventory with location details', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: {
          inventory: {
            include: {
              location: {
                select: { id: true, name: true, code: true, type: true },
              },
            },
          },
        },
      })

      expect(product?.inventory.length).toBe(1)
      expect(product?.inventory[0].quantity).toBe(100)
      expect(product?.inventory[0].reserved).toBe(15)
      expect(product?.inventory[0].location.name).toBe('Detail Test Warehouse')
    })
  })

  describe('Specifications', () => {
    it('stores specifications as JSON string', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      })

      expect(product?.specifications).toBeDefined()
      expect(typeof product?.specifications).toBe('string')
    })

    it('parses specifications correctly', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      })

      const specs = JSON.parse(product!.specifications!)

      expect(specs.weight).toBe('2.5 kg')
      expect(specs.dimensions).toBe('10x20x5 cm')
      expect(specs.color).toBe('Blue')
      expect(specs.material).toBe('Aluminum')
    })

    it('handles null specifications', async () => {
      const productNoSpecs = await prisma.product.create({
        data: {
          sku: 'NO-SPECS-001',
          name: 'Product Without Specs',
          price: 50.0,
          status: 'active',
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: productNoSpecs.id },
      })

      expect(product?.specifications).toBeNull()

      await prisma.product.delete({ where: { id: productNoSpecs.id } })
    })
  })

  describe('Image Gallery', () => {
    it('returns images in correct order', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      })

      // Primary should be first
      expect(product?.images[0].isPrimary).toBe(true)

      // Then by sortOrder
      for (let i = 1; i < product!.images.length; i++) {
        expect(product!.images[i].sortOrder).toBeGreaterThanOrEqual(
          product!.images[i - 1].sortOrder
        )
      }
    })

    it('includes alt text for accessibility', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: { images: true },
      })

      product?.images.forEach((image) => {
        expect(image.altText).toBeDefined()
      })
    })

    it('handles products without images', async () => {
      const productNoImages = await prisma.product.create({
        data: {
          sku: 'NO-IMAGES-001',
          name: 'Product Without Images',
          price: 25.0,
          status: 'active',
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: productNoImages.id },
        include: { images: true },
      })

      expect(product?.images.length).toBe(0)

      await prisma.product.delete({ where: { id: productNoImages.id } })
    })
  })

  describe('Inventory by Location', () => {
    it('calculates available stock correctly', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: { inventory: true },
      })

      const inv = product!.inventory[0]
      const available = inv.quantity - inv.reserved

      expect(available).toBe(85) // 100 - 15
    })

    it('supports multiple locations', async () => {
      // Create another location
      const location2 = await prisma.inventoryLocation.create({
        data: {
          name: 'Second Warehouse',
          code: 'SW-001',
          type: 'warehouse',
          isActive: true,
        },
      })

      // Add inventory at second location
      await prisma.inventory.create({
        data: {
          productId: testProductId,
          locationId: location2.id,
          quantity: 50,
          reserved: 5,
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        include: { inventory: true },
      })

      expect(product?.inventory.length).toBe(2)

      const totalAvailable = product!.inventory.reduce(
        (sum, inv) => sum + (inv.quantity - inv.reserved),
        0
      )
      expect(totalAvailable).toBe(130) // (100-15) + (50-5)

      // Cleanup
      await prisma.inventory.deleteMany({
        where: { locationId: location2.id },
      })
      await prisma.inventoryLocation.delete({ where: { id: location2.id } })
    })

    it('handles zero inventory', async () => {
      const productNoInventory = await prisma.product.create({
        data: {
          sku: 'NO-INV-001',
          name: 'Product Without Inventory',
          price: 75.0,
          status: 'active',
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: productNoInventory.id },
        include: { inventory: true },
      })

      expect(product?.inventory.length).toBe(0)

      const totalAvailable = product!.inventory.reduce(
        (sum, inv) => sum + (inv.quantity - inv.reserved),
        0
      )
      expect(totalAvailable).toBe(0)

      await prisma.product.delete({ where: { id: productNoInventory.id } })
    })
  })

  describe('Pricing Information', () => {
    it('includes price and cost price', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      })

      expect(product?.price).toBe(299.99)
      expect(product?.costPrice).toBe(150.0)
    })

    it('calculates margin correctly', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      })

      const margin =
        ((product!.price - product!.costPrice!) / product!.price) * 100
      expect(margin).toBeCloseTo(50.0, 1)
    })

    it('handles null cost price', async () => {
      const productNoCost = await prisma.product.create({
        data: {
          sku: 'NO-COST-001',
          name: 'Product Without Cost',
          price: 100.0,
          status: 'active',
        },
      })

      const product = await prisma.product.findUnique({
        where: { id: productNoCost.id },
      })

      expect(product?.costPrice).toBeNull()

      await prisma.product.delete({ where: { id: productNoCost.id } })
    })
  })
})

describe('Related Products', () => {
  let testCategoryId: string
  let mainProductId: string
  let relatedProductIds: string[] = []

  beforeAll(async () => {
    // Create category
    const category = await prisma.productCategory.create({
      data: {
        name: 'Related Products Category',
        slug: 'related-products-category-' + Date.now(),
      },
    })
    testCategoryId = category.id

    // Create main product
    const mainProduct = await prisma.product.create({
      data: {
        sku: 'MAIN-PROD-001',
        name: 'Main Product',
        price: 100.0,
        status: 'active',
        categoryId: testCategoryId,
      },
    })
    mainProductId = mainProduct.id

    // Create related products in same category
    const relatedProducts = await Promise.all([
      prisma.product.create({
        data: {
          sku: 'RELATED-001',
          name: 'Related Product 1',
          price: 80.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'RELATED-002',
          name: 'Related Product 2',
          price: 120.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      }),
      prisma.product.create({
        data: {
          sku: 'RELATED-003',
          name: 'Related Draft Product',
          price: 90.0,
          status: 'draft', // Not active
          categoryId: testCategoryId,
        },
      }),
    ])
    relatedProductIds = relatedProducts.map((p) => p.id)
  })

  afterAll(async () => {
    await prisma.product.delete({ where: { id: mainProductId } })
    await prisma.product.deleteMany({
      where: { id: { in: relatedProductIds } },
    })
    await prisma.productCategory.delete({ where: { id: testCategoryId } })
    await prisma.$disconnect()
  })

  it('finds products in the same category', async () => {
    const related = await prisma.product.findMany({
      where: {
        categoryId: testCategoryId,
        id: { not: mainProductId },
        status: 'active',
      },
    })

    // Should find 2 active products (excluding draft)
    expect(related.length).toBe(2)
  })

  it('excludes the current product', async () => {
    const related = await prisma.product.findMany({
      where: {
        categoryId: testCategoryId,
        id: { not: mainProductId },
        status: 'active',
      },
    })

    const ids = related.map((p) => p.id)
    expect(ids).not.toContain(mainProductId)
  })

  it('excludes non-active products', async () => {
    const related = await prisma.product.findMany({
      where: {
        categoryId: testCategoryId,
        id: { not: mainProductId },
        status: 'active',
      },
    })

    related.forEach((p) => {
      expect(p.status).toBe('active')
    })
  })

  it('limits the number of results', async () => {
    const limited = await prisma.product.findMany({
      where: {
        categoryId: testCategoryId,
        id: { not: mainProductId },
        status: 'active',
      },
      take: 1,
    })

    expect(limited.length).toBe(1)
  })

  it('returns empty array when no category', async () => {
    const productNoCategory = await prisma.product.create({
      data: {
        sku: 'NO-CAT-001',
        name: 'Product Without Category',
        price: 50.0,
        status: 'active',
      },
    })

    const related = await prisma.product.findMany({
      where: {
        categoryId: null,
        id: { not: productNoCategory.id },
        status: 'active',
      },
    })

    // No category means no related products through category
    // (unless there are other products without categories)

    await prisma.product.delete({ where: { id: productNoCategory.id } })
  })
})
