'use client';

// Market Analysis Card Component
// Displays local market indicators and their impact on demand

import type { MarketAnalysis } from '@/types/forecasting';

interface MarketAnalysisCardProps {
  analysis: MarketAnalysis | null;
  isLoading?: boolean;
}

const outlookColors = {
  positive: 'text-green-600 bg-green-100',
  neutral: 'text-gray-600 bg-gray-100',
  negative: 'text-red-600 bg-red-100',
};

const impactIcons = {
  positive: (
    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  ),
  neutral: (
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
  negative: (
    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
};

export function MarketAnalysisCard({ analysis, isLoading }: MarketAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Local Market Analysis</h3>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No market data available for your region.</p>
          <p className="text-sm mt-1">Market indicators will appear here once data is collected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Local Market Analysis</h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${outlookColors[analysis.overallOutlook]}`}>
          {analysis.overallOutlook.charAt(0).toUpperCase() + analysis.overallOutlook.slice(1)} Outlook
        </span>
      </div>

      {/* Region */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-600">Region: <span className="font-medium text-gray-900">{analysis.region}</span></span>
        </div>
        <div className="mt-2 flex items-center text-sm">
          <span className="text-gray-500">Demand Adjustment Factor:</span>
          <span className={`ml-2 font-bold ${analysis.adjustmentFactor >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {analysis.adjustmentFactor >= 1 ? '+' : ''}{((analysis.adjustmentFactor - 1) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Indicators */}
      <div className="space-y-3">
        {analysis.indicators.length === 0 ? (
          <p className="text-gray-500 text-sm">No specific indicators available.</p>
        ) : (
          analysis.indicators.map((indicator, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                {impactIcons[indicator.impact]}
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{indicator.name}</div>
                  <div className="text-xs text-gray-500">{indicator.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {typeof indicator.currentValue === 'number'
                    ? indicator.currentValue.toLocaleString()
                    : indicator.currentValue}
                </div>
                <div className={`text-xs ${
                  indicator.trend === 'up' ? 'text-green-600' :
                  indicator.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {indicator.trend === 'up' ? '↑' : indicator.trend === 'down' ? '↓' : '→'} {indicator.trend}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Impact Summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Market Impact Summary</h4>
        <p className="text-sm text-gray-600">
          {analysis.overallOutlook === 'positive'
            ? 'Market conditions favor increased demand. Consider adjusting forecasts upward.'
            : analysis.overallOutlook === 'negative'
              ? 'Market conditions may suppress demand. Review forecasts for potential adjustments.'
              : 'Market conditions are stable. Forecasts should remain reliable.'}
        </p>
      </div>
    </div>
  );
}
