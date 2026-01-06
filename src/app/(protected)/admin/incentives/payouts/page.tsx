'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  getAdminPayouts,
  getPayoutSummaryByProgram,
  getScheduledPayoutsAction,
  processPayoutAction,
  type PayoutListItem,
  type PayoutListResult,
} from '../actions'

type ProgramSummary = {
  programId: string
  programName: string
  programType: string
  totalPaid: number
  pendingAmount: number
  payoutCount: number
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutListItem[]>([])
  const [totals, setTotals] = useState<PayoutListResult['totals'] | null>(null)
  const [programSummary, setProgramSummary] = useState<ProgramSummary[]>([])
  const [scheduledPayouts, setScheduledPayouts] = useState<PayoutListItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'summary'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [processingPayout, setProcessingPayout] = useState<PayoutListItem | null>(null)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  useEffect(() => {
    loadPayouts()
  }, [statusFilter])

  async function loadData() {
    startTransition(async () => {
      const [payoutsData, summary, scheduled] = await Promise.all([
        getAdminPayouts({ status: statusFilter || undefined }),
        getPayoutSummaryByProgram(),
        getScheduledPayoutsAction(),
      ])
      setPayouts(payoutsData.payouts)
      setTotals(payoutsData.totals)
      setProgramSummary(summary)
      setScheduledPayouts(scheduled)
    })
  }

  async function loadPayouts() {
    startTransition(async () => {
      const data = await getAdminPayouts({ status: statusFilter || undefined })
      setPayouts(data.payouts)
      setTotals(data.totals)
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
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
        {style.label}
      </span>
    )
  }

  const handleProcessPayout = async () => {
    if (!processingPayout || !referenceNumber.trim()) return

    startTransition(async () => {
      const result = await processPayoutAction(processingPayout.id, referenceNumber.trim())

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setProcessingPayout(null)
        setReferenceNumber('')
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
          <span>Payouts</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Payout Management</h1>
            <p className="page-subtitle">Process and track incentive payouts</p>
          </div>
          <Link href="/admin/incentives/claims" className="btn-outline">
            Review Claims
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

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Payouts</p>
              <p className="text-2xl font-heading font-bold text-charcoal">{totals.count}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Total Amount</p>
              <p className="text-2xl font-heading font-bold text-olive">{formatCurrency(totals.totalAmount)}</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Completed</p>
              <p className="text-2xl font-heading font-bold text-green-600">{formatCurrency(totals.completedAmount)}</p>
              <p className="text-xs text-medium-gray">{totals.completedCount} payouts</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Pending</p>
              <p className="text-2xl font-heading font-bold text-yellow-600">{formatCurrency(totals.pendingAmount)}</p>
              <p className="text-xs text-medium-gray">{totals.pendingCount} payouts</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-olive text-olive'
                : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
            }`}
          >
            All Payouts
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scheduled'
                ? 'border-olive text-olive'
                : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
            }`}
          >
            Scheduled ({scheduledPayouts.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'summary'
                ? 'border-olive text-olive'
                : 'border-transparent text-medium-gray hover:text-dark-gray hover:border-light-gray'
            }`}
          >
            By Program
          </button>
        </nav>
      </div>

      {/* All Payouts Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-charcoal">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input w-40"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payouts Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dealer</th>
                    <th>Program</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Paid</th>
                    <th>Reference</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-medium-gray">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id}>
                        <td>
                          <div>
                            <p className="font-medium text-charcoal">{payout.dealer.name}</p>
                            <p className="text-xs text-medium-gray">{payout.dealer.code}</p>
                          </div>
                        </td>
                        <td>{payout.program.name}</td>
                        <td>{getTypeBadge(payout.payoutType)}</td>
                        <td className="font-medium">{formatCurrency(payout.amount)}</td>
                        <td>{getStatusBadge(payout.status)}</td>
                        <td>{formatDate(payout.scheduledDate)}</td>
                        <td>{formatDate(payout.paidDate)}</td>
                        <td className="font-mono text-sm">{payout.referenceNumber || '-'}</td>
                        <td>
                          {payout.status === 'pending' && (
                            <button
                              onClick={() => setProcessingPayout(payout)}
                              className="btn-primary btn-sm"
                            >
                              Process
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Scheduled Payouts Tab */}
      {activeTab === 'scheduled' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Scheduled Payouts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheduled Date</th>
                  <th>Dealer</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scheduledPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-medium-gray">
                      No scheduled payouts
                    </td>
                  </tr>
                ) : (
                  scheduledPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="font-medium">{formatDate(payout.scheduledDate)}</td>
                      <td>
                        <div>
                          <p className="font-medium text-charcoal">{payout.dealer.name}</p>
                          <p className="text-xs text-medium-gray">{payout.dealer.code}</p>
                        </div>
                      </td>
                      <td>{payout.program.name}</td>
                      <td className="font-medium">{formatCurrency(payout.amount)}</td>
                      <td>{getStatusBadge(payout.status)}</td>
                      <td>
                        <button
                          onClick={() => setProcessingPayout(payout)}
                          className="btn-primary btn-sm"
                        >
                          Process Now
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Program Summary Tab */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programSummary.length === 0 ? (
            <div className="col-span-full card">
              <div className="card-body text-center py-8 text-medium-gray">
                No active programs with payouts
              </div>
            </div>
          ) : (
            programSummary.map((program) => (
              <div key={program.programId} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-heading font-semibold text-charcoal">{program.programName}</h4>
                      <p className="text-sm text-medium-gray">{program.payoutCount} total payouts</p>
                    </div>
                    {getTypeBadge(program.programType)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-medium-gray">Total Paid</span>
                      <span className="font-heading font-bold text-green-600">
                        {formatCurrency(program.totalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium-gray">Pending</span>
                      <span className="font-heading font-bold text-yellow-600">
                        {formatCurrency(program.pendingAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-light-gray rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${program.totalPaid + program.pendingAmount > 0
                            ? (program.totalPaid / (program.totalPaid + program.pendingAmount)) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Process Payout Modal */}
      {processingPayout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-light-gray">
              <h2 className="text-lg font-heading font-semibold text-charcoal">
                Process Payout
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Payout Details */}
              <div className="bg-light-gray/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-medium-gray">Dealer:</span>
                  <span className="font-medium">{processingPayout.dealer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-gray">Program:</span>
                  <span>{processingPayout.program.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium-gray">Amount:</span>
                  <span className="font-heading font-bold text-lg text-olive">
                    {formatCurrency(processingPayout.amount)}
                  </span>
                </div>
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Payment Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., CHK-123456 or ACH-789012"
                />
                <p className="text-xs text-medium-gray mt-1">
                  Enter the check number, ACH reference, or other payment identifier
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-light-gray flex justify-end gap-3">
              <button
                onClick={() => {
                  setProcessingPayout(null)
                  setReferenceNumber('')
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessPayout}
                disabled={!referenceNumber.trim() || isPending}
                className="btn-primary"
              >
                {isPending ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
