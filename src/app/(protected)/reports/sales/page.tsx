'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getSalesSummary,
  getSalesByPeriod,
  getProductSales,
  getCategorySales,
  getSalesComparison,
  getPresetDateRanges,
  type SalesSummary,
  type SalesByPeriod,
  type ProductSales,
  type CategorySales,
  type SalesComparison,
  type DateRange,
} from './actions'

export default function SalesReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const presets = getPresetDateRanges()
    return presets['Last 30 Days']
  })
  const [selectedPreset, setSelectedPreset] = useState('Last 30 Days')
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriod[]>([])
  const [productSales, setProductSales] = useState<ProductSales[]>([])
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])
  const [comparison, setComparison] = useState<SalesComparison | null>(null)
  const [periodGrouping, setPeriodGrouping] = useState<'day' | 'week' | 'month'>('day')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'comparison'>('overview')
  const [mounted, setMounted] = useState(false)

  const dealerId = 'demo-dealer'
  const presets = getPresetDateRanges()

  useEffect(() => {
    setMounted(true)
    loadReports()
  }, [])

  useEffect(() => {
    if (mounted) {
      loadReports()
    }
  }, [dateRange, periodGrouping])

  async function loadReports() {
    setLoading(true)
    try {
      const [summaryData, periodData, productData, categoryData] = await Promise.all([
        getSalesSummary(dealerId, dateRange),
        getSalesByPeriod(dealerId, dateRange, periodGrouping),
        getProductSales(dealerId, dateRange, { limit: 10, sortBy: 'revenue' }),
        getCategorySales(dealerId, dateRange),
      ])
      setSummary(summaryData)
      setSalesByPeriod(periodData)
      setProductSales(productData)
      setCategorySales(categoryData)

      // Load comparison (current vs previous period)
      const periodDays = Math.ceil(
        (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / 86400000
      )
      const prevEnd = new Date(dateRange.startDate)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = new Date(prevEnd)
      prevStart.setDate(prevStart.getDate() - periodDays)

      const comparisonData = await getSalesComparison(dealerId, dateRange, {
        startDate: prevStart.toISOString().split('T')[0],
        endDate: prevEnd.toISOString().split('T')[0],
      })
      setComparison(comparisonData)
    } finally {
      setLoading(false)
    }
  }

  function handlePresetChange(preset: string) {
    setSelectedPreset(preset)
    setDateRange(presets[preset])
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  function getChangeColor(change: number) {
    if (change > 0) return 'text-success'
    if (change < 0) return 'text-error'
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
          <Link href="/reports">Reports</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Sales</span>
        </nav>
        <h1 className="page-title">Sales Reports</h1>
        <p className="page-subtitle">Analyze your sales performance and trends</p>
      </div>

      {/* Date Range Selector */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(presets).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedPreset === preset
                      ? 'bg-olive text-white'
                      : 'bg-light-beige text-charcoal hover:bg-olive/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setSelectedPreset('Custom')
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }}
                className="input py-1.5"
              />
              <span className="text-medium-gray">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setSelectedPreset('Custom')
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }}
                className="input py-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-4">
          {(['overview', 'products', 'categories', 'comparison'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-olive text-olive'
                  : 'border-transparent text-medium-gray hover:text-charcoal'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Sales</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary?.totalSales || 0)}
                    </p>
                    {summary && summary.growth !== 0 && (
                      <p className={`text-sm mt-1 ${getChangeColor(summary.growth)}`}>
                        {summary.growth > 0 ? '+' : ''}{summary.growth}% vs previous period
                      </p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Orders</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {summary?.orderCount || 0}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {summary?.itemsSold || 0} items sold
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Avg Order Value</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary?.averageOrderValue || 0)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Top Category</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {summary?.topCategory || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Chart */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Sales Trend</h2>
                  <div className="flex gap-2">
                    {(['day', 'week', 'month'] as const).map((grouping) => (
                      <button
                        key={grouping}
                        onClick={() => setPeriodGrouping(grouping)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          periodGrouping === grouping
                            ? 'bg-olive text-white'
                            : 'bg-light-beige text-charcoal hover:bg-olive/10'
                        }`}
                      >
                        {grouping.charAt(0).toUpperCase() + grouping.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card-body">
                  {salesByPeriod.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No sales data for this period</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Simple bar chart representation */}
                      <div className="flex items-end gap-1 h-48">
                        {salesByPeriod.map((period, index) => {
                          const maxSales = Math.max(...salesByPeriod.map((p) => p.sales))
                          const height = maxSales > 0 ? (period.sales / maxSales) * 100 : 0
                          return (
                            <div
                              key={index}
                              className="flex-1 bg-olive/20 hover:bg-olive/40 transition-colors rounded-t relative group"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-charcoal text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                <div>{period.period}</div>
                                <div>{formatCurrency(period.sales)}</div>
                                <div>{period.orders} orders</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-medium-gray">
                        <span>{salesByPeriod[0]?.period}</span>
                        <span>{salesByPeriod[salesByPeriod.length - 1]?.period}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Top Products by Revenue</h2>
              </div>
              <div className="overflow-x-auto">
                {productSales.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No product sales for this period</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Qty Sold
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Orders
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-gray">
                      {productSales.map((product) => (
                        <tr key={product.productId} className="hover:bg-light-beige/50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-charcoal">{product.productName}</p>
                              <p className="text-xs text-medium-gray">{product.productSku}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-medium-gray">
                            {product.category || 'Uncategorized'}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-charcoal">
                            {product.quantitySold}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-charcoal">
                            {product.orderCount}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-charcoal">
                            {formatCurrency(product.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Sales by Category</h2>
              </div>
              <div className="card-body">
                {categorySales.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No category sales for this period</p>
                ) : (
                  <div className="space-y-4">
                    {categorySales.map((category) => (
                      <div key={category.categoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-charcoal">{category.categoryName}</p>
                            <p className="text-xs text-medium-gray">
                              {category.productCount} products, {category.quantitySold} sold
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-charcoal">{formatCurrency(category.totalRevenue)}</p>
                            <p className="text-xs text-medium-gray">{category.percentage}% of total</p>
                          </div>
                        </div>
                        <div className="w-full bg-light-gray rounded-full h-2">
                          <div
                            className="bg-olive rounded-full h-2 transition-all"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && comparison && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sales Comparison */}
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray mb-4">Total Sales</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-charcoal">Current Period</span>
                        <span className="font-medium">{formatCurrency(comparison.current.sales)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-medium-gray">Previous Period</span>
                        <span className="text-medium-gray">{formatCurrency(comparison.previous.sales)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <span className={`text-lg font-bold ${getChangeColor(comparison.changes.salesChange)}`}>
                          {comparison.changes.salesChange > 0 ? '+' : ''}{comparison.changes.salesChange}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders Comparison */}
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray mb-4">Orders</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-charcoal">Current Period</span>
                        <span className="font-medium">{comparison.current.orders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-medium-gray">Previous Period</span>
                        <span className="text-medium-gray">{comparison.previous.orders}</span>
                      </div>
                      <div className="border-t pt-3">
                        <span className={`text-lg font-bold ${getChangeColor(comparison.changes.ordersChange)}`}>
                          {comparison.changes.ordersChange > 0 ? '+' : ''}{comparison.changes.ordersChange}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avg Order Comparison */}
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray mb-4">Average Order Value</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-charcoal">Current Period</span>
                        <span className="font-medium">{formatCurrency(comparison.current.avgOrderValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-medium-gray">Previous Period</span>
                        <span className="text-medium-gray">{formatCurrency(comparison.previous.avgOrderValue)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <span className={`text-lg font-bold ${getChangeColor(comparison.changes.avgOrderChange)}`}>
                          {comparison.changes.avgOrderChange > 0 ? '+' : ''}{comparison.changes.avgOrderChange}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Period Labels */}
              <div className="card">
                <div className="card-body">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-charcoal">Current Period</p>
                      <p className="text-medium-gray">{comparison.current.period}</p>
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">Previous Period</p>
                      <p className="text-medium-gray">{comparison.previous.period}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
