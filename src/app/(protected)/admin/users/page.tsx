import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers, getDealers } from './actions'
import { UserTable } from './UserTable'
import { userFilterSchema } from '@/lib/validations/user'

export const metadata = {
  title: 'User Management - THOR Dealer Portal Admin',
  description: 'Manage users in the THOR Dealer Portal',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function UserTableWrapper({ searchParams }: Props) {
  const params = await searchParams

  // Parse search params with defaults
  const filters = userFilterSchema.parse({
    search: typeof params.search === 'string' ? params.search : undefined,
    role: typeof params.role === 'string' ? params.role : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    dealerId: typeof params.dealerId === 'string' ? params.dealerId : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
  })

  const [data, dealers] = await Promise.all([getUsers(filters), getDealers()])

  return <UserTable data={data} dealers={dealers} />
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
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function UsersPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage users, roles, and permissions
          </p>
        </div>
        <Link
          href="/admin/users/new"
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
          Add User
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <UserTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
