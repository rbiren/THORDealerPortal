'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getStockAlerts,
  getAlertSummary,
  getMostCriticalItems,
  acknowledgeAlert,
  bulkAcknowledgeAlerts,
  updateThreshold,
  exportAlertsToCSV,
  type StockAlert,
  type AlertSummary,
  type AlertFilters,
} from './actions'
import { getInventoryLocations, type InventoryLocationListItem } from '../actions'

type SeverityFilter = 'all' | 'critical' | 'warning'

export default function AlertsPage() {
  const [isPending, startTransition] = useTransition()
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [criticalItems, setCriticalItems] = useState<StockAlert[]>([])
  const [locations, setLocations] = useState<InventoryLocationListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<AlertFilters['sortBy']>('severity')
  const [sortOrder, setSortOrder] = useState<AlertFilters['sortOrder']>('asc')

  // Selected alerts for bulk actions
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  // Threshold editing
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null)
  const [thresholdValue, setThresholdValue] = useState('')

  // Message state
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load initial data
  useEffect(() => {
    loadData()
    loadLocations()
    loadCriticalItems()
  }, [])

  // Reload alerts when filters change
  useEffect(() => {
    loadData()
  }, [severityFilter, locationFilter, search, sortBy, sortOrder, page])

  async function loadData() {
    startTransition(async () => {
      const filters: AlertFilters = {
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: search || undefined,
        locationId: locationFilter || undefined,
        severity: severityFilter === 'all' ? undefined : severityFilter,
      }

      const [alertsResult, summaryResult] = await Promise.all([
        getStockAlerts(filters),
        getAlertSummary(),
      ])

      setAlerts(alertsResult.alerts)
      setTotal(alertsResult.total)
      setSummary(summaryResult)
    })
  }

  async function loadLocations() {
    const result = await getInventoryLocations()
    setLocations(result)
  }

  async function loadCriticalItems() {
    const items = await getMostCriticalItems(5)
    setCriticalItems(items)
  }

  function handleSort(column: AlertFilters['sortBy']) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  function handleSelectAll() {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set())
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)))
    }
  }

  function handleSelect(id: string) {
    const newSelected = new Set(selectedAlerts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAlerts(newSelected)
  }

  async function handleAcknowledge(id: string) {
    startTransition(async () => {
      const result = await acknowledgeAlert(id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  async function handleBulkAcknowledge() {
    if (selectedAlerts.size === 0) return

    startTransition(async () => {
      const result = await bulkAcknowledgeAlerts(Array.from(selectedAlerts))
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setSelectedAlerts(new Set())
        loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  async function handleUpdateThreshold(id: string) {
    const threshold = parseInt(thresholdValue)
    if (isNaN(threshold) || threshold < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid threshold' })
      return
    }

    startTransition(async () => {
      const result = await updateThreshold(id, threshold)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setEditingThreshold(null)
        setThresholdValue('')
        loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  async function handleExport() {
    const filters: AlertFilters = {
      search: search || undefined,
      locationId: locationFilter || undefined,
      severity: severityFilter === 'all' ? undefined : severityFilter,
    }

    const csv = await exportAlertsToCSV(filters)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <nav className="breadcrumb">
            <Link href="/admin">Admin</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/admin/inventory">Inventory</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Alerts</span>
          </nav>
          <h1 className="page-title">Low Stock Alerts</h1>
          <p className="page-subtitle">Monitor and manage inventory stock alerts</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-outline">
            Export CSV
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Alerts</p>
              <p className="text-2xl font-heading font-bold text-charcoal">
                {summary.total}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Critical</p>
              <p className="text-2xl font-heading font-bold text-error">
                {summary.critical}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Warning</p>
              <p className="text-2xl font-heading font-bold text-burnt-orange">
                {summary.warning}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Unacknowledged</p>
              <p className="text-2xl font-heading font-bold text-charcoal">
                {summary.unacknowledged}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Most Critical Items */}
      {criticalItems.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-heading font-semibold">Most Critical Items</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {criticalItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-error-light rounded-lg border border-error/20"
                >
                  <p className="font-medium text-charcoal truncate">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-medium-gray">{item.product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-error font-bold">
                      {item.available} units
                    </span>
                    <span className="text-xs text-medium-gray">
                      /{item.threshold}
                    </span>
                  </div>
                  <p className="text-xs text-medium-gray mt-1">
                    {item.location.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
              />
            </div>
            <div className="w-48">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="select"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="warning">Warning Only</option>
              </select>
            </div>
            <div className="w-48">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="select"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAlerts.size > 0 && (
        <div className="card bg-light-beige">
          <div className="card-body flex items-center justify-between">
            <span className="text-sm">
              {selectedAlerts.size} alert{selectedAlerts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={handleBulkAcknowledge}
                disabled={isPending}
                className="btn-primary btn-sm"
              >
                Acknowledge Selected
              </button>
              <button
                onClick={() => setSelectedAlerts(new Set())}
                className="btn-ghost btn-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-light-gray"
                  />
                </th>
                <th
                  onClick={() => handleSort('severity')}
                  className="cursor-pointer hover:bg-light-gray/50"
                >
                  Severity {sortBy === 'severity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('product')}
                  className="cursor-pointer hover:bg-light-gray/50"
                >
                  Product {sortBy === 'product' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="cursor-pointer hover:bg-light-gray/50"
                >
                  Location {sortBy === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="cursor-pointer hover:bg-light-gray/50 text-right"
                >
                  Available {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('threshold')}
                  className="cursor-pointer hover:bg-light-gray/50 text-right"
                >
                  Threshold {sortBy === 'threshold' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-right">% of Threshold</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-medium-gray">
                    {isPending ? 'Loading...' : 'No alerts found'}
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className={alert.acknowledged ? 'opacity-60' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedAlerts.has(alert.id)}
                        onChange={() => handleSelect(alert.id)}
                        className="rounded border-light-gray"
                      />
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          alert.severity === 'critical'
                            ? 'badge-error'
                            : alert.severity === 'warning'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{alert.product.name}</p>
                        <p className="text-sm text-medium-gray">{alert.product.sku}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{alert.location.name}</span>
                    </td>
                    <td className="text-right">
                      <span
                        className={`font-medium ${
                          alert.available <= 0
                            ? 'text-error'
                            : alert.available <= alert.threshold * 0.5
                            ? 'text-burnt-orange'
                            : 'text-charcoal'
                        }`}
                      >
                        {alert.available}
                      </span>
                      <span className="text-medium-gray text-sm ml-1">
                        ({alert.currentStock} total, {alert.reserved} reserved)
                      </span>
                    </td>
                    <td className="text-right">
                      {editingThreshold === alert.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={thresholdValue}
                            onChange={(e) => setThresholdValue(e.target.value)}
                            className="input w-20 py-1 text-right"
                            min="0"
                          />
                          <button
                            onClick={() => handleUpdateThreshold(alert.id)}
                            disabled={isPending}
                            className="btn-primary btn-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingThreshold(null)
                              setThresholdValue('')
                            }}
                            className="btn-ghost btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingThreshold(alert.id)
                            setThresholdValue(alert.threshold.toString())
                          }}
                          className="text-olive hover:underline"
                        >
                          {alert.threshold}
                        </button>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-light-gray rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              alert.percentOfThreshold <= 25
                                ? 'bg-error'
                                : alert.percentOfThreshold <= 50
                                ? 'bg-burnt-orange'
                                : 'bg-olive'
                            }`}
                            style={{
                              width: `${Math.min(100, alert.percentOfThreshold)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm w-12">
                          {alert.percentOfThreshold.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      {alert.acknowledged ? (
                        <span className="badge badge-success">Acknowledged</span>
                      ) : (
                        <span className="badge badge-neutral">Pending</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={isPending}
                            className="btn-ghost btn-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        <Link
                          href={`/admin/inventory/adjustments?productId=${alert.product.id}&locationId=${alert.location.id}`}
                          className="btn-primary btn-sm"
                        >
                          Restock
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
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-medium-gray">
              Showing {(page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, total)} of {total} alerts
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isPending}
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
