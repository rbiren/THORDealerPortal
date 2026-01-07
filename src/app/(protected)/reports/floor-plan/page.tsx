'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getFloorPlanSummary,
  getFloorPlanUnits,
  getFloorPlanLenders,
  type FloorPlanSummary,
  type FloorPlanUnit,
} from './actions'

export default function FloorPlanReportPage() {
  const [summary, setSummary] = useState<FloorPlanSummary | null>(null)
  const [units, setUnits] = useState<FloorPlanUnit[]>([])
  const [lenders, setLenders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')
  const [selectedLender, setSelectedLender] = useState<string | null>(null)
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadUnits()
  }, [selectedLender, showOverdueOnly])

  async function loadData() {
    setLoading(true)
    try {
      const [summaryData, unitsData, lendersData] = await Promise.all([
        getFloorPlanSummary(),
        getFloorPlanUnits(),
        getFloorPlanLenders(),
      ])
      setSummary(summaryData)
      setUnits(unitsData)
      setLenders(lendersData)
    } finally {
      setLoading(false)
    }
  }

  async function loadUnits() {
    setLoading(true)
    try {
      const unitsData = await getFloorPlanUnits(
        selectedLender ?? undefined,
        showOverdueOnly
      )
      setUnits(unitsData)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(date: Date | null): string {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getDueStatusColor(unit: FloorPlanUnit): string {
    if (unit.isOverdue) return 'text-red-600 bg-red-100'
    if (unit.daysUntilDue !== null && unit.daysUntilDue <= 30) return 'text-orange-600 bg-orange-100'
    return 'text-green-600 bg-green-100'
  }

  function getDueStatusText(unit: FloorPlanUnit): string {
    if (!unit.floorPlanDueDate) return 'No due date'
    if (unit.isOverdue) return `${Math.abs(unit.daysUntilDue!)} days overdue`
    if (unit.daysUntilDue !== null && unit.daysUntilDue <= 0) return 'Due today'
    return `${unit.daysUntilDue} days`
  }

  const maxLenderPayoff = summary?.byLender.length
    ? Math.max(...summary.byLender.map((l) => l.totalPayoff), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/reports">Reports</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Floor Plan Exposure</span>
        </nav>
        <h1 className="page-title">Floor Plan Exposure Report</h1>
        <p className="page-subtitle">Monitor floor plan payoffs, carrying costs, and due dates</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-4">
          {(['summary', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'summary') {
                  setSelectedLender(null)
                  setShowOverdueOnly(false)
                }
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-olive text-olive'
                  : 'border-transparent text-medium-gray hover:text-charcoal'
              }`}
            >
              {tab === 'summary' ? 'Summary' : 'Unit Details'}
            </button>
          ))}
        </nav>
      </div>

      {loading && !summary ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Floor Plan Exposure</p>
                    <p className="text-3xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary.totalExposure)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      across {summary.totalUnits} units
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Avg Payoff / Unit</p>
                    <p className="text-3xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary.avgPayoffPerUnit)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Est. Monthly Interest</p>
                    <p className="text-3xl font-heading font-bold text-orange-600 mt-1">
                      {formatCurrency(summary.monthlyInterestEstimate)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">carrying cost</p>
                  </div>
                </div>

                <div className="card border-l-4 border-l-red-500">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Attention Required</p>
                    <div className="flex items-baseline gap-4 mt-1">
                      <div>
                        <p className="text-2xl font-heading font-bold text-red-600">
                          {summary.overdueUnits}
                        </p>
                        <p className="text-xs text-medium-gray">overdue</p>
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold text-orange-600">
                          {summary.unitsNearPayoff}
                        </p>
                        <p className="text-xs text-medium-gray">due in 30 days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exposure by Lender */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Exposure by Lender</h2>
                </div>
                <div className="card-body">
                  {summary.byLender.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No floor plan data available</p>
                  ) : (
                    <div className="space-y-4">
                      {summary.byLender.map((lender) => (
                        <button
                          key={lender.lender}
                          onClick={() => {
                            setSelectedLender(lender.lender)
                            setActiveTab('details')
                          }}
                          className="w-full text-left group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-charcoal group-hover:text-olive transition-colors">
                                {lender.lender}
                              </span>
                              <span className="text-sm text-medium-gray">
                                ({lender.unitCount} units)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-charcoal">{formatCurrency(lender.totalPayoff)}</span>
                              <span className="text-sm text-medium-gray ml-2">({lender.percentage}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 group-hover:bg-gray-300 transition-colors">
                            <div
                              className="bg-purple-600 rounded-full h-3 transition-all"
                              style={{ width: `${(lender.totalPayoff / maxLenderPayoff) * 100}%` }}
                            />
                          </div>
                          {lender.avgInterestRate > 0 && (
                            <p className="text-xs text-medium-gray mt-1">
                              Avg rate: {lender.avgInterestRate}%
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              {summary.overdueUnits > 0 && (
                <div className="card border-l-4 border-l-red-500 bg-red-50">
                  <div className="card-body">
                    <div className="flex items-start gap-3">
                      <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-red-800">Overdue Floor Plan Alert</h3>
                        <p className="text-sm text-red-700 mt-1">
                          You have <strong>{summary.overdueUnits}</strong> units with overdue floor plan payoffs.
                          Late fees may apply. Please review and take action.
                        </p>
                        <button
                          onClick={() => {
                            setShowOverdueOnly(true)
                            setActiveTab('details')
                          }}
                          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                        >
                          View overdue units →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {summary.unitsNearPayoff > 0 && summary.overdueUnits === 0 && (
                <div className="card border-l-4 border-l-orange-500 bg-orange-50">
                  <div className="card-body">
                    <div className="flex items-start gap-3">
                      <svg className="h-6 w-6 text-orange-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-orange-800">Upcoming Payoffs</h3>
                        <p className="text-sm text-orange-700 mt-1">
                          <strong>{summary.unitsNearPayoff}</strong> units have floor plan payoffs due in the next 30 days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Lender:</label>
                  <select
                    value={selectedLender || ''}
                    onChange={(e) => setSelectedLender(e.target.value || null)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Lenders</option>
                    {lenders.map((lender) => (
                      <option key={lender} value={lender}>
                        {lender}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOverdueOnly}
                    onChange={(e) => setShowOverdueOnly(e.target.checked)}
                    className="rounded border-gray-300 text-olive focus:ring-olive"
                  />
                  <span className="text-sm font-medium text-gray-700">Show overdue only</span>
                </label>
              </div>

              {/* Units Table */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">
                    Floor Plan Units
                    {selectedLender && ` - ${selectedLender}`}
                    {showOverdueOnly && ' (Overdue)'}
                  </h2>
                  <p className="text-sm text-medium-gray mt-1">{units.length} units found</p>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-6 w-6 border-2 border-olive border-t-transparent rounded-full" />
                    </div>
                  ) : units.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No floor plan units found</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Lender</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Payoff</th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Due Date</th>
                          <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Monthly Int.</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Days Floored</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {units.map((unit) => (
                          <tr key={unit.id} className={`hover:bg-light-beige/50 ${unit.isOverdue ? 'bg-red-50' : ''}`}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-charcoal">
                                {unit.modelYear} {unit.series} {unit.modelName}
                              </p>
                              <p className="text-xs text-medium-gray">
                                {unit.stockNumber || unit.vin.slice(-8)}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <p className="font-medium">{unit.floorPlanLender}</p>
                              {unit.floorPlanNumber && (
                                <p className="text-xs text-medium-gray">{unit.floorPlanNumber}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatCurrency(unit.floorPlanPayoff)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(unit.floorPlanDueDate)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDueStatusColor(unit)}`}>
                                {getDueStatusText(unit)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {unit.floorPlanInterestRate ? `${unit.floorPlanInterestRate}%` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-orange-600 font-medium">
                              {formatCurrency(unit.monthlyInterest)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {unit.daysOnFloorPlan} days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-light-beige font-semibold">
                        <tr>
                          <td className="px-4 py-3" colSpan={2}>
                            Total ({units.length} units)
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(units.reduce((sum, u) => sum + u.floorPlanPayoff, 0))}
                          </td>
                          <td className="px-4 py-3" colSpan={3}></td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {formatCurrency(units.reduce((sum, u) => sum + u.monthlyInterest, 0))}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
