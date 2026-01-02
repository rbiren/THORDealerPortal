import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Cart Server Actions', () => {
  let dealerId: string
  let productId: string
  let product2Id: string
  let locationId: string

  beforeAll(async () => {
    // Create test dealer
    const dealer = await prisma.dealer.create({
      data: {
        code: 'CART-DLR-' + Date.now(),
        name: 'Cart Test Dealer',
        status: 'active',
        tier: 'gold',
      },
    })
    dealerId = dealer.id

    // Create test location
    const location = await prisma.inventoryLocation.create({
      data: {
        name: 'Cart Test Warehouse',
        code: 'CART-WH-' + Date.now(),
        type: 'warehouse',
      },
    })
    locationId = location.id

    // Create test products
    const product = await prisma.product.create({
      data: {
        sku: 'CART-PROD-' + Date.now(),
        name: 'Cart Test Product',
        price: 99.99,
        status: 'active',
        inventory: {
          create: {
            locationId,
            quantity: 100,
            reserved: 0,
            lowStockThreshold: 10,
          },
        },
      },
    })
    productId = product.id

    const product2 = await prisma.product.create({
      data: {
        sku: 'CART-PROD2-' + Date.now(),
        name: 'Cart Test Product 2',
        price: 49.99,
        status: 'active',
        inventory: {
          create: {
            locationId,
            quantity: 50,
            reserved: 0,
            lowStockThreshold: 5,
          },
        },
      },
    })
    product2Id = product2.id
  })

  afterAll(async () => {
    // Clean up in order (respecting foreign keys)
    await prisma.cartItem.deleteMany({
      where: { cart: { dealerId } },
    })
    await prisma.cart.deleteMany({ where: { dealerId } })
    await prisma.inventory.deleteMany({ where: { locationId } })
    await prisma.product.deleteMany({
      where: { id: { in: [productId, product2Id] } },
    })
    await prisma.inventoryLocation.delete({ where: { id: locationId } })
    await prisma.dealer.delete({ where: { id: dealerId } })
    await prisma.$disconnect()
  })

  describe('Cart CRUD', () => {
    let cartId: string

    it('creates a new cart', async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
        },
      })

      cartId = cart.id
      expect(cart.id).toBeDefined()
      expect(cart.dealerId).toBe(dealerId)
      expect(cart.isSaved).toBe(false)
    })

    it('adds item to cart', async () => {
      const item = await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          quantity: 2,
        },
      })

      expect(item.cartId).toBe(cartId)
      expect(item.productId).toBe(productId)
      expect(item.quantity).toBe(2)
    })

    it('updates item quantity', async () => {
      await prisma.cartItem.update({
        where: {
          cartId_productId: { cartId, productId },
        },
        data: { quantity: 5 },
      })

      const item = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: { cartId, productId },
        },
      })

      expect(item?.quantity).toBe(5)
    })

    it('removes item from cart', async () => {
      await prisma.cartItem.delete({
        where: {
          cartId_productId: { cartId, productId },
        },
      })

      const items = await prisma.cartItem.findMany({
        where: { cartId },
      })

      expect(items.length).toBe(0)
    })

    it('retrieves cart with items', async () => {
      // Add items
      await prisma.cartItem.createMany({
        data: [
          { cartId, productId, quantity: 3 },
          { cartId, productId: product2Id, quantity: 2 },
        ],
      })

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      expect(cart?.items.length).toBe(2)
      expect(cart?.items[0].product.name).toBeDefined()
    })

    it('clears all items from cart', async () => {
      await prisma.cartItem.deleteMany({
        where: { cartId },
      })

      const items = await prisma.cartItem.findMany({
        where: { cartId },
      })

      expect(items.length).toBe(0)
    })

    it('deletes cart cascading items', async () => {
      // Create a new cart with items
      const newCart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [
              { productId, quantity: 1 },
              { productId: product2Id, quantity: 1 },
            ],
          },
        },
      })

      await prisma.cart.delete({
        where: { id: newCart.id },
      })

      const items = await prisma.cartItem.findMany({
        where: { cartId: newCart.id },
      })

      expect(items.length).toBe(0)
    })
  })

  describe('Saved Carts', () => {
    it('saves cart with name', async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          name: 'My Saved Cart',
          isSaved: true,
          items: {
            create: [{ productId, quantity: 5 }],
          },
        },
      })

      expect(cart.name).toBe('My Saved Cart')
      expect(cart.isSaved).toBe(true)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
    })

    it('retrieves saved carts for dealer', async () => {
      // Create saved carts
      const cart1 = await prisma.cart.create({
        data: {
          dealerId,
          name: 'Saved Cart 1',
          isSaved: true,
          items: { create: [{ productId, quantity: 1 }] },
        },
      })

      const cart2 = await prisma.cart.create({
        data: {
          dealerId,
          name: 'Saved Cart 2',
          isSaved: true,
          items: { create: [{ productId: product2Id, quantity: 2 }] },
        },
      })

      const savedCarts = await prisma.cart.findMany({
        where: { dealerId, isSaved: true },
        orderBy: { updatedAt: 'desc' },
      })

      expect(savedCarts.length).toBeGreaterThanOrEqual(2)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart1.id } })
      await prisma.cart.delete({ where: { id: cart2.id } })
    })

    it('restores saved cart to active cart', async () => {
      const savedCart = await prisma.cart.create({
        data: {
          dealerId,
          name: 'Cart to Restore',
          isSaved: true,
          items: {
            create: [
              { productId, quantity: 3 },
              { productId: product2Id, quantity: 2 },
            ],
          },
        },
        include: { items: true },
      })

      // Create or get active cart
      let activeCart = await prisma.cart.findFirst({
        where: { dealerId, isSaved: false },
      })

      if (!activeCart) {
        activeCart = await prisma.cart.create({
          data: { dealerId, isSaved: false },
        })
      } else {
        await prisma.cartItem.deleteMany({
          where: { cartId: activeCart.id },
        })
      }

      // Copy items
      for (const item of savedCart.items) {
        await prisma.cartItem.create({
          data: {
            cartId: activeCart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        })
      }

      const restoredCart = await prisma.cart.findUnique({
        where: { id: activeCart.id },
        include: { items: true },
      })

      expect(restoredCart?.items.length).toBe(2)

      // Cleanup
      await prisma.cart.delete({ where: { id: savedCart.id } })
    })
  })

  describe('Cart Validation', () => {
    let cartId: string

    beforeAll(async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [{ productId, quantity: 10 }],
          },
        },
      })
      cartId = cart.id
    })

    afterAll(async () => {
      await prisma.cart.delete({ where: { id: cartId } })
    })

    it('validates available stock', async () => {
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventory: true,
                },
              },
            },
          },
        },
      })

      const issues: string[] = []

      for (const item of cart?.items ?? []) {
        const available = item.product.inventory.reduce(
          (sum, inv) => sum + inv.quantity - inv.reserved,
          0
        )

        if (item.quantity > available) {
          issues.push(`${item.product.name}: only ${available} available`)
        }
      }

      // Cart has 10, stock is 100 - should be valid
      expect(issues.length).toBe(0)
    })

    it('detects insufficient stock', async () => {
      // Update cart to request more than available
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId, productId } },
        data: { quantity: 200 }, // More than the 100 available
      })

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventory: true,
                },
              },
            },
          },
        },
      })

      const issues: string[] = []

      for (const item of cart?.items ?? []) {
        const available = item.product.inventory.reduce(
          (sum, inv) => sum + inv.quantity - inv.reserved,
          0
        )

        if (item.quantity > available) {
          issues.push(`${item.product.name}: only ${available} available`)
        }
      }

      expect(issues.length).toBe(1)
      expect(issues[0]).toContain('100 available')

      // Reset
      await prisma.cartItem.update({
        where: { cartId_productId: { cartId, productId } },
        data: { quantity: 10 },
      })
    })

    it('detects unavailable products', async () => {
      // Create a discontinued product
      const discontinuedProduct = await prisma.product.create({
        data: {
          sku: 'DISC-PROD-' + Date.now(),
          name: 'Discontinued Product',
          price: 25.0,
          status: 'discontinued',
        },
      })

      // Add to cart
      await prisma.cartItem.create({
        data: {
          cartId,
          productId: discontinuedProduct.id,
          quantity: 1,
        },
      })

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      const issues: string[] = []

      for (const item of cart?.items ?? []) {
        if (item.product.status !== 'active') {
          issues.push(`${item.product.name} is no longer available`)
        }
      }

      expect(issues.length).toBe(1)
      expect(issues[0]).toContain('no longer available')

      // Cleanup
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId, productId: discontinuedProduct.id } },
      })
      await prisma.product.delete({ where: { id: discontinuedProduct.id } })
    })
  })

  describe('Cart Calculations', () => {
    it('calculates subtotal correctly', async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [
              { productId, quantity: 2 }, // 2 * 99.99 = 199.98
              { productId: product2Id, quantity: 3 }, // 3 * 49.99 = 149.97
            ],
          },
        },
        include: {
          items: {
            include: {
              product: { select: { price: true } },
            },
          },
        },
      })

      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )

      expect(subtotal).toBeCloseTo(349.95, 2)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
    })

    it('calculates item count correctly', async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [
              { productId, quantity: 2 },
              { productId: product2Id, quantity: 3 },
            ],
          },
        },
        include: { items: true },
      })

      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

      expect(itemCount).toBe(5)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
    })
  })

  describe('Cart Sync', () => {
    it('syncs client cart to server', async () => {
      const clientItems = [
        { productId, quantity: 5 },
        { productId: product2Id, quantity: 3 },
      ]

      // Find or create cart
      let cart = await prisma.cart.findFirst({
        where: { dealerId, isSaved: false },
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { dealerId, isSaved: false },
        })
      } else {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        })
      }

      // Sync items
      await prisma.cartItem.createMany({
        data: clientItems.map((item) => ({
          cartId: cart!.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      })

      const syncedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: { items: true },
      })

      expect(syncedCart?.items.length).toBe(2)
      expect(syncedCart?.items.find((i) => i.productId === productId)?.quantity).toBe(5)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
    })

    it('merges carts preferring higher quantity', async () => {
      const localCart = [{ productId, quantity: 3 }]
      const serverCart = [{ productId, quantity: 5 }]

      // Merge: use higher quantity
      const merged = [...serverCart]
      for (const localItem of localCart) {
        const serverIndex = merged.findIndex(
          (i) => i.productId === localItem.productId
        )
        if (serverIndex >= 0) {
          if (localItem.quantity > merged[serverIndex].quantity) {
            merged[serverIndex].quantity = localItem.quantity
          }
        } else {
          merged.push(localItem)
        }
      }

      expect(merged[0].quantity).toBe(5)
    })
  })

  describe('Unique Constraints', () => {
    it('prevents duplicate items in cart', async () => {
      const cart = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [{ productId, quantity: 1 }],
          },
        },
      })

      // Try to add duplicate
      let error: Error | null = null
      try {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId, // Same product
            quantity: 2,
          },
        })
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeDefined()
      expect(error?.message).toContain('Unique constraint')

      // Cleanup
      await prisma.cart.delete({ where: { id: cart.id } })
    })

    it('allows same product in different carts', async () => {
      const cart1 = await prisma.cart.create({
        data: {
          dealerId,
          isSaved: false,
          items: {
            create: [{ productId, quantity: 1 }],
          },
        },
      })

      const cart2 = await prisma.cart.create({
        data: {
          dealerId,
          name: 'Saved Cart',
          isSaved: true,
          items: {
            create: [{ productId, quantity: 2 }],
          },
        },
      })

      expect(cart1.id).not.toBe(cart2.id)

      // Cleanup
      await prisma.cart.delete({ where: { id: cart1.id } })
      await prisma.cart.delete({ where: { id: cart2.id } })
    })
  })
})
