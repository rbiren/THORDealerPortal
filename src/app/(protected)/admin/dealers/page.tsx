import { Suspense } from 'react'
import Link from 'next/link'
import { getDealers, getDealerStats } from './actions'
import { DealerTable } from './DealerTable'
import { dealerFilterSchema } from '@/lib/validations/dealer'

export const metadata = {
  title: 'Dealer Management - THOR Dealer Portal Admin',
  description: 'Manage dealers in the THOR Dealer Portal',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function DealerTableWrapper({ searchParams }: Props) {
  const params = await searchParams

  const filters = dealerFilterSchema.parse({
    search: typeof params.search === 'string' ? params.search : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    tier: typeof params.tier === 'string' ? params.tier : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
  })

  const data = await getDealers(filters)

  return <DealerTable data={data} />
}

async function DealerStats() {
  const stats = await getDealerStats()

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Total Dealers</div>
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Active</div>
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Pending</div>
        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">By Tier</div>
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
            P: {stats.byTier.platinum}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
            G: {stats.byTier.gold}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
            S: {stats.byTier.silver}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
            B: {stats.byTier.bronze}
          </span>
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function DealersPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dealer Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage dealer accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dealers/hierarchy"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
            Hierarchy
          </Link>
          <Link
            href="/admin/dealers/onboarding"
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            Onboard
          </Link>
          <Link
            href="/admin/dealers/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Dealer
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded-lg" />}>
        <DealerStats />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DealerTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
