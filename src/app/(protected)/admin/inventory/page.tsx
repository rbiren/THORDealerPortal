'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getInventorySummary,
  getLocationSummaries,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryByCategory,
  type InventorySummary,
  type LocationSummary,
  type LowStockItem,
  type InventoryByCategory,
} from './actions'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

type Tab = 'overview' | 'locations' | 'alerts' | 'categories'

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<InventorySummary | null>(null)
  const [locations, setLocations] = useState<LocationSummary[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [outOfStockItems, setOutOfStockItems] = useState<LowStockItem[]>([])
  const [categoryData, setCategoryData] = useState<InventoryByCategory[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [summaryData, locationData, lowStock, outOfStock, categories] = await Promise.all([
        getInventorySummary(),
        getLocationSummaries(),
        getLowStockItems(10),
        getOutOfStockItems(10),
        getInventoryByCategory(),
      ])
      setSummary(summaryData)
      setLocations(locationData)
      setLowStockItems(lowStock)
      setOutOfStockItems(outOfStock)
      setCategoryData(categories)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'locations', label: 'Locations' },
    { id: 'alerts', label: 'Stock Alerts' },
    { id: 'categories', label: 'By Category' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor stock levels, alerts, and inventory value across locations
          </p>
        </div>
        <Link
          href="/admin/inventory/list"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          View All Inventory
        </Link>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(summary.totalStock)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalProducts} products
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Available Stock */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(summary.totalAvailable)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(summary.totalReserved)} reserved
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalValue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  at cost basis
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.lowStockCount + summary.outOfStockCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.lowStockCount} low, {summary.outOfStockCount} out
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                summary.outOfStockCount > 0 ? 'bg-red-100' : summary.lowStockCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    summary.outOfStockCount > 0 ? 'text-red-600' : summary.lowStockCount > 0 ? 'text-yellow-600' : 'text-gray-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              locations={locations}
              lowStockItems={lowStockItems}
              outOfStockItems={outOfStockItems}
            />
          )}
          {activeTab === 'locations' && (
            <LocationsTab locations={locations} />
          )}
          {activeTab === 'alerts' && (
            <AlertsTab
              lowStockItems={lowStockItems}
              outOfStockItems={outOfStockItems}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab categoryData={categoryData} />
          )}
        </>
      )}
    </div>
  )
}

function OverviewTab({
  locations,
  lowStockItems,
  outOfStockItems,
}: {
  locations: LocationSummary[]
  lowStockItems: LowStockItem[]
  outOfStockItems: LowStockItem[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Location Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Locations</h3>
        </div>
        <div className="p-6">
          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No locations configured</p>
          ) : (
            <div className="space-y-4">
              {locations.slice(0, 5).map((location) => (
                <div key={location.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-500">{location.code} • {location.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatNumber(location.totalStock)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(location.totalValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Critical Alerts</h3>
        </div>
        <div className="p-6">
          {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-gray-500">No stock alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {outOfStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-800">{item.product.name}</p>
                    <p className="text-xs text-red-600">{item.product.sku} at {item.location.name}</p>
                  </div>
                  <span className="text-xs font-medium text-red-800">Out of Stock</span>
                </div>
              ))}
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-yellow-800">{item.product.name}</p>
                    <p className="text-xs text-yellow-600">{item.available} / {item.lowStockThreshold} threshold</p>
                  </div>
                  <span className="text-xs font-medium text-yellow-800">Low Stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LocationsTab({ locations }: { locations: LocationSummary[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {locations.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No inventory locations configured
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Low Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((location) => (
              <tr key={location.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {location.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(location.productCount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {formatNumber(location.totalStock)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatNumber(location.totalAvailable)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(location.totalValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {location.lowStockCount > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {location.lowStockCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function AlertsTab({
  lowStockItems,
  outOfStockItems,
}: {
  lowStockItems: LowStockItem[]
  outOfStockItems: LowStockItem[]
}) {
  return (
    <div className="space-y-6">
      {/* Out of Stock */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <h3 className="text-lg font-medium text-red-800">
            Out of Stock ({outOfStockItems.length})
          </h3>
        </div>
        {outOfStockItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No out of stock items
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {outOfStockItems.map((item) => (
                <tr key={item.id} className="bg-red-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-sm text-gray-500">{item.product.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.location.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.reserved}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.available}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Low Stock */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
          <h3 className="text-lg font-medium text-yellow-800">
            Low Stock ({lowStockItems.length})
          </h3>
        </div>
        {lowStockItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No low stock items
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lowStockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    <div className="text-sm text-gray-500">{item.product.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.location.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.available}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {item.lowStockThreshold}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.percentOfThreshold < 25
                              ? 'bg-red-500'
                              : item.percentOfThreshold < 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(item.percentOfThreshold, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(item.percentOfThreshold)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CategoriesTab({ categoryData }: { categoryData: InventoryByCategory[] }) {
  const totalValue = categoryData.reduce((sum, c) => sum + c.totalValue, 0)

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {categoryData.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No inventory data available
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % of Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categoryData.map((category) => {
              const percentOfTotal = totalValue > 0
                ? (category.totalValue / totalValue) * 100
                : 0

              return (
                <tr key={category.categoryId ?? 'uncategorized'} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {category.productCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(category.totalStock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(category.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {percentOfTotal.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                {categoryData.reduce((sum, c) => sum + c.productCount, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                {formatNumber(categoryData.reduce((sum, c) => sum + c.totalStock, 0))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                {formatCurrency(totalValue)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
