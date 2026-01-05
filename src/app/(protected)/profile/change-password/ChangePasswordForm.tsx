'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import Link from 'next/link'

const initialState: ChangePasswordState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Changing password...' : 'Change password'}
    </button>
  )
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(
    changePasswordAction,
    initialState
  )
  const [showPasswords, setShowPasswords] = useState(false)

  if (state.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Password changed successfully
              </h3>
              <p className="mt-2 text-sm text-green-700">
                Your password has been updated. You can now use your new
                password to sign in.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/profile"
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Back to profile
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Current password
        </label>
        <div className="mt-2">
          <input
            id="currentPassword"
            name="currentPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          New password
        </label>
        <div className="mt-2">
          <input
            id="newPassword"
            name="newPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Must be at least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Confirm new password
        </label>
        <div className="mt-2">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="showPasswords"
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
        />
        <label
          htmlFor="showPasswords"
          className="ml-2 block text-sm text-gray-900"
        >
          Show passwords
        </label>
      </div>

      <div className="flex gap-3">
        <SubmitButton />
        <Link
          href="/profile"
          className="flex-1 text-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
