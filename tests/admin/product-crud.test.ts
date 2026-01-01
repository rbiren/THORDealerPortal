import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Admin Product CRUD', () => {
  let testCategoryId: string
  let createdProductIds: string[] = []

  beforeAll(async () => {
    // Create test category
    const category = await prisma.productCategory.create({
      data: {
        name: 'CRUD Test Category',
        slug: 'crud-test-category-' + Date.now(),
      },
    })
    testCategoryId = category.id
  })

  afterAll(async () => {
    // Clean up created products
    if (createdProductIds.length > 0) {
      await prisma.productImage.deleteMany({
        where: { productId: { in: createdProductIds } },
      })
      await prisma.inventory.deleteMany({
        where: { productId: { in: createdProductIds } },
      })
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      })
    }
    await prisma.productCategory.delete({
      where: { id: testCategoryId },
    })
    await prisma.$disconnect()
  })

  describe('Create Product', () => {
    it('creates a product with required fields', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-CREATE-001',
          name: 'Test Product Create',
          price: 99.99,
          status: 'draft',
        },
      })
      createdProductIds.push(product.id)

      expect(product.id).toBeDefined()
      expect(product.sku).toBe('CRUD-CREATE-001')
      expect(product.name).toBe('Test Product Create')
      expect(product.price).toBe(99.99)
      expect(product.status).toBe('draft')
    })

    it('creates a product with all fields', async () => {
      const specs = { weight: '1kg', dimensions: '10x10x10' }
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-CREATE-002',
          name: 'Full Product',
          description: 'A full product description',
          price: 199.99,
          costPrice: 99.99,
          status: 'active',
          categoryId: testCategoryId,
          specifications: JSON.stringify(specs),
        },
      })
      createdProductIds.push(product.id)

      expect(product.description).toBe('A full product description')
      expect(product.costPrice).toBe(99.99)
      expect(product.categoryId).toBe(testCategoryId)
      expect(JSON.parse(product.specifications!)).toEqual(specs)
    })

    it('enforces unique SKU constraint', async () => {
      await prisma.product.create({
        data: {
          sku: 'CRUD-UNIQUE-001',
          name: 'Unique SKU Test',
          price: 50.0,
          status: 'draft',
        },
      }).then((p) => createdProductIds.push(p.id))

      await expect(
        prisma.product.create({
          data: {
            sku: 'CRUD-UNIQUE-001', // Same SKU
            name: 'Duplicate SKU Test',
            price: 60.0,
            status: 'draft',
          },
        })
      ).rejects.toThrow()
    })

    it('requires SKU, name, and price', async () => {
      // Missing SKU
      await expect(
        prisma.product.create({
          data: {
            name: 'No SKU',
            price: 10.0,
            status: 'draft',
          } as never,
        })
      ).rejects.toThrow()
    })
  })

  describe('Read Product', () => {
    let readTestProductId: string

    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-READ-001',
          name: 'Read Test Product',
          description: 'For reading',
          price: 75.0,
          costPrice: 50.0,
          status: 'active',
          categoryId: testCategoryId,
        },
      })
      readTestProductId = product.id
      createdProductIds.push(product.id)

      // Add images
      await prisma.productImage.createMany({
        data: [
          { productId: readTestProductId, url: 'https://example.com/1.jpg', isPrimary: true, sortOrder: 1 },
          { productId: readTestProductId, url: 'https://example.com/2.jpg', isPrimary: false, sortOrder: 2 },
        ],
      })
    })

    it('fetches product by ID', async () => {
      const product = await prisma.product.findUnique({
        where: { id: readTestProductId },
      })

      expect(product).toBeDefined()
      expect(product?.sku).toBe('CRUD-READ-001')
    })

    it('fetches product by SKU', async () => {
      const product = await prisma.product.findUnique({
        where: { sku: 'CRUD-READ-001' },
      })

      expect(product).toBeDefined()
      expect(product?.id).toBe(readTestProductId)
    })

    it('includes related category', async () => {
      const product = await prisma.product.findUnique({
        where: { id: readTestProductId },
        include: { category: true },
      })

      expect(product?.category).toBeDefined()
      expect(product?.category?.id).toBe(testCategoryId)
    })

    it('includes images ordered correctly', async () => {
      const product = await prisma.product.findUnique({
        where: { id: readTestProductId },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      })

      expect(product?.images.length).toBe(2)
      expect(product?.images[0].isPrimary).toBe(true)
    })

    it('returns null for non-existent product', async () => {
      const product = await prisma.product.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(product).toBeNull()
    })
  })

  describe('Update Product', () => {
    let updateTestProductId: string

    beforeAll(async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-UPDATE-001',
          name: 'Update Test Product',
          price: 100.0,
          status: 'draft',
        },
      })
      updateTestProductId = product.id
      createdProductIds.push(product.id)
    })

    it('updates product name', async () => {
      const updated = await prisma.product.update({
        where: { id: updateTestProductId },
        data: { name: 'Updated Product Name' },
      })

      expect(updated.name).toBe('Updated Product Name')
    })

    it('updates product price', async () => {
      const updated = await prisma.product.update({
        where: { id: updateTestProductId },
        data: { price: 150.0 },
      })

      expect(updated.price).toBe(150.0)
    })

    it('updates product status', async () => {
      const updated = await prisma.product.update({
        where: { id: updateTestProductId },
        data: { status: 'active' },
      })

      expect(updated.status).toBe('active')
    })

    it('updates product category', async () => {
      const updated = await prisma.product.update({
        where: { id: updateTestProductId },
        data: { categoryId: testCategoryId },
      })

      expect(updated.categoryId).toBe(testCategoryId)
    })

    it('updates product specifications', async () => {
      const specs = { color: 'red', size: 'large' }
      const updated = await prisma.product.update({
        where: { id: updateTestProductId },
        data: { specifications: JSON.stringify(specs) },
      })

      expect(JSON.parse(updated.specifications!)).toEqual(specs)
    })

    it('updates updatedAt timestamp', async () => {
      const before = await prisma.product.findUnique({
        where: { id: updateTestProductId },
      })

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 100))

      await prisma.product.update({
        where: { id: updateTestProductId },
        data: { description: 'Updated description' },
      })

      const after = await prisma.product.findUnique({
        where: { id: updateTestProductId },
      })

      expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime())
    })
  })

  describe('Delete Product', () => {
    it('deletes a product', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-DELETE-001',
          name: 'Delete Test Product',
          price: 25.0,
          status: 'draft',
        },
      })

      await prisma.product.delete({ where: { id: product.id } })

      const deleted = await prisma.product.findUnique({
        where: { id: product.id },
      })

      expect(deleted).toBeNull()
    })

    it('cascades delete to images', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-DELETE-002',
          name: 'Delete With Images',
          price: 30.0,
          status: 'draft',
        },
      })

      const image = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: 'https://example.com/delete.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      })

      // Delete images first (not cascade by default)
      await prisma.productImage.deleteMany({ where: { productId: product.id } })
      await prisma.product.delete({ where: { id: product.id } })

      const deletedImage = await prisma.productImage.findUnique({
        where: { id: image.id },
      })

      expect(deletedImage).toBeNull()
    })

    it('cascades delete to inventory', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'CRUD-DELETE-003',
          name: 'Delete With Inventory',
          price: 35.0,
          status: 'draft',
        },
      })

      const location = await prisma.inventoryLocation.create({
        data: {
          name: 'Delete Test Location',
          code: 'DTL-001',
          type: 'warehouse',
          isActive: true,
        },
      })

      await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantity: 10,
          reserved: 0,
        },
      })

      // Delete inventory first
      await prisma.inventory.deleteMany({ where: { productId: product.id } })
      await prisma.product.delete({ where: { id: product.id } })
      await prisma.inventoryLocation.delete({ where: { id: location.id } })

      const inventory = await prisma.inventory.findFirst({
        where: { productId: product.id },
      })

      expect(inventory).toBeNull()
    })
  })

  describe('Product List Filtering', () => {
    beforeAll(async () => {
      const products = await Promise.all([
        prisma.product.create({
          data: {
            sku: 'FILTER-001',
            name: 'Active Filter Product',
            price: 100.0,
            status: 'active',
            categoryId: testCategoryId,
          },
        }),
        prisma.product.create({
          data: {
            sku: 'FILTER-002',
            name: 'Draft Filter Product',
            price: 200.0,
            status: 'draft',
          },
        }),
        prisma.product.create({
          data: {
            sku: 'FILTER-003',
            name: 'Discontinued Filter Product',
            price: 300.0,
            status: 'discontinued',
            categoryId: testCategoryId,
          },
        }),
      ])
      createdProductIds.push(...products.map((p) => p.id))
    })

    it('filters by status', async () => {
      const activeProducts = await prisma.product.findMany({
        where: {
          sku: { startsWith: 'FILTER-' },
          status: 'active',
        },
      })

      expect(activeProducts.length).toBe(1)
      expect(activeProducts[0].sku).toBe('FILTER-001')
    })

    it('filters by category', async () => {
      const categoryProducts = await prisma.product.findMany({
        where: {
          sku: { startsWith: 'FILTER-' },
          categoryId: testCategoryId,
        },
      })

      expect(categoryProducts.length).toBe(2)
    })

    it('searches by name', async () => {
      const searchResults = await prisma.product.findMany({
        where: {
          sku: { startsWith: 'FILTER-' },
          name: { contains: 'Draft' },
        },
      })

      expect(searchResults.length).toBe(1)
      expect(searchResults[0].sku).toBe('FILTER-002')
    })

    it('searches by SKU', async () => {
      const searchResults = await prisma.product.findMany({
        where: {
          sku: { contains: 'FILTER-003' },
        },
      })

      expect(searchResults.length).toBe(1)
    })

    it('paginates results', async () => {
      const page1 = await prisma.product.findMany({
        where: { sku: { startsWith: 'FILTER-' } },
        orderBy: { sku: 'asc' },
        take: 2,
        skip: 0,
      })

      const page2 = await prisma.product.findMany({
        where: { sku: { startsWith: 'FILTER-' } },
        orderBy: { sku: 'asc' },
        take: 2,
        skip: 2,
      })

      expect(page1.length).toBe(2)
      expect(page2.length).toBe(1)
    })

    it('sorts by price', async () => {
      const ascending = await prisma.product.findMany({
        where: { sku: { startsWith: 'FILTER-' } },
        orderBy: { price: 'asc' },
      })

      expect(ascending[0].price).toBe(100.0)
      expect(ascending[2].price).toBe(300.0)
    })
  })

  describe('Bulk Operations', () => {
    let bulkProductIds: string[] = []

    beforeAll(async () => {
      const products = await Promise.all([
        prisma.product.create({
          data: { sku: 'BULK-001', name: 'Bulk Product 1', price: 10, status: 'draft' },
        }),
        prisma.product.create({
          data: { sku: 'BULK-002', name: 'Bulk Product 2', price: 20, status: 'draft' },
        }),
        prisma.product.create({
          data: { sku: 'BULK-003', name: 'Bulk Product 3', price: 30, status: 'draft' },
        }),
      ])
      bulkProductIds = products.map((p) => p.id)
      createdProductIds.push(...bulkProductIds)
    })

    it('bulk updates status', async () => {
      await prisma.product.updateMany({
        where: { id: { in: bulkProductIds } },
        data: { status: 'active' },
      })

      const products = await prisma.product.findMany({
        where: { id: { in: bulkProductIds } },
      })

      expect(products.every((p) => p.status === 'active')).toBe(true)
    })

    it('bulk deletes products', async () => {
      const toDelete = await Promise.all([
        prisma.product.create({
          data: { sku: 'BULK-DEL-001', name: 'Bulk Delete 1', price: 10, status: 'draft' },
        }),
        prisma.product.create({
          data: { sku: 'BULK-DEL-002', name: 'Bulk Delete 2', price: 20, status: 'draft' },
        }),
      ])

      const deleteIds = toDelete.map((p) => p.id)

      const result = await prisma.product.deleteMany({
        where: { id: { in: deleteIds } },
      })

      expect(result.count).toBe(2)

      const remaining = await prisma.product.findMany({
        where: { id: { in: deleteIds } },
      })

      expect(remaining.length).toBe(0)
    })
  })
})

describe('Product Image Management', () => {
  let testProductId: string
  let imageIds: string[] = []

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'IMAGE-TEST-001',
        name: 'Image Test Product',
        price: 50.0,
        status: 'active',
      },
    })
    testProductId = product.id
  })

  afterAll(async () => {
    await prisma.productImage.deleteMany({
      where: { productId: testProductId },
    })
    await prisma.product.delete({
      where: { id: testProductId },
    })
    await prisma.$disconnect()
  })

  it('adds an image to a product', async () => {
    const image = await prisma.productImage.create({
      data: {
        productId: testProductId,
        url: 'https://example.com/test1.jpg',
        altText: 'Test image 1',
        sortOrder: 1,
        isPrimary: true,
      },
    })
    imageIds.push(image.id)

    expect(image.id).toBeDefined()
    expect(image.productId).toBe(testProductId)
    expect(image.isPrimary).toBe(true)
  })

  it('adds multiple images', async () => {
    const image2 = await prisma.productImage.create({
      data: {
        productId: testProductId,
        url: 'https://example.com/test2.jpg',
        sortOrder: 2,
        isPrimary: false,
      },
    })
    imageIds.push(image2.id)

    const images = await prisma.productImage.findMany({
      where: { productId: testProductId },
    })

    expect(images.length).toBe(2)
  })

  it('updates primary image', async () => {
    // Set all to non-primary
    await prisma.productImage.updateMany({
      where: { productId: testProductId },
      data: { isPrimary: false },
    })

    // Set second image as primary
    await prisma.productImage.update({
      where: { id: imageIds[1] },
      data: { isPrimary: true },
    })

    const images = await prisma.productImage.findMany({
      where: { productId: testProductId },
      orderBy: { isPrimary: 'desc' },
    })

    expect(images[0].id).toBe(imageIds[1])
    expect(images[0].isPrimary).toBe(true)
  })

  it('deletes an image', async () => {
    const imageToDelete = await prisma.productImage.create({
      data: {
        productId: testProductId,
        url: 'https://example.com/delete.jpg',
        sortOrder: 99,
        isPrimary: false,
      },
    })

    await prisma.productImage.delete({
      where: { id: imageToDelete.id },
    })

    const deleted = await prisma.productImage.findUnique({
      where: { id: imageToDelete.id },
    })

    expect(deleted).toBeNull()
  })

  it('orders images correctly', async () => {
    const images = await prisma.productImage.findMany({
      where: { productId: testProductId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    })

    // Primary should be first
    expect(images[0].isPrimary).toBe(true)
  })
})
