'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  runAccrualCalculation,
  finalizeAccrualsAction,
  getAccrualSummaryAction,
  getAvailablePeriods,
  getPeriodAccruals,
  type AccrualSummary,
} from '../actions'

type Props = {
  programId: string
  programType: string
  programStatus: string
}

type AccrualDetail = {
  id: string
  dealer: { id: string; name: string; code: string }
  qualifyingVolume: number
  rebateRate: number
  accruedAmount: number
  finalAmount: number
  tierAchieved: string | null
  status: string
}

type Period = {
  label: string
  periodType: 'monthly' | 'quarterly' | 'annual'
  periodStart: string
  periodEnd: string
}

export function AccrualsTab({ programId, programType, programStatus }: Props) {
  const [summary, setSummary] = useState<AccrualSummary | null>(null)
  const [accruals, setAccruals] = useState<AccrualDetail[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [recalculate, setRecalculate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isRunning, setIsRunning] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      const periodsData = await getAvailablePeriods()
      setPeriods(periodsData)
      if (periodsData.length > 0) {
        setSelectedPeriod(periodsData[0].periodStart)
      }
      loadSummary()
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedPeriod && summary?.periods.length) {
      loadAccrualDetails()
    }
  }, [selectedPeriod])

  async function loadSummary() {
    startTransition(async () => {
      const data = await getAccrualSummaryAction(programId)
      setSummary(data)
    })
  }

  async function loadAccrualDetails() {
    const period = periods.find((p) => p.periodStart === selectedPeriod)
    if (!period) return

    startTransition(async () => {
      const data = await getPeriodAccruals(programId, period.periodStart, period.periodEnd)
      setAccruals(data)
    })
  }

  async function handleRunCalculation() {
    const period = periods.find((p) => p.periodStart === selectedPeriod)
    if (!period) return

    setIsRunning(true)
    setMessage(null)

    try {
      const result = await runAccrualCalculation(programId, {
        periodType: period.periodType,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        recalculate,
      })

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        loadSummary()
        loadAccrualDetails()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while running calculations' })
    } finally {
      setIsRunning(false)
    }
  }

  async function handleFinalizeAccruals() {
    const period = periods.find((p) => p.periodStart === selectedPeriod)
    if (!period) return

    if (!confirm('Are you sure you want to finalize these accruals? This will lock them for payout.')) {
      return
    }

    setMessage(null)

    try {
      const result = await finalizeAccrualsAction(programId, period.periodStart, period.periodEnd)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        loadSummary()
        loadAccrualDetails()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while finalizing accruals' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (programType !== 'rebate') {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-medium-gray"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium">Accruals Not Applicable</h3>
          <p className="mt-2 text-medium-gray">
            Accrual calculations only apply to rebate-type programs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Calculated</p>
              <p className="text-2xl font-heading font-bold text-blue-600">
                {formatCurrency(summary.calculatedAmount)}
              </p>
              <p className="text-xs text-medium-gray mt-1">{summary.totalCalculated} accruals</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Finalized</p>
              <p className="text-2xl font-heading font-bold text-orange-600">
                {formatCurrency(summary.finalizedAmount)}
              </p>
              <p className="text-xs text-medium-gray mt-1">{summary.totalFinalized} accruals</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-medium-gray">Paid</p>
              <p className="text-2xl font-heading font-bold text-green-600">
                {formatCurrency(summary.paidAmount)}
              </p>
              <p className="text-xs text-medium-gray mt-1">{summary.totalPaid} accruals</p>
            </div>
          </div>
        </div>
      )}

      {/* Run Calculation Panel */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Run Accrual Calculation</h3>
        </div>
        <div className="card-body">
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label className="label">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input w-full"
              >
                {periods.map((period) => (
                  <option key={period.periodStart} value={period.periodStart}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={recalculate}
                  onChange={(e) => setRecalculate(e.target.checked)}
                  className="h-4 w-4 rounded border-light-gray text-olive focus:ring-olive"
                />
                <span className="text-sm text-charcoal">Recalculate existing</span>
              </label>

              <button
                onClick={handleRunCalculation}
                disabled={isRunning || programStatus !== 'active'}
                className="btn-primary"
              >
                {isRunning ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Calculating...
                  </>
                ) : (
                  'Run Calculation'
                )}
              </button>
            </div>
          </div>

          {programStatus !== 'active' && (
            <p className="mt-3 text-sm text-yellow-600">
              Program must be active to run calculations.
            </p>
          )}
        </div>
      </div>

      {/* Period History */}
      {summary && summary.periods.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Period History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Dealers
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {summary.periods.map((period, idx) => (
                  <tr key={idx} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3 text-sm text-charcoal">
                      {formatDate(period.periodStart)} - {formatDate(period.periodEnd)}
                    </td>
                    <td className="px-4 py-3 text-sm text-charcoal capitalize">{period.periodType}</td>
                    <td className="px-4 py-3 text-center text-sm text-charcoal">{period.dealerCount}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-charcoal">
                      {formatCurrency(period.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          period.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : period.status === 'finalized'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accrual Details for Selected Period */}
      {accruals.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="card-title">
              Accrual Details - {periods.find((p) => p.periodStart === selectedPeriod)?.label}
            </h3>
            {accruals.some((a) => a.status === 'calculated') && (
              <button
                onClick={handleFinalizeAccruals}
                className="btn-outline btn-sm"
              >
                Finalize for Payout
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                    Dealer
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Qualifying Volume
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Accrued
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                    Final
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {accruals.map((accrual) => (
                  <tr key={accrual.id} className="hover:bg-light-beige/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{accrual.dealer.name}</p>
                      <p className="text-xs text-medium-gray">{accrual.dealer.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-charcoal">
                      {formatCurrency(accrual.qualifyingVolume)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-charcoal">
                      {formatPercent(accrual.rebateRate)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-charcoal">
                      {accrual.tierAchieved || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-charcoal">
                      {formatCurrency(accrual.accruedAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-charcoal">
                      {formatCurrency(accrual.finalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          accrual.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : accrual.status === 'finalized'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {accrual.status.charAt(0).toUpperCase() + accrual.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light-beige">
                <tr>
                  <td className="px-4 py-3 font-semibold text-charcoal" colSpan={4}>
                    Total ({accruals.length} dealers)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-charcoal">
                    {formatCurrency(accruals.reduce((sum, a) => sum + a.accruedAmount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-charcoal">
                    {formatCurrency(accruals.reduce((sum, a) => sum + a.finalAmount, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isPending ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
        </div>
      ) : (
        accruals.length === 0 &&
        !isPending && (
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-charcoal">No accruals for this period</h3>
              <p className="mt-2 text-medium-gray">
                Run a calculation to generate accruals for enrolled dealers.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
