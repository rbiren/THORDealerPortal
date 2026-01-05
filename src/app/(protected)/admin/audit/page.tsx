import { Suspense } from 'react'
import Link from 'next/link'
import { fetchAuditLogs, fetchAuditStats, getFilterUsers, getEntityTypes, getActionTypes } from './actions'
import { AuditLogTable } from './AuditLogTable'
import { z } from 'zod'

export const metadata = {
  title: 'Audit Logs - THOR Dealer Portal Admin',
  description: 'View audit logs for the THOR Dealer Portal',
}

const filterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
})

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function AuditTableWrapper({ searchParams }: Props) {
  const params = await searchParams

  const filters = filterSchema.parse({
    userId: typeof params.userId === 'string' ? params.userId : undefined,
    action: typeof params.action === 'string' ? params.action : undefined,
    entityType: typeof params.entityType === 'string' ? params.entityType : undefined,
    entityId: typeof params.entityId === 'string' ? params.entityId : undefined,
    startDate: typeof params.startDate === 'string' ? params.startDate : undefined,
    endDate: typeof params.endDate === 'string' ? params.endDate : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  })

  const [data, users, entityTypes, actionTypes] = await Promise.all([
    fetchAuditLogs(filters),
    getFilterUsers(),
    getEntityTypes(),
    getActionTypes(),
  ])

  return (
    <AuditLogTable
      data={data}
      users={users}
      entityTypes={entityTypes}
      actionTypes={actionTypes}
    />
  )
}

async function AuditStats() {
  const stats = await fetchAuditStats()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="card card-body">
        <div className="text-sm font-medium text-medium-gray">Total Logs</div>
        <div className="text-2xl font-bold text-charcoal">{stats.totalLogs.toLocaleString()}</div>
      </div>
      <div className="card card-body">
        <div className="text-sm font-medium text-medium-gray">Last 24 Hours</div>
        <div className="text-2xl font-bold text-olive">{stats.recentActivity.toLocaleString()}</div>
      </div>
      <div className="card card-body">
        <div className="text-sm font-medium text-medium-gray">Top Actions</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(stats.logsByAction)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([action, count]) => (
              <span
                key={action}
                className="text-xs px-1.5 py-0.5 rounded bg-light-beige text-charcoal"
                title={`${action}: ${count}`}
              >
                {action}: {count}
              </span>
            ))}
        </div>
      </div>
      <div className="card card-body">
        <div className="text-sm font-medium text-medium-gray">Entity Types</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(stats.logsByEntityType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([type, count]) => (
              <span
                key={type}
                className="text-xs px-1.5 py-0.5 rounded bg-olive/10 text-olive"
                title={`${type}: ${count}`}
              >
                {type}: {count}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card card-body animate-pulse">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-48 bg-light-beige rounded" />
          <div className="h-10 w-36 bg-light-beige rounded" />
          <div className="h-10 w-36 bg-light-beige rounded" />
          <div className="h-10 w-48 bg-light-beige rounded" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="divide-y divide-light-beige">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 bg-light-beige rounded" />
                <div className="h-4 w-36 bg-light-beige rounded" />
                <div className="h-4 w-32 bg-light-beige rounded" />
                <div className="h-4 w-20 bg-light-beige rounded" />
                <div className="h-4 w-24 bg-light-beige rounded" />
                <div className="h-4 w-32 bg-light-beige rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function AuditLogsPage({ searchParams }: Props) {
  return (
    <div className="min-h-screen bg-light-beige">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-olive">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                      />
                    </svg>
                  </div>
                  <span className="ml-2 text-lg font-semibold text-charcoal">
                    THOR Dealer Portal
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-medium-gray hover:border-light-beige hover:text-charcoal"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-medium-gray hover:border-light-beige hover:text-charcoal"
                >
                  Users
                </Link>
                <Link
                  href="/admin/dealers"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-medium-gray hover:border-light-beige hover:text-charcoal"
                >
                  Dealers
                </Link>
                <Link
                  href="/admin/audit"
                  className="inline-flex items-center border-b-2 border-olive px-1 pt-1 text-sm font-medium text-charcoal"
                >
                  Audit Logs
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm text-medium-gray hover:text-charcoal"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="page-header">
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/users">Admin</Link>
            <span>/</span>
            <span>Audit Log</span>
          </nav>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">
            View and search the audit trail for all system activities
          </p>
        </div>

        <Suspense fallback={<div className="animate-pulse h-32 bg-light-beige rounded-lg mb-6" />}>
          <AuditStats />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <AuditTableWrapper searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}
