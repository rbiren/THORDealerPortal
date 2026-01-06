import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminProgram, getProgramEnrollments, getDealerTiers } from '../actions'
import { ProgramDetail } from './ProgramDetail'
import { EnrollmentsTab } from './EnrollmentsTab'
import { AccrualsTab } from './AccrualsTab'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const program = await getAdminProgram(id)

  if (!program) {
    return { title: 'Program Not Found' }
  }

  return {
    title: `${program.name} - Incentive Programs`,
    description: program.description || `Manage ${program.name} incentive program`,
  }
}

export default async function ProgramPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab = 'details' } = await searchParams

  const [program, enrollments, tiers] = await Promise.all([
    getAdminProgram(id),
    getProgramEnrollments(id),
    getDealerTiers(),
  ])

  if (!program) {
    notFound()
  }

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'enrollments', label: `Enrollments (${program.stats.enrollmentCount})` },
    ...(program.type === 'rebate' ? [{ id: 'accruals', label: 'Accruals' }] : []),
    { id: 'claims', label: `Claims (${Object.values(program.stats.claims).reduce((a, b) => a + b, 0)})` },
    { id: 'payouts', label: 'Payouts' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/incentives">Incentives</Link>
          <span className="breadcrumb-separator">/</span>
          <span>{program.name}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{program.name}</h1>
              <StatusBadge status={program.status} />
            </div>
            <p className="page-subtitle">{program.code}</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/admin/incentives/${id}/edit`} className="btn-outline">
              Edit Program
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-medium-gray">Active Enrollments</p>
            <p className="text-2xl font-bold text-blue-600">{program.stats.activeEnrollments}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-medium-gray">Total Accrued</p>
            <p className="text-2xl font-bold text-green-600">
              ${program.stats.totalAccrued.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-medium-gray">Total Paid</p>
            <p className="text-2xl font-bold text-purple-600">
              ${program.stats.totalPaid.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-medium-gray">Pending Claims</p>
            <p className="text-2xl font-bold text-orange-600">
              {(program.stats.claims.submitted || 0) + (program.stats.claims.under_review || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/admin/incentives/${id}?tab=${t.id}`}
              className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Suspense fallback={<TabSkeleton />}>
        {tab === 'details' && <ProgramDetail program={program} tiers={tiers} />}
        {tab === 'enrollments' && <EnrollmentsTab enrollments={enrollments} programId={id} />}
        {tab === 'accruals' && (
          <AccrualsTab programId={id} programType={program.type} programStatus={program.status} />
        )}
        {tab === 'claims' && <ClaimsTab programId={id} />}
        {tab === 'payouts' && <PayoutsTab programId={id} />}
      </Suspense>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function TabSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card-body space-y-4">
        <div className="h-4 w-48 bg-light-gray rounded" />
        <div className="h-4 w-64 bg-light-gray rounded" />
        <div className="h-4 w-32 bg-light-gray rounded" />
      </div>
    </div>
  )
}

async function ClaimsTab({ programId }: { programId: string }) {
  const { prisma } = await import('@/lib/prisma')

  const claims = await prisma.incentiveClaim.findMany({
    where: { programId },
    include: {
      dealer: { select: { name: true, code: true } },
      submittedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

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
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'badge-gray',
      submitted: 'badge-info',
      under_review: 'badge-warning',
      approved: 'badge-success',
      denied: 'badge-danger',
      paid: 'badge-success',
    }
    return styles[status] || 'badge-gray'
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Dealer</th>
              <th>Type</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-medium-gray">
                  No claims submitted yet
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id}>
                  <td className="font-medium">{claim.claimNumber}</td>
                  <td>
                    <div>{claim.dealer.name}</div>
                    <div className="text-sm text-medium-gray">{claim.dealer.code}</div>
                  </td>
                  <td>{claim.claimType}</td>
                  <td>{formatCurrency(claim.requestedAmount)}</td>
                  <td>{formatCurrency(claim.approvedAmount)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(claim.status)}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{formatDate(claim.submittedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function PayoutsTab({ programId }: { programId: string }) {
  const { prisma } = await import('@/lib/prisma')

  const payouts = await prisma.incentivePayout.findMany({
    where: { programId },
    include: {
      dealer: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
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
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'badge-warning',
      processing: 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger',
    }
    return styles[status] || 'badge-gray'
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Dealer</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Period</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-medium-gray">
                  No payouts processed yet
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <div>{payout.dealer.name}</div>
                    <div className="text-sm text-medium-gray">{payout.dealer.code}</div>
                  </td>
                  <td className="font-medium">{formatCurrency(payout.amount)}</td>
                  <td>{payout.payoutType}</td>
                  <td>{payout.periodCovered || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td>{formatDate(payout.paidDate)}</td>
                  <td>{payout.referenceNumber || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
