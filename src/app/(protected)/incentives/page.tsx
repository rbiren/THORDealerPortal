'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getAvailablePrograms, getMyEnrollments, getDashboardData, type AvailableProgram, type DealerEnrollment, type IncentivesDashboardData } from './actions'

export default function IncentivesPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'enrolled'>('available')
  const [availablePrograms, setAvailablePrograms] = useState<AvailableProgram[]>([])
  const [enrollments, setEnrollments] = useState<DealerEnrollment[]>([])
  const [dashboard, setDashboard] = useState<IncentivesDashboardData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  async function loadData() {
    startTransition(async () => {
      const [programs, myEnrollments, dashData] = await Promise.all([
        getAvailablePrograms(),
        getMyEnrollments(),
        getDashboardData(),
      ])
      setAvailablePrograms(programs)
      setEnrollments(myEnrollments)
      setDashboard(dashData)
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ongoing'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
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
      rebate: { bg: 'bg-blue-100 text-blue-800', label: 'Rebate' },
      coop: { bg: 'bg-green-100 text-green-800', label: 'Co-op' },
      contest: { bg: 'bg-purple-100 text-purple-800', label: 'Contest' },
      spiff: { bg: 'bg-orange-100 text-orange-800', label: 'Spiff' },
    }
    const style = styles[type] || { bg: 'bg-gray-100 text-gray-800', label: type }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
        {style.label}
      </span>
    )
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  const notEnrolledPrograms = availablePrograms.filter((p) => !p.isEnrolled)
  const activeEnrollments = enrollments.filter((e) => e.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Incentive Programs</span>
        </nav>
        <h1 className="page-title">Incentive Programs</h1>
        <p className="page-subtitle">Earn rebates, access co-op funds, and participate in dealer programs</p>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Active Programs</p>
              <p className="text-2xl font-heading font-bold text-olive">{dashboard.activePrograms}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Accrued</p>
              <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(dashboard.totalAccrued)}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">YTD Paid</p>
              <p className="text-2xl font-heading font-bold text-purple-600">{formatCurrency(dashboard.ytdPaid)}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-orange-600">{formatCurrency(dashboard.pendingAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'available'
                ? 'border-olive text-olive'
                : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
            }`}
          >
            Available Programs ({notEnrolledPrograms.length})
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'enrolled'
                ? 'border-olive text-olive'
                : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
            }`}
          >
            My Enrollments ({enrollments.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
        </div>
      ) : activeTab === 'available' ? (
        <AvailableProgramsGrid
          programs={notEnrolledPrograms}
          formatDate={formatDate}
          getTypeBadge={getTypeBadge}
        />
      ) : (
        <EnrollmentsList
          enrollments={enrollments}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getTypeBadge={getTypeBadge}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  )
}

function AvailableProgramsGrid({
  programs,
  formatDate,
  getTypeBadge,
}: {
  programs: AvailableProgram[]
  formatDate: (date: Date | null) => string
  getTypeBadge: (type: string) => React.ReactNode
}) {
  if (programs.length === 0) {
    return (
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-charcoal">You're enrolled in all available programs</h3>
          <p className="mt-2 text-medium-gray">Check back later for new incentive opportunities</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <div key={program.id} className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-start justify-between mb-3">
              {getTypeBadge(program.type)}
              {program.enrollmentDeadline && new Date(program.enrollmentDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <span className="text-xs text-red-600 font-medium">Ending Soon</span>
              )}
            </div>
            <h3 className="font-heading font-semibold text-lg text-charcoal mb-2">{program.name}</h3>
            <p className="text-sm text-medium-gray line-clamp-2 mb-4">
              {program.description || 'No description available'}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-medium-gray">Program Period</span>
                <span className="text-charcoal">
                  {formatDate(program.startDate)} - {formatDate(program.endDate)}
                </span>
              </div>
              {program.rules.flatRate && (
                <div className="flex justify-between">
                  <span className="text-medium-gray">Rebate Rate</span>
                  <span className="text-charcoal font-medium">{(program.rules.flatRate * 100).toFixed(1)}%</span>
                </div>
              )}
              {program.rules.tiers && program.rules.tiers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-medium-gray">Rate Range</span>
                  <span className="text-charcoal font-medium">
                    {(Math.min(...program.rules.tiers.map((t) => t.rate)) * 100).toFixed(1)}% -{' '}
                    {(Math.max(...program.rules.tiers.map((t) => t.rate)) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {program.enrollmentDeadline && (
                <div className="flex justify-between">
                  <span className="text-medium-gray">Enroll By</span>
                  <span className="text-charcoal">{formatDate(program.enrollmentDeadline)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-light-gray">
              <Link href={`/incentives/${program.id}`} className="btn-primary w-full text-center">
                View Details
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EnrollmentsList({
  enrollments,
  formatDate,
  formatCurrency,
  getTypeBadge,
  getStatusBadge,
}: {
  enrollments: DealerEnrollment[]
  formatDate: (date: Date | null) => string
  formatCurrency: (amount: number) => string
  getTypeBadge: (type: string) => React.ReactNode
  getStatusBadge: (status: string | null) => React.ReactNode
}) {
  if (enrollments.length === 0) {
    return (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-charcoal">No active enrollments</h3>
          <p className="mt-2 text-medium-gray">Browse available programs to start earning incentives</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => (
        <div key={enrollment.id} className="card">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Program Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getTypeBadge(enrollment.program.type)}
                  {getStatusBadge(enrollment.status)}
                </div>
                <Link
                  href={`/incentives/${enrollment.programId}`}
                  className="font-heading font-semibold text-lg text-charcoal hover:text-olive transition-colors"
                >
                  {enrollment.program.name}
                </Link>
                <p className="text-sm text-medium-gray mt-1">
                  Enrolled {formatDate(enrollment.enrolledAt)}
                  {enrollment.status === 'active' && enrollment.program.endDate && (
                    <> · Ends {formatDate(enrollment.program.endDate)}</>
                  )}
                </p>
              </div>

              {/* Progress/Amounts */}
              <div className="grid grid-cols-3 gap-6 lg:w-auto">
                <div className="text-center">
                  <p className="text-xs text-medium-gray uppercase mb-1">Accrued</p>
                  <p className="font-heading font-bold text-green-600">{formatCurrency(enrollment.accruedAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-medium-gray uppercase mb-1">Paid</p>
                  <p className="font-heading font-bold text-purple-600">{formatCurrency(enrollment.paidAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-medium-gray uppercase mb-1">Pending</p>
                  <p className="font-heading font-bold text-orange-600">{formatCurrency(enrollment.pendingAmount)}</p>
                </div>
              </div>

              {/* Tier Progress */}
              {enrollment.status === 'active' && enrollment.tierProgress > 0 && (
                <div className="lg:w-48">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-medium-gray">
                      {enrollment.tierAchieved || 'Base Tier'}
                    </span>
                    <span className="text-charcoal">{Math.round(enrollment.tierProgress)}%</span>
                  </div>
                  <div className="h-2 bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-olive rounded-full transition-all"
                      style={{ width: `${enrollment.tierProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="lg:ml-4">
                <Link
                  href={`/incentives/${enrollment.programId}`}
                  className="btn-outline btn-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
