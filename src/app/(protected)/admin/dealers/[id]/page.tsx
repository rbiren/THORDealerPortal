import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getDealer,
  getParentDealers,
  getDealerUsers,
  getDealerOrders,
  getDealerContacts,
  getDealerAddresses,
} from '../actions'
import { DealerTabs } from './DealerTabs'

export const metadata = {
  title: 'Dealer Details - THOR Dealer Portal Admin',
  description: 'View and manage dealer in the THOR Dealer Portal',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function DealerDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch all dealer data in parallel
  const [dealer, parentDealers, users, orders, contacts, addresses] = await Promise.all([
    getDealer(id),
    getParentDealers(),
    getDealerUsers(id),
    getDealerOrders(id),
    getDealerContacts(id),
    getDealerAddresses(id),
  ])

  if (!dealer) {
    notFound()
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-200 text-gray-800',
      bronze: 'bg-orange-100 text-orange-800',
    }
    return colors[tier] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
          <Link
            href="/admin/dealers"
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
            Back to dealers
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-lg font-bold">
                {dealer.code.substring(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{dealer.name}</h1>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(dealer.tier)}`}>
                    {dealer.tier}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dealer.status)}`}>
                    {dealer.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">{dealer.code}</p>
              </div>
            </div>
          </div>
        </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <DealerTabs
          dealer={dealer}
          users={users}
          orders={orders}
          contacts={contacts}
          addresses={addresses}
          parentDealers={parentDealers}
        />
      </Suspense>
    </div>
  )
}
