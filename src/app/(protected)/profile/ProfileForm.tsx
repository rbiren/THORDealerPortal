'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { updateProfileAction, type ProfileState } from './actions'

interface ProfileFormProps {
  user: {
    firstName: string
    lastName: string
    phone: string | null
  }
}

const initialState: ProfileState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  )
}

function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      Cancel
    </button>
  )
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction] = useFormState(
    updateProfileAction,
    initialState
  )
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">First name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.firstName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.lastName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.phone || 'Not provided'}
            </dd>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Edit profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData)
        if (!state.error) {
          setIsEditing(false)
        }
      }}
      className="space-y-6"
    >
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

      {state.success && (
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
              <p className="text-sm font-medium text-green-800">
                Profile updated successfully
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            First name
          </label>
          <div className="mt-2">
            <input
              id="firstName"
              name="firstName"
              type="text"
              defaultValue={user.firstName}
              className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Last name
          </label>
          <div className="mt-2">
            <input
              id="lastName"
              name="lastName"
              type="text"
              defaultValue={user.lastName}
              className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Phone number
          </label>
          <div className="mt-2">
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || ''}
              className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="(555) 555-5555"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <SubmitButton />
        <CancelButton onClick={() => setIsEditing(false)} />
      </div>
    </form>
  )
}
