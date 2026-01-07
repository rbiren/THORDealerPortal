'use client'

import Link from 'next/link'

const reports = [
  // RV Reports
  {
    id: 'rv-sales',
    name: 'RV Unit Sales',
    description: 'Track RV sales performance, trends, and gross profit analysis',
    href: '/reports/rv-sales',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'rv-aging',
    name: 'RV Inventory Aging',
    description: 'Monitor days on lot, aging buckets, and stale inventory',
    href: '/reports/rv-aging',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'floor-plan',
    name: 'Floor Plan Exposure',
    description: 'View floor plan payoffs, carrying costs, and lender breakdown',
    href: '/reports/floor-plan',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'bg-purple-100 text-purple-600',
  },
  // Parts Reports
  {
    id: 'sales',
    name: 'Parts Sales Reports',
    description: 'View sales trends, product performance, and revenue analysis',
    href: '/reports/sales',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'bg-olive/10 text-olive',
  },
  {
    id: 'inventory',
    name: 'Parts Inventory Reports',
    description: 'Track inventory levels, turnover rates, and stock aging',
    href: '/reports/inventory',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'orders',
    name: 'Order Reports',
    description: 'Analyze order patterns, fulfillment times, and status distribution',
    href: '/reports/orders',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: 'bg-yellow-100 text-yellow-600',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Reports</span>
        </nav>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Access detailed reports and analytics for your business</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={report.href}
            className="card hover:shadow-lg transition-shadow group"
          >
            <div className="card-body">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.color} group-hover:scale-110 transition-transform`}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-semibold text-charcoal group-hover:text-olive transition-colors">
                    {report.name}
                  </h3>
                  <p className="text-sm text-medium-gray mt-1">{report.description}</p>
                </div>
                <svg className="h-5 w-5 text-light-gray group-hover:text-olive transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-heading font-semibold text-charcoal">Quick Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-olive">--</p>
              <p className="text-sm text-medium-gray mt-1">MTD Sales</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-blue-600">--</p>
              <p className="text-sm text-medium-gray mt-1">Active Products</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-yellow-600">--</p>
              <p className="text-sm text-medium-gray mt-1">Orders This Month</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-purple-600">--</p>
              <p className="text-sm text-medium-gray mt-1">Avg Order Value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
