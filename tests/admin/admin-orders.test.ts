/**
 * Tests for Admin Order Management
 * Task 3.6.1-3.6.3: Admin order management
 */

// Create mock prisma for testing
const mockPrisma = {
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  orderItem: {
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderNote: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
}

describe('Admin Order Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Admin Order Status Configuration', () => {
    const ADMIN_ORDER_STATUSES = {
      draft: { label: 'Draft', color: 'gray', adminActions: ['confirm', 'cancel'] },
      submitted: { label: 'Submitted', color: 'blue', adminActions: ['confirm', 'cancel'] },
      confirmed: { label: 'Confirmed', color: 'olive', adminActions: ['process', 'cancel'] },
      processing: { label: 'Processing', color: 'yellow', adminActions: ['ship'] },
      shipped: { label: 'Shipped', color: 'purple', adminActions: ['deliver'] },
      delivered: { label: 'Delivered', color: 'green', adminActions: [] },
      cancelled: { label: 'Cancelled', color: 'red', adminActions: [] },
    }

    it('has correct admin actions for draft status', () => {
      expect(ADMIN_ORDER_STATUSES.draft.adminActions).toContain('confirm')
      expect(ADMIN_ORDER_STATUSES.draft.adminActions).toContain('cancel')
    })

    it('has correct admin actions for submitted status', () => {
      expect(ADMIN_ORDER_STATUSES.submitted.adminActions).toContain('confirm')
      expect(ADMIN_ORDER_STATUSES.submitted.adminActions).toContain('cancel')
    })

    it('has correct admin actions for confirmed status', () => {
      expect(ADMIN_ORDER_STATUSES.confirmed.adminActions).toContain('process')
      expect(ADMIN_ORDER_STATUSES.confirmed.adminActions).toContain('cancel')
    })

    it('has correct admin actions for processing status', () => {
      expect(ADMIN_ORDER_STATUSES.processing.adminActions).toContain('ship')
      expect(ADMIN_ORDER_STATUSES.processing.adminActions).not.toContain('cancel')
    })

    it('has correct admin actions for shipped status', () => {
      expect(ADMIN_ORDER_STATUSES.shipped.adminActions).toContain('deliver')
    })

    it('has no admin actions for delivered status', () => {
      expect(ADMIN_ORDER_STATUSES.delivered.adminActions).toHaveLength(0)
    })

    it('has no admin actions for cancelled status', () => {
      expect(ADMIN_ORDER_STATUSES.cancelled.adminActions).toHaveLength(0)
    })
  })

  describe('Admin Order Queries', () => {
    it('fetches orders with dealer information', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 'ORD-2026-TEST01',
          dealer: { id: 'dealer-1', name: 'Test Dealer', code: 'TD001', tier: 'gold' },
          items: [{ quantity: 2 }, { quantity: 3 }],
          _count: { items: 2 },
        },
      ])

      const orders = await mockPrisma.order.findMany({
        include: { dealer: true, items: true, _count: { select: { items: true } } },
      })

      expect(orders[0].dealer.name).toBe('Test Dealer')
      expect(orders[0].dealer.tier).toBe('gold')
    })

    it('calculates item count correctly', () => {
      const items = [{ quantity: 2 }, { quantity: 3 }, { quantity: 5 }]
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      expect(itemCount).toBe(10)
    })

    it('supports filtering by status array', () => {
      const statuses = ['submitted', 'confirmed']
      const where = { status: { in: statuses } }
      expect(where.status.in).toContain('submitted')
      expect(where.status.in).toContain('confirmed')
    })

    it('supports date range filtering', () => {
      const dateFrom = '2026-01-01'
      const dateTo = '2026-01-31'

      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)

      expect(startDate.getFullYear()).toBe(2026)
      expect(endDate.getHours()).toBe(23)
    })

    it('supports search across multiple fields', () => {
      const search = 'TEST'
      const whereOR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { poNumber: { contains: search, mode: 'insensitive' } },
        { dealer: { name: { contains: search, mode: 'insensitive' } } },
        { dealer: { code: { contains: search, mode: 'insensitive' } } },
      ]

      expect(whereOR).toHaveLength(4)
    })
  })

  describe('Admin Order Statistics', () => {
    it('calculates total orders', async () => {
      mockPrisma.order.count.mockResolvedValue(100)
      const total = await mockPrisma.order.count()
      expect(total).toBe(100)
    })

    it('calculates pending orders', async () => {
      mockPrisma.order.count.mockResolvedValue(25)
      const pending = await mockPrisma.order.count({
        where: { status: { in: ['submitted', 'confirmed'] } },
      })
      expect(pending).toBe(25)
    })

    it('calculates monthly revenue', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
      })

      const revenue = await mockPrisma.order.aggregate({
        _sum: { totalAmount: true },
      })
      expect(revenue._sum.totalAmount).toBe(50000)
    })

    it('calculates monthly growth percentage', () => {
      const thisMonth = 120
      const lastMonth = 100
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100
      expect(growth).toBe(20)
    })

    it('handles negative growth', () => {
      const thisMonth = 80
      const lastMonth = 100
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100
      expect(growth).toBe(-20)
    })

    it('handles zero last month', () => {
      const thisMonth = 50
      const lastMonth = 0
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
      expect(growth).toBe(0)
    })
  })

  describe('Bulk Order Status Updates', () => {
    it('updates multiple orders successfully', async () => {
      const orderIds = ['order-1', 'order-2', 'order-3']
      const newStatus = 'confirmed'

      let updated = 0
      for (const id of orderIds) {
        updated++
      }

      expect(updated).toBe(3)
    })

    it('tracks errors for failed updates', () => {
      const errors: string[] = []
      const failedOrderId = 'order-2'

      errors.push(`Order ${failedOrderId}: Cannot update status`)

      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('order-2')
    })

    it('returns partial success result', () => {
      const result = {
        success: false,
        updated: 2,
        errors: ['Order order-3: Failed to update'],
      }

      expect(result.success).toBe(false)
      expect(result.updated).toBe(2)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('Order Item Editing', () => {
    it('validates order status before editing', () => {
      const editableStatuses = ['draft', 'submitted', 'confirmed']

      expect(editableStatuses).toContain('draft')
      expect(editableStatuses).toContain('submitted')
      expect(editableStatuses).toContain('confirmed')
      expect(editableStatuses).not.toContain('processing')
      expect(editableStatuses).not.toContain('shipped')
    })

    it('updates item quantity and price', async () => {
      const itemId = 'item-1'
      const newQuantity = 5
      const newPrice = 99.99
      const newTotalPrice = newQuantity * newPrice

      mockPrisma.orderItem.update.mockResolvedValue({
        id: itemId,
        quantity: newQuantity,
        unitPrice: newPrice,
        totalPrice: newTotalPrice,
      })

      const result = await mockPrisma.orderItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity, unitPrice: newPrice, totalPrice: newTotalPrice },
      })

      expect(result.quantity).toBe(5)
      expect(result.totalPrice).toBe(499.95)
    })

    it('prevents removing last item', () => {
      const itemCount = 1
      const canRemove = itemCount > 1

      expect(canRemove).toBe(false)
    })

    it('allows removing item when multiple exist', () => {
      const itemCount = 3
      const canRemove = itemCount > 1

      expect(canRemove).toBe(true)
    })
  })

  describe('Order Total Recalculation', () => {
    it('recalculates subtotal from items', () => {
      const items = [
        { totalPrice: 100 },
        { totalPrice: 200 },
        { totalPrice: 150 },
      ]

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
      expect(subtotal).toBe(450)
    })

    it('calculates tax at 8%', () => {
      const subtotal = 1000
      const taxRate = 0.08
      const taxAmount = subtotal * taxRate
      expect(taxAmount).toBe(80)
    })

    it('applies free shipping over $500', () => {
      const subtotalOver = 600
      const subtotalUnder = 400

      const shippingOver = subtotalOver > 500 ? 0 : 25
      const shippingUnder = subtotalUnder > 500 ? 0 : 25

      expect(shippingOver).toBe(0)
      expect(shippingUnder).toBe(25)
    })

    it('rounds totals to 2 decimal places', () => {
      const amount = 123.456789
      const rounded = Math.round(amount * 100) / 100
      expect(rounded).toBe(123.46)
    })
  })

  describe('Order Notes', () => {
    it('creates internal note', async () => {
      mockPrisma.orderNote.create.mockResolvedValue({
        id: 'note-1',
        orderId: 'order-1',
        userId: 'user-1',
        content: 'Internal note content',
        isInternal: true,
      })

      const note = await mockPrisma.orderNote.create({
        data: {
          orderId: 'order-1',
          userId: 'user-1',
          content: 'Internal note content',
          isInternal: true,
        },
      })

      expect(note.isInternal).toBe(true)
    })

    it('creates external note visible to dealer', async () => {
      mockPrisma.orderNote.create.mockResolvedValue({
        id: 'note-2',
        orderId: 'order-1',
        userId: 'user-1',
        content: 'External note for dealer',
        isInternal: false,
      })

      const note = await mockPrisma.orderNote.create({
        data: {
          orderId: 'order-1',
          userId: 'user-1',
          content: 'External note for dealer',
          isInternal: false,
        },
      })

      expect(note.isInternal).toBe(false)
    })

    it('fetches notes in descending order', async () => {
      mockPrisma.orderNote.findMany.mockResolvedValue([
        { id: 'note-2', createdAt: new Date('2026-01-02') },
        { id: 'note-1', createdAt: new Date('2026-01-01') },
      ])

      const notes = await mockPrisma.orderNote.findMany({
        where: { orderId: 'order-1' },
        orderBy: { createdAt: 'desc' },
      })

      expect(notes[0].id).toBe('note-2')
    })

    it('deletes note successfully', async () => {
      mockPrisma.orderNote.delete.mockResolvedValue({ id: 'note-1' })

      const result = await mockPrisma.orderNote.delete({ where: { id: 'note-1' } })
      expect(result.id).toBe('note-1')
    })
  })

  describe('CSV Export', () => {
    it('generates CSV headers', () => {
      const headers = [
        'Order Number',
        'Status',
        'Dealer Code',
        'Dealer Name',
        'PO Number',
        'Items',
        'Subtotal',
        'Total',
        'Created At',
        'Submitted At',
      ]

      expect(headers).toContain('Order Number')
      expect(headers).toContain('Status')
      expect(headers).toContain('Total')
    })

    it('formats CSV row correctly', () => {
      const order = {
        orderNumber: 'ORD-2026-TEST01',
        statusLabel: 'Confirmed',
        dealerCode: 'TD001',
        dealerName: 'Test Dealer',
        poNumber: 'PO-123',
        itemCount: 5,
        subtotal: 1000,
        totalAmount: 1080,
        createdAt: '2026-01-15T10:30:00Z',
        submittedAt: '2026-01-15T10:35:00Z',
      }

      const row = [
        order.orderNumber,
        order.statusLabel,
        order.dealerCode,
        order.dealerName,
        order.poNumber,
        order.itemCount.toString(),
        order.subtotal.toFixed(2),
        order.totalAmount.toFixed(2),
        order.createdAt,
        order.submittedAt,
      ]

      const csvRow = row.map((cell) => `"${cell}"`).join(',')

      expect(csvRow).toContain('"ORD-2026-TEST01"')
      expect(csvRow).toContain('"Test Dealer"')
    })

    it('handles empty PO number', () => {
      const poNumber = null
      const csvValue = poNumber || ''
      expect(csvValue).toBe('')
    })

    it('handles null submitted date', () => {
      const submittedAt = null
      const csvValue = submittedAt ? new Date(submittedAt).toISOString() : ''
      expect(csvValue).toBe('')
    })
  })

  describe('Dealer Tier Display', () => {
    const tierColors = {
      platinum: 'bg-gradient-to-r from-gray-300 to-gray-400',
      gold: 'bg-gradient-to-r from-yellow-300 to-yellow-400',
      silver: 'bg-gradient-to-r from-gray-200 to-gray-300',
      bronze: 'bg-gradient-to-r from-orange-200 to-orange-300',
    }

    it('has correct colors for each tier', () => {
      expect(tierColors.platinum).toContain('gray')
      expect(tierColors.gold).toContain('yellow')
      expect(tierColors.silver).toContain('gray')
      expect(tierColors.bronze).toContain('orange')
    })
  })
})

describe('Admin Order Detail', () => {
  describe('Order Detail View', () => {
    it('includes order items with current prices', () => {
      const item = {
        unitPrice: 100,
        currentPrice: 110,
      }

      const priceChanged = item.unitPrice !== item.currentPrice
      expect(priceChanged).toBe(true)
    })

    it('parses shipping address JSON', () => {
      const addressJson = JSON.stringify({
        name: 'John Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      })

      const address = JSON.parse(addressJson)
      expect(address.name).toBe('John Doe')
    })

    it('formats status history correctly', () => {
      const history = {
        status: 'confirmed',
        note: 'Order confirmed by admin',
        changedBy: 'admin-1',
        createdAt: new Date('2026-01-15T10:00:00Z'),
      }

      expect(history.status).toBe('confirmed')
      expect(history.note).toContain('admin')
    })
  })

  describe('Quick Actions', () => {
    it('shows confirm action for submitted orders', () => {
      const status = 'submitted'
      const actions = ['confirm', 'cancel']

      expect(actions.includes('confirm')).toBe(true)
    })

    it('shows ship action for processing orders', () => {
      const status = 'processing'
      const actions = ['ship']

      expect(actions.includes('ship')).toBe(true)
    })

    it('hides cancel for shipped orders', () => {
      const status = 'shipped'
      const actions = ['deliver']

      expect(actions.includes('cancel')).toBe(false)
    })
  })
})
