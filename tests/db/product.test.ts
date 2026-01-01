import { prisma } from '../setup'

describe('Product Model', () => {
  it('should create a product', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        description: 'A test product',
        price: 99.99,
        costPrice: 50.00,
        status: 'active',
      },
    })

    expect(product.id).toBeDefined()
    expect(product.sku).toBe('TEST-SKU-001')
    expect(product.price).toBe(99.99)
  })

  it('should create product with category', async () => {
    const category = await prisma.productCategory.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
      },
    })

    const product = await prisma.product.create({
      data: {
        sku: 'CAT-PROD-001',
        name: 'Categorized Product',
        price: 149.99,
        categoryId: category.id,
      },
      include: { category: true },
    })

    expect(product.category?.name).toBe('Test Category')
  })

  it('should enforce unique SKU', async () => {
    await prisma.product.create({
      data: {
        sku: 'UNIQUE-SKU',
        name: 'First Product',
        price: 10.00,
      },
    })

    await expect(
      prisma.product.create({
        data: {
          sku: 'UNIQUE-SKU',
          name: 'Second Product',
          price: 20.00,
        },
      })
    ).rejects.toThrow()
  })

  it('should store specifications as JSON', async () => {
    const specs = { weight: '5kg', dimensions: '10x20x30cm', material: 'steel' }

    const product = await prisma.product.create({
      data: {
        sku: 'SPEC-PROD-001',
        name: 'Product with Specs',
        price: 199.99,
        specifications: JSON.stringify(specs),
      },
    })

    const parsed = JSON.parse(product.specifications || '{}')
    expect(parsed.weight).toBe('5kg')
    expect(parsed.material).toBe('steel')
  })
})

describe('Inventory Model', () => {
  it('should create inventory for product at location', async () => {
    const product = await prisma.product.create({
      data: {
        sku: 'INV-PROD-001',
        name: 'Inventory Product',
        price: 50.00,
      },
    })

    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Test Warehouse',
        code: 'WH-TEST',
        type: 'warehouse',
      },
    })

    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: 100,
        reserved: 5,
        lowStockThreshold: 10,
      },
    })

    expect(inventory.quantity).toBe(100)
    expect(inventory.reserved).toBe(5)
  })

  it('should enforce unique product-location combination', async () => {
    const product = await prisma.product.create({
      data: { sku: 'UNIQ-INV', name: 'Unique Inventory', price: 25.00 },
    })

    const location = await prisma.inventoryLocation.create({
      data: { name: 'Unique WH', code: 'WH-UNIQ', type: 'warehouse' },
    })

    await prisma.inventory.create({
      data: { productId: product.id, locationId: location.id, quantity: 50 },
    })

    await expect(
      prisma.inventory.create({
        data: { productId: product.id, locationId: location.id, quantity: 100 },
      })
    ).rejects.toThrow()
  })
})
