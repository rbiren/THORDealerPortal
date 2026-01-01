'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUser,
  updateUser,
  deleteUser,
  type UserDetail,
  type CreateUserState,
  type UpdateUserState,
} from './actions'

type Props = {
  user?: UserDetail | null
  dealers: { id: string; name: string; code: string }[]
  mode: 'create' | 'edit'
}

const roles = [
  { value: 'readonly', label: 'Read Only' },
  { value: 'dealer_user', label: 'Dealer User' },
  { value: 'dealer_admin', label: 'Dealer Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

export function UserForm({ user, dealers, mode }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'dealer_user',
    status: user?.status || 'active',
    dealerId: user?.dealerId || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
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
      let result: CreateUserState | UpdateUserState

      if (mode === 'create') {
        result = await createUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role as 'super_admin' | 'admin' | 'dealer_admin' | 'dealer_user' | 'readonly',
          status: formData.status as 'active' | 'inactive' | 'pending' | 'suspended',
          dealerId: formData.dealerId || undefined,
        })
      } else {
        result = await updateUser({
          id: user!.id,
          email: formData.email !== user?.email ? formData.email : undefined,
          firstName: formData.firstName !== user?.firstName ? formData.firstName : undefined,
          lastName: formData.lastName !== user?.lastName ? formData.lastName : undefined,
          phone: formData.phone !== (user?.phone || '') ? (formData.phone || null) : undefined,
          role: formData.role !== user?.role ? (formData.role as 'super_admin' | 'admin' | 'dealer_admin' | 'dealer_user' | 'readonly') : undefined,
          status: formData.status !== user?.status ? (formData.status as 'active' | 'inactive' | 'pending' | 'suspended') : undefined,
          dealerId: formData.dealerId !== (user?.dealerId || '') ? (formData.dealerId || null) : undefined,
        })
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (mode === 'create' && 'userId' in result) {
          setTimeout(() => router.push('/admin/users'), 1000)
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
    if (!user) return

    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result.success) {
        router.push('/admin/users')
      } else {
        setMessage({ type: 'error', text: result.message })
        setShowDeleteConfirm(false)
      }
    })
  }

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Email */}
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName[0]}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName[0]}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Password (only for create) */}
        {mode === 'create' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Min 8 characters, with uppercase, lowercase, and number
            </p>
          </div>
        )}

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
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

        {/* Dealer */}
        <div className="sm:col-span-2">
          <label htmlFor="dealerId" className="block text-sm font-medium text-gray-700">
            Dealer <span className="text-gray-400">(optional)</span>
          </label>
          <select
            id="dealerId"
            name="dealerId"
            value={formData.dealerId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">No dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name} ({dealer.code})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Assign user to a dealer for dealer-specific access
          </p>
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
                  Delete User
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
