'use client'

import { useState, useEffect, useTransition, use } from 'react'
import Link from 'next/link'
import {
  getInvoice,
  getInvoiceHtml,
  sendInvoiceEmail,
  markInvoicePaid,
  INVOICE_STATUSES,
  type InvoiceData,
} from '../actions'

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>
}) {
  const resolvedParams = use(params)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [resolvedParams.invoiceNumber])

  async function loadInvoice() {
    setLoading(true)
    try {
      const data = await getInvoice(resolvedParams.invoiceNumber)
      setInvoice(data)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePrint() {
    if (!invoice) return

    const html = await getInvoiceHtml(invoice.id)
    if (!html) return

    // Open print window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      // Wait for content to load
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  async function handleSendEmail() {
    if (!invoice) return

    startTransition(async () => {
      const result = await sendInvoiceEmail(invoice.id)
      if (result.success) {
        setMessage({ type: 'success', text: 'Invoice sent successfully' })
        loadInvoice()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send invoice' })
      }
    })
  }

  async function handleMarkPaid() {
    if (!invoice) return

    startTransition(async () => {
      const result = await markInvoicePaid(invoice.id)
      if (result.success) {
        setMessage({ type: 'success', text: 'Invoice marked as paid' })
        loadInvoice()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update invoice' })
      }
    })
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function isOverdue() {
    if (!invoice?.dueDate || invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false
    }
    return new Date(invoice.dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-heading font-semibold text-charcoal">Invoice not found</h2>
        <p className="mt-2 text-medium-gray">
          The invoice you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/invoices" className="btn-primary mt-4 inline-flex">
          Back to Invoices
        </Link>
      </div>
    )
  }

  const statusConfig = INVOICE_STATUSES[invoice.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/invoices">Invoices</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{invoice.invoiceNumber}</span>
          </nav>
          <h1 className="page-title">Invoice {invoice.invoiceNumber}</h1>
          <p className="page-subtitle">Order: {invoice.orderNumber}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} disabled={isPending} className="btn-outline">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
          <button onClick={handleSendEmail} disabled={isPending} className="btn-outline">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </button>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button onClick={handleMarkPaid} disabled={isPending} className="btn-primary">
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Status Banner */}
      {isOverdue() && (
        <div className="alert-error">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">This invoice is overdue</p>
              <p className="text-sm">Payment was due on {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-olive">THOR Industries</h2>
                  <p className="text-medium-gray">Dealer Portal</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[statusConfig?.color || 'gray']
                    }`}
                  >
                    {statusConfig?.label || invoice.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-light-beige rounded-lg">
                <div>
                  <p className="text-xs text-medium-gray uppercase">Invoice Date</p>
                  <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">Due Date</p>
                  <p className={`font-medium ${isOverdue() ? 'text-error' : ''}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">Order Number</p>
                  <Link href={`/orders/${invoice.orderNumber}`} className="font-medium text-olive hover:underline">
                    {invoice.orderNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">Payment Terms</p>
                  <p className="font-medium">{invoice.paymentTerms}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Bill To</h3>
                  <p className="font-medium text-charcoal">{invoice.dealerName}</p>
                  <p className="text-sm text-medium-gray">Dealer Code: {invoice.dealerCode}</p>
                  {invoice.billingAddress && (
                    <div className="mt-2 text-sm text-medium-gray">
                      <p>{invoice.billingAddress.name}</p>
                      <p>{invoice.billingAddress.street}</p>
                      {invoice.billingAddress.street2 && <p>{invoice.billingAddress.street2}</p>}
                      <p>
                        {invoice.billingAddress.city}, {invoice.billingAddress.state}{' '}
                        {invoice.billingAddress.zipCode}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Ship To</h3>
                  {invoice.shippingAddress ? (
                    <div className="text-sm text-medium-gray">
                      <p>{invoice.shippingAddress.name}</p>
                      <p>{invoice.shippingAddress.street}</p>
                      {invoice.shippingAddress.street2 && <p>{invoice.shippingAddress.street2}</p>}
                      <p>
                        {invoice.shippingAddress.city}, {invoice.shippingAddress.state}{' '}
                        {invoice.shippingAddress.zipCode}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-medium-gray">Same as billing</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Line Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-beige">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-gray">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 font-medium text-charcoal">{item.description}</td>
                      <td className="px-4 py-4 text-sm text-medium-gray">{item.sku}</td>
                      <td className="px-4 py-4 text-center">{item.quantity}</td>
                      <td className="px-4 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right font-medium">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Summary</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Tax</span>
                <span>${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Shipping</span>
                <span>
                  {invoice.shippingAmount === 0 ? 'FREE' : '$' + invoice.shippingAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-light-gray pt-4">
                <span>Total Due</span>
                <span className="text-olive">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Payment Status</h2>
            </div>
            <div className="card-body">
              {invoice.status === 'paid' ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium text-green-600">Paid</p>
                  {invoice.paidDate && (
                    <p className="text-sm text-medium-gray">{formatDate(invoice.paidDate)}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-medium-gray">Status</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[statusConfig?.color || 'gray']
                      }`}
                    >
                      {statusConfig?.label || invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-medium-gray">Due Date</span>
                    <span className={isOverdue() ? 'text-error font-medium' : ''}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-medium-gray">Terms</span>
                    <span>{invoice.paymentTerms}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-medium-gray">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
