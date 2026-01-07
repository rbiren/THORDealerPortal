'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getDashboardStats,
  getRecentOrders,
  getActivityFeed,
  getLowStockAlerts,
  getRVDashboardMetrics,
  getRecentRVUnits,
  type DashboardStats,
  type RecentOrder,
  type ActivityItem,
  type LowStockAlert,
  type RVDashboardMetrics,
  type RecentRVUnit,
} from './actions'

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  olive: 'bg-olive/10 text-olive',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [rvMetrics, setRvMetrics] = useState<RVDashboardMetrics | null>(null)
  const [recentRVUnits, setRecentRVUnits] = useState<RecentRVUnit[]>([])
  const [mounted, setMounted] = useState(false)

  // TODO: Get dealer ID from session
  const dealerId = 'demo-dealer'

  useEffect(() => {
    setMounted(true)
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const [statsData, ordersData, activityData, alertsData, rvMetricsData, rvUnitsData] = await Promise.all([
      getDashboardStats(dealerId),
      getRecentOrders(dealerId, 5),
      getActivityFeed(dealerId, 8),
      getLowStockAlerts(5),
      getRVDashboardMetrics(dealerId),
      getRecentRVUnits(dealerId, 5),
    ])
    setStats(statsData)
    setRecentOrders(ordersData)
    setActivities(activityData)
    setLowStockAlerts(alertsData)
    setRvMetrics(rvMetricsData)
    setRecentRVUnits(rvUnitsData)
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here&apos;s your business overview.</p>
      </div>

      {/* RV Inventory Section */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h2 className="text-lg font-heading font-semibold text-charcoal">RV Inventory</h2>
          </div>
          <Link href="/rv-inventory" className="text-sm text-olive hover:underline">
            View all
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Units in Stock */}
            <div className="text-center p-3 rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-700">{rvMetrics?.unitsInStock ?? '--'}</p>
              <p className="text-xs text-green-600 mt-1">In Stock</p>
            </div>
            {/* Units in Transit */}
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-700">{rvMetrics?.unitsInTransit ?? '--'}</p>
              <p className="text-xs text-blue-600 mt-1">In Transit</p>
            </div>
            {/* Units Reserved */}
            <div className="text-center p-3 rounded-lg bg-purple-50">
              <p className="text-2xl font-bold text-purple-700">{rvMetrics?.unitsReserved ?? '--'}</p>
              <p className="text-xs text-purple-600 mt-1">Reserved</p>
            </div>
            {/* Sold MTD */}
            <div className="text-center p-3 rounded-lg bg-olive/10">
              <p className="text-2xl font-bold text-olive">{rvMetrics?.unitsSoldMTD ?? '--'}</p>
              <p className="text-xs text-olive mt-1">Sold MTD</p>
            </div>
            {/* Avg Days on Lot */}
            <div className="text-center p-3 rounded-lg bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-700">{rvMetrics?.averageDaysOnLot ?? '--'}</p>
              <p className="text-xs text-yellow-600 mt-1">Avg Days on Lot</p>
            </div>
            {/* 90+ Days */}
            <div className={`text-center p-3 rounded-lg ${(rvMetrics?.unitsOver90Days ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${(rvMetrics?.unitsOver90Days ?? 0) > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                {rvMetrics?.unitsOver90Days ?? '--'}
              </p>
              <p className={`text-xs mt-1 ${(rvMetrics?.unitsOver90Days ?? 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>90+ Days</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-light-gray">
            <div className="flex items-center justify-between p-3 rounded-lg bg-light-beige">
              <div>
                <p className="text-sm text-medium-gray">Total Inventory Value</p>
                <p className="text-xl font-bold text-charcoal">{rvMetrics ? formatCurrency(rvMetrics.totalInventoryValue) : '--'}</p>
              </div>
              <div className="h-10 w-10 bg-olive/10 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-light-beige">
              <div>
                <p className="text-sm text-medium-gray">Floor Plan Exposure</p>
                <p className="text-xl font-bold text-charcoal">{rvMetrics ? formatCurrency(rvMetrics.totalFloorPlanExposure) : '--'}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-light-beige">
              <div>
                <p className="text-sm text-medium-gray">Pending Vehicle Orders</p>
                <p className="text-xl font-bold text-charcoal">{rvMetrics?.pendingVehicleOrders ?? '--'}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent RV Units */}
          {recentRVUnits.length > 0 && (
            <div className="mt-4 pt-4 border-t border-light-gray">
              <h3 className="text-sm font-medium text-charcoal mb-3">Recent Inventory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-light-beige">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-charcoal uppercase">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-charcoal uppercase">Status</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-charcoal uppercase">MSRP</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-charcoal uppercase">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray">
                    {recentRVUnits.map((unit) => (
                      <tr key={unit.id} className="hover:bg-light-beige/50">
                        <td className="px-3 py-2">
                          <Link href={`/rv-inventory/${unit.vin}`} className="font-medium text-olive hover:underline">
                            {unit.modelYear} {unit.modelName}
                          </Link>
                          <p className="text-xs text-medium-gray">{unit.stockNumber || unit.vin}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            unit.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                            unit.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            unit.status === 'reserved' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {unit.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-charcoal">
                          {formatCurrency(unit.msrp)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`${(unit.daysOnLot ?? 0) > 90 ? 'text-red-600 font-medium' : 'text-medium-gray'}`}>
                            {unit.daysOnLot ?? '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parts & Accessories Stats */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="text-lg font-heading font-semibold text-charcoal">Parts & Accessories</h2>
          </div>
          <Link href="/products" className="text-sm text-olive hover:underline">
            Browse catalog
          </Link>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monthly Sales */}
            <div className="p-4 rounded-lg border border-light-gray">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Monthly Sales</p>
                  <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                    {stats ? formatCurrency(stats.monthlySales) : '--'}
                  </p>
                  {stats && stats.monthlyGrowth !== 0 && (
                    <p className={`text-sm mt-1 ${stats.monthlyGrowth > 0 ? 'text-success' : 'text-error'}`}>
                      {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% vs last month
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 bg-olive/10 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* YTD Sales */}
            <div className="p-4 rounded-lg border border-light-gray">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Year to Date</p>
                  <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                    {stats ? formatCurrency(stats.yearToDateSales) : '--'}
                  </p>
                  <p className="text-sm text-medium-gray mt-1">
                    Avg order: {stats ? formatCurrency(stats.averageOrderValue) : '--'}
                  </p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="p-4 rounded-lg border border-light-gray">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Pending Orders</p>
                  <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                    {stats?.pendingOrders ?? '--'}
                  </p>
                  <p className="text-sm text-medium-gray mt-1">
                    {stats?.totalOrders ?? 0} total orders
                  </p>
                </div>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div className="p-4 rounded-lg border border-light-gray">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-medium-gray">Pending Invoices</p>
                  <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                    {stats?.pendingInvoices ?? '--'}
                  </p>
                  {stats && stats.overdueInvoices > 0 && (
                    <p className="text-sm text-error mt-1">
                      {stats.overdueInvoices} overdue
                    </p>
                  )}
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Recent Orders</h2>
              <Link href="/orders" className="text-sm text-olive hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-light-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="mt-4 text-medium-gray">No orders yet</p>
                  <Link href="/products" className="btn-primary mt-4 inline-block">
                    Browse Products
                  </Link>
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
                      <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-gray">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-light-beige/50">
                        <td className="px-4 py-4">
                          <Link href={`/orders/${order.orderNumber}`} className="font-medium text-olive hover:underline">
                            {order.orderNumber}
                          </Link>
                          <p className="text-xs text-medium-gray">{order.itemCount} items</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-medium-gray">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.statusColor] || statusColors.gray}`}>
                            {order.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-charcoal">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Link
                  href="/rv-inventory"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-olive/10 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">RV Inventory</span>
                </Link>

                <Link
                  href="/vehicle-orders/new"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">New Vehicle Order</span>
                </Link>

                <Link
                  href="/vehicle-orders"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">Vehicle Orders</span>
                </Link>

                <Link
                  href="/products"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">Parts Catalog</span>
                </Link>

                <Link
                  href="/warranty/new"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">Warranty Claim</span>
                </Link>

                <Link
                  href="/reports"
                  className="flex flex-col items-center p-4 rounded-lg border border-light-gray hover:border-olive hover:bg-light-beige/50 transition-colors"
                >
                  <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-charcoal text-center">Reports</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Recent Activity</h2>
            </div>
            <div className="card-body">
              {activities.length === 0 ? (
                <p className="text-center text-medium-gray py-4">No recent activity</p>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-4">
                    {activities.map((activity, index) => (
                      <li key={activity.id}>
                        <div className="relative pb-4">
                          {index !== activities.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-light-gray" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.color === 'blue' ? 'bg-blue-100' :
                                activity.color === 'green' ? 'bg-green-100' :
                                activity.color === 'olive' ? 'bg-olive/10' :
                                activity.color === 'purple' ? 'bg-purple-100' :
                                activity.color === 'yellow' ? 'bg-yellow-100' :
                                'bg-gray-100'
                              }`}>
                                {activity.type === 'order' && (
                                  <svg className={`h-4 w-4 ${activity.color === 'blue' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                )}
                                {activity.type === 'invoice' && (
                                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                                {activity.type === 'status_change' && (
                                  <svg className={`h-4 w-4 ${
                                    activity.color === 'olive' ? 'text-olive' :
                                    activity.color === 'purple' ? 'text-purple-600' :
                                    activity.color === 'green' ? 'text-green-600' :
                                    'text-gray-500'
                                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-charcoal">{activity.title}</p>
                              <p className="text-xs text-medium-gray">{activity.description}</p>
                              <p className="text-xs text-medium-gray mt-1">{formatDate(activity.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <div className="card border-l-4 border-l-warning">
              <div className="card-header flex items-center gap-2">
                <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-heading font-semibold text-charcoal">Low Stock Alerts</h2>
              </div>
              <div className="card-body">
                <ul className="space-y-3">
                  {lowStockAlerts.map((alert) => (
                    <li key={alert.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{alert.productName}</p>
                        <p className="text-xs text-medium-gray">{alert.productSku} - {alert.locationName}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">
                        {alert.quantity} left
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/admin/inventory" className="text-sm text-olive hover:underline mt-4 block">
                  View all inventory
                </Link>
              </div>
            </div>
          )}

          {/* Products Card */}
          <div className="card">
            <div className="card-body text-center">
              <div className="h-12 w-12 bg-olive/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-2xl font-heading font-bold text-charcoal">{stats?.activeProducts ?? '--'}</p>
              <p className="text-sm text-medium-gray">Active Products</p>
              <Link href="/products" className="btn-outline btn-sm mt-4 inline-block">
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
