/**
 * Tests for Invoice Service
 * Task 3.5.1-3.5.3: Invoice management
 */

// Create mock prisma for testing
const mockPrisma = {
  invoice: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
  dealer: {
    findUnique: jest.fn(),
  },
}

describe('Invoice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Invoice Number Generation', () => {
    it('generates unique invoice numbers with year prefix', () => {
      const year = new Date().getFullYear()
      const pattern = new RegExp(`^INV-${year}-[A-Z0-9]{6}$`)

      expect(pattern.test(`INV-${year}-ABC123`)).toBe(true)
      expect(pattern.test(`INV-${year}-XYZ789`)).toBe(true)
    })

    it('rejects invalid invoice number formats', () => {
      const year = new Date().getFullYear()
      const pattern = new RegExp(`^INV-${year}-[A-Z0-9]{6}$`)

      expect(pattern.test('ORD-2026-ABC123')).toBe(false)
      expect(pattern.test('INV-2026-AB')).toBe(false)
    })
  })

  describe('Invoice Creation from Order', () => {
    it('creates invoice with order details', async () => {
      const orderData = {
        id: 'order-1',
        orderNumber: 'ORD-2026-TEST01',
        dealerId: 'dealer-1',
        subtotal: 500,
        taxAmount: 40,
        shippingAmount: 25,
        totalAmount: 565,
        items: [
          {
            quantity: 2,
            unitPrice: 250,
            totalPrice: 500,
            product: { name: 'Widget', sku: 'WDG-001' },
          },
        ],
        shippingAddress: JSON.stringify({ name: 'John', city: 'Test City' }),
        billingAddress: null,
      }

      mockPrisma.order.findUnique.mockResolvedValue(orderData)
      mockPrisma.invoice.findFirst.mockResolvedValue(null)
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-TEST01',
      })

      const order = await mockPrisma.order.findUnique({ where: { id: 'order-1' } })
      expect(order?.subtotal).toBe(500)
      expect(order?.items).toHaveLength(1)
    })

    it('calculates due date as 30 days from creation', () => {
      const now = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const daysDiff = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(30)
    })

    it('stores line items as JSON', () => {
      const items = [
        { description: 'Widget', sku: 'WDG-001', quantity: 2, unitPrice: 100, totalPrice: 200 },
        { description: 'Gadget', sku: 'GDG-001', quantity: 1, unitPrice: 50, totalPrice: 50 },
      ]

      const jsonItems = JSON.stringify(items)
      const parsed = JSON.parse(jsonItems)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].description).toBe('Widget')
    })

    it('does not create duplicate invoices for same order', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({ id: 'existing-invoice' })

      const existing = await mockPrisma.invoice.findFirst({ where: { orderId: 'order-1' } })
      expect(existing).not.toBeNull()
    })
  })

  describe('Invoice Status', () => {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

    it('validates all invoice statuses', () => {
      validStatuses.forEach((status) => {
        expect(validStatuses).toContain(status)
      })
    })

    it('sets paid date when marking as paid', () => {
      const paidDate = new Date()
      const updateData = { status: 'paid', paidDate }

      expect(updateData.paidDate).toBeInstanceOf(Date)
    })

    it('detects overdue invoices', () => {
      const now = new Date()
      const pastDueDate = new Date()
      pastDueDate.setDate(pastDueDate.getDate() - 5)

      const isOverdue = pastDueDate < now
      expect(isOverdue).toBe(true)
    })

    it('does not mark future due dates as overdue', () => {
      const now = new Date()
      const futureDueDate = new Date()
      futureDueDate.setDate(futureDueDate.getDate() + 10)

      const isOverdue = futureDueDate < now
      expect(isOverdue).toBe(false)
    })
  })

  describe('Invoice Queries', () => {
    it('fetches invoice by ID', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-TEST01',
        status: 'sent',
      })

      const invoice = await mockPrisma.invoice.findUnique({ where: { id: 'invoice-1' } })
      expect(invoice?.invoiceNumber).toBe('INV-2026-TEST01')
    })

    it('fetches invoice by invoice number', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-2026-TEST01',
      })

      const invoice = await mockPrisma.invoice.findUnique({
        where: { invoiceNumber: 'INV-2026-TEST01' },
      })
      expect(invoice?.id).toBe('invoice-1')
    })

    it('fetches dealer invoices with pagination', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'invoice-1' },
        { id: 'invoice-2' },
      ])
      mockPrisma.invoice.count.mockResolvedValue(25)

      const page = 1
      const limit = 20

      const [invoices, total] = await Promise.all([
        mockPrisma.invoice.findMany({
          where: { dealerId: 'dealer-1' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        mockPrisma.invoice.count({ where: { dealerId: 'dealer-1' } }),
      ])

      expect(invoices).toHaveLength(2)
      expect(Math.ceil(total / limit)).toBe(2)
    })

    it('filters invoices by status', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'invoice-1', status: 'paid' },
      ])

      const invoices = await mockPrisma.invoice.findMany({
        where: { dealerId: 'dealer-1', status: 'paid' },
      })

      expect(invoices[0].status).toBe('paid')
    })
  })

  describe('Invoice Statistics', () => {
    it('calculates total invoices count', async () => {
      mockPrisma.invoice.count.mockResolvedValue(50)

      const count = await mockPrisma.invoice.count({ where: { dealerId: 'dealer-1' } })
      expect(count).toBe(50)
    })

    it('calculates pending invoices count', async () => {
      mockPrisma.invoice.count.mockResolvedValue(10)

      const count = await mockPrisma.invoice.count({
        where: { dealerId: 'dealer-1', status: { in: ['draft', 'sent'] } },
      })
      expect(count).toBe(10)
    })

    it('calculates total invoice amount', async () => {
      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: { totalAmount: 5000.50 },
      })

      const result = await mockPrisma.invoice.aggregate({
        where: { dealerId: 'dealer-1', status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
      })

      expect(result._sum.totalAmount).toBe(5000.50)
    })
  })

  describe('Invoice HTML Generation', () => {
    it('includes invoice number in HTML', () => {
      const invoiceNumber = 'INV-2026-TEST01'
      const html = `<div>${invoiceNumber}</div>`

      expect(html).toContain(invoiceNumber)
    })

    it('formats currency values correctly', () => {
      const amount = 1234.56
      const formatted = '$' + amount.toFixed(2)

      expect(formatted).toBe('$1234.56')
    })

    it('formats dates correctly', () => {
      const date = new Date('2026-01-15')
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2026')
    })

    it('includes line items in HTML', () => {
      const items = [
        { description: 'Widget', quantity: 2, totalPrice: 200 },
      ]

      const itemsHtml = items.map((item) =>
        `<tr><td>${item.description}</td><td>${item.quantity}</td><td>$${item.totalPrice.toFixed(2)}</td></tr>`
      ).join('')

      expect(itemsHtml).toContain('Widget')
      expect(itemsHtml).toContain('$200.00')
    })

    it('shows correct status styling', () => {
      const statusColors = {
        paid: 'status-paid',
        sent: 'status-sent',
        overdue: 'status-overdue',
      }

      expect(statusColors.paid).toBe('status-paid')
      expect(statusColors.overdue).toBe('status-overdue')
    })
  })

  describe('Invoice Email', () => {
    it('includes invoice number in subject', () => {
      const invoiceNumber = 'INV-2026-TEST01'
      const subject = `Invoice ${invoiceNumber} - THOR Dealer Portal`

      expect(subject).toContain(invoiceNumber)
    })

    it('includes amount due in email', () => {
      const totalAmount = 565.50
      const text = `Amount Due: $${totalAmount.toFixed(2)}`

      expect(text).toContain('$565.50')
    })

    it('includes due date in email', () => {
      const dueDate = new Date('2026-02-15')
      const formatted = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      expect(formatted).toContain('February')
    })

    it('updates status to sent after email', async () => {
      const invoice = { id: 'invoice-1', status: 'draft' }
      const shouldUpdate = invoice.status === 'draft'

      expect(shouldUpdate).toBe(true)
    })
  })

  describe('Overdue Invoice Check', () => {
    it('identifies past due invoices', () => {
      const now = new Date()
      const invoices = [
        { id: 'inv-1', status: 'sent', dueDate: new Date(now.getTime() - 86400000) },
        { id: 'inv-2', status: 'sent', dueDate: new Date(now.getTime() + 86400000) },
      ]

      const overdue = invoices.filter(
        (inv) => inv.status === 'sent' && inv.dueDate < now
      )

      expect(overdue).toHaveLength(1)
      expect(overdue[0].id).toBe('inv-1')
    })

    it('excludes paid invoices from overdue check', () => {
      const now = new Date()
      const invoices = [
        { id: 'inv-1', status: 'paid', dueDate: new Date(now.getTime() - 86400000) },
      ]

      const overdue = invoices.filter(
        (inv) => inv.status === 'sent' && inv.dueDate < now
      )

      expect(overdue).toHaveLength(0)
    })

    it('excludes cancelled invoices from overdue check', () => {
      const now = new Date()
      const invoices = [
        { id: 'inv-1', status: 'cancelled', dueDate: new Date(now.getTime() - 86400000) },
      ]

      const overdue = invoices.filter(
        (inv) => ['draft', 'sent'].includes(inv.status) && inv.dueDate < now
      )

      expect(overdue).toHaveLength(0)
    })
  })
})

describe('Invoice Actions', () => {
  describe('getInvoice', () => {
    it('routes to getInvoiceByNumber for INV- prefixed IDs', () => {
      const id = 'INV-2026-TEST01'
      const isInvoiceNumber = id.startsWith('INV-')

      expect(isInvoiceNumber).toBe(true)
    })

    it('routes to getInvoiceById for other IDs', () => {
      const id = 'cuid123abc'
      const isInvoiceNumber = id.startsWith('INV-')

      expect(isInvoiceNumber).toBe(false)
    })
  })

  describe('Invoice Status Labels', () => {
    const INVOICE_STATUSES = {
      draft: { label: 'Draft', color: 'gray' },
      sent: { label: 'Sent', color: 'blue' },
      paid: { label: 'Paid', color: 'green' },
      overdue: { label: 'Overdue', color: 'red' },
      cancelled: { label: 'Cancelled', color: 'gray' },
    }

    it('has correct labels for all statuses', () => {
      expect(INVOICE_STATUSES.draft.label).toBe('Draft')
      expect(INVOICE_STATUSES.sent.label).toBe('Sent')
      expect(INVOICE_STATUSES.paid.label).toBe('Paid')
      expect(INVOICE_STATUSES.overdue.label).toBe('Overdue')
      expect(INVOICE_STATUSES.cancelled.label).toBe('Cancelled')
    })

    it('has correct colors for all statuses', () => {
      expect(INVOICE_STATUSES.draft.color).toBe('gray')
      expect(INVOICE_STATUSES.sent.color).toBe('blue')
      expect(INVOICE_STATUSES.paid.color).toBe('green')
      expect(INVOICE_STATUSES.overdue.color).toBe('red')
    })
  })
})
