'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getNetworkStats,
  getDealerPerformance,
  getTierDistribution,
  getOrderStatusDistribution,
  getTopProducts,
  getSystemUsage,
  getMonthlyRevenueTrend,
  type NetworkStats,
  type DealerPerformance,
  type TierDistribution,
  type OrderStatusDistribution,
  type TopProduct,
  type SystemUsage,
} from './actions'

const tierColors: Record<string, string> = {
  platinum: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  gold: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-800',
  silver: 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700',
  bronze: 'bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800',
}

const statusColors: Record<string, string> = {
  submitted: 'bg-olive',
  confirmed: 'bg-olive',
  processing: 'bg-yellow-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [dealers, setDealers] = useState<DealerPerformance[]>([])
  const [tiers, setTiers] = useState<TierDistribution[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatusDistribution[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [usage, setUsage] = useState<SystemUsage | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<Array<{ month: string; revenue: number; orders: number }>>([])
  const [dealerSort, setDealerSort] = useState<'revenue' | 'orders' | 'growth'>('revenue')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadAnalytics()
  }, [])

  useEffect(() => {
    if (mounted) {
      loadDealerData()
    }
  }, [dealerSort, mounted])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const [
        statsData,
        dealerData,
        tierData,
        statusData,
        productsData,
        usageData,
        trendData,
      ] = await Promise.all([
        getNetworkStats(),
        getDealerPerformance({ sortBy: dealerSort, limit: 10 }),
        getTierDistribution(),
        getOrderStatusDistribution(),
        getTopProducts({ periodDays: 30, limit: 5 }),
        getSystemUsage(),
        getMonthlyRevenueTrend(6),
      ])
      setStats(statsData)
      setDealers(dealerData)
      setTiers(tierData)
      setOrderStatus(statusData)
      setTopProducts(productsData)
      setUsage(usageData)
      setRevenueTrend(trendData)
    } finally {
      setLoading(false)
    }
  }

  async function loadDealerData() {
    const data = await getDealerPerformance({ sortBy: dealerSort, limit: 10 })
    setDealers(data)
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  function getGrowthColor(growth: number) {
    if (growth > 0) return 'text-success'
    if (growth < 0) return 'text-error'
    return 'text-medium-gray'
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
          <Link href="/admin">Admin</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Analytics</span>
        </nav>
        <h1 className="page-title">Network Analytics</h1>
        <p className="page-subtitle">Monitor network-wide performance and dealer metrics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-medium-gray">Monthly Revenue</p>
                <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                  {formatCurrency(stats?.monthlyRevenue || 0)}
                </p>
                {stats && stats.monthlyGrowth !== 0 && (
                  <p className={`text-sm mt-1 ${getGrowthColor(stats.monthlyGrowth)}`}>
                    {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% vs last month
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-medium-gray">Total Revenue</p>
                <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
                <p className="text-sm text-medium-gray mt-1">
                  {stats?.totalOrders?.toLocaleString() || 0} orders
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-medium-gray">Active Dealers</p>
                <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                  {stats?.activeDealers || 0}
                </p>
                <p className="text-sm text-medium-gray mt-1">
                  {stats?.pendingDealers || 0} pending approval
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-medium-gray">Avg Order Value</p>
                <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                  {formatCurrency(stats?.avgOrderValue || 0)}
                </p>
                <p className="text-sm text-medium-gray mt-1">
                  {stats?.lowStockItems || 0} low stock alerts
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Trend & System Usage Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Revenue Trend</h2>
              </div>
              <div className="card-body">
                {revenueTrend.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No revenue data</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-end gap-1 h-48">
                      {revenueTrend.map((period, index) => {
                        const maxRevenue = Math.max(...revenueTrend.map((p) => p.revenue))
                        const height = maxRevenue > 0 ? (period.revenue / maxRevenue) * 100 : 0
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-olive/20 hover:bg-olive/40 transition-colors rounded-t relative group cursor-pointer"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-charcoal text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              <div>{period.month}</div>
                              <div>{formatCurrency(period.revenue)}</div>
                              <div>{period.orders} orders</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-medium-gray">
                      <span>{revenueTrend[0]?.month}</span>
                      <span>{revenueTrend[revenueTrend.length - 1]?.month}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Usage */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">System Usage</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-medium-gray">Active Users (7d)</span>
                  <span className="font-medium text-charcoal">{usage?.activeUsers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-medium-gray">Logins Today</span>
                  <span className="font-medium text-charcoal">{usage?.loginsToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-medium-gray">Orders Today</span>
                  <span className="font-medium text-charcoal">{usage?.ordersToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-medium-gray">Active Carts</span>
                  <span className="font-medium text-charcoal">{usage?.cartsActive || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dealer Performance & Tier Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dealer Performance */}
            <div className="lg:col-span-2 card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Top Dealers</h2>
                <div className="flex gap-2">
                  {(['revenue', 'orders', 'growth'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setDealerSort(sort)}
                      className={`px-3 py-1 text-sm capitalize ${
                        dealerSort === sort
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                    >
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                {dealers.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No dealer data</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                          Dealer
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                          Tier
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Orders
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Growth
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-gray">
                      {dealers.map((dealer, index) => (
                        <tr key={dealer.dealerId} className="hover:bg-light-beige/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-olive">{index + 1}</span>
                              <div>
                                <p className="font-medium text-charcoal">{dealer.dealerName}</p>
                                <p className="text-xs text-medium-gray">{dealer.dealerCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${tierColors[dealer.tier] || 'bg-gray-100'}`}>
                              {dealer.tier}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-charcoal">
                            {dealer.orderCount}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-charcoal">
                            {formatCurrency(dealer.totalRevenue)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-medium ${getGrowthColor(dealer.growth)}`}>
                              {dealer.growth > 0 ? '+' : ''}{dealer.growth}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Tier Distribution</h2>
              </div>
              <div className="card-body space-y-4">
                {tiers.map((tier) => (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${tierColors[tier.tier] || 'bg-gray-100'}`}>
                        {tier.tier}
                      </span>
                      <span className="text-sm text-charcoal">{tier.count} dealers</span>
                    </div>
                    <div className="w-full bg-light-gray rounded-full h-2">
                      <div
                        className="bg-olive rounded-full h-2 transition-all"
                        style={{ width: `${tier.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-medium-gray">
                      {formatCurrency(tier.totalRevenue)} total revenue
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Status & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Distribution */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Order Status Distribution</h2>
              </div>
              <div className="card-body">
                <div className="flex h-6 rounded-full overflow-hidden">
                  {orderStatus.filter((s) => s.count > 0).map((status) => (
                    <div
                      key={status.status}
                      className={`${statusColors[status.status] || 'bg-gray-500'} relative group cursor-pointer`}
                      style={{ width: `${status.percentage}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-charcoal text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 capitalize">
                        {status.status}: {status.count} ({status.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {orderStatus.filter((s) => s.count > 0).map((status) => (
                    <div key={status.status} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${statusColors[status.status] || 'bg-gray-500'}`} />
                      <span className="text-sm text-medium-gray capitalize">{status.status}</span>
                      <span className="text-sm font-medium text-charcoal">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Top Products (30d)</h2>
              </div>
              <div className="card-body">
                {topProducts.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No product data</p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.productId} className="flex items-center gap-4">
                        <span className="text-lg font-medium text-olive w-6">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal truncate">{product.productName}</p>
                          <p className="text-xs text-medium-gray">{product.productSku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-charcoal">{formatCurrency(product.revenue)}</p>
                          <p className="text-xs text-medium-gray">{product.unitsSold} units</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
