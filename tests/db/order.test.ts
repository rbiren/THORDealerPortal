import { prisma } from '../setup'

describe('Order Model', () => {
  let testDealer: Awaited<ReturnType<typeof prisma.dealer.create>>
  let testProduct: Awaited<ReturnType<typeof prisma.product.create>>

  beforeEach(async () => {
    // Clean up any existing test data first
    await prisma.orderItem.deleteMany({ where: { order: { orderNumber: { startsWith: 'ORD-' } } } })
    await prisma.orderStatusHistory.deleteMany({ where: { order: { orderNumber: { startsWith: 'ORD-' } } } })
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'ORD-' } } })
    await prisma.product.deleteMany({ where: { sku: 'ORDER-PROD' } })
    await prisma.dealer.deleteMany({ where: { code: 'ORDER-DLR' } })

    testDealer = await prisma.dealer.create({
      data: {
        code: 'ORDER-DLR',
        name: 'Order Test Dealer',
        status: 'active',
      },
    })

    testProduct = await prisma.product.create({
      data: {
        sku: 'ORDER-PROD',
        name: 'Order Test Product',
        price: 100.00,
      },
    })
  })

  it('should create an order with items', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-TEST-001',
        dealerId: testDealer.id,
        status: 'submitted',
        subtotal: 200.00,
        taxAmount: 16.00,
        shippingAmount: 10.00,
        totalAmount: 226.00,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 100.00,
            totalPrice: 200.00,
          },
        },
      },
      include: { items: true },
    })

    expect(order.orderNumber).toBe('ORD-TEST-001')
    expect(order.items).toHaveLength(1)
    expect(order.items[0].quantity).toBe(2)
    expect(order.totalAmount).toBe(226.00)
  })

  it('should track order status history', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-HIST-001',
        dealerId: testDealer.id,
        status: 'submitted',
        totalAmount: 100.00,
        statusHistory: {
          create: [
            { status: 'draft', note: 'Order created' },
            { status: 'submitted', note: 'Order submitted' },
          ],
        },
      },
      include: { statusHistory: true },
    })

    expect(order.statusHistory).toHaveLength(2)
    expect(order.statusHistory[0].status).toBe('draft')
    expect(order.statusHistory[1].status).toBe('submitted')
  })

  it('should store addresses as JSON', async () => {
    const shippingAddress = {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-ADDR-001',
        dealerId: testDealer.id,
        status: 'draft',
        totalAmount: 50.00,
        shippingAddress: JSON.stringify(shippingAddress),
      },
    })

    const parsed = JSON.parse(order.shippingAddress || '{}')
    expect(parsed.city).toBe('Test City')
    expect(parsed.zipCode).toBe('12345')
  })

  it('should cascade delete order items', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-CASCADE-001',
        dealerId: testDealer.id,
        status: 'draft',
        totalAmount: 100.00,
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 100.00,
            totalPrice: 100.00,
          },
        },
      },
    })

    await prisma.order.delete({ where: { id: order.id } })

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    })

    expect(items).toHaveLength(0)
  })
})
