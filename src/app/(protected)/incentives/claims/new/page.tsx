'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getCoopProgramsForClaims,
  getClaimTypes,
  submitNewClaim,
  type ClaimSubmissionResult,
} from '../../actions'
import type { CoopFundBalance } from '@/lib/services/incentives'

type CoopProgram = {
  id: string
  name: string
  type: string
  balance: CoopFundBalance | null
}

export default function NewClaimPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProgramId = searchParams.get('programId')

  const [programs, setPrograms] = useState<CoopProgram[]>([])
  const [claimTypes, setClaimTypes] = useState<Array<{ value: string; label: string }>>([])
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [result, setResult] = useState<ClaimSubmissionResult | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    programId: preselectedProgramId || '',
    claimType: '',
    requestedAmount: '',
    description: '',
    activityDate: '',
    vendorName: '',
    invoiceNumber: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  useEffect(() => {
    if (preselectedProgramId && programs.length > 0) {
      setFormData((prev) => ({ ...prev, programId: preselectedProgramId }))
    }
  }, [preselectedProgramId, programs])

  async function loadData() {
    startTransition(async () => {
      const [programsData, typesData] = await Promise.all([
        getCoopProgramsForClaims(),
        getClaimTypes(),
      ])
      setPrograms(programsData)
      setClaimTypes(typesData)
    })
  }

  const selectedProgram = programs.find((p) => p.id === formData.programId)
  const availableBalance = selectedProgram?.balance?.availableBalance || 0

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.programId) {
      newErrors.programId = 'Please select a program'
    }
    if (!formData.claimType) {
      newErrors.claimType = 'Please select a claim type'
    }
    if (!formData.requestedAmount) {
      newErrors.requestedAmount = 'Please enter an amount'
    } else {
      const amount = parseFloat(formData.requestedAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.requestedAmount = 'Please enter a valid amount'
      } else if (amount > availableBalance) {
        newErrors.requestedAmount = `Amount exceeds available balance of $${availableBalance.toFixed(2)}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    startTransition(async () => {
      const submitResult = await submitNewClaim({
        programId: formData.programId,
        claimType: formData.claimType,
        requestedAmount: parseFloat(formData.requestedAmount),
        description: formData.description || undefined,
        activityDate: formData.activityDate || undefined,
        vendorName: formData.vendorName || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
      })

      setResult(submitResult)

      if (submitResult.success) {
        // Redirect after short delay to show success
        setTimeout(() => {
          router.push('/incentives/claims')
        }, 2000)
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="page-header mb-6">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/incentives/claims">Claims</Link>
          <span className="breadcrumb-separator">/</span>
          <span>New Claim</span>
        </nav>
        <h1 className="page-title">Submit New Claim</h1>
        <p className="page-subtitle">Request reimbursement from your co-op fund balance</p>
      </div>

      {/* Success Message */}
      {result?.success && (
        <div className="card bg-green-50 border-green-200 mb-6">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-green-800">Claim Submitted Successfully!</p>
                <p className="text-sm text-green-700">
                  Claim #{result.claimNumber} has been submitted for review. Redirecting...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {result && !result.success && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <p className="font-medium text-red-800">Submission Failed</p>
                <p className="text-sm text-red-700">{result.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Programs Warning */}
      {programs.length === 0 && !isPending && (
        <div className="card mb-6">
          <div className="card-body text-center py-8">
            <svg className="mx-auto h-12 w-12 text-medium-gray mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-medium text-charcoal mb-2">No Co-op Programs Available</h3>
            <p className="text-medium-gray text-sm">
              You must be enrolled in an active co-op program to submit claims.
            </p>
            <Link href="/incentives" className="btn-primary mt-4 inline-block">
              Browse Programs
            </Link>
          </div>
        </div>
      )}

      {/* Claim Form */}
      {programs.length > 0 && (
        <form onSubmit={handleSubmit} className="card">
          <div className="card-body space-y-6">
            {/* Program Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                className={`form-input w-full ${errors.programId ? 'border-red-500' : ''}`}
                disabled={isPending}
              >
                <option value="">Select a program...</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} - Available: {formatCurrency(program.balance?.availableBalance || 0)}
                  </option>
                ))}
              </select>
              {errors.programId && <p className="text-red-500 text-sm mt-1">{errors.programId}</p>}
            </div>

            {/* Available Balance Display */}
            {selectedProgram && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-medium-gray uppercase">Available</p>
                    <p className="font-heading font-bold text-lg text-green-600">
                      {formatCurrency(selectedProgram.balance?.availableBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-medium-gray uppercase">Total Accrued</p>
                    <p className="font-heading font-bold text-lg text-charcoal">
                      {formatCurrency(selectedProgram.balance?.totalAccrued || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-medium-gray uppercase">Pending Claims</p>
                    <p className="font-heading font-bold text-lg text-orange-600">
                      {selectedProgram.balance?.pendingClaims || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Claim Type */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Claim Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.claimType}
                onChange={(e) => setFormData({ ...formData, claimType: e.target.value })}
                className={`form-input w-full ${errors.claimType ? 'border-red-500' : ''}`}
                disabled={isPending}
              >
                <option value="">Select claim type...</option>
                {claimTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.claimType && <p className="text-red-500 text-sm mt-1">{errors.claimType}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Amount Requested <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={availableBalance}
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  className={`form-input w-full pl-8 ${errors.requestedAmount ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  disabled={isPending}
                />
              </div>
              {errors.requestedAmount && <p className="text-red-500 text-sm mt-1">{errors.requestedAmount}</p>}
            </div>

            {/* Activity Date */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Activity Date
              </label>
              <input
                type="date"
                value={formData.activityDate}
                onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                className="form-input w-full"
                disabled={isPending}
              />
              <p className="text-xs text-medium-gray mt-1">Date when the expense occurred</p>
            </div>

            {/* Vendor Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="form-input w-full"
                placeholder="e.g., ABC Marketing Agency"
                disabled={isPending}
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Invoice/Receipt Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="form-input w-full"
                placeholder="e.g., INV-2026-001"
                disabled={isPending}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input w-full"
                rows={3}
                placeholder="Describe the marketing activity or expense..."
                disabled={isPending}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-light-gray">
              <Link href="/incentives/claims" className="btn-outline">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={isPending || result?.success}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Claim'
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Help Text */}
      <div className="mt-6 text-sm text-medium-gray">
        <h4 className="font-medium text-charcoal mb-2">Claim Submission Guidelines</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Claims must be submitted within 90 days of the activity date</li>
          <li>Keep all receipts and invoices for documentation</li>
          <li>Claims are typically reviewed within 5-7 business days</li>
          <li>Approved claims are paid in the next payment cycle</li>
        </ul>
      </div>
    </div>
  )
}
