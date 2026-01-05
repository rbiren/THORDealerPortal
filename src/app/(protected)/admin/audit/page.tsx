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
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Total Logs</div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Last 24 Hours</div>
        <div className="text-2xl font-bold text-blue-600">{stats.recentActivity.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Top Actions</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(stats.logsByAction)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([action, count]) => (
              <span
                key={action}
                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800"
                title={`${action}: ${count}`}
              >
                {action}: {count}
              </span>
            ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Entity Types</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(stats.logsByEntityType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([type, count]) => (
              <span
                key={type}
                className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800"
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
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
          <div className="h-10 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and search the audit trail for all system activities
        </p>
      </div>

      <Suspense fallback={<div className="animate-pulse h-32 bg-gray-200 rounded-lg" />}>
        <AuditStats />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <AuditTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
