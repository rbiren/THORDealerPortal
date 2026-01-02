'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { AuditLogEntry, AuditLogResult } from './actions'

type Props = {
  data: AuditLogResult
  users: { id: string; name: string; email: string }[]
  entityTypes: string[]
  actionTypes: string[]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function JsonViewer({ data, title }: { data: Record<string, unknown> | null; title: string }) {
  if (!data) return <span className="text-gray-400 italic">None</span>

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function LogDetail({ log }: { log: AuditLogEntry }) {
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Log ID</div>
          <div className="text-sm font-mono">{log.id}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">Entity ID</div>
          <div className="text-sm font-mono">{log.entityId || <span className="text-gray-400">N/A</span>}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">IP Address</div>
          <div className="text-sm font-mono">{log.ipAddress || <span className="text-gray-400">Unknown</span>}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1">User Agent</div>
          <div className="text-sm truncate" title={log.userAgent || undefined}>
            {log.userAgent ? (
              log.userAgent.length > 40 ? log.userAgent.slice(0, 40) + '...' : log.userAgent
            ) : (
              <span className="text-gray-400">Unknown</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <JsonViewer data={log.oldValues} title="Previous Values" />
        <JsonViewer data={log.newValues} title="New Values" />
      </div>
    </div>
  )
}

export function AuditLogTable({ data, users, entityTypes, actionTypes }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { logs, total, page, pageSize, totalPages } = data

  const updateFilters = (updates: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedIds(newSet)
  }

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-gray-100 text-gray-800',
      login_failed: 'bg-orange-100 text-orange-800',
      password_change: 'bg-yellow-100 text-yellow-800',
      password_reset: 'bg-pink-100 text-pink-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const hasActiveFilters = () => {
    return (
      searchParams.has('userId') ||
      searchParams.has('action') ||
      searchParams.has('entityType') ||
      searchParams.has('entityId') ||
      searchParams.has('startDate') ||
      searchParams.has('endDate')
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          {/* User Filter */}
          <div className="min-w-[200px]">
            <label htmlFor="userId" className="block text-xs font-medium text-gray-500 mb-1">
              User
            </label>
            <select
              id="userId"
              value={searchParams.get('userId') || ''}
              onChange={(e) => updateFilters({ userId: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="min-w-[150px]">
            <label htmlFor="action" className="block text-xs font-medium text-gray-500 mb-1">
              Action
            </label>
            <select
              id="action"
              value={searchParams.get('action') || ''}
              onChange={(e) => updateFilters({ action: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="min-w-[150px]">
            <label htmlFor="entityType" className="block text-xs font-medium text-gray-500 mb-1">
              Entity Type
            </label>
            <select
              id="entityType"
              value={searchParams.get('entityType') || ''}
              onChange={(e) => updateFilters({ entityType: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Entity ID Search */}
          <div className="min-w-[200px]">
            <label htmlFor="entityId" className="block text-xs font-medium text-gray-500 mb-1">
              Entity ID
            </label>
            <input
              id="entityId"
              type="text"
              placeholder="Search by entity ID..."
              value={searchParams.get('entityId') || ''}
              onChange={(e) => updateFilters({ entityId: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="min-w-[180px]">
            <label htmlFor="startDate" className="block text-xs font-medium text-gray-500 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="datetime-local"
              value={searchParams.get('startDate') || ''}
              onChange={(e) => updateFilters({ startDate: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="min-w-[180px]">
            <label htmlFor="endDate" className="block text-xs font-medium text-gray-500 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="datetime-local"
              value={searchParams.get('endDate') || ''}
              onChange={(e) => updateFilters({ endDate: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>
          {hasActiveFilters() && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-8 px-4 py-3"></th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Entity Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Entity ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-4 py-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              expandedIds.has(log.id) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user.firstName} {log.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.entityType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-600">
                          {log.entityId ? (
                            log.entityId.length > 20 ? log.entityId.slice(0, 20) + '...' : log.entityId
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </span>
                      </td>
                    </tr>
                    {expandedIds.has(log.id) && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6}>
                          <LogDetail log={log} />
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => updateFilters({ page: String(page - 1) })}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => updateFilters({ page: String(page + 1) })}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => updateFilters({ page: String(page - 1) })}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilters({ page: String(pageNum) })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => updateFilters({ page: String(page + 1) })}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
