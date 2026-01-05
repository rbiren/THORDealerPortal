import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser, getDealers } from '../actions'
import { UserForm } from '../UserForm'

export const metadata = {
  title: 'Edit User - THOR Dealer Portal Admin',
  description: 'Edit user in the THOR Dealer Portal',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  const [user, dealers] = await Promise.all([getUser(id), getDealers()])

  if (!user) {
    notFound()
  }

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
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg font-bold">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Edit User</h2>
          <UserForm user={user} dealers={dealers} mode="edit" />
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">MFA Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.mfaEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.mfaEnabled ? 'Enabled' : 'Not Enabled'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
