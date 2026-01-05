'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getWarrantyClaims,
  getWarrantyStatsAction,
  deleteWarrantyClaimAction,
  submitWarrantyClaimAction,
  isUserAdmin,
  type WarrantyClaimListItem,
  type WarrantyStatsResult,
} from './actions'

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'info_requested', label: 'Info Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'partial', label: 'Partially Approved' },
  { value: 'denied', label: 'Denied' },
]

const claimTypeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'product_defect', label: 'Product Defect' },
  { value: 'shipping_damage', label: 'Shipping Damage' },
  { value: 'missing_parts', label: 'Missing Parts' },
  { value: 'installation_issue', label: 'Installation Issue' },
  { value: 'other', label: 'Other' },
]

export default function WarrantyPage() {
  const [claims, setClaims] = useState<WarrantyClaimListItem[]>([])
  const [stats, setStats] = useState<WarrantyStatsResult | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadClaims()
    loadStats()
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const admin = await isUserAdmin()
    setIsAdmin(admin)
  }

  async function loadClaims(page = 1) {
    startTransition(async () => {
      const result = await getWarrantyClaims({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        claimType: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
        page,
        pageSize: 20,
      })
      setClaims(result.claims)
      setPagination(result.pagination)
    })
  }

  async function loadStats() {
    const result = await getWarrantyStatsAction()
    setStats(result)
  }

  function handleSearch() {
    loadClaims(1)
  }

  function handleFilterChange(filterType: 'status' | 'type', value: string) {
    if (filterType === 'status') {
      setStatusFilter(value)
    } else {
      setTypeFilter(value)
    }
    // Reload with new filter
    startTransition(async () => {
      const result = await getWarrantyClaims({
        status: filterType === 'status' ? (value !== 'all' ? value : undefined) : (statusFilter !== 'all' ? statusFilter : undefined),
        claimType: filterType === 'type' ? (value !== 'all' ? value : undefined) : (typeFilter !== 'all' ? typeFilter : undefined),
        search: searchQuery || undefined,
        page: 1,
        pageSize: 20,
      })
      setClaims(result.claims)
      setPagination(result.pagination)
    })
  }

  async function handleDelete(claimId: string) {
    if (!confirm('Are you sure you want to delete this draft claim?')) return

    startTransition(async () => {
      const result = await deleteWarrantyClaimAction(claimId)
      if (result.success) {
        loadClaims(pagination.page)
        loadStats()
      } else {
        alert(result.error || 'Failed to delete claim')
      }
    })
  }

  async function handleSubmit(claimId: string) {
    if (!confirm('Submit this warranty claim for review?')) return

    startTransition(async () => {
      const result = await submitWarrantyClaimAction(claimId)
      if (result.success) {
        loadClaims(pagination.page)
        loadStats()
      } else {
        alert(result.error || 'Failed to submit claim')
      }
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Warranty Claims</span>
          </nav>
          <h1 className="page-title">Warranty Claims</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Manage warranty claims from dealers' : 'Submit and track your warranty claims'}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/warranty/new" className="btn-primary inline-flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Claim
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">Total Claims</p>
              <p className="text-2xl font-heading font-bold text-charcoal">{stats.total}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-blue-600">{stats.pending}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">In Review</p>
              <p className="text-2xl font-heading font-bold text-yellow-600">{stats.inReview}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">Approved</p>
              <p className="text-2xl font-heading font-bold text-olive">{stats.approved}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">Requested</p>
              <p className="text-xl font-heading font-bold text-charcoal">{formatCurrency(stats.totalRequested)}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-4">
              <p className="text-sm text-medium-gray">Approved Amt</p>
              <p className="text-xl font-heading font-bold text-olive">{formatCurrency(stats.totalApproved)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by claim #, product, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input pl-10 w-full"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-medium-gray"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input w-full"
              >
                {statusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="sm:w-44">
              <select
                value={typeFilter}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input w-full"
              >
                {claimTypeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button onClick={handleSearch} className="btn-primary px-6">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card">
        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-light-gray"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-charcoal">No warranty claims found</h3>
              <p className="mt-2 text-medium-gray">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Submit your first warranty claim to get started'}
              </p>
              {!isAdmin && !searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                <Link href="/warranty/new" className="btn-primary mt-4 inline-flex">
                  Submit Warranty Claim
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Claim #
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                      Dealer
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/warranty/${claim.id}`}
                        className="font-medium text-olive hover:underline"
                      >
                        {claim.claimNumber}
                      </Link>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4">
                        <p className="font-medium text-charcoal">{claim.dealerName}</p>
                        <p className="text-sm text-medium-gray">{claim.dealerCode}</p>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <p className="text-charcoal truncate max-w-[200px]">{claim.productName}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-medium-gray">
                      {claim.claimTypeLabel}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${claim.statusColor.bg} ${claim.statusColor.text}`}
                      >
                        {claim.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${claim.priorityColor.bg} ${claim.priorityColor.text}`}
                      >
                        {claim.priorityLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-medium text-charcoal">{formatCurrency(claim.totalRequested)}</p>
                      {claim.totalApproved !== null && (
                        <p className="text-sm text-olive">{formatCurrency(claim.totalApproved)} approved</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-medium-gray">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {claim.status === 'draft' && !isAdmin && (
                          <>
                            <button
                              onClick={() => handleSubmit(claim.id)}
                              className="text-olive hover:text-olive-800 p-1"
                              title="Submit"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(claim.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                        <Link
                          href={`/warranty/${claim.id}`}
                          className="text-olive hover:text-olive-800 p-1"
                          title="View Details"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-medium-gray">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} claims
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadClaims(pagination.page - 1)}
                disabled={pagination.page === 1 || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadClaims(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || isPending}
                className="btn-outline btn-sm disabled:opacity-50"
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
