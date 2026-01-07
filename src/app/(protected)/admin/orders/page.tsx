'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getAdminOrders,
  getAdminOrderStats,
  bulkUpdateOrderStatus,
  exportOrdersCsv,
} from './actions'
import { ADMIN_ORDER_STATUSES, type AdminOrderStatus } from '@/lib/admin-order-statuses'

type AdminOrder = {
  id: string
  orderNumber: string
  status: string
  statusLabel: string
  statusColor: string
  availableActions: string[]
  poNumber: string | null
  dealerId: string
  dealerName: string
  dealerCode: string
  dealerTier: string
  subtotal: number
  totalAmount: number
  itemCount: number
  lineItemCount: number
  createdAt: string
  submittedAt: string | null
}

type AdminOrderStats = {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  cancelledOrders: number
  monthlyOrders: number
  monthlyGrowth: number
  monthlyRevenue: number
}

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  olive: 'bg-olive/10 text-olive',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

const tierColors: Record<string, string> = {
  platinum: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  gold: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-800',
  silver: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700',
  bronze: 'bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stats, setStats] = useState<AdminOrderStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 })
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadOrders()
    loadStats()
  }, [])

  async function loadOrders(page = 1) {
    startTransition(async () => {
      const result = await getAdminOrders({
        page,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setOrders(result.orders)
      setPagination(result.pagination)
      setSelectedOrders(new Set())
    })
  }

  async function loadStats() {
    const result = await getAdminOrderStats()
    setStats(result)
  }

  function handleSearch() {
    loadOrders(1)
  }

  function handleStatusFilter(status: AdminOrderStatus | '') {
    setStatusFilter(status)
    startTransition(async () => {
      const result = await getAdminOrders({
        page: 1,
        status: status || undefined,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setOrders(result.orders)
      setPagination(result.pagination)
      setSelectedOrders(new Set())
    })
  }

  function toggleOrderSelection(orderId: string) {
    const newSelection = new Set(selectedOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrders(newSelection)
  }

  function toggleSelectAll() {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)))
    }
  }

  async function handleBulkStatusUpdate(newStatus: AdminOrderStatus) {
    if (selectedOrders.size === 0) return

    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(
        Array.from(selectedOrders),
        newStatus,
        `Bulk status update to ${ADMIN_ORDER_STATUSES[newStatus].label}`
      )

      if (result.success) {
        setMessage({ type: 'success', text: `Updated ${result.updated} orders` })
      } else {
        setMessage({
          type: 'error',
          text: `Updated ${result.updated} orders. Errors: ${result.errors.join(', ')}`,
        })
      }

      loadOrders(pagination.page)
      loadStats()
    })
  }

  async function handleExport() {
    startTransition(async () => {
      const csv = await exportOrdersCsv({
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
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
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/admin">Admin</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Orders</span>
          </nav>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Manage all dealer orders</p>
        </div>
        <button onClick={handleExport} disabled={isPending} className="btn-outline">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export CSV
        </button>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="card col-span-2">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Orders</p>
              <p className="text-2xl font-heading font-bold text-charcoal">{stats.totalOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-blue-600">{stats.pendingOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Processing</p>
              <p className="text-2xl font-heading font-bold text-yellow-600">{stats.processingOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Completed</p>
              <p className="text-2xl font-heading font-bold text-green-600">{stats.completedOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Cancelled</p>
              <p className="text-2xl font-heading font-bold text-red-600">{stats.cancelledOrders}</p>
            </div>
          </div>
          <div className="card col-span-2">
            <div className="card-body">
              <p className="text-sm text-medium-gray">This Month</p>
              <p className="text-2xl font-heading font-bold text-charcoal">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
              <p className={`text-xs ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% vs last month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search order #, PO #, dealer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as AdminOrderStatus | '')}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                {Object.entries(ADMIN_ORDER_STATUSES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input w-full"
                placeholder="From"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input w-full"
                placeholder="To"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button onClick={handleSearch} className="btn-primary">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="card bg-olive/5 border-olive">
          <div className="card-body flex items-center justify-between">
            <span className="font-medium">
              {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('confirmed')}
                disabled={isPending}
                className="btn-outline btn-sm"
              >
                Confirm
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('processing')}
                disabled={isPending}
                className="btn-outline btn-sm"
              >
                Process
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('shipped')}
                disabled={isPending}
                className="btn-outline btn-sm"
              >
                Ship
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('cancelled')}
                disabled={isPending}
                className="btn-ghost btn-sm text-error"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-charcoal">No orders found</h3>
              <p className="mt-2 text-medium-gray">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-medium-gray"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Dealer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-medium-gray"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-olive hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      {order.poNumber && (
                        <p className="text-sm text-medium-gray">PO: {order.poNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            tierColors[order.dealerTier] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.dealerTier}
                        </span>
                        <div>
                          <p className="font-medium text-charcoal">{order.dealerName}</p>
                          <p className="text-sm text-medium-gray">{order.dealerCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-medium-gray">
                      {formatDate(order.submittedAt || order.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.statusColor] || statusColors.gray
                        }`}
                      >
                        {order.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-charcoal">
                      {order.itemCount}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-charcoal">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadOrders(pagination.page - 1)}
                disabled={pagination.page === 1 || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadOrders(pagination.page + 1)}
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
