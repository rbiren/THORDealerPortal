/**
 * Report Export Utilities
 * Handles CSV, Excel, and PDF export generation
 */

// CSV Export
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return ''

  const headers = columns.map((c) => escapeCSVValue(c.header)).join(',')
  const rows = data.map((row) =>
    columns.map((c) => escapeCSVValue(formatValue(row[c.key]))).join(',')
  )

  return [headers, ...rows].join('\n')
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Excel-compatible CSV with BOM for proper UTF-8 display
export function generateExcelCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const csv = generateCSV(data, columns)
  // Add BOM for Excel UTF-8 compatibility
  return '\uFEFF' + csv
}

// Download helper for client-side
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Date formatting for reports
export function formatDateForExport(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Currency formatting for exports
export function formatCurrencyForExport(amount: number): string {
  return amount.toFixed(2)
}

// Generate filename with timestamp
export function generateExportFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 10)
  return `${baseName}-${timestamp}.${extension}`
}

// Column definitions for common reports
export const salesReportColumns = [
  { key: 'date' as const, header: 'Date' },
  { key: 'orderNumber' as const, header: 'Order Number' },
  { key: 'dealerName' as const, header: 'Dealer' },
  { key: 'status' as const, header: 'Status' },
  { key: 'itemCount' as const, header: 'Items' },
  { key: 'subtotal' as const, header: 'Subtotal' },
  { key: 'tax' as const, header: 'Tax' },
  { key: 'total' as const, header: 'Total' },
]

export const inventoryReportColumns = [
  { key: 'sku' as const, header: 'SKU' },
  { key: 'productName' as const, header: 'Product Name' },
  { key: 'category' as const, header: 'Category' },
  { key: 'location' as const, header: 'Location' },
  { key: 'quantity' as const, header: 'Quantity' },
  { key: 'price' as const, header: 'Unit Price' },
  { key: 'totalValue' as const, header: 'Total Value' },
]

export const dealerPerformanceColumns = [
  { key: 'dealerName' as const, header: 'Dealer Name' },
  { key: 'tier' as const, header: 'Tier' },
  { key: 'totalRevenue' as const, header: 'Total Revenue' },
  { key: 'orderCount' as const, header: 'Order Count' },
  { key: 'avgOrderValue' as const, header: 'Avg Order Value' },
  { key: 'growth' as const, header: 'Growth %' },
]

export const invoiceReportColumns = [
  { key: 'invoiceNumber' as const, header: 'Invoice Number' },
  { key: 'orderNumber' as const, header: 'Order Number' },
  { key: 'dealerName' as const, header: 'Dealer' },
  { key: 'issueDate' as const, header: 'Issue Date' },
  { key: 'dueDate' as const, header: 'Due Date' },
  { key: 'status' as const, header: 'Status' },
  { key: 'amount' as const, header: 'Amount' },
]

// PDF generation helpers (for server-side)
export interface PDFSection {
  type: 'title' | 'subtitle' | 'table' | 'text' | 'chart' | 'spacer'
  content: string | string[][] | Record<string, unknown>
}

export interface PDFReport {
  title: string
  subtitle?: string
  generatedAt: Date
  sections: PDFSection[]
  footer?: string
}

// Generate HTML for PDF (to be converted with puppeteer/playwright)
export function generatePDFHTML(report: PDFReport): string {
  const sections = report.sections.map(renderPDFSection).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { border-bottom: 2px solid #4a5d23; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: bold; color: #4a5d23; margin: 0; }
    .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
    .generated { font-size: 12px; color: #888; margin-top: 10px; }
    .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; color: #333; }
    .section-subtitle { font-size: 14px; color: #666; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #fafafa; }
    .text { margin: 15px 0; line-height: 1.6; }
    .spacer { height: 30px; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${escapeHTML(report.title)}</h1>
    ${report.subtitle ? `<div class="subtitle">${escapeHTML(report.subtitle)}</div>` : ''}
    <div class="generated">Generated: ${report.generatedAt.toLocaleString()}</div>
  </div>
  ${sections}
  ${report.footer ? `<div class="footer">${escapeHTML(report.footer)}</div>` : ''}
</body>
</html>`
}

function renderPDFSection(section: PDFSection): string {
  switch (section.type) {
    case 'title':
      return `<h2 class="section-title">${escapeHTML(section.content as string)}</h2>`
    case 'subtitle':
      return `<h3 class="section-subtitle">${escapeHTML(section.content as string)}</h3>`
    case 'text':
      return `<p class="text">${escapeHTML(section.content as string)}</p>`
    case 'spacer':
      return '<div class="spacer"></div>'
    case 'table':
      return renderTable(section.content as string[][])
    default:
      return ''
  }
}

function renderTable(data: string[][]): string {
  if (data.length === 0) return ''

  const [headers, ...rows] = data
  const headerCells = headers.map((h) => `<th>${escapeHTML(h)}</th>`).join('')
  const bodyRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`)
    .join('')

  return `<table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
