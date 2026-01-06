import { Suspense } from 'react'
import Link from 'next/link'
import { getAdminPrograms, getProgramTypes, getStatusOptions } from './actions'
import { ProgramTable } from './ProgramTable'

export const metadata = {
  title: 'Incentive Programs - Admin',
  description: 'Manage dealer incentive programs, rebates, and co-op funds',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function ProgramTableWrapper({ searchParams }: Props) {
  const params = await searchParams

  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    type: typeof params.type === 'string' ? params.type : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
    pageSize: 20,
  }

  const [data, types, statuses] = await Promise.all([
    getAdminPrograms(filters),
    getProgramTypes(),
    getStatusOptions(),
  ])

  return <ProgramTable data={data} types={types} statuses={statuses} />
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="h-10 w-48 bg-light-gray rounded" />
            <div className="h-10 w-36 bg-light-gray rounded" />
            <div className="h-10 w-36 bg-light-gray rounded" />
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-light-beige border-b border-light-gray" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-light-gray flex items-center gap-4 px-6">
              <div className="h-4 w-48 bg-light-gray rounded" />
              <div className="h-4 w-24 bg-light-gray rounded" />
              <div className="h-4 w-20 bg-light-gray rounded" />
              <div className="h-4 w-28 bg-light-gray rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function AdminIncentivesPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/admin/incentives">Admin</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Incentives</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Incentive Programs</h1>
            <p className="page-subtitle">Manage rebates, co-op funds, contests, and dealer incentives</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/incentives/claims" className="btn-outline">
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Claims
            </Link>
            <Link href="/admin/incentives/new" className="btn-primary">
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Program
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <StatsCards />
        </Suspense>
      </div>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <ProgramTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="card-body">
            <div className="h-4 w-24 bg-light-gray rounded mb-2" />
            <div className="h-8 w-16 bg-light-gray rounded" />
          </div>
        </div>
      ))}
    </>
  )
}

async function StatsCards() {
  const { prisma } = await import('@/lib/prisma')

  const [activePrograms, totalEnrollments, pendingClaims, ytdPayouts] = await Promise.all([
    prisma.incentiveProgram.count({ where: { status: 'active' } }),
    prisma.dealerProgramEnrollment.count({ where: { status: 'active' } }),
    prisma.incentiveClaim.count({ where: { status: { in: ['submitted', 'under_review'] } } }),
    prisma.incentivePayout.aggregate({
      where: {
        status: 'completed',
        paidDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
      _sum: { amount: true },
    }),
  ])

  const stats = [
    { label: 'Active Programs', value: activePrograms, color: 'text-green-600' },
    { label: 'Active Enrollments', value: totalEnrollments, color: 'text-blue-600' },
    { label: 'Pending Claims', value: pendingClaims, color: 'text-orange-600' },
    { label: 'YTD Payouts', value: `$${((ytdPayouts._sum.amount || 0) / 1000).toFixed(1)}K`, color: 'text-purple-600' },
  ]

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <div className="card-body">
            <p className="text-sm text-medium-gray">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </>
  )
}
