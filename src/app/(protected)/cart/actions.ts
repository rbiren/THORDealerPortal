'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SCHEMAS
// ============================================================================

const addItemSchema = z.object({
  dealerId: z.string().min(1, 'Dealer ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

const updateItemSchema = z.object({
  cartId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().min(0),
})

const saveCartSchema = z.object({
  cartId: z.string().min(1),
  name: z.string().min(1, 'Cart name is required').max(100),
})

// ============================================================================
// TYPES
// ============================================================================

export type CartItemData = {
  productId: string
  sku: string
  name: string
  price: number
  quantity: number
  maxQuantity: number
  imageUrl: string | null
}

export type CartData = {
  id: string
  dealerId: string
  items: CartItemData[]
  subtotal: number
  itemCount: number
  updatedAt: Date
}

export type SavedCartSummary = {
  id: string
  name: string
  itemCount: number
  subtotal: number
  createdAt: Date
  updatedAt: Date
}

type ActionResult<T = void> = {
  success: boolean
  message: string
  data?: T
}

// ============================================================================
// GET ACTIVE CART
// ============================================================================

export async function getActiveCart(dealerId: string): Promise<CartData | null> {
  const cart = await prisma.cart.findFirst({
    where: {
      dealerId,
      isSaved: false,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
              inventory: {
                select: { quantity: true, reserved: true },
              },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return null
  }

  type CartItemQueryResult = {
    productId: string
    quantity: number
    product: {
      sku: string
      name: string
      price: number
      images: Array<{ url: string }>
      inventory: Array<{ quantity: number; reserved: number }>
    }
  }

  const items: CartItemData[] = cart.items.map((item: CartItemQueryResult) => {
    const totalStock = item.product.inventory.reduce(
      (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
      0
    )

    return {
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      maxQuantity: totalStock,
      imageUrl: item.product.images[0]?.url ?? null,
    }
  })

  const subtotal = items.reduce((sum: number, item: CartItemData) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum: number, item: CartItemData) => sum + item.quantity, 0)

  return {
    id: cart.id,
    dealerId: cart.dealerId,
    items,
    subtotal,
    itemCount,
    updatedAt: cart.updatedAt,
  }
}

// ============================================================================
// GET OR CREATE CART
// ============================================================================

export async function getOrCreateCart(dealerId: string, userId?: string): Promise<CartData> {
  let cart = await prisma.cart.findFirst({
    where: {
      dealerId,
      isSaved: false,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
              inventory: {
                select: { quantity: true, reserved: true },
              },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        dealerId,
        userId,
        isSaved: false,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                price: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
                inventory: {
                  select: { quantity: true, reserved: true },
                },
              },
            },
          },
        },
      },
    })
  }

  type CartItemQueryResult2 = {
    productId: string
    quantity: number
    product: {
      sku: string
      name: string
      price: number
      images: Array<{ url: string }>
      inventory: Array<{ quantity: number; reserved: number }>
    }
  }

  const items: CartItemData[] = cart.items.map((item: CartItemQueryResult2) => {
    const totalStock = item.product.inventory.reduce(
      (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
      0
    )

    return {
      productId: item.productId,
      sku: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      maxQuantity: totalStock,
      imageUrl: item.product.images[0]?.url ?? null,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    id: cart.id,
    dealerId: cart.dealerId,
    items,
    subtotal,
    itemCount,
    updatedAt: cart.updatedAt,
  }
}

// ============================================================================
// ADD ITEM TO CART
// ============================================================================

export async function addToCart(
  dealerId: string,
  productId: string,
  quantity: number,
  userId?: string
): Promise<ActionResult<CartData>> {
  try {
    const validated = addItemSchema.safeParse({ dealerId, productId, quantity })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Invalid input',
      }
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: {
          select: { quantity: true, reserved: true },
        },
      },
    })

    if (!product) {
      return { success: false, message: 'Product not found' }
    }

    if (product.status !== 'active') {
      return { success: false, message: 'Product is not available' }
    }

    // Check available stock
    const available = product.inventory.reduce(
      (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
      0
    )

    if (available < quantity) {
      return {
        success: false,
        message: `Only ${available} units available`,
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { dealerId, isSaved: false },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { dealerId, userId, isSaved: false },
      })
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > available) {
        return {
          success: false,
          message: `Cannot add more. Only ${available} units available.`,
        }
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      })
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/cart')

    const updatedCart = await getActiveCart(dealerId)

    return {
      success: true,
      message: 'Added to cart',
      data: updatedCart ?? undefined,
    }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    return { success: false, message: 'Failed to add to cart' }
  }
}

// ============================================================================
// UPDATE CART ITEM QUANTITY
// ============================================================================

export async function updateCartItemQuantity(
  cartId: string,
  productId: string,
  quantity: number
): Promise<ActionResult<CartData>> {
  try {
    const validated = updateItemSchema.safeParse({ cartId, productId, quantity })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Invalid input',
      }
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!cart) {
      return { success: false, message: 'Cart not found' }
    }

    if (quantity <= 0) {
      // Remove item
      await prisma.cartItem.deleteMany({
        where: { cartId, productId },
      })
    } else {
      // Check available stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          inventory: {
            select: { quantity: true, reserved: true },
          },
        },
      })

      if (!product) {
        return { success: false, message: 'Product not found' }
      }

      const available = product.inventory.reduce(
        (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
        0
      )

      if (quantity > available) {
        return {
          success: false,
          message: `Only ${available} units available`,
        }
      }

      await prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId, productId },
        },
        update: { quantity },
        create: { cartId, productId, quantity },
      })
    }

    // Update cart timestamp
    await prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/cart')

    const updatedCart = await getActiveCart(cart.dealerId)

    return {
      success: true,
      message: quantity <= 0 ? 'Item removed' : 'Quantity updated',
      data: updatedCart ?? undefined,
    }
  } catch (error) {
    console.error('Failed to update cart:', error)
    return { success: false, message: 'Failed to update cart' }
  }
}

// ============================================================================
// REMOVE ITEM FROM CART
// ============================================================================

export async function removeFromCart(
  cartId: string,
  productId: string
): Promise<ActionResult<CartData>> {
  return updateCartItemQuantity(cartId, productId, 0)
}

// ============================================================================
// CLEAR CART
// ============================================================================

export async function clearCart(cartId: string): Promise<ActionResult> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!cart) {
      return { success: false, message: 'Cart not found' }
    }

    await prisma.cartItem.deleteMany({
      where: { cartId },
    })

    await prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/cart')

    return { success: true, message: 'Cart cleared' }
  } catch (error) {
    console.error('Failed to clear cart:', error)
    return { success: false, message: 'Failed to clear cart' }
  }
}

// ============================================================================
// SYNC CART FROM CLIENT
// ============================================================================

export async function syncCart(
  dealerId: string,
  clientItems: Array<{ productId: string; quantity: number }>,
  userId?: string
): Promise<ActionResult<CartData>> {
  try {
    // Get or create server cart
    let cart = await prisma.cart.findFirst({
      where: { dealerId, isSaved: false },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { dealerId, userId, isSaved: false },
      })
    }

    // Clear existing items and add synced items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    // Add items from client, validating each
    for (const item of clientItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: {
            select: { quantity: true, reserved: true },
          },
        },
      })

      if (!product || product.status !== 'active') {
        continue // Skip invalid products
      }

      const available = product.inventory.reduce(
        (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
        0
      )

      if (available <= 0) {
        continue // Skip out of stock items
      }

      // Add with capped quantity
      const quantity = Math.min(item.quantity, available)

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          quantity,
        },
      })
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/cart')

    const updatedCart = await getActiveCart(dealerId)

    return {
      success: true,
      message: 'Cart synced',
      data: updatedCart ?? undefined,
    }
  } catch (error) {
    console.error('Failed to sync cart:', error)
    return { success: false, message: 'Failed to sync cart' }
  }
}

// ============================================================================
// SAVE CART
// ============================================================================

export async function saveCurrentCart(
  cartId: string,
  name: string
): Promise<ActionResult<SavedCartSummary>> {
  try {
    const validated = saveCartSchema.safeParse({ cartId, name })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Invalid input',
      }
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    })

    if (!cart) {
      return { success: false, message: 'Cart not found' }
    }

    if (cart.items.length === 0) {
      return { success: false, message: 'Cannot save empty cart' }
    }

    // Create a copy of the cart as saved
    const savedCart = await prisma.cart.create({
      data: {
        dealerId: cart.dealerId,
        userId: cart.userId,
        name,
        isSaved: true,
        items: {
          create: cart.items.map((item: { productId: string; quantity: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
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

    const subtotal = savedCart.items.reduce(
      (sum: number, item: { product: { price: number }; quantity: number }) => sum + item.product.price * item.quantity,
      0
    )

    const itemCount = savedCart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)

    return {
      success: true,
      message: 'Cart saved',
      data: {
        id: savedCart.id,
        name: savedCart.name!,
        itemCount,
        subtotal,
        createdAt: savedCart.createdAt,
        updatedAt: savedCart.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to save cart:', error)
    return { success: false, message: 'Failed to save cart' }
  }
}

// ============================================================================
// GET SAVED CARTS
// ============================================================================

export async function getSavedCarts(dealerId: string): Promise<SavedCartSummary[]> {
  const carts = await prisma.cart.findMany({
    where: {
      dealerId,
      isSaved: true,
    },
    include: {
      items: {
        include: {
          product: { select: { price: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  type SavedCartQueryResult = {
    id: string
    name: string | null
    items: Array<{ product: { price: number }; quantity: number }>
    createdAt: Date
    updatedAt: Date
  }

  return carts.map((cart: SavedCartQueryResult) => {
    const subtotal = cart.items.reduce(
      (sum: number, item: { product: { price: number }; quantity: number }) => sum + item.product.price * item.quantity,
      0
    )
    const itemCount = cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)

    return {
      id: cart.id,
      name: cart.name ?? 'Unnamed Cart',
      itemCount,
      subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    }
  })
}

// ============================================================================
// RESTORE SAVED CART
// ============================================================================

export async function restoreSavedCart(
  savedCartId: string,
  dealerId: string
): Promise<ActionResult<CartData>> {
  try {
    const savedCart = await prisma.cart.findUnique({
      where: { id: savedCartId },
      include: { items: true },
    })

    if (!savedCart || !savedCart.isSaved) {
      return { success: false, message: 'Saved cart not found' }
    }

    if (savedCart.dealerId !== dealerId) {
      return { success: false, message: 'Access denied' }
    }

    // Get or create active cart
    let activeCart = await prisma.cart.findFirst({
      where: { dealerId, isSaved: false },
    })

    if (activeCart) {
      // Clear existing items
      await prisma.cartItem.deleteMany({
        where: { cartId: activeCart.id },
      })
    } else {
      activeCart = await prisma.cart.create({
        data: { dealerId, isSaved: false },
      })
    }

    // Copy items from saved cart, validating availability
    for (const item of savedCart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: {
            select: { quantity: true, reserved: true },
          },
        },
      })

      if (!product || product.status !== 'active') {
        continue
      }

      const available = product.inventory.reduce(
        (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
        0
      )

      if (available <= 0) {
        continue
      }

      const quantity = Math.min(item.quantity, available)

      await prisma.cartItem.create({
        data: {
          cartId: activeCart.id,
          productId: item.productId,
          quantity,
        },
      })
    }

    await prisma.cart.update({
      where: { id: activeCart.id },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/cart')

    const updatedCart = await getActiveCart(dealerId)

    return {
      success: true,
      message: 'Cart restored',
      data: updatedCart ?? undefined,
    }
  } catch (error) {
    console.error('Failed to restore cart:', error)
    return { success: false, message: 'Failed to restore cart' }
  }
}

// ============================================================================
// DELETE SAVED CART
// ============================================================================

export async function deleteSavedCart(
  cartId: string,
  dealerId: string
): Promise<ActionResult> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    })

    if (!cart || !cart.isSaved) {
      return { success: false, message: 'Saved cart not found' }
    }

    if (cart.dealerId !== dealerId) {
      return { success: false, message: 'Access denied' }
    }

    await prisma.cart.delete({
      where: { id: cartId },
    })

    return { success: true, message: 'Saved cart deleted' }
  } catch (error) {
    console.error('Failed to delete saved cart:', error)
    return { success: false, message: 'Failed to delete saved cart' }
  }
}

// ============================================================================
// VALIDATE CART BEFORE CHECKOUT
// ============================================================================

export type CartValidationResult = {
  isValid: boolean
  issues: Array<{
    productId: string
    productName: string
    type: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'unavailable'
    message: string
    currentValue?: number
    requestedValue?: number
  }>
}

export async function validateCart(cartId: string): Promise<CartValidationResult> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              status: true,
              inventory: {
                select: { quantity: true, reserved: true },
              },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return { isValid: false, issues: [] }
  }

  const issues: CartValidationResult['issues'] = []

  for (const item of cart.items) {
    const product = item.product

    // Check if product is still active
    if (product.status !== 'active') {
      issues.push({
        productId: product.id,
        productName: product.name,
        type: 'unavailable',
        message: `${product.name} is no longer available`,
      })
      continue
    }

    // Check stock availability
    const available = product.inventory.reduce(
      (sum: number, inv: { quantity: number; reserved: number }) => sum + inv.quantity - inv.reserved,
      0
    )

    if (available <= 0) {
      issues.push({
        productId: product.id,
        productName: product.name,
        type: 'out_of_stock',
        message: `${product.name} is out of stock`,
        requestedValue: item.quantity,
        currentValue: 0,
      })
    } else if (available < item.quantity) {
      issues.push({
        productId: product.id,
        productName: product.name,
        type: 'insufficient_stock',
        message: `Only ${available} units of ${product.name} available`,
        requestedValue: item.quantity,
        currentValue: available,
      })
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}
