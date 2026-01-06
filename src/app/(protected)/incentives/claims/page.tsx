'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getMyClaims } from '../actions'

type ClaimData = {
  id: string
  claimNumber: string
  claimType: string
  status: string
  requestedAmount: number
  approvedAmount: number | null
  description: string | null
  createdAt: Date
  submittedAt: Date | null
  reviewedAt: Date | null
  reviewNotes: string | null
  denialReason: string | null
  program: { name: string; type: string }
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimData[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  async function loadData() {
    startTransition(async () => {
      const data = await getMyClaims()
      setClaims(data as ClaimData[])
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

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; label: string }> = {
      draft: { bg: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      under_review: { bg: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      approved: { bg: 'bg-green-100 text-green-800', label: 'Approved' },
      denied: { bg: 'bg-red-100 text-red-800', label: 'Denied' },
      paid: { bg: 'bg-purple-100 text-purple-800', label: 'Paid' },
    }
    const style = styles[status] || styles.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
        {style.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; label: string }> = {
      rebate: { bg: 'bg-blue-100 text-blue-800', label: 'Rebate' },
      coop: { bg: 'bg-green-100 text-green-800', label: 'Co-op' },
      contest: { bg: 'bg-purple-100 text-purple-800', label: 'Contest' },
      spiff: { bg: 'bg-orange-100 text-orange-800', label: 'Spiff' },
    }
    const style = styles[type] || { bg: 'bg-gray-100 text-gray-800', label: type }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
        {style.label}
      </span>
    )
  }

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'pending') return ['submitted', 'under_review'].includes(c.status)
    return c.status === filter
  })

  const statusCounts = {
    all: claims.length,
    pending: claims.filter((c) => ['submitted', 'under_review'].includes(c.status)).length,
    approved: claims.filter((c) => c.status === 'approved').length,
    paid: claims.filter((c) => c.status === 'paid').length,
    denied: claims.filter((c) => c.status === 'denied').length,
  }

  if (!mounted || isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Claims</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">My Claims</h1>
            <p className="page-subtitle">Track your incentive claims and reimbursement requests</p>
          </div>
          <Link href="/incentives/dashboard" className="btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'paid', label: 'Paid' },
          { key: 'denied', label: 'Denied' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-olive text-white'
                : 'bg-light-beige text-charcoal hover:bg-light-gray'
            }`}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
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
            <h3 className="mt-4 text-lg font-medium text-charcoal">No claims found</h3>
            <p className="mt-2 text-medium-gray">
              {filter === 'all'
                ? "You haven't submitted any claims yet"
                : `No ${filter} claims`}
            </p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Claim #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-charcoal">{claim.claimNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(claim.program.type)}
                        <span className="text-charcoal">{claim.program.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal capitalize">
                      {claim.claimType}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-charcoal">
                      {formatCurrency(claim.requestedAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {claim.approvedAmount !== null ? (
                        <span className="text-green-600">{formatCurrency(claim.approvedAmount)}</span>
                      ) : (
                        <span className="text-medium-gray">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-4 py-3 text-medium-gray">
                      {formatDate(claim.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {claims.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <p className="text-sm text-medium-gray">Total Requested</p>
              <p className="text-xl font-bold text-charcoal">
                {formatCurrency(claims.reduce((sum, c) => sum + c.requestedAmount, 0))}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-sm text-medium-gray">Total Approved</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(
                  claims
                    .filter((c) => c.approvedAmount !== null)
                    .reduce((sum, c) => sum + (c.approvedAmount || 0), 0)
                )}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-sm text-medium-gray">Pending Review</p>
              <p className="text-xl font-bold text-yellow-600">
                {statusCounts.pending}
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <p className="text-sm text-medium-gray">Approval Rate</p>
              <p className="text-xl font-bold text-charcoal">
                {claims.length > 0
                  ? Math.round(
                      ((statusCounts.approved + statusCounts.paid) /
                        (statusCounts.approved + statusCounts.paid + statusCounts.denied || 1)) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
