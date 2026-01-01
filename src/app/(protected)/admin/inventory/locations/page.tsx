'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
  type LocationListItem,
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

const locationTypes = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store', label: 'Store' },
  { value: 'distribution_center', label: 'Distribution Center' },
]

type FormData = {
  name: string
  code: string
  type: 'warehouse' | 'store' | 'distribution_center'
  address: string
  isActive: boolean
}

const emptyForm: FormData = {
  name: '',
  code: '',
  type: 'warehouse',
  address: '',
  isActive: true,
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadLocations = async () => {
    setIsLoading(true)
    try {
      const data = await getLocations()
      setLocations(data)
    } catch (error) {
      console.error('Failed to load locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const handleCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const handleEdit = (location: LocationListItem) => {
    setEditingId(location.id)
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type as FormData['type'],
      address: location.address || '',
      isActive: location.isActive,
    })
    setErrors({})
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyForm)
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setMessage(null)

    try {
      const input = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        address: formData.address || undefined,
        isActive: formData.isActive,
      }

      const result = editingId
        ? await updateLocation(editingId, input)
        : await createLocation(input)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        handleClose()
        loadLocations()
      } else {
        if (result.errors) {
          setErrors(result.errors)
        }
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (location: LocationListItem) => {
    if (location.inventoryCount > 0) {
      setMessage({
        type: 'error',
        text: `Cannot delete "${location.name}" - it has ${location.inventoryCount} inventory items`,
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return
    }

    setMessage(null)
    const result = await deleteLocation(location.id)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      loadLocations()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const handleToggleStatus = async (location: LocationListItem) => {
    setMessage(null)
    const result = await toggleLocationStatus(location.id)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      loadLocations()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  const TypeBadge = ({ type }: { type: string }) => {
    const config = {
      warehouse: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Warehouse' },
      store: { bg: 'bg-green-100', text: 'text-green-800', label: 'Store' },
      distribution_center: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Distribution Center' },
    }[type] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: type }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
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
              <li className="font-medium text-gray-900">Locations</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Locations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage warehouses, stores, and distribution centers
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
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

      {/* Location List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : locations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2">No locations configured</p>
            <button
              onClick={handleCreate}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Add your first location
            </button>
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
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                      {location.address && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">{location.address}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TypeBadge type={location.type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(location.inventoryCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(location.totalStock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(location.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(location)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {location.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(location)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location)}
                        className="text-red-600 hover:text-red-900"
                        disabled={location.inventoryCount > 0}
                        title={location.inventoryCount > 0 ? 'Cannot delete location with inventory' : 'Delete location'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? 'Edit Location' : 'Add Location'}
                  </h3>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
                      )}
                    </div>

                    {/* Code */}
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                          errors.code ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="WH-001"
                        required
                      />
                      {errors.code && (
                        <p className="mt-1 text-sm text-red-600">{errors.code[0]}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Letters, numbers, and hyphens only
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as FormData['type'] })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {locationTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Address */}
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="123 Warehouse St, City, State 12345"
                      />
                    </div>

                    {/* Active */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
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
