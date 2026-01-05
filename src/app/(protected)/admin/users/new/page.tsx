import Link from 'next/link'
import { getDealers } from '../actions'
import { UserForm } from '../UserForm'

export const metadata = {
  title: 'Create User - THOR Dealer Portal Admin',
  description: 'Create a new user in the THOR Dealer Portal',
}

export default async function NewUserPage() {
  const dealers = await getDealers()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new user to the THOR Dealer Portal
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <UserForm dealers={dealers} mode="create" />
        </div>
      </div>
    </div>
  )
}
