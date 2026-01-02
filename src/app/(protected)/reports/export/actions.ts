'use server'

import { prisma } from '@/lib/prisma'
import {
  generateCSV,
  generatePDFHTML,
  formatDateForExport,
  formatCurrencyForExport,
  type PDFReport,
} from '@/lib/export'

// Types
export type DateRange = {
  startDate: Date
  endDate: Date
}

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export type ExportResult = {
  content: string
  filename: string
  mimeType: string
}

// Sales Export
export async function exportSalesReport(
  dealerId: string,
  dateRange: DateRange,
  format: ExportFormat
): Promise<ExportResult> {
  const orders = await prisma.order.findMany({
    where: {
      dealerId,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      status: { not: 'cancelled' },
    },
    include: {
      dealer: { select: { companyName: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = orders.map((order) => ({
    date: formatDateForExport(order.createdAt),
    orderNumber: order.orderNumber,
    dealerName: order.dealer.companyName,
    status: order.status,
    itemCount: String(order.items.length),
    subtotal: formatCurrencyForExport(order.subtotal),
    tax: formatCurrencyForExport(order.taxAmount),
    total: formatCurrencyForExport(order.totalAmount),
  }))

  const columns = [
    { key: 'date' as const, header: 'Date' },
    { key: 'orderNumber' as const, header: 'Order Number' },
    { key: 'dealerName' as const, header: 'Dealer' },
    { key: 'status' as const, header: 'Status' },
    { key: 'itemCount' as const, header: 'Items' },
    { key: 'subtotal' as const, header: 'Subtotal' },
    { key: 'tax' as const, header: 'Tax' },
    { key: 'total' as const, header: 'Total' },
  ]

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'pdf') {
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    const report: PDFReport = {
      title: 'Sales Report',
      subtitle: `${formatDateForExport(dateRange.startDate)} - ${formatDateForExport(dateRange.endDate)}`,
      generatedAt: new Date(),
      sections: [
        { type: 'title', content: 'Summary' },
        {
          type: 'text',
          content: `Total Orders: ${orders.length} | Total Revenue: $${formatCurrencyForExport(totalRevenue)} | Avg Order Value: $${formatCurrencyForExport(avgOrderValue)}`,
        },
        { type: 'spacer', content: '' },
        { type: 'title', content: 'Order Details' },
        {
          type: 'table',
          content: [
            columns.map((c) => c.header),
            ...data.map((row) => columns.map((c) => row[c.key])),
          ],
        },
      ],
      footer: 'THOR Industries Dealer Portal',
    }

    return {
      content: generatePDFHTML(report),
      filename: `sales-report-${timestamp}.html`,
      mimeType: 'text/html',
    }
  }

  const csv = generateCSV(data, columns)
  const bomPrefix = format === 'excel' ? '\uFEFF' : ''

  return {
    content: bomPrefix + csv,
    filename: `sales-report-${timestamp}.csv`,
    mimeType: 'text/csv',
  }
}

// Inventory Export
export async function exportInventoryReport(format: ExportFormat): Promise<ExportResult> {
  const inventory = await prisma.inventory.findMany({
    include: {
      product: {
        select: { name: true, sku: true, price: true, category: { select: { name: true } } },
      },
      location: { select: { name: true } },
    },
    orderBy: [{ product: { sku: 'asc' } }, { location: { name: 'asc' } }],
  })

  const data = inventory.map((inv) => ({
    sku: inv.product.sku,
    productName: inv.product.name,
    category: inv.product.category?.name || 'Uncategorized',
    location: inv.location.name,
    quantity: String(inv.quantity),
    price: formatCurrencyForExport(inv.product.price),
    totalValue: formatCurrencyForExport(inv.quantity * inv.product.price),
  }))

  const columns = [
    { key: 'sku' as const, header: 'SKU' },
    { key: 'productName' as const, header: 'Product Name' },
    { key: 'category' as const, header: 'Category' },
    { key: 'location' as const, header: 'Location' },
    { key: 'quantity' as const, header: 'Quantity' },
    { key: 'price' as const, header: 'Unit Price' },
    { key: 'totalValue' as const, header: 'Total Value' },
  ]

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'pdf') {
    const totalValue = inventory.reduce(
      (sum, inv) => sum + inv.quantity * inv.product.price,
      0
    )
    const totalQuantity = inventory.reduce((sum, inv) => sum + inv.quantity, 0)

    const report: PDFReport = {
      title: 'Inventory Report',
      subtitle: `As of ${formatDateForExport(new Date())}`,
      generatedAt: new Date(),
      sections: [
        { type: 'title', content: 'Summary' },
        {
          type: 'text',
          content: `Total SKUs: ${inventory.length} | Total Quantity: ${totalQuantity} | Total Value: $${formatCurrencyForExport(totalValue)}`,
        },
        { type: 'spacer', content: '' },
        { type: 'title', content: 'Inventory Details' },
        {
          type: 'table',
          content: [
            columns.map((c) => c.header),
            ...data.map((row) => columns.map((c) => row[c.key])),
          ],
        },
      ],
      footer: 'THOR Industries Dealer Portal',
    }

    return {
      content: generatePDFHTML(report),
      filename: `inventory-report-${timestamp}.html`,
      mimeType: 'text/html',
    }
  }

  const csv = generateCSV(data, columns)
  const bomPrefix = format === 'excel' ? '\uFEFF' : ''

  return {
    content: bomPrefix + csv,
    filename: `inventory-report-${timestamp}.csv`,
    mimeType: 'text/csv',
  }
}

// Dealer Performance Export (Admin)
export async function exportDealerPerformanceReport(
  format: ExportFormat
): Promise<ExportResult> {
  const dealers = await prisma.dealer.findMany({
    where: { status: 'active' },
    include: {
      orders: {
        where: { status: { not: 'cancelled' } },
        select: { totalAmount: true },
      },
    },
  })

  const data = dealers.map((dealer) => {
    const totalRevenue = dealer.orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const orderCount = dealer.orders.length
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

    return {
      dealerName: dealer.companyName,
      tier: dealer.tier,
      totalRevenue: formatCurrencyForExport(totalRevenue),
      orderCount: String(orderCount),
      avgOrderValue: formatCurrencyForExport(avgOrderValue),
      growth: '0', // Would need historical data for real growth calculation
    }
  })

  // Sort by revenue descending
  data.sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))

  const columns = [
    { key: 'dealerName' as const, header: 'Dealer Name' },
    { key: 'tier' as const, header: 'Tier' },
    { key: 'totalRevenue' as const, header: 'Total Revenue' },
    { key: 'orderCount' as const, header: 'Order Count' },
    { key: 'avgOrderValue' as const, header: 'Avg Order Value' },
    { key: 'growth' as const, header: 'Growth %' },
  ]

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'pdf') {
    const totalNetworkRevenue = data.reduce(
      (sum, d) => sum + parseFloat(d.totalRevenue),
      0
    )

    const report: PDFReport = {
      title: 'Dealer Performance Report',
      subtitle: `As of ${formatDateForExport(new Date())}`,
      generatedAt: new Date(),
      sections: [
        { type: 'title', content: 'Network Summary' },
        {
          type: 'text',
          content: `Active Dealers: ${dealers.length} | Total Network Revenue: $${formatCurrencyForExport(totalNetworkRevenue)}`,
        },
        { type: 'spacer', content: '' },
        { type: 'title', content: 'Dealer Rankings' },
        {
          type: 'table',
          content: [
            columns.map((c) => c.header),
            ...data.map((row) => columns.map((c) => row[c.key])),
          ],
        },
      ],
      footer: 'THOR Industries Dealer Portal - Confidential',
    }

    return {
      content: generatePDFHTML(report),
      filename: `dealer-performance-${timestamp}.html`,
      mimeType: 'text/html',
    }
  }

  const csv = generateCSV(data, columns)
  const bomPrefix = format === 'excel' ? '\uFEFF' : ''

  return {
    content: bomPrefix + csv,
    filename: `dealer-performance-${timestamp}.csv`,
    mimeType: 'text/csv',
  }
}

// Invoice Export
export async function exportInvoiceReport(
  dealerId: string,
  dateRange: DateRange,
  format: ExportFormat
): Promise<ExportResult> {
  const invoices = await prisma.invoice.findMany({
    where: {
      dealerId,
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
    include: {
      dealer: { select: { companyName: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.order?.orderNumber || '-',
    dealerName: invoice.dealer.companyName,
    issueDate: formatDateForExport(invoice.createdAt),
    dueDate: formatDateForExport(invoice.dueDate),
    status: invoice.status,
    amount: formatCurrencyForExport(invoice.totalAmount),
  }))

  const columns = [
    { key: 'invoiceNumber' as const, header: 'Invoice Number' },
    { key: 'orderNumber' as const, header: 'Order Number' },
    { key: 'dealerName' as const, header: 'Dealer' },
    { key: 'issueDate' as const, header: 'Issue Date' },
    { key: 'dueDate' as const, header: 'Due Date' },
    { key: 'status' as const, header: 'Status' },
    { key: 'amount' as const, header: 'Amount' },
  ]

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'pdf') {
    const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length

    const report: PDFReport = {
      title: 'Invoice Report',
      subtitle: `${formatDateForExport(dateRange.startDate)} - ${formatDateForExport(dateRange.endDate)}`,
      generatedAt: new Date(),
      sections: [
        { type: 'title', content: 'Summary' },
        {
          type: 'text',
          content: `Total Invoices: ${invoices.length} | Total Amount: $${formatCurrencyForExport(totalAmount)} | Overdue: ${overdueCount}`,
        },
        { type: 'spacer', content: '' },
        { type: 'title', content: 'Invoice Details' },
        {
          type: 'table',
          content: [
            columns.map((c) => c.header),
            ...data.map((row) => columns.map((c) => row[c.key])),
          ],
        },
      ],
      footer: 'THOR Industries Dealer Portal',
    }

    return {
      content: generatePDFHTML(report),
      filename: `invoice-report-${timestamp}.html`,
      mimeType: 'text/html',
    }
  }

  const csv = generateCSV(data, columns)
  const bomPrefix = format === 'excel' ? '\uFEFF' : ''

  return {
    content: bomPrefix + csv,
    filename: `invoice-report-${timestamp}.csv`,
    mimeType: 'text/csv',
  }
}

// Orders Export (Admin - all orders)
export async function exportAllOrdersReport(
  dateRange: DateRange,
  format: ExportFormat
): Promise<ExportResult> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    },
    include: {
      dealer: { select: { companyName: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = orders.map((order) => ({
    date: formatDateForExport(order.createdAt),
    orderNumber: order.orderNumber,
    dealerName: order.dealer.companyName,
    status: order.status,
    itemCount: String(order.items.length),
    subtotal: formatCurrencyForExport(order.subtotal),
    tax: formatCurrencyForExport(order.taxAmount),
    shipping: formatCurrencyForExport(order.shippingAmount),
    total: formatCurrencyForExport(order.totalAmount),
    poNumber: order.poNumber || '-',
  }))

  const columns = [
    { key: 'date' as const, header: 'Date' },
    { key: 'orderNumber' as const, header: 'Order Number' },
    { key: 'dealerName' as const, header: 'Dealer' },
    { key: 'status' as const, header: 'Status' },
    { key: 'itemCount' as const, header: 'Items' },
    { key: 'subtotal' as const, header: 'Subtotal' },
    { key: 'tax' as const, header: 'Tax' },
    { key: 'shipping' as const, header: 'Shipping' },
    { key: 'total' as const, header: 'Total' },
    { key: 'poNumber' as const, header: 'PO Number' },
  ]

  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'pdf') {
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const statusCounts = orders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const report: PDFReport = {
      title: 'All Orders Report',
      subtitle: `${formatDateForExport(dateRange.startDate)} - ${formatDateForExport(dateRange.endDate)}`,
      generatedAt: new Date(),
      sections: [
        { type: 'title', content: 'Summary' },
        {
          type: 'text',
          content: `Total Orders: ${orders.length} | Total Revenue: $${formatCurrencyForExport(totalRevenue)}`,
        },
        {
          type: 'text',
          content: `Status Breakdown: ${Object.entries(statusCounts)
            .map(([status, count]) => `${status}: ${count}`)
            .join(' | ')}`,
        },
        { type: 'spacer', content: '' },
        { type: 'title', content: 'Order Details' },
        {
          type: 'table',
          content: [
            columns.map((c) => c.header),
            ...data.map((row) => columns.map((c) => row[c.key])),
          ],
        },
      ],
      footer: 'THOR Industries Dealer Portal - Confidential',
    }

    return {
      content: generatePDFHTML(report),
      filename: `all-orders-${timestamp}.html`,
      mimeType: 'text/html',
    }
  }

  const csv = generateCSV(data, columns)
  const bomPrefix = format === 'excel' ? '\uFEFF' : ''

  return {
    content: bomPrefix + csv,
    filename: `all-orders-${timestamp}.csv`,
    mimeType: 'text/csv',
  }
}
