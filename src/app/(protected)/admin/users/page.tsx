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
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-10 bg-light-gray rounded" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="divide-y divide-light-gray">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 bg-light-gray rounded" />
                <div className="h-4 w-48 bg-light-gray rounded" />
                <div className="h-4 w-32 bg-light-gray rounded" />
                <div className="h-4 w-24 bg-light-gray rounded" />
                <div className="h-4 w-20 bg-light-gray rounded" />
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
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/users">Admin</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Users</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage users, roles, and permissions</p>
          </div>
          <Link href="/admin/users/new" className="btn-primary">
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
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <UserTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
