'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getMyPayouts } from '../actions'

type PayoutData = {
  id: string
  amount: number
  status: string
  payoutType: string
  paymentMethod: string | null
  periodCovered: string | null
  referenceNumber: string | null
  paidDate: Date | null
  scheduledDate: Date | null
  notes: string | null
  createdAt: Date
  program: { name: string; type: string }
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  async function loadData() {
    startTransition(async () => {
      const data = await getMyPayouts()
      setPayouts(data as PayoutData[])
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      pending: { bg: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { bg: 'bg-blue-100 text-blue-800', label: 'Processing' },
      completed: { bg: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { bg: 'bg-red-100 text-red-800', label: 'Failed' },
    }
    const style = styles[status] || styles.pending
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

  const filteredPayouts = payouts.filter((p) => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const statusCounts = {
    all: payouts.length,
    pending: payouts.filter((p) => p.status === 'pending').length,
    processing: payouts.filter((p) => p.status === 'processing').length,
    completed: payouts.filter((p) => p.status === 'completed').length,
  }

  // Calculate totals
  const totalCompleted = payouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = payouts
    .filter((p) => ['pending', 'processing'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0)

  // Get YTD total
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
  const ytdTotal = payouts
    .filter((p) => p.status === 'completed' && p.paidDate && new Date(p.paidDate) >= yearStart)
    .reduce((sum, p) => sum + p.amount, 0)

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
          <span>Payouts</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Payout History</h1>
            <p className="page-subtitle">View your incentive payments and scheduled payouts</p>
          </div>
          <Link href="/incentives/dashboard" className="btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Total Received</p>
                <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(totalCompleted)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">Pending/Processing</p>
                <p className="text-2xl font-heading font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-medium-gray">YTD {new Date().getFullYear()}</p>
                <p className="text-2xl font-heading font-bold text-purple-600">{formatCurrency(ytdTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'pending', label: 'Pending' },
          { key: 'processing', label: 'Processing' },
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
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {/* Payouts List */}
      {filteredPayouts.length === 0 ? (
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-charcoal">No payouts found</h3>
            <p className="mt-2 text-medium-gray">
              {filter === 'all'
                ? "You haven't received any payouts yet"
                : `No ${filter} payouts`}
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
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Type
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
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(payout.program.type)}
                        <span className="text-charcoal font-medium">{payout.program.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal capitalize">
                      {payout.payoutType}
                    </td>
                    <td className="px-4 py-3 text-medium-gray">
                      {payout.periodCovered || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${payout.status === 'completed' ? 'text-green-600' : 'text-charcoal'}`}>
                        {formatCurrency(payout.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-4 py-3 text-medium-gray">
                      {payout.status === 'completed'
                        ? formatDate(payout.paidDate)
                        : payout.scheduledDate
                        ? `Scheduled: ${formatDate(payout.scheduledDate)}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-medium-gray font-mono text-sm">
                      {payout.referenceNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Breakdown (if there are payouts) */}
      {payouts.filter((p) => p.status === 'completed').length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Breakdown</h2>
          </div>
          <div className="card-body">
            {(() => {
              const completedPayouts = payouts.filter((p) => p.status === 'completed' && p.paidDate)
              const byMonth = completedPayouts.reduce((acc, p) => {
                const date = new Date(p.paidDate!)
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                if (!acc[key]) {
                  acc[key] = { total: 0, count: 0 }
                }
                acc[key].total += p.amount
                acc[key].count += 1
                return acc
              }, {} as Record<string, { total: number; count: number }>)

              const months = Object.entries(byMonth)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 12)

              if (months.length === 0) {
                return <p className="text-center text-medium-gray py-4">No completed payouts yet</p>
              }

              const maxAmount = Math.max(...months.map(([, v]) => v.total))

              return (
                <div className="space-y-3">
                  {months.map(([month, data]) => {
                    const [year, monthNum] = month.split('-')
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleDateString(
                      'en-US',
                      { month: 'short', year: 'numeric' }
                    )

                    return (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-charcoal">{monthName}</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(data.total)}
                            <span className="text-medium-gray ml-2">({data.count} payment{data.count !== 1 ? 's' : ''})</span>
                          </span>
                        </div>
                        <div className="h-2 bg-light-gray rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${(data.total / maxAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
