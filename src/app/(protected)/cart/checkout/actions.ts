'use server'

import { prisma } from '@/lib/prisma'
import {
  createOrder,
  validateOrderItems,
  getOrderByNumber,
  type OrderItemInput,
} from '@/lib/services/order'
import { sendOrderConfirmationEmail } from '@/lib/services/email'

export type SubmitOrderInput = {
  dealerId: string
  cartId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    name: string
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
    phone?: string
  }
  billingAddress?: {
    name: string
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
    phone?: string
  }
  paymentMethod: {
    type: 'credit_terms' | 'credit_card' | 'ach'
    label: string
  }
  poNumber?: string
  notes?: string
}

export type SubmitOrderResult = {
  success: boolean
  orderNumber?: string
  orderId?: string
  error?: string
  validationIssues?: Array<{
    productId: string
    productName: string
    issue: string
  }>
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  try {
    // Convert cart items to order items
    const orderItems: OrderItemInput[] = input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
    }))

    // Validate items before creating order
    const validation = await validateOrderItems(orderItems)
    if (!validation.isValid) {
      return {
        success: false,
        error: 'Some items have issues that need to be resolved',
        validationIssues: validation.issues.map((issue) => ({
          productId: issue.productId,
          productName: issue.productName,
          issue: issue.issue,
        })),
      }
    }

    // Create the order
    const result = await createOrder({
      dealerId: input.dealerId,
      items: orderItems,
      shippingAddress: JSON.stringify(input.shippingAddress),
      billingAddress: input.billingAddress
        ? JSON.stringify(input.billingAddress)
        : undefined,
      poNumber: input.poNumber,
      notes: input.notes,
      paymentMethod: input.paymentMethod.type,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create order',
      }
    }

    // Clear the cart
    if (input.cartId) {
      await prisma.cart.delete({
        where: { id: input.cartId },
      }).catch(() => {
        // Ignore if cart doesn't exist (might already be cleared)
      })
    }

    // Send confirmation email (fire and forget)
    if (result.orderId) {
      sendOrderConfirmationEmail(result.orderId).catch((err) => {
        console.error('Failed to send order confirmation email:', err)
      })
    }

    return {
      success: true,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
    }
  } catch (error) {
    console.error('Submit order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

export async function getOrderDetails(orderNumber: string) {
  const order = await getOrderByNumber(orderNumber)

  if (!order) {
    return null
  }

  // Parse addresses from JSON
  let shippingAddress = null
  let billingAddress = null

  try {
    if (order.shippingAddress) {
      shippingAddress = JSON.parse(order.shippingAddress)
    }
    if (order.billingAddress) {
      billingAddress = JSON.parse(order.billingAddress)
    }
  } catch {
    // Ignore parse errors
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    totalAmount: order.totalAmount,
    poNumber: order.poNumber,
    notes: order.notes,
    shippingAddress,
    billingAddress,
    items: order.items.map((item: {
      id: string
      productId: string
      product: { name: string; sku: string; images?: Array<unknown> }
      quantity: number
      unitPrice: number
      totalPrice: number
    }) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      image: item.product.images?.[0] || null,
    })),
    dealer: order.dealer,
    statusHistory: order.statusHistory.map((h: { status: string; note: string | null; createdAt: Date }) => ({
      status: h.status,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
    submittedAt: order.submittedAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
  }
}

export async function validateCheckout(
  items: Array<{ productId: string; quantity: number; price: number }>
) {
  const orderItems: OrderItemInput[] = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.price,
  }))

  const validation = await validateOrderItems(orderItems)

  return {
    isValid: validation.isValid,
    issues: validation.issues.map((issue) => ({
      productId: issue.productId,
      productName: issue.productName,
      issue: issue.issue,
      type: issue.type,
    })),
  }
}
