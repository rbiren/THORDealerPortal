'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getInvoicesForDealer,
  getDealerInvoiceStats,
  type InvoiceStatus,
  type InvoiceData,
} from './actions'
import { INVOICE_STATUSES } from '@/lib/invoice-statuses'

type InvoiceWithLabels = InvoiceData & {
  statusLabel: string
  statusColor: string
}

type InvoiceStats = {
  totalInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalAmount: number
}

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithLabels[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // TODO: Get dealer ID from session
  const dealerId = 'demo-dealer'

  useEffect(() => {
    setMounted(true)
    loadInvoices()
    loadStats()
  }, [])

  async function loadInvoices(page = 1) {
    startTransition(async () => {
      const result = await getInvoicesForDealer(dealerId, {
        status: statusFilter || undefined,
        page,
        limit: 20,
      })
      setInvoices(result.invoices as InvoiceWithLabels[])
      setPagination(result.pagination)
    })
  }

  async function loadStats() {
    const result = await getDealerInvoiceStats(dealerId)
    setStats(result)
  }

  function handleStatusFilter(status: InvoiceStatus | '') {
    setStatusFilter(status)
    startTransition(async () => {
      const result = await getInvoicesForDealer(dealerId, {
        status: status || undefined,
        page: 1,
        limit: 20,
      })
      setInvoices(result.invoices as InvoiceWithLabels[])
      setPagination(result.pagination)
    })
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function isOverdue(invoice: InvoiceWithLabels) {
    if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false
    }
    return new Date(invoice.dueDate) < new Date()
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Invoices</span>
        </nav>
        <h1 className="page-title">Invoices</h1>
        <p className="page-subtitle">View and manage your invoices</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Invoices</p>
              <p className="text-2xl font-heading font-bold text-charcoal">{stats.totalInvoices}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-blue-600">{stats.pendingInvoices}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Overdue</p>
              <p className="text-2xl font-heading font-bold text-error">{stats.overdueInvoices}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Amount</p>
              <p className="text-2xl font-heading font-bold text-charcoal">
                ${stats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as InvoiceStatus | '')}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                {Object.entries(INVOICE_STATUSES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-light-gray"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-charcoal">No invoices found</h3>
              <p className="mt-2 text-medium-gray">
                {statusFilter ? 'Try adjusting your filters' : 'Invoices will appear here after orders are placed'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/invoices/${invoice.invoiceNumber}`}
                        className="font-medium text-olive hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/orders/${invoice.orderNumber}`}
                        className="text-medium-gray hover:text-olive"
                      >
                        {invoice.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-medium-gray">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={isOverdue(invoice) ? 'text-error font-medium' : 'text-medium-gray'}>
                        {formatDate(invoice.dueDate)}
                        {isOverdue(invoice) && ' (Overdue)'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[invoice.statusColor] || statusColors.gray
                        }`}
                      >
                        {invoice.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-charcoal">
                      ${invoice.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/invoices/${invoice.invoiceNumber}`}
                        className="text-olive hover:text-olive-800"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-medium-gray">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadInvoices(pagination.page - 1)}
                disabled={pagination.page === 1 || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadInvoices(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
