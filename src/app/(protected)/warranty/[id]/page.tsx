'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getWarrantyClaimDetails,
  addNoteAction,
  reviewClaimAction,
  respondToRequestAction,
  assignClaimAction,
  submitClaimAction,
  warrantyStatusLabels,
  warrantyStatusColors,
  warrantyClaimTypeLabels,
  warrantyPriorityLabels,
  warrantyPriorityColors,
} from './actions'

type WarrantyClaim = Awaited<ReturnType<typeof getWarrantyClaimDetails>>

const resolutionTypes = [
  { value: 'replacement', label: 'Replacement' },
  { value: 'repair', label: 'Repair' },
  { value: 'credit', label: 'Credit' },
  { value: 'partial_credit', label: 'Partial Credit' },
]

export default function WarrantyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string
  const [claim, setClaim] = useState<WarrantyClaim>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // Note form
  const [noteContent, setNoteContent] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)

  // Response form
  const [responseContent, setResponseContent] = useState('')
  const [resubmitAfterResponse, setResubmitAfterResponse] = useState(true)

  // Review form
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'deny' | 'partial' | 'request_info'>('approve')
  const [reviewNote, setReviewNote] = useState('')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [resolutionType, setResolutionType] = useState('credit')
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    setMounted(true)
    loadClaim()
  }, [claimId])

  async function loadClaim() {
    const data = await getWarrantyClaimDetails(claimId)
    setClaim(data)
  }

  function formatDate(date: Date | string | null) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatCurrency(amount: number | null) {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return

    startTransition(async () => {
      const result = await addNoteAction(claimId, noteContent, isInternalNote)
      if (result.success) {
        setNoteContent('')
        setIsInternalNote(false)
        loadClaim()
      } else {
        alert(result.error)
      }
    })
  }

  async function handleRespond() {
    if (!responseContent.trim()) return

    startTransition(async () => {
      const result = await respondToRequestAction(claimId, responseContent, resubmitAfterResponse)
      if (result.success) {
        setResponseContent('')
        loadClaim()
      } else {
        alert(result.error)
      }
    })
  }

  async function handleReview() {
    startTransition(async () => {
      const result = await reviewClaimAction(
        claimId,
        reviewAction,
        reviewNote || undefined,
        reviewAction === 'approve' || reviewAction === 'partial' ? parseFloat(approvedAmount) || undefined : undefined,
        reviewAction !== 'request_info' ? resolutionType : undefined,
        resolutionNotes || undefined
      )
      if (result.success) {
        setShowReviewModal(false)
        setReviewNote('')
        setApprovedAmount('')
        setResolutionNotes('')
        loadClaim()
      } else {
        alert(result.error)
      }
    })
  }

  async function handleAssign() {
    startTransition(async () => {
      const result = await assignClaimAction(claimId)
      if (result.success) {
        loadClaim()
      } else {
        alert(result.error)
      }
    })
  }

  async function handleSubmit() {
    if (!confirm('Submit this warranty claim for review?')) return

    startTransition(async () => {
      const result = await submitClaimAction(claimId)
      if (result.success) {
        loadClaim()
      } else {
        alert(result.error)
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

  if (!claim) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-charcoal">Warranty claim not found</h2>
        <Link href="/warranty" className="text-olive hover:underline mt-4 inline-block">
          Back to Warranty Claims
        </Link>
      </div>
    )
  }

  const statusColor = warrantyStatusColors[claim.status as keyof typeof warrantyStatusColors] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  const priorityColor = warrantyPriorityColors[claim.priority as keyof typeof warrantyPriorityColors] || { bg: 'bg-gray-100', text: 'text-gray-600' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/warranty">Warranty Claims</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{claim.claimNumber}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="page-title flex items-center gap-3">
              {claim.claimNumber}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}>
                {warrantyStatusLabels[claim.status as keyof typeof warrantyStatusLabels]}
              </span>
            </h1>
            <p className="page-subtitle">{claim.productName}</p>
          </div>
          <div className="flex gap-2">
            {claim.canSubmit && (
              <button onClick={handleSubmit} className="btn-primary" disabled={isPending}>
                Submit for Review
              </button>
            )}
            {claim.isAdmin && claim.status === 'submitted' && !claim.assignedTo && (
              <button onClick={handleAssign} className="btn-primary" disabled={isPending}>
                Assign to Me
              </button>
            )}
            {claim.canReview && (
              <button onClick={() => setShowReviewModal(true)} className="btn-primary">
                Review Claim
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Details Card */}
          <div className="card">
            <div className="card-body space-y-6">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Claim Details</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-medium-gray">Claim Type</p>
                  <p className="font-medium text-charcoal">
                    {warrantyClaimTypeLabels[claim.claimType as keyof typeof warrantyClaimTypeLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Priority</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
                    {warrantyPriorityLabels[claim.priority as keyof typeof warrantyPriorityLabels]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Under Warranty</p>
                  <p className="font-medium text-charcoal">{claim.isUnderWarranty ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-medium-gray">Submitted</p>
                  <p className="font-medium text-charcoal">{formatDate(claim.submittedAt)}</p>
                </div>
              </div>

              <div className="border-t border-light-gray pt-4">
                <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Issue Description</h3>
                <p className="text-charcoal whitespace-pre-wrap bg-light-beige p-4 rounded">
                  {claim.issueDescription}
                </p>
              </div>

              {/* Product Information */}
              <div className="border-t border-light-gray pt-4">
                <h3 className="text-sm font-medium text-medium-gray uppercase mb-3">Product Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-medium-gray">Product</p>
                    <p className="font-medium text-charcoal">{claim.productName}</p>
                  </div>
                  {claim.serialNumber && (
                    <div>
                      <p className="text-sm text-medium-gray">Serial Number</p>
                      <p className="font-medium text-charcoal">{claim.serialNumber}</p>
                    </div>
                  )}
                  {claim.modelNumber && (
                    <div>
                      <p className="text-sm text-medium-gray">Model Number</p>
                      <p className="font-medium text-charcoal">{claim.modelNumber}</p>
                    </div>
                  )}
                  {claim.purchaseDate && (
                    <div>
                      <p className="text-sm text-medium-gray">Purchase Date</p>
                      <p className="font-medium text-charcoal">{formatDate(claim.purchaseDate)}</p>
                    </div>
                  )}
                  {claim.failureDate && (
                    <div>
                      <p className="text-sm text-medium-gray">Failure Date</p>
                      <p className="font-medium text-charcoal">{formatDate(claim.failureDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              {(claim.customerName || claim.customerEmail || claim.customerPhone) && (
                <div className="border-t border-light-gray pt-4">
                  <h3 className="text-sm font-medium text-medium-gray uppercase mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {claim.customerName && (
                      <div>
                        <p className="text-sm text-medium-gray">Name</p>
                        <p className="font-medium text-charcoal">{claim.customerName}</p>
                      </div>
                    )}
                    {claim.customerPhone && (
                      <div>
                        <p className="text-sm text-medium-gray">Phone</p>
                        <p className="font-medium text-charcoal">{claim.customerPhone}</p>
                      </div>
                    )}
                    {claim.customerEmail && (
                      <div>
                        <p className="text-sm text-medium-gray">Email</p>
                        <p className="font-medium text-charcoal">{claim.customerEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Affected Parts */}
              {claim.items.length > 0 && (
                <div className="border-t border-light-gray pt-4">
                  <h3 className="text-sm font-medium text-medium-gray uppercase mb-3">Affected Parts</h3>
                  <div className="border border-light-gray rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-3 py-2 text-left">Part</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-left">Issue</th>
                          <th className="px-3 py-2 text-right">Cost</th>
                          {claim.isAdmin && <th className="px-3 py-2 text-center">Status</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {claim.items.map((item) => (
                          <tr key={item.id} className="border-t border-light-gray">
                            <td className="px-3 py-2">
                              {item.partName}
                              {item.partNumber && <span className="text-medium-gray ml-1">({item.partNumber})</span>}
                            </td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 capitalize">{item.issueType}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.totalCost)}</td>
                            {claim.isAdmin && (
                              <td className="px-3 py-2 text-center">
                                {item.approved === true && (
                                  <span className="text-green-600">Approved</span>
                                )}
                                {item.approved === false && (
                                  <span className="text-red-600">Denied</span>
                                )}
                                {item.approved === null && (
                                  <span className="text-medium-gray">Pending</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Communication */}
          <div className="card">
            <div className="card-body space-y-4">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Communication</h2>

              {/* Info Requested Response Form */}
              {claim.canRespond && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-orange-800 mb-2">Additional Information Requested</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    The manufacturer has requested additional information. Please respond below.
                  </p>
                  <textarea
                    value={responseContent}
                    onChange={(e) => setResponseContent(e.target.value)}
                    className="input w-full h-24 mb-2"
                    placeholder="Provide the requested information..."
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={resubmitAfterResponse}
                        onChange={(e) => setResubmitAfterResponse(e.target.checked)}
                      />
                      Resubmit for review after responding
                    </label>
                    <button
                      onClick={handleRespond}
                      className="btn-primary btn-sm"
                      disabled={isPending || !responseContent.trim()}
                    >
                      {isPending ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {claim.notes.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No messages yet</p>
                ) : (
                  claim.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg ${
                        note.isSystemNote
                          ? 'bg-gray-50 border border-gray-200'
                          : note.isInternal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : note.userId === claim.currentUserId
                          ? 'bg-olive/10 border border-olive/20 ml-8'
                          : 'bg-light-beige border border-light-gray mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-charcoal text-sm">
                            {note.user.firstName} {note.user.lastName}
                          </span>
                          {note.isInternal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                              Internal
                            </span>
                          )}
                          {note.isSystemNote && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              System
                            </span>
                          )}
                          <span className="text-xs text-medium-gray capitalize">
                            ({note.user.role.replace('_', ' ')})
                          </span>
                        </div>
                        <span className="text-xs text-medium-gray">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-charcoal whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              {claim.status !== 'closed' && (
                <div className="border-t border-light-gray pt-4">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="input w-full h-20 mb-2"
                    placeholder="Add a message..."
                  />
                  <div className="flex items-center justify-between">
                    {claim.isAdmin && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                        />
                        Internal note (not visible to dealer)
                      </label>
                    )}
                    {!claim.isAdmin && <div />}
                    <button
                      onClick={handleAddNote}
                      className="btn-primary btn-sm"
                      disabled={isPending || !noteContent.trim()}
                    >
                      {isPending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-heading font-semibold text-charcoal mb-4">Claim Summary</h3>
              <div className="space-y-3">
                {claim.partsAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Parts</span>
                    <span>{formatCurrency(claim.partsAmount)}</span>
                  </div>
                )}
                {claim.laborAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Labor ({claim.laborHours}h)</span>
                    <span>{formatCurrency(claim.laborAmount)}</span>
                  </div>
                )}
                {claim.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-medium-gray">Shipping</span>
                    <span>{formatCurrency(claim.shippingAmount)}</span>
                  </div>
                )}
                <div className="border-t border-light-gray pt-3 flex justify-between font-semibold">
                  <span>Total Requested</span>
                  <span className="text-charcoal">{formatCurrency(claim.totalRequested)}</span>
                </div>
                {claim.totalApproved !== null && (
                  <div className="flex justify-between font-semibold text-olive">
                    <span>Total Approved</span>
                    <span>{formatCurrency(claim.totalApproved)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resolution Info (if resolved) */}
          {claim.resolutionType && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-heading font-semibold text-charcoal mb-4">Resolution</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-medium-gray">Type</p>
                    <p className="font-medium text-charcoal capitalize">
                      {claim.resolutionType.replace('_', ' ')}
                    </p>
                  </div>
                  {claim.resolutionNotes && (
                    <div>
                      <p className="text-sm text-medium-gray">Notes</p>
                      <p className="text-charcoal">{claim.resolutionNotes}</p>
                    </div>
                  )}
                  {claim.resolvedAt && (
                    <div>
                      <p className="text-sm text-medium-gray">Resolved</p>
                      <p className="font-medium text-charcoal">{formatDate(claim.resolvedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dealer Info (for admins) */}
          {claim.isAdmin && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-heading font-semibold text-charcoal mb-4">Dealer</h3>
                <div className="space-y-2">
                  <p className="font-medium text-charcoal">{claim.dealer.name}</p>
                  <p className="text-sm text-medium-gray">Code: {claim.dealer.code}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-heading font-semibold text-charcoal mb-4">Assignment</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-medium-gray">Submitted By</p>
                  <p className="font-medium text-charcoal">
                    {claim.submittedBy.firstName} {claim.submittedBy.lastName}
                  </p>
                </div>
                {claim.assignedTo && (
                  <div>
                    <p className="text-sm text-medium-gray">Assigned To</p>
                    <p className="font-medium text-charcoal">
                      {claim.assignedTo.firstName} {claim.assignedTo.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-heading font-semibold text-charcoal mb-4">Status History</h3>
              <div className="space-y-3">
                {claim.statusHistory.map((history, index) => (
                  <div key={history.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-olive' : 'bg-light-gray'}`} />
                      {index < claim.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-light-gray" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="font-medium text-charcoal text-sm">
                        {warrantyStatusLabels[history.toStatus as keyof typeof warrantyStatusLabels]}
                      </p>
                      <p className="text-xs text-medium-gray">{formatDate(history.createdAt)}</p>
                      {history.note && (
                        <p className="text-sm text-medium-gray mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-heading font-semibold text-charcoal">Review Warranty Claim</h2>

              <div>
                <label className="form-label">Action</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: 'approve', label: 'Approve', color: 'bg-green-100 border-green-300 text-green-800' },
                    { value: 'partial', label: 'Partial Approve', color: 'bg-lime-100 border-lime-300 text-lime-800' },
                    { value: 'deny', label: 'Deny', color: 'bg-red-100 border-red-300 text-red-800' },
                    { value: 'request_info', label: 'Request Info', color: 'bg-orange-100 border-orange-300 text-orange-800' },
                  ].map((action) => (
                    <button
                      key={action.value}
                      onClick={() => setReviewAction(action.value as typeof reviewAction)}
                      className={`p-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                        reviewAction === action.value
                          ? action.color
                          : 'bg-white border-light-gray text-medium-gray hover:border-charcoal'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {(reviewAction === 'approve' || reviewAction === 'partial') && (
                <>
                  <div>
                    <label className="form-label">Approved Amount</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="input w-full"
                      placeholder={`Max: $${claim.totalRequested.toFixed(2)}`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Resolution Type</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="input w-full"
                    >
                      {resolutionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Resolution Notes</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="input w-full h-20"
                      placeholder="Details about the resolution..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="form-label">
                  {reviewAction === 'request_info' ? 'What information do you need?' : 'Note (optional)'}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="input w-full h-20"
                  placeholder={
                    reviewAction === 'request_info'
                      ? 'Please describe what additional information you need...'
                      : 'Add a note about your decision...'
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-light-gray">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="btn-outline"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  className={`btn-primary ${reviewAction === 'deny' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  disabled={isPending}
                >
                  {isPending ? 'Processing...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
