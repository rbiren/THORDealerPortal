'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getAdminClaims,
  getClaimStats,
  reviewClaimAction,
  startClaimReview,
  batchApproveClaimsAction,
  createPayoutFromApprovedClaim,
  type ClaimListItem,
  type ClaimListResult,
} from '../actions'

type ClaimStats = {
  pending: number
  underReview: number
  approvedToday: number
  deniedToday: number
  totalPendingAmount: number
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimListItem[]>([])
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string[]>(['submitted', 'under_review'])
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [reviewingClaim, setReviewingClaim] = useState<ClaimListItem | null>(null)
  const [reviewForm, setReviewForm] = useState({
    decision: '' as 'approved' | 'denied' | '',
    approvedAmount: '',
    reviewNotes: '',
    denialReason: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  useEffect(() => {
    loadClaims()
  }, [statusFilter, pagination.page])

  async function loadData() {
    startTransition(async () => {
      const [claimsData, statsData] = await Promise.all([
        getAdminClaims({ status: statusFilter, page: pagination.page }),
        getClaimStats(),
      ])
      setClaims(claimsData.claims)
      setPagination({
        page: claimsData.page,
        totalPages: claimsData.totalPages,
        total: claimsData.total,
      })
      setStats(statsData)
    })
  }

  async function loadClaims() {
    startTransition(async () => {
      const data = await getAdminClaims({ status: statusFilter, page: pagination.page })
      setClaims(data.claims)
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      })
    })
  }

  const formatCurrency = (amount: number) => {
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
    const styles: Record<string, string> = {
      submitted: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800',
    }
    const labels: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      denied: 'Denied',
      paid: 'Paid',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getClaimTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      advertising: 'Advertising',
      marketing_materials: 'Marketing Materials',
      trade_show: 'Trade Show',
      training: 'Training',
      promotional: 'Promotional',
      digital_marketing: 'Digital Marketing',
      signage: 'Signage',
      other: 'Other',
    }
    return labels[type] || type
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(new Set(claims.map((c) => c.id)))
    } else {
      setSelectedClaims(new Set())
    }
  }

  const handleSelectClaim = (claimId: string, checked: boolean) => {
    const newSet = new Set(selectedClaims)
    if (checked) {
      newSet.add(claimId)
    } else {
      newSet.delete(claimId)
    }
    setSelectedClaims(newSet)
  }

  const handleStartReview = async (claim: ClaimListItem) => {
    startTransition(async () => {
      const result = await startClaimReview(claim.id)
      if (result.success) {
        setReviewingClaim(claim)
        setReviewForm({
          decision: '',
          approvedAmount: claim.requestedAmount.toString(),
          reviewNotes: '',
          denialReason: '',
        })
        await loadClaims()
      }
    })
  }

  const handleReviewSubmit = async () => {
    if (!reviewingClaim || !reviewForm.decision) return

    startTransition(async () => {
      const result = await reviewClaimAction(reviewingClaim.id, {
        decision: reviewForm.decision as 'approved' | 'denied',
        approvedAmount: reviewForm.decision === 'approved' ? parseFloat(reviewForm.approvedAmount) : undefined,
        reviewNotes: reviewForm.reviewNotes || undefined,
        denialReason: reviewForm.decision === 'denied' ? reviewForm.denialReason : undefined,
      })

      if (result.success) {
        // If approved, create payout
        if (reviewForm.decision === 'approved') {
          await createPayoutFromApprovedClaim(reviewingClaim.id)
        }

        setMessage({ type: 'success', text: result.message })
        setReviewingClaim(null)
        await loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  const handleBatchApprove = async () => {
    if (selectedClaims.size === 0) return

    startTransition(async () => {
      const result = await batchApproveClaimsAction(Array.from(selectedClaims))

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setSelectedClaims(new Set())
        await loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
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
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/admin">Admin</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Claims</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Claims Review</h1>
            <p className="page-subtitle">Review and approve dealer incentive claims</p>
          </div>
          <Link href="/admin/incentives/payouts" className="btn-outline">
            View Payouts
          </Link>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="card-body py-3">
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Under Review</p>
              <p className="text-2xl font-heading font-bold text-blue-600">{stats.underReview}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Approved Today</p>
              <p className="text-2xl font-heading font-bold text-green-600">{stats.approvedToday}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Denied Today</p>
              <p className="text-2xl font-heading font-bold text-red-600">{stats.deniedToday}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending Amount</p>
              <p className="text-2xl font-heading font-bold text-purple-600">{formatCurrency(stats.totalPendingAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-charcoal">Status:</label>
              <div className="flex gap-2">
                {['submitted', 'under_review', 'approved', 'denied'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      if (statusFilter.includes(status)) {
                        setStatusFilter(statusFilter.filter((s) => s !== status))
                      } else {
                        setStatusFilter([...statusFilter, status])
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      statusFilter.includes(status)
                        ? 'bg-olive text-white'
                        : 'bg-light-gray text-medium-gray hover:bg-olive/10'
                    }`}
                  >
                    {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {selectedClaims.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-medium-gray">{selectedClaims.size} selected</span>
                <button
                  onClick={handleBatchApprove}
                  disabled={isPending}
                  className="btn-primary btn-sm"
                >
                  Approve Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedClaims.size === claims.length && claims.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="form-checkbox"
                  />
                </th>
                <th>Claim #</th>
                <th>Dealer</th>
                <th>Program</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Docs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-medium-gray">
                    No claims found matching your filters
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedClaims.has(claim.id)}
                        onChange={(e) => handleSelectClaim(claim.id, e.target.checked)}
                        className="form-checkbox"
                      />
                    </td>
                    <td className="font-mono text-sm">{claim.claimNumber}</td>
                    <td>
                      <div>
                        <p className="font-medium text-charcoal">{claim.dealer.name}</p>
                        <p className="text-xs text-medium-gray">{claim.dealer.code}</p>
                      </div>
                    </td>
                    <td>{claim.program.name}</td>
                    <td>{getClaimTypeBadge(claim.claimType)}</td>
                    <td className="font-medium">{formatCurrency(claim.requestedAmount)}</td>
                    <td>{getStatusBadge(claim.status)}</td>
                    <td>{formatDate(claim.submittedAt)}</td>
                    <td>
                      {claim.documents.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                          {claim.documents.length} file{claim.documents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      {claim.status === 'submitted' && (
                        <button
                          onClick={() => handleStartReview(claim)}
                          disabled={isPending}
                          className="btn-primary btn-sm"
                        >
                          Review
                        </button>
                      )}
                      {claim.status === 'under_review' && (
                        <button
                          onClick={() => {
                            setReviewingClaim(claim)
                            setReviewForm({
                              decision: '',
                              approvedAmount: claim.requestedAmount.toString(),
                              reviewNotes: '',
                              denialReason: '',
                            })
                          }}
                          className="btn-outline btn-sm"
                        >
                          Continue
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-light-gray px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-medium-gray">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1 || isPending}
                className="btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages || isPending}
                className="btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-light-gray">
              <h2 className="text-lg font-heading font-semibold text-charcoal">
                Review Claim {reviewingClaim.claimNumber}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Claim Details */}
              <div className="bg-light-gray/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-gray">Dealer:</span>
                  <span className="font-medium">{reviewingClaim.dealer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-gray">Program:</span>
                  <span>{reviewingClaim.program.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-gray">Type:</span>
                  <span>{getClaimTypeBadge(reviewingClaim.claimType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-gray">Requested:</span>
                  <span className="font-medium text-lg">{formatCurrency(reviewingClaim.requestedAmount)}</span>
                </div>
                {reviewingClaim.documents.length > 0 && (
                  <div className="pt-2 border-t border-light-gray">
                    <p className="text-sm text-medium-gray mb-2">Attached Documents:</p>
                    <ul className="text-sm space-y-1">
                      {reviewingClaim.documents.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-medium-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {doc.fileName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Decision</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, decision: 'approved' })}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                      reviewForm.decision === 'approved'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-light-gray text-medium-gray hover:border-green-300'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, decision: 'denied' })}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                      reviewForm.decision === 'denied'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-light-gray text-medium-gray hover:border-red-300'
                    }`}
                  >
                    Deny
                  </button>
                </div>
              </div>

              {/* Approved Amount (if approving) */}
              {reviewForm.decision === 'approved' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Approved Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={reviewForm.approvedAmount}
                      onChange={(e) => setReviewForm({ ...reviewForm, approvedAmount: e.target.value })}
                      className="form-input w-full pl-8"
                    />
                  </div>
                </div>
              )}

              {/* Denial Reason (if denying) */}
              {reviewForm.decision === 'denied' && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Denial Reason
                  </label>
                  <textarea
                    value={reviewForm.denialReason}
                    onChange={(e) => setReviewForm({ ...reviewForm, denialReason: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Explain why this claim is being denied..."
                  />
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Review Notes (optional)
                </label>
                <textarea
                  value={reviewForm.reviewNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
                  className="form-input w-full"
                  rows={2}
                  placeholder="Internal notes about this review..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-light-gray flex justify-end gap-3">
              <button
                onClick={() => setReviewingClaim(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={!reviewForm.decision || isPending}
                className="btn-primary"
              >
                {isPending ? 'Processing...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
