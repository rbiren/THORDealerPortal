'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  adjustInventory,
  getAdjustmentHistory,
  type AdjustmentHistoryItem,
  type AdjustmentReason,
} from './actions'
import { getAdjustmentReasons } from '@/lib/inventory-utils'
import { getInventoryLocations, type InventoryLocationListItem } from '../actions'
import { prisma } from '@/lib/prisma'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

type ProductOption = {
  id: string
  sku: string
  name: string
}

export default function AdjustmentsPage() {
  const [locations, setLocations] = useState<InventoryLocationListItem[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [history, setHistory] = useState<AdjustmentHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<AdjustmentReason>('received')
  const [notes, setNotes] = useState('')

  const reasons = getAdjustmentReasons()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [locData, historyData] = await Promise.all([
        getInventoryLocations(),
        getAdjustmentHistory({ pageSize: 50 }),
      ])
      setLocations(locData)
      setHistory(historyData.items)

      // Fetch products for the dropdown
      const response = await fetch('/api/products')
      if (response.ok) {
        const productsData = await response.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !locationId) return

    setIsSubmitting(true)
    setMessage(null)

    const result = await adjustInventory({
      productId,
      locationId,
      type: adjustmentType,
      quantity,
      reason,
      notes: notes || undefined,
    })

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setShowForm(false)
      resetForm()
      loadData()
    } else {
      setMessage({ type: 'error', text: result.message })
    }

    setIsSubmitting(false)
  }

  const resetForm = () => {
    setProductId('')
    setLocationId('')
    setAdjustmentType('add')
    setQuantity(1)
    setReason('received')
    setNotes('')
  }

  const TypeBadge = ({ type }: { type: string }) => {
    const config = {
      add: { bg: 'bg-green-100', text: 'text-green-800', label: 'Added' },
      remove: { bg: 'bg-red-100', text: 'text-red-800', label: 'Removed' },
      set: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Set' },
    }[type] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: type }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const ReasonBadge = ({ reason }: { reason: string }) => {
    const label = reasons.find((r) => r.value === reason)?.label ?? reason
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
        {label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/admin/inventory" className="hover:text-gray-700">
                  Inventory
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li className="font-medium text-gray-900">Adjustments</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add or remove stock with reason codes and audit trail
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Adjustment
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setAdjustmentType('add')
            setReason('received')
            setShowForm(true)
          }}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Receive Stock</p>
              <p className="text-sm text-gray-500">Add incoming inventory</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setAdjustmentType('remove')
            setReason('damaged')
            setShowForm(true)
          }}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Remove Stock</p>
              <p className="text-sm text-gray-500">Damaged, lost, or returned</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setAdjustmentType('set')
            setReason('cycle_count')
            setShowForm(true)
          }}
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Cycle Count</p>
              <p className="text-sm text-gray-500">Set exact quantity</p>
            </div>
          </div>
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Adjustment History</h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2">No adjustments recorded yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.adjustedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">{item.productSku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.locationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TypeBadge type={item.type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={item.type === 'add' ? 'text-green-600' : item.type === 'remove' ? 'text-red-600' : 'text-blue-600'}>
                      {item.type === 'add' ? '+' : item.type === 'remove' ? '-' : '='}{item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <span className="text-gray-400">{item.previousQuantity}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{item.newQuantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ReasonBadge reason={item.reason} />
                    {item.notes && (
                      <p className="mt-1 text-xs text-gray-500 truncate max-w-xs" title={item.notes}>
                        {item.notes}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjustment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} />

            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {adjustmentType === 'add' ? 'Add Stock' : adjustmentType === 'remove' ? 'Remove Stock' : 'Set Stock Level'}
                  </h3>

                  <div className="space-y-4">
                    {/* Product Selection */}
                    <div>
                      <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="productId"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        placeholder="Enter product ID"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Location Selection */}
                    <div>
                      <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="locationId"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select location...</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Adjustment Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adjustment Type
                      </label>
                      <div className="flex gap-2">
                        {(['add', 'remove', 'set'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAdjustmentType(type)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
                              adjustmentType === type
                                ? type === 'add'
                                  ? 'bg-green-600 text-white'
                                  : type === 'remove'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type === 'add' ? 'Add' : type === 'remove' ? 'Remove' : 'Set'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                        min={1}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {reasons.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Optional notes..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm disabled:opacity-50 ${
                      adjustmentType === 'add'
                        ? 'bg-green-600 hover:bg-green-700'
                        : adjustmentType === 'remove'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Apply Adjustment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
