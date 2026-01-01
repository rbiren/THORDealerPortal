'use client';

// Forecasting Summary Cards Component
// Displays key forecasting metrics at a glance

import type { OrderPlanSummary, ForecastSummary } from '@/types/forecasting';

interface ForecastingSummaryCardsProps {
  orderSummary?: OrderPlanSummary;
  forecastSummaries?: ForecastSummary[];
  isLoading?: boolean;
}

export function ForecastingSummaryCards({
  orderSummary,
  forecastSummaries,
  isLoading,
}: ForecastingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate aggregated forecast metrics
  const totalForecastedDemand = forecastSummaries?.reduce(
    (sum, s) => sum + s.totalForecastedDemand,
    0
  ) || 0;

  const avgMonthlyDemand = forecastSummaries?.reduce(
    (sum, s) => sum + s.averageMonthlyDemand,
    0
  ) || 0;

  const trendUp = forecastSummaries?.filter(s => s.trendDirection === 'up').length || 0;
  const trendDown = forecastSummaries?.filter(s => s.trendDirection === 'down').length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Upcoming Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Upcoming Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {orderSummary?.upcomingMonth || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        {orderSummary?.criticalOrders && orderSummary.criticalOrders > 0 && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {orderSummary.criticalOrders} critical
          </div>
        )}
      </div>

      {/* Total Forecasted Units */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Forecasted Demand</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalForecastedDemand.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">18-month total</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          ~{Math.round(avgMonthlyDemand).toLocaleString()} units/month avg
        </div>
      </div>

      {/* Estimated Order Value */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${((orderSummary?.totalEstimatedCost || 0) / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-1">Planned orders</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Value: ${((orderSummary?.totalEstimatedValue || 0) / 1000).toFixed(0)}K
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Demand Trends</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {trendUp}
              </span>
              <span className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {trendDown}
              </span>
            </div>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Products by trend direction</p>
      </div>
    </div>
  );
}
