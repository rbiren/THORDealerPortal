import { redirect } from 'next/navigation'
import { getProfileData } from './actions'
import { ProfileForm } from './ProfileForm'
import Link from 'next/link'

export const metadata = {
  title: 'Profile - THOR Dealer Portal',
  description: 'Manage your THOR Dealer Portal profile',
}

export default async function ProfilePage() {
  const user = await getProfileData()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl font-bold">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <ProfileForm
                    user={{
                      firstName: user.firstName,
                      lastName: user.lastName,
                      phone: user.phone,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Account Information
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {user.role.replace('_', ' ')}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Member since
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Dealer Info (if applicable) */}
            {user.dealer && (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Dealer Information
                  </h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Dealer Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.dealer.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Dealer Code
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.dealer.code}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Tier
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.dealer.tier === 'platinum'
                              ? 'bg-purple-100 text-purple-800'
                              : user.dealer.tier === 'gold'
                                ? 'bg-yellow-100 text-yellow-800'
                                : user.dealer.tier === 'silver'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {user.dealer.tier}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Security
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/profile/change-password"
                    className="flex items-center justify-between rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">
                        Change password
                      </span>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
