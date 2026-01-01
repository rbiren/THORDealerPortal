'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getOrdersForDealer, getDealerOrderStats, ORDER_STATUSES, type OrderStatus } from './actions'

type Order = {
  id: string
  orderNumber: string
  status: string
  statusLabel: string
  statusColor: string
  poNumber: string | null
  subtotal: number
  totalAmount: number
  itemCount: number
  createdAt: string
  submittedAt: string | null
}

type OrderStats = {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalSpent: number
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // TODO: Get dealer ID from session
  const dealerId = 'demo-dealer'

  useEffect(() => {
    setMounted(true)
    loadOrders()
    loadStats()
  }, [])

  async function loadOrders(page = 1) {
    startTransition(async () => {
      const result = await getOrdersForDealer(dealerId, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 20,
      })
      setOrders(result.orders)
      setPagination(result.pagination)
    })
  }

  async function loadStats() {
    const result = await getDealerOrderStats(dealerId)
    setStats(result)
  }

  function handleSearch() {
    loadOrders(1)
  }

  function handleStatusFilter(status: OrderStatus | '') {
    setStatusFilter(status)
    // Reload with new filter
    startTransition(async () => {
      const result = await getOrdersForDealer(dealerId, {
        status: status || undefined,
        search: searchQuery || undefined,
        page: 1,
        limit: 20,
      })
      setOrders(result.orders)
      setPagination(result.pagination)
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          <span>Orders</span>
        </nav>
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">View and manage your orders</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Orders</p>
              <p className="text-2xl font-heading font-bold text-charcoal">{stats.totalOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending Orders</p>
              <p className="text-2xl font-heading font-bold text-burnt-orange">{stats.pendingOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Completed Orders</p>
              <p className="text-2xl font-heading font-bold text-olive">{stats.completedOrders}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Spent</p>
              <p className="text-2xl font-heading font-bold text-charcoal">
                ${stats.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order # or PO #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input pl-10 w-full"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-medium-gray"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as OrderStatus | '')}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button onClick={handleSearch} className="btn-primary px-6">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-charcoal">No orders found</h3>
              <p className="mt-2 text-medium-gray">
                {searchQuery || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Start shopping to place your first order'}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/products" className="btn-primary mt-4 inline-flex">
                  Browse Products
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Order
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
                      <Link
                        href={`/orders/${order.orderNumber}`}
                        className="font-medium text-olive hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      {order.poNumber && (
                        <p className="text-sm text-medium-gray">PO: {order.poNumber}</p>
                      )}
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
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/orders/${order.orderNumber}`}
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
