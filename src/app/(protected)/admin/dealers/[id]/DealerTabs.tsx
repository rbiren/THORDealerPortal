'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type {
  DealerDetail,
  DealerUser,
  DealerOrder,
  DealerContact,
  DealerAddress,
} from '../actions'
import { DealerForm } from '../DealerForm'

type Props = {
  dealer: DealerDetail
  users: DealerUser[]
  orders: DealerOrder[]
  contacts: DealerContact[]
  addresses: DealerAddress[]
  parentDealers: { id: string; name: string; code: string }[]
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'orders', label: 'Orders' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'settings', label: 'Settings' },
]

export function DealerTabs({ dealer, users, orders, contacts, addresses, parentDealers }: Props) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      dealer_admin: 'bg-indigo-100 text-indigo-800',
      dealer_user: 'bg-cyan-100 text-cyan-800',
      readonly: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/dealers/${dealer.id}?tab=${tab.id}`}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                currentTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'users' && users.length > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                  {users.length}
                </span>
              )}
              {tab.id === 'orders' && orders.length > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                  {orders.length}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Users</div>
              <div className="text-2xl font-bold text-gray-900">{dealer._count.users}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Orders</div>
              <div className="text-2xl font-bold text-gray-900">{dealer._count.orders}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Child Dealers</div>
              <div className="text-2xl font-bold text-gray-900">{dealer._count.childDealers}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Member Since</div>
              <div className="text-sm font-bold text-gray-900">
                {new Date(dealer.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">EIN</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dealer.ein || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">License Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dealer.licenseNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Insurance Policy</dt>
                  <dd className="mt-1 text-sm text-gray-900">{dealer.insurancePolicy || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Parent Dealer</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {dealer.parentDealer ? (
                      <Link
                        href={`/admin/dealers/${dealer.parentDealer.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {dealer.parentDealer.name} ({dealer.parentDealer.code})
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Recent Activity */}
          {orders.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-medium">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Users ({users.length})</h3>
              <Link
                href={`/admin/users/new?dealerId=${dealer.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add User
              </Link>
            </div>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">No users assigned to this dealer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'orders' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Orders ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders for this dealer yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'contacts' && (
        <div className="space-y-6">
          {/* Contacts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contacts</h3>
              {contacts.length === 0 ? (
                <p className="text-gray-500 text-sm">No contacts added yet.</p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{contact.type}</span>
                          {contact.isPrimary && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Primary</span>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">{contact.email}</div>
                        {contact.phone && (
                          <div className="text-sm text-gray-500">{contact.phone}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Addresses</h3>
              {addresses.length === 0 ? (
                <p className="text-gray-500 text-sm">No addresses added yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {addresses.map((address) => (
                    <div key={address.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{address.type}</span>
                        {address.isPrimary && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Primary</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-900">
                        <div>{address.street}</div>
                        {address.street2 && <div>{address.street2}</div>}
                        <div>
                          {address.city}, {address.state} {address.zipCode}
                        </div>
                        <div>{address.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'settings' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Edit Dealer Settings</h3>
            <DealerForm dealer={dealer} parentDealers={parentDealers} mode="edit" />
          </div>
        </div>
      )}
    </div>
  )
}
