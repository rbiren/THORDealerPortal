'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getRVSalesSummary,
  getRVSalesByMonth,
  getRVSalesBySeries,
  getRecentRVSales,
  type RVSalesSummary,
  type RVSalesByMonth,
  type RVSalesBySeries,
  type RVSoldUnit,
} from './actions'

export default function RVSalesReportPage() {
  const [summary, setSummary] = useState<RVSalesSummary | null>(null)
  const [byMonth, setByMonth] = useState<RVSalesByMonth[]>([])
  const [bySeries, setBySeries] = useState<RVSalesBySeries[]>([])
  const [recentSales, setRecentSales] = useState<RVSoldUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'monthly' | 'series' | 'details'>('summary')
  const [dateRange, setDateRange] = useState<'mtd' | 'ytd' | 'all'>('ytd')

  useEffect(() => {
    loadData()
  }, [dateRange])

  async function loadData() {
    setLoading(true)
    try {
      const now = new Date()
      let dateFrom: Date | undefined
      let dateTo: Date | undefined = now

      if (dateRange === 'mtd') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (dateRange === 'ytd') {
        dateFrom = new Date(now.getFullYear(), 0, 1)
      }

      const [summaryData, monthlyData, seriesData, recentData] = await Promise.all([
        getRVSalesSummary(dateFrom, dateTo),
        getRVSalesByMonth(12),
        getRVSalesBySeries(dateFrom, dateTo),
        getRecentRVSales(20),
      ])

      setSummary(summaryData)
      setByMonth(monthlyData)
      setBySeries(seriesData)
      setRecentSales(recentData)
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

  const maxMonthlyRevenue = Math.max(...byMonth.map((m) => m.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/reports">Reports</Link>
          <span className="breadcrumb-separator">/</span>
          <span>RV Unit Sales</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">RV Unit Sales Report</h1>
            <p className="page-subtitle">Track sales performance, gross profit, and trends</p>
          </div>
          <div className="flex gap-2">
            {(['mtd', 'ytd', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-olive text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === 'mtd' ? 'MTD' : range === 'ytd' ? 'YTD' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-light-gray">
        <nav className="flex gap-4">
          {(['summary', 'monthly', 'series', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-olive text-olive'
                  : 'border-transparent text-medium-gray hover:text-charcoal'
              }`}
            >
              {tab === 'summary' ? 'Summary' : tab === 'monthly' ? 'Monthly Trend' : tab === 'series' ? 'By Series' : 'Recent Sales'}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
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
                    <p className="text-sm text-medium-gray">Units Sold</p>
                    <p className="text-3xl font-heading font-bold text-charcoal mt-1">
                      {summary.totalUnitsSold}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {summary.newUnitsSold} new / {summary.usedUnitsSold} used
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Total Revenue</p>
                    <p className="text-3xl font-heading font-bold text-charcoal mt-1">
                      {formatCurrency(summary.totalRevenue)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Gross Profit</p>
                    <p className="text-3xl font-heading font-bold text-success mt-1">
                      {formatCurrency(summary.totalGrossProfit)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      {summary.totalRevenue > 0
                        ? `${Math.round((summary.totalGrossProfit / summary.totalRevenue) * 100)}% margin`
                        : '0% margin'}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-medium-gray">Avg Gross / Unit</p>
                    <p className="text-3xl font-heading font-bold text-olive mt-1">
                      {formatCurrency(summary.avgGrossPerUnit)}
                    </p>
                    <p className="text-sm text-medium-gray mt-1">
                      Avg {summary.avgDaysToSell} days to sell
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-heading font-semibold text-charcoal">Profit Breakdown</h2>
                  </div>
                  <div className="card-body space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-medium-gray">Total Revenue</span>
                      <span className="font-medium text-charcoal">{formatCurrency(summary.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-medium-gray">Total Cost</span>
                      <span className="font-medium text-charcoal">({formatCurrency(summary.totalCost)})</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-lg">
                      <span className="font-semibold text-charcoal">Gross Profit</span>
                      <span className="font-bold text-success">{formatCurrency(summary.totalGrossProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-heading font-semibold text-charcoal">Sales Mix</h2>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>New Units</span>
                          <span className="font-medium">{summary.newUnitsSold} ({summary.totalUnitsSold > 0 ? Math.round((summary.newUnitsSold / summary.totalUnitsSold) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 rounded-full h-3"
                            style={{ width: `${summary.totalUnitsSold > 0 ? (summary.newUnitsSold / summary.totalUnitsSold) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Used/Demo Units</span>
                          <span className="font-medium">{summary.usedUnitsSold} ({summary.totalUnitsSold > 0 ? Math.round((summary.usedUnitsSold / summary.totalUnitsSold) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 rounded-full h-3"
                            style={{ width: `${summary.totalUnitsSold > 0 ? (summary.usedUnitsSold / summary.totalUnitsSold) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Trend Tab */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Monthly Sales Trend (12 Months)</h2>
                </div>
                <div className="card-body">
                  {byMonth.length === 0 ? (
                    <p className="text-center text-medium-gray py-8">No sales data available</p>
                  ) : (
                    <div className="space-y-3">
                      {byMonth.map((month) => (
                        <div key={month.month} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-medium-gray">{month.monthLabel}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-6 bg-olive/80 rounded"
                                style={{ width: `${(month.revenue / maxMonthlyRevenue) * 100}%`, minWidth: month.revenue > 0 ? '4px' : '0' }}
                              />
                              <span className="text-sm font-medium">{formatCurrency(month.revenue)}</span>
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm text-charcoal font-medium">
                            {month.unitsSold} units
                          </div>
                          <div className="w-24 text-right text-sm text-success font-medium">
                            {formatCurrency(month.grossProfit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Summary Table */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-heading font-semibold text-charcoal">Monthly Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Month</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Units</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Gross Profit</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Avg Gross</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-gray">
                      {byMonth.map((month) => (
                        <tr key={month.month} className="hover:bg-light-beige/50">
                          <td className="px-4 py-3 font-medium">{month.monthLabel}</td>
                          <td className="px-4 py-3 text-right">{month.unitsSold}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(month.revenue)}</td>
                          <td className="px-4 py-3 text-right text-success font-medium">{formatCurrency(month.grossProfit)}</td>
                          <td className="px-4 py-3 text-right">
                            {month.unitsSold > 0 ? formatCurrency(month.grossProfit / month.unitsSold) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* By Series Tab */}
          {activeTab === 'series' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Sales by Series</h2>
              </div>
              <div className="overflow-x-auto">
                {bySeries.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No sales data available</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Series</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Units Sold</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">% of Total</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Gross Profit</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Avg Gross</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-gray">
                      {bySeries.map((series) => (
                        <tr key={series.series} className="hover:bg-light-beige/50">
                          <td className="px-4 py-3 font-medium">{series.series}</td>
                          <td className="px-4 py-3 text-right">{series.unitsSold}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-olive rounded-full h-2"
                                  style={{ width: `${series.percentage}%` }}
                                />
                              </div>
                              <span>{series.percentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(series.revenue)}</td>
                          <td className="px-4 py-3 text-right text-success font-medium">{formatCurrency(series.grossProfit)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(series.avgGross)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Recent Sales Tab */}
          {activeTab === 'details' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold text-charcoal">Recent Sales</h2>
              </div>
              <div className="overflow-x-auto">
                {recentSales.length === 0 ? (
                  <p className="text-center text-medium-gray py-8">No recent sales</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">VIN</th>
                        <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">Sold Date</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Days on Lot</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Sale Price</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-gray">
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-light-beige/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-charcoal">
                              {sale.modelYear} {sale.series} {sale.modelName}
                            </p>
                            <p className="text-xs text-medium-gray capitalize">{sale.condition}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-medium-gray font-mono">
                            {sale.vin.slice(-8)}
                          </td>
                          <td className="px-4 py-3 text-sm">{formatDate(sale.soldDate)}</td>
                          <td className="px-4 py-3 text-right text-sm">
                            {sale.daysOnLot !== null ? `${sale.daysOnLot} days` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.salePrice)}</td>
                          <td className="px-4 py-3 text-right text-medium-gray">{formatCurrency(sale.cost)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${sale.grossProfit >= 0 ? 'text-success' : 'text-error'}`}>
                            {formatCurrency(sale.grossProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
