'use server'

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Invoice status types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export type InvoiceData = {
  id: string
  invoiceNumber: string
  orderId: string
  orderNumber: string
  dealerId: string
  dealerName: string
  dealerCode: string
  status: InvoiceStatus
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  dueDate: string | null
  paidDate: string | null
  items: Array<{
    description: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  billingAddress: {
    name: string
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
  } | null
  shippingAddress: {
    name: string
    street: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
  } | null
  paymentTerms: string
  notes: string | null
  createdAt: string
}

// Generate unique invoice number (e.g., INV-2026-XXXXXX)
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const id = nanoid(6).toUpperCase()
  return `INV-${year}-${id}`
}

// Create invoice from order
export async function createInvoiceFromOrder(
  orderId: string
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
        dealer: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check if invoice already exists for this order
    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId },
    })

    if (existingInvoice) {
      return { success: true, invoiceId: existingInvoice.id }
    }

    // Calculate due date (net 30 by default)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        orderId: order.id,
        dealerId: order.dealerId,
        status: 'sent',
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        dueDate,
        billingAddress: order.billingAddress || order.shippingAddress,
        shippingAddress: order.shippingAddress,
        paymentTerms: 'Net 30',
        items: JSON.stringify(
          order.items.map((item: { product: { name: string; sku: string }; quantity: number; unitPrice: number; totalPrice: number }) => ({
            description: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }))
        ),
      },
    })

    return { success: true, invoiceId: invoice.id }
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    }
  }
}

// Get invoice by ID
export async function getInvoiceById(invoiceId: string): Promise<InvoiceData | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        select: { orderNumber: true },
      },
      dealer: {
        select: { id: true, name: true, code: true },
      },
    },
  })

  if (!invoice) return null

  return formatInvoice(invoice)
}

// Get invoice by invoice number
export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceData | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      order: {
        select: { orderNumber: true },
      },
      dealer: {
        select: { id: true, name: true, code: true },
      },
    },
  })

  if (!invoice) return null

  return formatInvoice(invoice)
}

// Get invoices for a dealer
export async function getDealerInvoices(
  dealerId: string,
  options: {
    status?: InvoiceStatus
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}
) {
  const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const where = {
    dealerId,
    ...(status ? { status } : {}),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true },
        },
        dealer: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    invoices: invoices.map(formatInvoice),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Update invoice status
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = { status }

    if (status === 'paid') {
      updateData.paidDate = new Date()
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update invoice',
    }
  }
}

// Get invoice statistics for dealer
export async function getInvoiceStats(dealerId: string) {
  const [total, pending, overdue, totalAmount] = await Promise.all([
    prisma.invoice.count({ where: { dealerId } }),
    prisma.invoice.count({
      where: { dealerId, status: { in: ['sent', 'draft'] } },
    }),
    prisma.invoice.count({
      where: { dealerId, status: 'overdue' },
    }),
    prisma.invoice.aggregate({
      where: { dealerId, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    totalInvoices: total,
    pendingInvoices: pending,
    overdueInvoices: overdue,
    totalAmount: totalAmount._sum.totalAmount || 0,
  }
}

// Helper to format invoice data
function formatInvoice(invoice: {
  id: string
  invoiceNumber: string
  orderId: string
  order: { orderNumber: string }
  dealerId: string
  dealer: { id: string; name: string; code: string }
  status: string
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  dueDate: Date | null
  paidDate: Date | null
  items: string | null
  billingAddress: string | null
  shippingAddress: string | null
  paymentTerms: string
  notes: string | null
  createdAt: Date
}): InvoiceData {
  let items: InvoiceData['items'] = []
  let billingAddress: InvoiceData['billingAddress'] = null
  let shippingAddress: InvoiceData['shippingAddress'] = null

  try {
    if (invoice.items) {
      items = JSON.parse(invoice.items)
    }
    if (invoice.billingAddress) {
      billingAddress = JSON.parse(invoice.billingAddress)
    }
    if (invoice.shippingAddress) {
      shippingAddress = JSON.parse(invoice.shippingAddress)
    }
  } catch {
    // Ignore parse errors
  }

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: invoice.order.orderNumber,
    dealerId: invoice.dealerId,
    dealerName: invoice.dealer.name,
    dealerCode: invoice.dealer.code,
    status: invoice.status as InvoiceStatus,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    shippingAmount: invoice.shippingAmount,
    totalAmount: invoice.totalAmount,
    dueDate: invoice.dueDate?.toISOString() || null,
    paidDate: invoice.paidDate?.toISOString() || null,
    items,
    billingAddress,
    shippingAddress,
    paymentTerms: invoice.paymentTerms,
    notes: invoice.notes,
    createdAt: invoice.createdAt.toISOString(),
  }
}

// Generate invoice HTML for printing/PDF
export async function generateInvoiceHtml(invoiceId: string): Promise<string | null> {
  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #556B2F; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 32px; color: #556B2F; margin-bottom: 5px; }
    .invoice-number { font-size: 16px; color: #666; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-sent { background: #e3f2fd; color: #1976d2; }
    .status-paid { background: #e8f5e9; color: #388e3c; }
    .status-overdue { background: #ffebee; color: #d32f2f; }
    .addresses { display: flex; gap: 40px; margin-bottom: 30px; }
    .address { flex: 1; }
    .address h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 10px; }
    .meta { display: flex; gap: 40px; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .meta-item { }
    .meta-item label { font-size: 12px; text-transform: uppercase; color: #666; display: block; margin-bottom: 5px; }
    .meta-item span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { text-align: left; padding: 12px; background: #556B2F; color: white; font-size: 12px; text-transform: uppercase; }
    th:last-child { text-align: right; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    td:last-child { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { border-top: 2px solid #333; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 15px; }
    .totals-row.total span:last-child { color: #556B2F; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
    .payment-terms { background: #fff8e1; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .payment-terms h4 { color: #f57c00; margin-bottom: 5px; }
    @media print {
      .invoice { padding: 20px; }
      .status { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">THOR Industries</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 10px;">
          <span class="status status-${invoice.status}">${invoice.status}</span>
        </div>
      </div>
    </div>

    <div class="addresses">
      <div class="address">
        <h3>Bill To</h3>
        <p><strong>${invoice.dealerName}</strong></p>
        <p>Dealer Code: ${invoice.dealerCode}</p>
        ${invoice.billingAddress ? `
          <p>${invoice.billingAddress.name}</p>
          <p>${invoice.billingAddress.street}</p>
          ${invoice.billingAddress.street2 ? `<p>${invoice.billingAddress.street2}</p>` : ''}
          <p>${invoice.billingAddress.city}, ${invoice.billingAddress.state} ${invoice.billingAddress.zipCode}</p>
        ` : ''}
      </div>
      <div class="address">
        <h3>Ship To</h3>
        ${invoice.shippingAddress ? `
          <p>${invoice.shippingAddress.name}</p>
          <p>${invoice.shippingAddress.street}</p>
          ${invoice.shippingAddress.street2 ? `<p>${invoice.shippingAddress.street2}</p>` : ''}
          <p>${invoice.shippingAddress.city}, ${invoice.shippingAddress.state} ${invoice.shippingAddress.zipCode}</p>
        ` : '<p>Same as billing</p>'}
      </div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <label>Invoice Date</label>
        <span>${formatDate(invoice.createdAt)}</span>
      </div>
      <div class="meta-item">
        <label>Due Date</label>
        <span>${formatDate(invoice.dueDate)}</span>
      </div>
      <div class="meta-item">
        <label>Order Number</label>
        <span>${invoice.orderNumber}</span>
      </div>
      <div class="meta-item">
        <label>Payment Terms</label>
        <span>${invoice.paymentTerms}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.sku}</td>
            <td>${item.quantity}</td>
            <td>$${item.unitPrice.toFixed(2)}</td>
            <td>$${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>$${invoice.subtotal.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Tax</span>
        <span>$${invoice.taxAmount.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Shipping</span>
        <span>${invoice.shippingAmount === 0 ? 'FREE' : '$' + invoice.shippingAmount.toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>Total Due</span>
        <span>$${invoice.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-terms">
      <h4>Payment Terms</h4>
      <p>${invoice.paymentTerms} - Payment due by ${formatDate(invoice.dueDate)}</p>
    </div>

    ${invoice.notes ? `
      <div style="margin-bottom: 20px;">
        <h4>Notes</h4>
        <p>${invoice.notes}</p>
      </div>
    ` : ''}

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>THOR Industries Dealer Portal</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
