'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import Link from 'next/link'

const initialState: ChangePasswordState = {}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState
  )
  const [showPasswords, setShowPasswords] = useState(false)

  if (state.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-olive/10 p-4 border border-olive/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-olive"
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
              <h3 className="text-sm font-heading font-semibold text-olive">
                Password changed successfully
              </h3>
              <p className="mt-2 text-sm text-charcoal">
                Your password has been updated. You can now use your new
                password to sign in.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/profile"
          className="btn-primary flex w-full justify-center"
        >
          Back to profile
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
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
          className="label"
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
            disabled={isPending}
            className="input w-full disabled:bg-light-beige disabled:text-medium-gray disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="label"
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
            disabled={isPending}
            className="input w-full disabled:bg-light-beige disabled:text-medium-gray disabled:cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-sm text-medium-gray">
          Must be at least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="label"
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
            disabled={isPending}
            className="input w-full disabled:bg-light-beige disabled:text-medium-gray disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="showPasswords"
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="h-4 w-4 rounded border-light-gray text-olive focus:ring-olive"
        />
        <label
          htmlFor="showPasswords"
          className="ml-2 block text-sm text-charcoal"
        >
          Show passwords
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Changing password...' : 'Change password'}
        </button>
        <Link
          href="/profile"
          className="btn-outline flex-1 text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
