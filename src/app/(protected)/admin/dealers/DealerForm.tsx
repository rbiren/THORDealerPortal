'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createDealer,
  updateDealer,
  deleteDealer,
  type DealerDetail,
  type CreateDealerState,
  type UpdateDealerState,
} from './actions'

type Props = {
  dealer?: DealerDetail | null
  parentDealers: { id: string; name: string; code: string }[]
  mode: 'create' | 'edit'
}

const tiers = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
]

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
]

export function DealerForm({ dealer, parentDealers, mode }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    code: dealer?.code || '',
    name: dealer?.name || '',
    status: dealer?.status || 'pending',
    tier: dealer?.tier || 'bronze',
    ein: dealer?.ein || '',
    licenseNumber: dealer?.licenseNumber || '',
    insurancePolicy: dealer?.insurancePolicy || '',
    parentDealerId: dealer?.parentDealerId || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)

    startTransition(async () => {
      let result: CreateDealerState | UpdateDealerState

      if (mode === 'create') {
        result = await createDealer({
          code: formData.code,
          name: formData.name,
          status: formData.status as 'active' | 'pending' | 'suspended' | 'inactive',
          tier: formData.tier as 'platinum' | 'gold' | 'silver' | 'bronze',
          ein: formData.ein || null,
          licenseNumber: formData.licenseNumber || null,
          insurancePolicy: formData.insurancePolicy || null,
          parentDealerId: formData.parentDealerId || null,
        })
      } else {
        result = await updateDealer({
          id: dealer!.id,
          code: formData.code !== dealer?.code ? formData.code : undefined,
          name: formData.name !== dealer?.name ? formData.name : undefined,
          status: formData.status !== dealer?.status ? (formData.status as 'active' | 'pending' | 'suspended' | 'inactive') : undefined,
          tier: formData.tier !== dealer?.tier ? (formData.tier as 'platinum' | 'gold' | 'silver' | 'bronze') : undefined,
          ein: formData.ein !== (dealer?.ein || '') ? (formData.ein || null) : undefined,
          licenseNumber: formData.licenseNumber !== (dealer?.licenseNumber || '') ? (formData.licenseNumber || null) : undefined,
          insurancePolicy: formData.insurancePolicy !== (dealer?.insurancePolicy || '') ? (formData.insurancePolicy || null) : undefined,
          parentDealerId: formData.parentDealerId !== (dealer?.parentDealerId || '') ? (formData.parentDealerId || null) : undefined,
        })
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (mode === 'create' && 'dealerId' in result) {
          setTimeout(() => router.push('/admin/dealers'), 1000)
        }
      } else {
        setMessage({ type: 'error', text: result.message })
        if (result.errors) {
          setErrors(result.errors)
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!dealer) return

    startTransition(async () => {
      const result = await deleteDealer(dealer.id)
      if (result.success) {
        router.push('/admin/dealers')
      } else {
        setMessage({ type: 'error', text: result.message })
        setShowDeleteConfirm(false)
      }
    })
  }

  // Filter out current dealer from parent options to prevent circular references
  const availableParentDealers = parentDealers.filter(
    (d) => !dealer || d.id !== dealer.id
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Dealer Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              maxLength={20}
              placeholder="e.g., DLR001"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono uppercase ${
                errors.code ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code[0]}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Uppercase letters and numbers only
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Dealer Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={100}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
              Tier
            </label>
            <select
              id="tier"
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {tiers.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* EIN */}
          <div>
            <label htmlFor="ein" className="block text-sm font-medium text-gray-700">
              EIN <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="ein"
              name="ein"
              value={formData.ein}
              onChange={handleChange}
              placeholder="12-3456789"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* License Number */}
          <div>
            <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
              License Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Insurance Policy */}
          <div>
            <label htmlFor="insurancePolicy" className="block text-sm font-medium text-gray-700">
              Insurance Policy <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="insurancePolicy"
              name="insurancePolicy"
              value={formData.insurancePolicy}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Parent Dealer */}
          <div>
            <label htmlFor="parentDealerId" className="block text-sm font-medium text-gray-700">
              Parent Dealer <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="parentDealerId"
              name="parentDealerId"
              value={formData.parentDealerId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.parentDealerId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">No parent dealer</option>
              {availableParentDealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            {errors.parentDealerId && (
              <p className="mt-1 text-sm text-red-600">{errors.parentDealerId[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {mode === 'edit' && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Confirm delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Delete Dealer
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/dealers')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Create Dealer' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
