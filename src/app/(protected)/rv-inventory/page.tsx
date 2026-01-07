'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Truck,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Package,
  Eye,
  FileText,
  Wrench,
} from 'lucide-react'
import { fetchRVInventory, fetchRVInventoryMetrics, fetchRVSeries, fetchRVModelYears } from './actions'
import type { RVUnit, RVInventoryMetrics, RVInventoryFilters, RVUnitStatus, RVUnitCondition, RVClassType } from '@/types/rv'

const STATUS_COLORS: Record<RVUnitStatus, string> = {
  in_transit: 'bg-blue-100 text-blue-800',
  in_stock: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-purple-100 text-purple-800',
  wholesale: 'bg-gray-100 text-gray-800',
  service: 'bg-orange-100 text-orange-800',
}

const STATUS_LABELS: Record<RVUnitStatus, string> = {
  in_transit: 'In Transit',
  in_stock: 'In Stock',
  reserved: 'Reserved',
  sold: 'Sold',
  wholesale: 'Wholesale',
  service: 'In Service',
}

const CONDITION_LABELS: Record<RVUnitCondition, string> = {
  new: 'New',
  used: 'Used',
  demo: 'Demo',
  certified_preowned: 'Certified Pre-Owned',
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

export default function RVInventoryPage() {
  const [units, setUnits] = useState<RVUnit[]>([])
  const [metrics, setMetrics] = useState<RVInventoryMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RVUnitStatus[]>([])
  const [conditionFilter, setConditionFilter] = useState<RVUnitCondition[]>([])
  const [seriesOptions, setSeriesOptions] = useState<string[]>([])
  const [yearOptions, setYearOptions] = useState<number[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])

  // Load filter options
  useEffect(() => {
    async function loadFilterOptions() {
      const [series, years] = await Promise.all([
        fetchRVSeries(),
        fetchRVModelYears(),
      ])
      setSeriesOptions(series)
      setYearOptions(years)
    }
    loadFilterOptions()
  }, [])

  // Load inventory data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const filters: RVInventoryFilters = {
          search: searchQuery || undefined,
          status: statusFilter.length ? statusFilter : undefined,
          condition: conditionFilter.length ? conditionFilter : undefined,
          series: selectedSeries.length ? selectedSeries : undefined,
          modelYear: selectedYears.length ? selectedYears : undefined,
        }

        const [inventoryData, metricsData] = await Promise.all([
          fetchRVInventory(filters, page),
          fetchRVInventoryMetrics(),
        ])

        setUnits(inventoryData.units)
        setTotalPages(inventoryData.pages)
        setTotal(inventoryData.total)
        setMetrics(metricsData)
      } catch (error) {
        console.error('Failed to load RV inventory:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [page, searchQuery, statusFilter, conditionFilter, selectedSeries, selectedYears])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const toggleStatus = (status: RVUnitStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
    setPage(1)
  }

  const toggleCondition = (condition: RVUnitCondition) => {
    setConditionFilter((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter([])
    setConditionFilter([])
    setSelectedSeries([])
    setSelectedYears([])
    setPage(1)
  }

  const activeFilterCount =
    statusFilter.length +
    conditionFilter.length +
    selectedSeries.length +
    selectedYears.length +
    (searchQuery ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RV Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your RV unit inventory by VIN
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/vehicle-orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            New Vehicle Order
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              In Stock
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.unitsInStock}</div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              In Transit
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.unitsInTransit}</div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              Sold MTD
            </div>
            <div className="mt-1 text-2xl font-bold text-green-600">{metrics.unitsSoldMTD}</div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              Inventory Value
            </div>
            <div className="mt-1 text-xl font-bold text-gray-900">
              {formatCurrency(metrics.totalInventoryValue)}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Avg Days on Lot
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{metrics.averageDaysOnLot}</div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              90+ Days
            </div>
            <div className="mt-1 text-2xl font-bold text-orange-600">{metrics.unitsOver90Days}</div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by VIN, stock number, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Filter Toggle */}
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
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['in_stock', 'in_transit', 'reserved', 'service'] as RVUnitStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusFilter.includes(status)
                          ? STATUS_COLORS[status]
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'used', 'demo', 'certified_preowned'] as RVUnitCondition[]).map((condition) => (
                    <button
                      key={condition}
                      onClick={() => toggleCondition(condition)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        conditionFilter.includes(condition)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {CONDITION_LABELS[condition]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Series</label>
                <select
                  multiple
                  value={selectedSeries}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (o) => o.value)
                    setSelectedSeries(values)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {seriesOptions.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Model Year</label>
                <select
                  multiple
                  value={selectedYears.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (o) => parseInt(o.value))
                    setSelectedYears(values)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
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

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  VIN / Stock #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Condition
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  MSRP
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Days on Lot
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
                    Loading inventory...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No RV units found matching your criteria.
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {unit.modelYear} {unit.model?.series} {unit.model?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {unit.exteriorColor}
                          {unit.model?.classType && ` • ${unit.model.classType}`}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="font-mono text-sm text-gray-900">{unit.vin}</div>
                      {unit.stockNumber && (
                        <div className="text-sm text-gray-500">Stock: {unit.stockNumber}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          STATUS_COLORS[unit.status as RVUnitStatus]
                        }`}
                      >
                        {STATUS_LABELS[unit.status as RVUnitStatus]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {CONDITION_LABELS[unit.condition as RVUnitCondition]}
                      {unit.mileage && (
                        <div className="text-xs text-gray-400">
                          {unit.mileage.toLocaleString()} mi
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {unit.locationName || unit.lotLocation || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(unit.msrp)}</div>
                      {unit.internetPrice && unit.internetPrice < unit.msrp && (
                        <div className="text-sm text-green-600">
                          Internet: {formatCurrency(unit.internetPrice)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <span
                        className={`font-medium ${
                          (unit.daysOnLot || 0) > 90
                            ? 'text-red-600'
                            : (unit.daysOnLot || 0) > 60
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {unit.daysOnLot ?? '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/rv-inventory/${unit.vin}`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/warranty/new?vin=${unit.vin}`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Submit Warranty Claim"
                        >
                          <Wrench className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/vehicle-orders/new?vin=${unit.vin}`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Create Order"
                        >
                          <FileText className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} units
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
