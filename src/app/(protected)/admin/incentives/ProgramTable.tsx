'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ProgramListResult, changeProgramStatus, deleteIncentiveProgram } from './actions'

type Props = {
  data: ProgramListResult
  types: Array<{ value: string; label: string }>
  statuses: Array<{ value: string; label: string }>
}

export function ProgramTable({ data, types, statuses }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete('page') // Reset to page 1 on filter change
    router.push(`?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const handleStatusAction = async (id: string, action: 'activate' | 'pause' | 'complete' | 'cancel') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this program?')) return

    startTransition(async () => {
      const result = await changeProgramStatus(id, action)
      if (!result.success) {
        alert(result.message)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program? This cannot be undone.')) return

    startTransition(async () => {
      const result = await deleteIncentiveProgram(id)
      if (!result.success) {
        alert(result.message)
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'badge-gray',
      active: 'badge-success',
      paused: 'badge-warning',
      completed: 'badge-info',
      cancelled: 'badge-danger',
    }
    return styles[status] || 'badge-gray'
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      rebate: 'bg-blue-100 text-blue-800',
      coop: 'bg-green-100 text-green-800',
      contest: 'bg-purple-100 text-purple-800',
      spiff: 'bg-orange-100 text-orange-800',
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search programs..."
                className="input w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-40"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                updateFilters({ type: e.target.value })
              }}
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="input w-40"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                updateFilters({ status: e.target.value })
              }}
            >
              <option value="all">All Status</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Type</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Enrollments</th>
                <th>Budget</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={isPending ? 'opacity-50' : ''}>
              {data.programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-medium-gray">
                    No programs found. Create your first incentive program.
                  </td>
                </tr>
              ) : (
                data.programs.map((program) => (
                  <tr key={program.id}>
                    <td>
                      <Link
                        href={`/admin/incentives/${program.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {program.name}
                      </Link>
                      <div className="text-sm text-medium-gray">{program.code}</div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(program.type)}`}>
                        {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(program.status)}`}>
                        {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{formatDate(program.startDate)}</div>
                        {program.endDate && (
                          <div className="text-medium-gray">to {formatDate(program.endDate)}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{program.activeEnrollments}</span>
                      <span className="text-medium-gray"> active</span>
                    </td>
                    <td>
                      {program.budgetAmount ? (
                        <div className="text-sm">
                          <div>{formatCurrency(program.spentAmount)} spent</div>
                          <div className="text-medium-gray">of {formatCurrency(program.budgetAmount)}</div>
                        </div>
                      ) : (
                        <span className="text-medium-gray">No limit</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/incentives/${program.id}`}
                          className="btn-sm btn-outline"
                        >
                          View
                        </Link>
                        <div className="relative group">
                          <button className="btn-sm btn-outline">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-light-gray opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="py-1">
                              {program.status === 'draft' && (
                                <button
                                  onClick={() => handleStatusAction(program.id, 'activate')}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-light-beige"
                                >
                                  Activate
                                </button>
                              )}
                              {program.status === 'active' && (
                                <button
                                  onClick={() => handleStatusAction(program.id, 'pause')}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-light-beige"
                                >
                                  Pause
                                </button>
                              )}
                              {program.status === 'paused' && (
                                <button
                                  onClick={() => handleStatusAction(program.id, 'activate')}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-light-beige"
                                >
                                  Resume
                                </button>
                              )}
                              {['active', 'paused'].includes(program.status) && (
                                <button
                                  onClick={() => handleStatusAction(program.id, 'complete')}
                                  className="block w-full text-left px-4 py-2 text-sm hover:bg-light-beige"
                                >
                                  Complete
                                </button>
                              )}
                              {program.status === 'draft' && (
                                <button
                                  onClick={() => handleDelete(program.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="border-t border-light-gray px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-medium-gray">
              Showing {(data.page - 1) * data.pageSize + 1} to{' '}
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} programs
            </div>
            <div className="flex gap-2">
              <button
                className="btn-sm btn-outline"
                disabled={data.page === 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(data.page - 1))
                  router.push(`?${params.toString()}`)
                }}
              >
                Previous
              </button>
              <button
                className="btn-sm btn-outline"
                disabled={data.page === data.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', String(data.page + 1))
                  router.push(`?${params.toString()}`)
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
