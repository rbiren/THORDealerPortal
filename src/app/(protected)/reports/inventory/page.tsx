'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getInventoryValueSummary,
  getInventoryByLocation,
  getInventoryByCategory,
  getInventoryTurnover,
  getSlowMovingInventory,
  getAgingSummary,
  getInventoryAging,
  type InventoryValueSummary,
  type InventoryByLocation,
  type InventoryByCategory,
  type TurnoverData,
  type AgingSummary,
  type AgingData,
} from './actions'

export default function InventoryReportsPage() {
  const [summary, setSummary] = useState<InventoryValueSummary | null>(null)
  const [byLocation, setByLocation] = useState<InventoryByLocation[]>([])
  const [byCategory, setByCategory] = useState<InventoryByCategory[]>([])
  const [turnover, setTurnover] = useState<TurnoverData[]>([])
  const [slowMovers, setSlowMovers] = useState<TurnoverData[]>([])
  const [agingSummary, setAgingSummary] = useState<AgingSummary[]>([])
  const [agingDetails, setAgingDetails] = useState<AgingData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'value' | 'turnover' | 'aging'>('value')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    try {
      const [
        summaryData,
        locationData,
        categoryData,
        turnoverData,
        slowData,
        agingSumData,
        agingDetailData,
      ] = await Promise.all([
        getInventoryValueSummary(),
        getInventoryByLocation(),
        getInventoryByCategory(),
        getInventoryTurnover({ periodDays: 90, limit: 20 }),
        getSlowMovingInventory({ periodDays: 90, limit: 10 }),
        getAgingSummary(),
        getInventoryAging(),
      ])
      setSummary(summaryData)
      setByLocation(locationData)
      setByCategory(categoryData)
      setTurnover(turnoverData)
      setSlowMovers(slowData)
      setAgingSummary(agingSumData)
      setAgingDetails(agingDetailData.slice(0, 20))
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  function getAgeBucketColor(bucket: string) {
    switch (bucket) {
      case '0-30 days':
        return 'bg-green-100 text-green-800'
      case '31-60 days':
        return 'bg-blue-100 text-blue-800'
      case '61-90 days':
        return 'bg-yellow-100 text-yellow-800'
      case '91-120 days':
        return 'bg-orange-100 text-orange-800'
      case '120+ days':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function getTurnoverIndicator(rate: number) {
    if (rate >= 6) return { label: 'Fast', color: 'text-success' }
    if (rate >= 3) return { label: 'Good', color: 'text-blue-600' }
    if (rate >= 1) return { label: 'Moderate', color: 'text-warning' }
    return { label: 'Slow', color: 'text-error' }
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
          <span>Inventory</span>
        </nav>
        <h1 className="page-title">Inventory Reports</h1>
        <p className="page-subtitle">Track inventory value, turnover, and aging</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-4">
          {(['value', 'turnover', 'aging'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-olive text-olive'
                  : 'border-transparent text-medium-gray hover:text-charcoal'
              }`}
            >
              {tab === 'value' ? 'Inventory Value' : tab === 'turnover' ? 'Turnover Analysis' : 'Inventory Aging'}
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
          {/* Value Tab */}
          {activeTab === 'value' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Inventory Value</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary?.totalValue || 0)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">at retail price</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Cost</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary?.totalCost || 0)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">invested capital</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Potential Profit</p>
                    <p className="text-2xl font-heading font-bold text-success mt-1">
                      {formatCurrency(summary?.potentialProfit || 0)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">if all sold</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Items</p>
                    <p className="text-2xl font-heading font-bold text-charcoal mt-1">
                      {summary?.totalQuantity?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {summary?.totalItems || 0} products
                    </p>
                  </div>
                </div>
              </div>

              {/* Value by Location */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Value by Location</h2>
                </div>
                <div className="overflow-x-auto">
                  {byLocation.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No inventory data available</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                            Location
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Items
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {byLocation.map((location) => (
                          <tr key={location.locationId} className="hover:bg-light-beige/50">
                            <td className="px-4 py-4 font-medium text-charcoal">
                              {location.locationName}
                            </td>
                            <td className="px-4 py-4 text-sm text-medium-gray capitalize">
                              {location.locationType.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-charcoal">
                              {location.itemCount}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-charcoal">
                              {location.totalQuantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-charcoal">
                              {formatCurrency(location.totalValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Value by Category */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Value by Category</h2>
                </div>
                <div className="card-body">
                  {byCategory.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No category data available</p>
                  ) : (
                    <div className="space-y-4">
                      {byCategory.map((category) => (
                        <div key={category.categoryId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-charcoal">{category.categoryName}</p>
                              <p className="text-xs text-medium-gray">
                                {category.itemCount} products, {category.totalQuantity.toLocaleString()} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-charcoal">{formatCurrency(category.totalValue)}</p>
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
            </div>
          )}

          {/* Turnover Tab */}
          {activeTab === 'turnover' && (
            <div className="space-y-6">
              {/* Fast Movers */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Top Performers (Fast Movers)</h2>
                  <p className="text-sm text-medium-gray mt-1">Products with highest turnover rate in last 90 days</p>
                </div>
                <div className="overflow-x-auto">
                  {turnover.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No turnover data available</p>
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
                            Stock
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Sold
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Turnover
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Days Supply
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {turnover.slice(0, 10).map((item) => {
                          const indicator = getTurnoverIndicator(item.turnoverRate)
                          return (
                            <tr key={item.productId} className="hover:bg-light-beige/50">
                              <td className="px-4 py-4">
                                <p className="font-medium text-charcoal">{item.productName}</p>
                                <p className="text-xs text-medium-gray">{item.productSku}</p>
                              </td>
                              <td className="px-4 py-4 text-sm text-medium-gray">
                                {item.category || 'Uncategorized'}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-charcoal">
                                {item.currentStock}
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-charcoal">
                                {item.soldQuantity}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className={`font-medium ${indicator.color}`}>
                                  {item.turnoverRate}x
                                </span>
                                <span className="text-xs text-medium-gray ml-1">({indicator.label})</span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-charcoal">
                                {item.daysOfSupply < 999 ? `${item.daysOfSupply} days` : 'N/A'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Slow Movers */}
              <div className="card border-l-4 border-l-warning">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Slow Moving Inventory</h2>
                  <p className="text-sm text-medium-gray mt-1">Products with low turnover rate - consider promotions or markdowns</p>
                </div>
                <div className="overflow-x-auto">
                  {slowMovers.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No slow-moving inventory</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                            Product
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Sold (90d)
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Turnover
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Days Supply
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {slowMovers.map((item) => (
                          <tr key={item.productId} className="hover:bg-light-beige/50">
                            <td className="px-4 py-4">
                              <p className="font-medium text-charcoal">{item.productName}</p>
                              <p className="text-xs text-medium-gray">{item.productSku}</p>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-charcoal">
                              {item.currentStock}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-charcoal">
                              {item.soldQuantity}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="font-medium text-error">
                                {item.turnoverRate}x
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-warning font-medium">
                              {item.daysOfSupply < 999 ? `${item.daysOfSupply} days` : '999+ days'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Aging Tab */}
          {activeTab === 'aging' && (
            <div className="space-y-6">
              {/* Aging Summary */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Aging Summary</h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {agingSummary.map((bucket) => (
                      <div key={bucket.bucket} className="text-center p-4 rounded-lg bg-light-beige">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAgeBucketColor(bucket.bucket)}`}>
                          {bucket.bucket}
                        </span>
                        <p className="text-2xl font-heading font-bold text-charcoal mt-2">
                          {formatCurrency(bucket.value)}
                        </p>
                        <p className="text-sm text-medium-gray">
                          {bucket.quantity.toLocaleString()} items
                        </p>
                        <p className="text-xs text-medium-gray">
                          {bucket.percentage}% of total
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aging Details */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Oldest Inventory</h2>
                  <p className="text-sm text-medium-gray mt-1">Items that have been in stock the longest</p>
                </div>
                <div className="overflow-x-auto">
                  {agingDetails.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No aging data available</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                            Location
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Age
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {agingDetails.map((item, index) => (
                          <tr key={`${item.productId}-${index}`} className="hover:bg-light-beige/50">
                            <td className="px-4 py-4">
                              <p className="font-medium text-charcoal">{item.productName}</p>
                              <p className="text-xs text-medium-gray">{item.productSku}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-medium-gray">
                              {item.locationName}
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-charcoal">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAgeBucketColor(item.ageBucket)}`}>
                                {item.ageInDays} days
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-charcoal">
                              {formatCurrency(item.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
