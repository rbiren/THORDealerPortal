'use server'

import {
  getInvoiceById,
  getInvoiceByNumber,
  getDealerInvoices,
  getInvoiceStats,
  updateInvoiceStatus,
  createInvoiceFromOrder,
  generateInvoiceHtml,
  type InvoiceStatus,
  type InvoiceData,
} from '@/lib/services/invoice'
import { sendEmail } from '@/lib/services/email'
import { prisma } from '@/lib/prisma'

export type { InvoiceStatus, InvoiceData }

// Invoice status configuration
export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  sent: { label: 'Sent', color: 'blue' },
  paid: { label: 'Paid', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
} as const

// Get invoice by ID or number
export async function getInvoice(idOrNumber: string) {
  if (idOrNumber.startsWith('INV-')) {
    return getInvoiceByNumber(idOrNumber)
  }
  return getInvoiceById(idOrNumber)
}

// Get invoices for dealer with formatting
export async function getInvoicesForDealer(
  dealerId: string,
  options: {
    status?: InvoiceStatus
    page?: number
    limit?: number
  } = {}
) {
  const result = await getDealerInvoices(dealerId, options)

  return {
    invoices: result.invoices.map((invoice) => ({
      ...invoice,
      statusLabel: INVOICE_STATUSES[invoice.status]?.label || invoice.status,
      statusColor: INVOICE_STATUSES[invoice.status]?.color || 'gray',
    })),
    pagination: result.pagination,
  }
}

// Get invoice statistics
export async function getDealerInvoiceStats(dealerId: string) {
  return getInvoiceStats(dealerId)
}

// Create invoice from an order
export async function createInvoice(orderId: string) {
  return createInvoiceFromOrder(orderId)
}

// Mark invoice as paid
export async function markInvoicePaid(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  return updateInvoiceStatus(invoiceId, 'paid')
}

// Get printable invoice HTML
export async function getInvoiceHtml(invoiceId: string) {
  return generateInvoiceHtml(invoiceId)
}

// Send invoice by email
export async function sendInvoiceEmail(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  // Get dealer email
  const dealer = await prisma.dealer.findUnique({
    where: { id: invoice.dealerId },
    include: {
      users: {
        where: { role: { in: ['dealer_admin', 'dealer_user'] } },
        select: { email: true, name: true },
        take: 1,
      },
    },
  })

  if (!dealer || !dealer.users[0]) {
    return { success: false, error: 'No recipient found for dealer' }
  }

  const recipient = dealer.users[0]
  const subject = `Invoice ${invoice.invoiceNumber} - THOR Dealer Portal`

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const text = `
Invoice ${invoice.invoiceNumber}

Dear ${recipient.name || 'Valued Customer'},

Please find your invoice for order ${invoice.orderNumber} attached.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Order Number: ${invoice.orderNumber}
- Amount Due: $${invoice.totalAmount.toFixed(2)}
- Due Date: ${formatDate(invoice.dueDate)}
- Payment Terms: ${invoice.paymentTerms}

You can view and download your invoice by logging into the THOR Dealer Portal.

Thank you for your business!

---
THOR Dealer Portal
`.trim()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #556B2F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">THOR Dealer Portal</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #556B2F;">Invoice ${invoice.invoiceNumber}</h2>
    <p>Dear ${recipient.name || 'Valued Customer'},</p>
    <p>Please find your invoice for order ${invoice.orderNumber} below.</p>

    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Invoice Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Order Number:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${invoice.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${formatDate(invoice.dueDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment Terms:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${invoice.paymentTerms}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 18px;"><strong>Amount Due:</strong></td>
          <td style="padding: 12px 0; font-size: 18px; text-align: right; color: #556B2F; font-weight: bold;">$${invoice.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <p>You can view and download your invoice by logging into the THOR Dealer Portal.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">Thank you for your business!</p>
    <p style="color: #999; font-size: 12px; margin: 5px 0 0; text-align: center;">THOR Dealer Portal</p>
  </div>
</body>
</html>
`.trim()

  const result = await sendEmail({ to: recipient.email, subject, text, html })

  if (result.success) {
    // Update invoice status to sent if it was draft
    const currentInvoice = await getInvoiceById(invoiceId)
    if (currentInvoice?.status === 'draft') {
      await updateInvoiceStatus(invoiceId, 'sent')
    }
  }

  return result
}

// Check and update overdue invoices
export async function checkOverdueInvoices() {
  const now = new Date()

  // Find invoices that are past due and not yet marked overdue
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['draft', 'sent'] },
      dueDate: { lt: now },
    },
  })

  for (const invoice of overdueInvoices) {
    await updateInvoiceStatus(invoice.id, 'overdue')
  }

  return { updated: overdueInvoices.length }
}
