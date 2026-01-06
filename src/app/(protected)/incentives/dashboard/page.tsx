'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getDashboardData,
  getMyClaims,
  getMyPayouts,
  getMyEnrollments,
  type IncentivesDashboardData,
  type DealerEnrollment,
} from '../actions'

type ClaimData = {
  id: string
  claimNumber: string
  claimType: string
  status: string
  requestedAmount: number
  approvedAmount: number | null
  createdAt: Date
  submittedAt: Date | null
  program: { name: string; type: string }
}

type PayoutData = {
  id: string
  amount: number
  status: string
  payoutType: string
  paidDate: Date | null
  periodCovered: string | null
  program: { name: string; type: string }
}

export default function IncentivesDashboardPage() {
  const [dashboard, setDashboard] = useState<IncentivesDashboardData | null>(null)
  const [claims, setClaims] = useState<ClaimData[]>([])
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [enrollments, setEnrollments] = useState<DealerEnrollment[]>([])
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  async function loadData() {
    startTransition(async () => {
      const [dashData, claimsData, payoutsData, enrollmentsData] = await Promise.all([
        getDashboardData(),
        getMyClaims(),
        getMyPayouts(),
        getMyEnrollments(),
      ])
      setDashboard(dashData)
      setClaims(claimsData as ClaimData[])
      setPayouts(payoutsData as PayoutData[])
      setEnrollments(enrollmentsData)
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800',
      paid: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
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

  const activeEnrollments = enrollments.filter((e) => e.status === 'active')
  const totalAccrued = enrollments.reduce((sum, e) => sum + e.accruedAmount, 0)
  const totalPaid = enrollments.reduce((sum, e) => sum + e.paidAmount, 0)
  const totalPending = enrollments.reduce((sum, e) => sum + e.pendingAmount, 0)
  const pendingClaims = claims.filter((c) => ['submitted', 'under_review'].includes(c.status))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Dashboard</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Incentives Dashboard</h1>
            <p className="page-subtitle">Track your earnings, claims, and program progress</p>
          </div>
          <div className="flex gap-3">
            <Link href="/incentives" className="btn-outline">
              Browse Programs
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-olive/10 to-olive/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-olive/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Active Programs</p>
                <p className="text-2xl font-heading font-bold text-olive">{activeEnrollments.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Total Accrued</p>
                <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(totalAccrued)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Total Paid</p>
                <p className="text-2xl font-heading font-bold text-purple-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Pending</p>
                <p className="text-2xl font-heading font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Progress Cards */}
      {activeEnrollments.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title">Program Progress</h2>
            <Link href="/incentives" className="text-sm text-olive hover:underline">
              View All Programs
            </Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEnrollments.slice(0, 6).map((enrollment) => {
                const program = enrollment.program
                const rules = JSON.parse(program.rules)
                const maxRate = rules.tiers?.length
                  ? Math.max(...rules.tiers.map((t: { rate: number }) => t.rate))
                  : rules.flatRate || 0

                return (
                  <Link
                    key={enrollment.id}
                    href={`/incentives/${enrollment.programId}`}
                    className="block p-4 border border-light-gray rounded-lg hover:border-olive hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {getTypeBadge(program.type)}
                      <span className="text-sm font-medium text-green-600">
                        {(maxRate * 100).toFixed(1)}% max
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-charcoal mb-2 line-clamp-1">
                      {program.name}
                    </h3>

                    {/* Progress Ring */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            strokeWidth="6"
                            stroke="#e5e5e5"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            strokeWidth="6"
                            stroke="#626F47"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${(enrollment.tierProgress / 100) * 176} 176`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-charcoal">
                            {Math.round(enrollment.tierProgress)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-medium-gray mb-1">
                          {enrollment.tierAchieved || 'Base Tier'}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(enrollment.accruedAmount)}
                        </p>
                        <p className="text-xs text-medium-gray">accrued</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            {activeEnrollments.length > 6 && (
              <div className="mt-4 text-center">
                <Link href="/incentives" className="text-olive hover:underline text-sm">
                  View {activeEnrollments.length - 6} more programs
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Program Type */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Earnings by Program Type</h2>
          </div>
          <div className="card-body">
            {(() => {
              const byType = enrollments.reduce((acc, e) => {
                const type = e.program.type
                if (!acc[type]) {
                  acc[type] = { accrued: 0, paid: 0, count: 0 }
                }
                acc[type].accrued += e.accruedAmount
                acc[type].paid += e.paidAmount
                acc[type].count += 1
                return acc
              }, {} as Record<string, { accrued: number; paid: number; count: number }>)

              const types = Object.entries(byType)

              if (types.length === 0) {
                return (
                  <p className="text-center text-medium-gray py-8">
                    No earnings data yet
                  </p>
                )
              }

              const maxAmount = Math.max(...types.map(([, v]) => v.accrued))

              return (
                <div className="space-y-4">
                  {types.map(([type, data]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(type)}
                          <span className="text-sm text-medium-gray">
                            ({data.count} program{data.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <span className="font-medium text-charcoal">
                          {formatCurrency(data.accrued)}
                        </span>
                      </div>
                      <div className="h-3 bg-light-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-olive rounded-full transition-all"
                          style={{ width: `${(data.accrued / maxAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/incentives"
                className="flex flex-col items-center justify-center p-4 border border-light-gray rounded-lg hover:border-olive hover:bg-olive/5 transition-all"
              >
                <svg className="w-8 h-8 text-olive mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-charcoal">Browse Programs</span>
              </Link>
              <Link
                href="/incentives/claims"
                className="flex flex-col items-center justify-center p-4 border border-light-gray rounded-lg hover:border-olive hover:bg-olive/5 transition-all"
              >
                <svg className="w-8 h-8 text-olive mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-charcoal">View Claims</span>
              </Link>
              <Link
                href="/incentives/payouts"
                className="flex flex-col items-center justify-center p-4 border border-light-gray rounded-lg hover:border-olive hover:bg-olive/5 transition-all"
              >
                <svg className="w-8 h-8 text-olive mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm font-medium text-charcoal">Payout History</span>
              </Link>
              <Link
                href="/support"
                className="flex flex-col items-center justify-center p-4 border border-light-gray rounded-lg hover:border-olive hover:bg-olive/5 transition-all"
              >
                <svg className="w-8 h-8 text-olive mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-charcoal">Get Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title">Pending Claims ({pendingClaims.length})</h2>
            <Link href="/incentives/claims" className="text-sm text-olive hover:underline">
              View All
            </Link>
          </div>
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
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Amount
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
                {pendingClaims.slice(0, 5).map((claim) => (
                  <tr key={claim.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {claim.claimNumber}
                    </td>
                    <td className="px-4 py-3 text-charcoal">
                      {claim.program.name}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-charcoal">
                      {formatCurrency(claim.requestedAmount)}
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

      {/* Recent Payouts */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="card-title">Recent Payouts</h2>
          <Link href="/incentives/payouts" className="text-sm text-olive hover:underline">
            View All
          </Link>
        </div>
        {payouts.length === 0 ? (
          <div className="card-body text-center py-8">
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-charcoal">No payouts yet</h3>
            <p className="mt-2 text-medium-gray">
              Your incentive payouts will appear here once processed
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Paid Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {payouts.slice(0, 10).map((payout) => (
                  <tr key={payout.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(payout.program.type)}
                        <span className="text-charcoal">{payout.program.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-medium-gray">
                      {payout.periodCovered || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-4 py-3 text-medium-gray">
                      {formatDate(payout.paidDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Empty State */}
      {enrollments.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-light-gray"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-heading font-semibold text-charcoal">
              Start Earning Incentives
            </h3>
            <p className="mt-2 text-medium-gray max-w-md mx-auto">
              Enroll in incentive programs to start earning rebates, access co-op funds, and participate in dealer contests.
            </p>
            <Link href="/incentives" className="btn-primary mt-6 inline-flex">
              Browse Available Programs
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
