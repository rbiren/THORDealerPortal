'use client';

// Inventory Forecasting Page
// Main dashboard for demand forecasting and order planning

import { useState, useEffect, useCallback } from 'react';
import {
  ForecastingSummaryCards,
  OrderPlanTable,
  DemandForecastChart,
  MarketAnalysisCard,
  OrderTimeline,
} from '@/components/forecasting';
import type {
  ForecastChartData,
  MarketAnalysis,
  OrderTimelineData,
  SuggestedOrderItem,
  ForecastSummary,
  OrderPlanSummary,
} from '@/types/forecasting';

// Demo dealer ID for development - would come from auth context
const DEMO_DEALER_ID = 'demo-dealer-001';

type Tab = 'overview' | 'orders' | 'demand' | 'market';

export default function ForecastingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [orderSummary, setOrderSummary] = useState<OrderPlanSummary | null>(null);
  const [orders, setOrders] = useState<SuggestedOrderItem[]>([]);
  const [forecastSummaries, setForecastSummaries] = useState<ForecastSummary[]>([]);
  const [chartData, setChartData] = useState<ForecastChartData | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [timelineData, setTimelineData] = useState<OrderTimelineData | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [ordersRes, demandRes, chartRes, marketRes, timelineRes] = await Promise.all([
        fetch(`/api/forecasting/orders?dealerId=${DEMO_DEALER_ID}`),
        fetch(`/api/forecasting/demand?dealerId=${DEMO_DEALER_ID}`),
        fetch(`/api/forecasting/demand?dealerId=${DEMO_DEALER_ID}&format=chart`),
        fetch(`/api/forecasting/market?dealerId=${DEMO_DEALER_ID}`),
        fetch(`/api/forecasting/orders?dealerId=${DEMO_DEALER_ID}&format=timeline`),
      ]);

      // Process orders
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.data.orders || []);
          setOrderSummary(ordersData.data.summary || null);
        }
      }

      // Process demand forecasts
      if (demandRes.ok) {
        const demandData = await demandRes.json();
        if (demandData.success && demandData.data.forecasts) {
          // Extract summaries from forecasts if available
          // For now, we'll calculate from the forecast data
          const summaries: ForecastSummary[] = demandData.data.forecasts.map((f: { periods: { forecastedDemand: number; periodLabel: string }[] }) => {
            const demands = f.periods.map((p: { forecastedDemand: number }) => p.forecastedDemand);
            const total = demands.reduce((a: number, b: number) => a + b, 0);
            return {
              totalForecastedDemand: total,
              averageMonthlyDemand: total / f.periods.length,
              peakMonth: f.periods.reduce((max: { forecastedDemand: number; periodLabel: string }, p: { forecastedDemand: number; periodLabel: string }) => p.forecastedDemand > max.forecastedDemand ? p : max, f.periods[0])?.periodLabel || '',
              lowMonth: f.periods.reduce((min: { forecastedDemand: number; periodLabel: string }, p: { forecastedDemand: number; periodLabel: string }) => p.forecastedDemand < min.forecastedDemand ? p : min, f.periods[0])?.periodLabel || '',
              trendDirection: 'stable' as const,
              confidenceScore: 0.85,
            };
          });
          setForecastSummaries(summaries);
        }
      }

      // Process chart data
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        if (chartJson.success) {
          setChartData(chartJson.data);
        }
      }

      // Process market analysis
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        if (marketData.success) {
          setMarketAnalysis(marketData.data);
        }
      }

      // Process timeline
      if (timelineRes.ok) {
        const timelineJson = await timelineRes.json();
        if (timelineJson.success) {
          setTimelineData(timelineJson.data);
        }
      }
    } catch (err) {
      console.error('Error fetching forecasting data:', err);
      setError('Failed to load forecasting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate forecasts
  const handleGenerateForecasts = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate demand forecasts
      const demandRes = await fetch('/api/forecasting/demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId: DEMO_DEALER_ID }),
      });

      if (!demandRes.ok) {
        throw new Error('Failed to generate demand forecasts');
      }

      // Generate order plan
      const ordersRes = await fetch('/api/forecasting/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId: DEMO_DEALER_ID }),
      });

      if (!ordersRes.ok) {
        throw new Error('Failed to generate order plan');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error generating forecasts:', err);
      setError('Failed to generate forecasts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle order actions
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/forecasting/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'accepted' }),
      });

      if (res.ok) {
        // Update local state
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: 'accepted' } : o)
        );
      }
    } catch (err) {
      console.error('Error accepting order:', err);
    }
  };

  const handleSkipOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/forecasting/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'skipped' }),
      });

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: 'skipped' } : o)
        );
      }
    } catch (err) {
      console.error('Error skipping order:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory Forecasting
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                18-month demand forecasts and suggested order planning
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button
                onClick={handleGenerateForecasts}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate Forecasts
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'orders', label: 'Order Plan' },
              { id: 'demand', label: 'Demand Forecast' },
              { id: 'market', label: 'Market Analysis' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ForecastingSummaryCards
              orderSummary={orderSummary || undefined}
              forecastSummaries={forecastSummaries}
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DemandForecastChart data={chartData} isLoading={isLoading} />
              <OrderTimeline data={timelineData} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <OrderPlanTable
                  orders={orders.slice(0, 5)}
                  onAccept={handleAcceptOrder}
                  onSkip={handleSkipOrder}
                  isLoading={isLoading}
                />
              </div>
              <MarketAnalysisCard analysis={marketAnalysis} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <OrderTimeline data={timelineData} isLoading={isLoading} />
            <OrderPlanTable
              orders={orders}
              onAccept={handleAcceptOrder}
              onSkip={handleSkipOrder}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Demand Tab */}
        {activeTab === 'demand' && (
          <div className="space-y-6">
            <DemandForecastChart data={chartData} isLoading={isLoading} />

            {/* Product-level forecasts would go here */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Forecasts</h3>
              <p className="text-gray-500 text-sm">
                Detailed product-level forecast breakdown coming soon.
                Use the chart above for aggregated demand projections.
              </p>
            </div>
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <MarketAnalysisCard analysis={marketAnalysis} isLoading={isLoading} />

            {/* Regional comparison would go here */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Comparison</h3>
              <p className="text-gray-500 text-sm">
                Compare your region&apos;s market indicators against national averages.
                Additional market intelligence features coming soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-500">
          Forecasts are based on historical order patterns and market indicators.
          Actual demand may vary. Review and adjust as needed.
        </div>
      </div>
    </div>
  );
}
