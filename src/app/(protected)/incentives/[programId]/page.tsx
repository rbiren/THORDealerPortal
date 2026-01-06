'use client'

import { useState, useEffect, useTransition, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getProgramDetail, enrollInProgram, withdrawFromProgram, type AvailableProgram, type DealerEnrollment } from '../actions'

type Props = {
  params: Promise<{ programId: string }>
}

type AccrualHistory = {
  id: string
  periodType: string
  periodStart: Date
  periodEnd: Date
  qualifyingVolume: number
  rebateRate: number
  accruedAmount: number
  finalAmount: number
  tierAchieved: string | null
  status: string
}

export default function ProgramDetailPage({ params }: Props) {
  const { programId } = use(params)
  const router = useRouter()
  const [program, setProgram] = useState<AvailableProgram | null>(null)
  const [enrollment, setEnrollment] = useState<DealerEnrollment | null>(null)
  const [accrualHistory, setAccrualHistory] = useState<AccrualHistory[]>([])
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // Enrollment modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [programId])

  async function loadData() {
    startTransition(async () => {
      const data = await getProgramDetail(programId)
      setProgram(data.program)
      setEnrollment(data.enrollment)
      setAccrualHistory(data.accrualHistory)
    })
  }

  const handleEnroll = async () => {
    setEnrollError('')

    startTransition(async () => {
      const result = await enrollInProgram(programId, acceptTerms)

      if (result.success) {
        setShowEnrollModal(false)
        setAcceptTerms(false)
        loadData()
      } else {
        setEnrollError(result.message)
      }
    })
  }

  const handleWithdraw = async () => {
    if (!enrollment) return

    startTransition(async () => {
      const result = await withdrawFromProgram(enrollment.id, withdrawReason)

      if (result.success) {
        setShowWithdrawModal(false)
        setWithdrawReason('')
        router.push('/incentives')
      } else {
        alert(result.message)
      }
    })
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Ongoing'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  const getTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; label: string }> = {
      rebate: { bg: 'bg-blue-100 text-blue-800', label: 'Rebate Program' },
      coop: { bg: 'bg-green-100 text-green-800', label: 'Co-op Fund' },
      contest: { bg: 'bg-purple-100 text-purple-800', label: 'Contest' },
      spiff: { bg: 'bg-orange-100 text-orange-800', label: 'Spiff Program' },
    }
    const style = styles[type] || { bg: 'bg-gray-100 text-gray-800', label: type }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg}`}>
        {style.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!mounted || isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/incentives">Incentives</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Not Found</span>
          </nav>
        </div>
        <div className="card">
          <div className="card-body text-center py-12">
            <h3 className="text-lg font-medium text-charcoal">Program Not Found</h3>
            <p className="mt-2 text-medium-gray">This program may no longer be available</p>
            <Link href="/incentives" className="btn-primary mt-4 inline-flex">
              Back to Programs
            </Link>
          </div>
        </div>
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
          <span>{program.name}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getTypeBadge(program.type)}
              {enrollment && getStatusBadge(enrollment.status)}
            </div>
            <h1 className="page-title">{program.name}</h1>
            <p className="text-medium-gray">{program.code}</p>
          </div>
          {!enrollment && (
            <button onClick={() => setShowEnrollModal(true)} className="btn-primary">
              Enroll Now
            </button>
          )}
          {enrollment && enrollment.status === 'active' && (
            <button onClick={() => setShowWithdrawModal(true)} className="btn-outline text-red-600 border-red-200 hover:bg-red-50">
              Withdraw
            </button>
          )}
        </div>
      </div>

      {/* Enrollment Status Card */}
      {enrollment && (
        <div className={`card ${enrollment.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="card-body">
            {enrollment.status === 'pending' ? (
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">Enrollment Pending Approval</p>
                  <p className="text-sm text-yellow-700">Your enrollment is being reviewed by the admin team.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-green-700">Total Accrued</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(enrollment.accruedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Total Paid</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(enrollment.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Pending Payment</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(enrollment.pendingAmount)}</p>
                </div>
                {enrollment.tierAchieved && (
                  <div>
                    <p className="text-sm text-green-700">Current Tier</p>
                    <p className="text-2xl font-bold text-green-800">{enrollment.tierAchieved}</p>
                    <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${enrollment.tierProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Program Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Program Details</h2>
            </div>
            <div className="card-body">
              <p className="text-charcoal">{program.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Rules */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Earning Structure</h2>
            </div>
            <div className="card-body">
              {program.rules.flatRate ? (
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-olive">{(program.rules.flatRate * 100).toFixed(1)}%</p>
                  <p className="text-medium-gray mt-2">Flat rebate rate on qualifying purchases</p>
                </div>
              ) : program.rules.tiers && program.rules.tiers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-light-gray">
                        <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Tier</th>
                        <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Min Volume</th>
                        <th className="text-right py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Rebate Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {program.rules.tiers.map((tier, index) => (
                        <tr
                          key={index}
                          className={`border-b border-light-gray ${
                            enrollment?.tierAchieved === tier.name ? 'bg-green-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium">{tier.name}</span>
                            {enrollment?.tierAchieved === tier.name && (
                              <span className="ml-2 text-xs text-green-600">(Current)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-medium-gray">{formatCurrency(tier.minVolume)}</td>
                          <td className="py-3 px-4 text-right font-medium text-olive">{(tier.rate * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-medium-gray">No rate structure defined.</p>
              )}

              {program.rules.maxPayoutPerDealer && (
                <div className="mt-4 pt-4 border-t border-light-gray">
                  <p className="text-sm text-medium-gray">
                    Maximum payout per dealer: <span className="font-medium text-charcoal">{formatCurrency(program.rules.maxPayoutPerDealer)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Accrual History */}
          {enrollment && enrollment.status === 'active' && accrualHistory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Accrual History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-gray">
                      <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Period</th>
                      <th className="text-right py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Volume</th>
                      <th className="text-right py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Rate</th>
                      <th className="text-right py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Amount</th>
                      <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-charcoal uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accrualHistory.map((accrual) => (
                      <tr key={accrual.id} className="border-b border-light-gray">
                        <td className="py-3 px-4">
                          <p className="font-medium">{accrual.periodType}</p>
                          <p className="text-xs text-medium-gray">
                            {formatDate(accrual.periodStart)} - {formatDate(accrual.periodEnd)}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">{formatCurrency(accrual.qualifyingVolume)}</td>
                        <td className="py-3 px-4 text-right">{(accrual.rebateRate * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(accrual.finalAmount)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            accrual.status === 'paid' ? 'bg-green-100 text-green-800' :
                            accrual.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {accrual.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Program Info</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-xs text-medium-gray uppercase mb-1">Start Date</p>
                <p className="font-medium">{formatDate(program.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-medium-gray uppercase mb-1">End Date</p>
                <p className="font-medium">{formatDate(program.endDate)}</p>
              </div>
              {program.enrollmentDeadline && (
                <div>
                  <p className="text-xs text-medium-gray uppercase mb-1">Enrollment Deadline</p>
                  <p className="font-medium text-orange-600">{formatDate(program.enrollmentDeadline)}</p>
                </div>
              )}
              {program.eligibleTiers.length > 0 && (
                <div>
                  <p className="text-xs text-medium-gray uppercase mb-1">Eligible Tiers</p>
                  <div className="flex flex-wrap gap-2">
                    {program.eligibleTiers.map((tier) => (
                      <span key={tier} className="px-2 py-1 bg-light-beige rounded text-sm capitalize">
                        {tier}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!enrollment && (
            <div className="card bg-olive/5 border-olive/20">
              <div className="card-body">
                <h3 className="font-heading font-semibold text-olive mb-2">Ready to Earn?</h3>
                <p className="text-sm text-medium-gray mb-4">
                  Enroll in this program to start earning rebates on your qualifying purchases.
                </p>
                <button onClick={() => setShowEnrollModal(true)} className="btn-primary w-full">
                  Enroll Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Enroll in {program.name}</h2>
              <div className="space-y-4">
                <p className="text-medium-gray">
                  By enrolling in this program, you agree to the program terms and conditions.
                </p>

                {enrollError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {enrollError}
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 rounded border-light-gray"
                  />
                  <span className="text-sm">
                    I have read and agree to the program terms and conditions. I understand the rebate structure and payout terms.
                  </span>
                </label>
              </div>
            </div>
            <div className="border-t border-light-gray p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEnrollModal(false)
                  setAcceptTerms(false)
                  setEnrollError('')
                }}
                className="btn-outline"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                className="btn-primary"
                disabled={!acceptTerms || isPending}
              >
                {isPending ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Withdraw from Program</h2>
              <div className="space-y-4">
                <p className="text-medium-gray">
                  Are you sure you want to withdraw from this program? Any accrued rebates that have not been paid will be forfeited.
                </p>
                <div>
                  <label className="label">Reason (optional)</label>
                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    className="input w-full"
                    rows={3}
                    placeholder="Why are you withdrawing?"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-light-gray p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawReason('')
                }}
                className="btn-outline"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="btn-danger"
                disabled={isPending}
              >
                {isPending ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
