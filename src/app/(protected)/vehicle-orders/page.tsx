'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Eye,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react'
import { fetchVehicleOrders } from './actions'
import type { VehicleOrder, VehicleOrderStatus } from '@/types/rv'

const STATUS_CONFIG: Record<
  VehicleOrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  quote: { label: 'Quote', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  in_production: { label: 'In Production', color: 'bg-purple-100 text-purple-800', icon: Clock },
  ready: { label: 'Ready', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Truck },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function VehicleOrdersPage() {
  const [orders, setOrders] = useState<VehicleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleOrderStatus[]>([])
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('')

  // Load orders
  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      try {
        const result = await fetchVehicleOrders(
          {
            status: statusFilter.length ? statusFilter : undefined,
            orderType: orderTypeFilter || undefined,
            search: searchQuery || undefined,
          },
          page
        )
        setOrders(result.orders)
        setTotalPages(result.pages)
        setTotal(result.total)
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [page, statusFilter, orderTypeFilter, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const toggleStatus = (status: VehicleOrderStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
    setOrderTypeFilter('')
    setPage(1)
  }

  const activeFilterCount =
    statusFilter.length + (orderTypeFilter ? 1 : 0) + (searchQuery ? 1 : 0)

  // Stats
  const activeOrders = orders.filter(
    (o) => !['completed', 'cancelled'].includes(o.status)
  ).length
  const totalValue = orders.reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage RV unit orders, quotes, and deliveries
          </p>
        </div>
        <Link
          href="/vehicle-orders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Order
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            Total Orders
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Active Orders
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{activeOrders}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            Total Value
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            Pending Approval
          </div>
          <div className="mt-1 text-2xl font-bold text-yellow-600">
            {orders.filter((o) => o.status === 'pending_approval').length}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, VIN, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['quote', 'pending_approval', 'confirmed', 'in_transit', 'completed'] as VehicleOrderStatus[]).map(
                    (status) => {
                      const config = STATUS_CONFIG[status]
                      return (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            statusFilter.includes(status)
                              ? config.color
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {config.label}
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              {/* Order Type Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Order Type</label>
                <select
                  value={orderTypeFilter}
                  onChange={(e) => {
                    setOrderTypeFilter(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="stock">Stock Order</option>
                  <option value="factory">Factory Order</option>
                  <option value="locate">Locate</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No vehicle orders found.
                    <Link
                      href="/vehicle-orders/new"
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      Create your first order
                    </Link>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4">
                        <Link
                          href={`/vehicle-orders/${order.orderNumber}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        {order.rvUnit ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.rvUnit.modelYear} {order.rvUnit.model?.series}{' '}
                              {order.rvUnit.model?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              VIN: {order.rvUnit.vin}
                            </div>
                          </div>
                        ) : order.rvModel ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {order.rvModel.modelYear} {order.rvModel.series}{' '}
                              {order.rvModel.name}
                            </div>
                            <div className="text-sm text-gray-500">Factory Order</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {order.customerName ? (
                          <div>
                            <div className="text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {order.customerType}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="capitalize text-gray-600">{order.orderType}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Link
                          href={`/vehicle-orders/${order.orderNumber}`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="View Order"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
