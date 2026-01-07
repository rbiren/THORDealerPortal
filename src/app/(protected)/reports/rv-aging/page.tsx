'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getRVAgingSummary,
  getRVAgingBuckets,
  getAgingUnits,
  type AgingSummary,
  type AgingBucket,
  type AgingUnit,
} from './actions'

export default function RVAgingReportPage() {
  const [summary, setSummary] = useState<AgingSummary | null>(null)
  const [buckets, setBuckets] = useState<AgingBucket[]>([])
  const [units, setUnits] = useState<AgingUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview')
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadBucketDetails()
    } else {
      loadAllUnits()
    }
  }, [selectedBucket])

  async function loadData() {
    setLoading(true)
    try {
      const [summaryData, bucketsData, unitsData] = await Promise.all([
        getRVAgingSummary(),
        getRVAgingBuckets(),
        getAgingUnits(),
      ])
      setSummary(summaryData)
      setBuckets(bucketsData)
      setUnits(unitsData)
    } finally {
      setLoading(false)
    }
  }

  async function loadBucketDetails() {
    const bucket = buckets.find((b) => b.bucket === selectedBucket)
    if (!bucket) return

    setLoading(true)
    try {
      const unitsData = await getAgingUnits(bucket.minDays, bucket.maxDays ?? undefined)
      setUnits(unitsData)
    } finally {
      setLoading(false)
    }
  }

  async function loadAllUnits() {
    setLoading(true)
    try {
      const unitsData = await getAgingUnits()
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

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getBucketColor(bucket: string): string {
    switch (bucket) {
      case '0-30 days':
        return 'bg-green-100 text-green-800 border-green-300'
      case '31-60 days':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case '61-90 days':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case '91-120 days':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case '120+ days':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  function getBucketBarColor(bucket: string): string {
    switch (bucket) {
      case '0-30 days':
        return 'bg-green-500'
      case '31-60 days':
        return 'bg-blue-500'
      case '61-90 days':
        return 'bg-yellow-500'
      case '91-120 days':
        return 'bg-orange-500'
      case '120+ days':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  function getDaysColor(days: number): string {
    if (days <= 30) return 'text-green-600'
    if (days <= 60) return 'text-blue-600'
    if (days <= 90) return 'text-yellow-600'
    if (days <= 120) return 'text-orange-600'
    return 'text-red-600'
  }

  const maxBucketValue = Math.max(...buckets.map((b) => b.totalValue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/reports">Reports</Link>
          <span className="breadcrumb-separator">/</span>
          <span>RV Inventory Aging</span>
        </nav>
        <h1 className="page-title">RV Inventory Aging Report</h1>
        <p className="page-subtitle">Monitor days on lot and identify stale inventory</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-4">
          {(['overview', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'overview') setSelectedBucket(null)
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-olive text-olive'
                  : 'border-transparent text-medium-gray hover:text-charcoal'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 'Unit Details'}
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
          {/* Overview Tab */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Units</p>
                    <p className="text-3xl font-heading font-bold text-charcoal mt-1">
                      {summary.totalUnits}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {formatCurrency(summary.totalValue)} value
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Avg Days on Lot</p>
                    <p className={`text-3xl font-heading font-bold mt-1 ${getDaysColor(summary.avgDaysOnLot)}`}>
                      {summary.avgDaysOnLot}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">days average</p>
                  </div>
                </div>

                <div className="card border-l-4 border-l-orange-500">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Units Over 90 Days</p>
                    <p className="text-3xl font-heading font-bold text-orange-600 mt-1">
                      {summary.unitsOver90Days}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {summary.totalUnits > 0
                        ? `${Math.round((summary.unitsOver90Days / summary.totalUnits) * 100)}% of inventory`
                        : '0% of inventory'}
                    </p>
                  </div>
                </div>

                <div className="card border-l-4 border-l-red-500">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Est. Carrying Cost</p>
                    <p className="text-3xl font-heading font-bold text-red-600 mt-1">
                      {formatCurrency(summary.totalCarryingCost)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">floor plan interest</p>
                  </div>
                </div>
              </div>

              {/* Aging Buckets */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Inventory by Age</h2>
                  <p className="text-sm text-medium-gray mt-1">Click a bucket to view details</p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {buckets.map((bucket) => (
                      <button
                        key={bucket.bucket}
                        onClick={() => {
                          setSelectedBucket(bucket.bucket)
                          setActiveTab('details')
                        }}
                        className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${getBucketColor(bucket.bucket)} ${
                          selectedBucket === bucket.bucket ? 'ring-2 ring-offset-2 ring-olive' : ''
                        }`}
                      >
                        <p className="text-xs font-medium uppercase">{bucket.bucket}</p>
                        <p className="text-2xl font-bold mt-1">{bucket.unitCount}</p>
                        <p className="text-xs mt-1">units</p>
                        <p className="text-sm font-medium mt-2">{formatCurrency(bucket.totalValue)}</p>
                      </button>
                    ))}
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="space-y-3">
                    {buckets.map((bucket) => (
                      <div key={bucket.bucket} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium">{bucket.bucket}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-6">
                            <div
                              className={`${getBucketBarColor(bucket.bucket)} rounded-full h-6 transition-all flex items-center justify-end pr-2`}
                              style={{ width: `${Math.max((bucket.totalValue / maxBucketValue) * 100, bucket.unitCount > 0 ? 5 : 0)}%` }}
                            >
                              {bucket.unitCount > 0 && (
                                <span className="text-white text-xs font-medium">{bucket.unitCount}</span>
                              )}
                            </div>
                          </div>
                          <span className="w-28 text-sm font-medium text-right">{formatCurrency(bucket.totalValue)}</span>
                        </div>
                        <div className="w-12 text-sm text-medium-gray text-right">{bucket.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alert for Old Inventory */}
              {summary.unitsOver90Days > 0 && (
                <div className="card border-l-4 border-l-red-500 bg-red-50">
                  <div className="card-body">
                    <div className="flex items-start gap-3">
                      <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-red-800">Aged Inventory Alert</h3>
                        <p className="text-sm text-red-700 mt-1">
                          You have <strong>{summary.unitsOver90Days}</strong> units that have been on the lot for more than 90 days.
                          {summary.unitsOver120Days > 0 && (
                            <> Of these, <strong>{summary.unitsOver120Days}</strong> are over 120 days.</>
                          )}
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                          Consider pricing adjustments or promotions to move these units and reduce carrying costs.
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
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBucket(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedBucket === null
                      ? 'bg-olive text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Units
                </button>
                {buckets.map((bucket) => (
                  <button
                    key={bucket.bucket}
                    onClick={() => setSelectedBucket(bucket.bucket)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedBucket === bucket.bucket
                        ? 'bg-olive text-white'
                        : `${getBucketColor(bucket.bucket)} hover:opacity-80`
                    }`}
                  >
                    {bucket.bucket} ({bucket.unitCount})
                  </button>
                ))}
              </div>

              {/* Units Table */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">
                    {selectedBucket ? `Units: ${selectedBucket}` : 'All Units by Age'}
                  </h2>
                  <p className="text-sm text-medium-gray mt-1">{units.length} units found</p>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-6 w-6 border-2 border-olive border-t-transparent rounded-full" />
                    </div>
                  ) : units.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No units in this age range</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-light-beige">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Stock #</th>
                          <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Received</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Days on Lot</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">MSRP</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Cost</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Daily Carry</th>
                          <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Total Carry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-gray">
                        {units.map((unit) => (
                          <tr key={unit.id} className="hover:bg-light-beige/50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-charcoal">
                                {unit.modelYear} {unit.series} {unit.modelName}
                              </p>
                              <p className="text-xs text-medium-gray capitalize">{unit.condition}</p>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {unit.stockNumber || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(unit.receivedDate)}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${getDaysColor(unit.daysOnLot)}`}>
                              {unit.daysOnLot} days
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(unit.msrp)}
                            </td>
                            <td className="px-4 py-3 text-right text-medium-gray">
                              {formatCurrency(unit.invoiceCost)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-medium-gray">
                              {formatCurrency(unit.dailyCarryingCost)}/day
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-red-600">
                              {formatCurrency(unit.totalCarryingCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
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
