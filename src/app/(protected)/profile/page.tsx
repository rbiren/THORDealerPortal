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
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Profile</span>
        </nav>
        <h1 className="page-title">Your Profile</h1>
        <p className="page-subtitle">Manage your account settings and personal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-4 pb-6 border-b border-light-gray">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-olive/10 text-olive text-xl font-heading font-bold">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-charcoal">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-medium-gray">{user.email}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-base font-heading font-semibold text-charcoal mb-4">
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
          <div className="card">
            <div className="card-body">
              <h3 className="text-base font-heading font-semibold text-charcoal mb-4">
                Account Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-medium-gray">Email</dt>
                  <dd className="mt-1 text-sm text-charcoal">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-medium-gray">Role</dt>
                  <dd className="mt-1">
                    <span className="badge badge-info">
                      {user.role.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-medium-gray">Status</dt>
                  <dd className="mt-1">
                    <span className={user.status === 'active' ? 'badge badge-success' : 'badge badge-neutral'}>
                      {user.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-medium-gray">Member since</dt>
                  <dd className="mt-1 text-sm text-charcoal">
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
            <div className="card">
              <div className="card-body">
                <h3 className="text-base font-heading font-semibold text-charcoal mb-4">
                  Dealer Information
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-medium-gray">Dealer Name</dt>
                    <dd className="mt-1 text-sm text-charcoal">{user.dealer.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-medium-gray">Dealer Code</dt>
                    <dd className="mt-1 text-sm text-charcoal">{user.dealer.code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-medium-gray">Tier</dt>
                    <dd className="mt-1">
                      <span
                        className={`badge ${
                          user.dealer.tier === 'platinum'
                            ? 'badge-info'
                            : user.dealer.tier === 'gold'
                              ? 'badge-warning'
                              : user.dealer.tier === 'silver'
                                ? 'badge-neutral'
                                : 'bg-burnt-orange/10 text-burnt-orange'
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
          <div className="card">
            <div className="card-body">
              <h3 className="text-base font-heading font-semibold text-charcoal mb-4">
                Security
              </h3>
              <div className="space-y-3">
                <Link
                  href="/profile/change-password"
                  className="flex items-center justify-between rounded-md border border-light-gray px-4 py-3 hover:bg-light-beige transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-medium-gray"
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
                    <span className="text-sm font-medium text-charcoal">
                      Change password
                    </span>
                  </div>
                  <svg
                    className="h-5 w-5 text-medium-gray"
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
  )
}
