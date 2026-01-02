'use client';

// Demand Forecast Chart Component
// Visualizes 18-month demand forecasts with confidence intervals

import type { ForecastChartData } from '@/types/forecasting';

interface DemandForecastChartProps {
  data: ForecastChartData | null;
  isLoading?: boolean;
}

export function DemandForecastChart({ data, isLoading }: DemandForecastChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.labels.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No forecast data available. Generate forecasts to see projections.
        </div>
      </div>
    );
  }

  // Find max value for scaling
  const allValues = data.datasets.flatMap(d => d.data);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const chartHeight = 256;
  const chartWidth = data.labels.length * 60;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  const getY = (value: number) => {
    return chartHeight - padding.bottom - ((value - minValue) / range) * (chartHeight - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    return padding.left + (index / (data.labels.length - 1)) * (chartWidth - padding.left - padding.right);
  };

  // Create path for each dataset
  const forecastPath = data.datasets[0].data
    .map((value, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(value)}`)
    .join(' ');

  const lowerPath = data.datasets[1]?.data
    .map((value, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(value)}`)
    .join(' ') || '';

  const upperPath = data.datasets[2]?.data
    .map((value, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(value)}`)
    .join(' ') || '';

  // Create filled area between bounds
  const areaPath = lowerPath && upperPath
    ? `${lowerPath} L ${getX(data.labels.length - 1)} ${getY(data.datasets[2].data[data.labels.length - 1])} ${data.datasets[2].data.map((value, i) => `L ${getX(data.labels.length - 1 - i)} ${getY(value)}`).reverse().join(' ')} Z`
    : '';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-gray-600">Forecast</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-gray-600">Confidence Range</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="min-w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + (1 - pct) * (chartHeight - padding.top - padding.bottom);
            const value = minValue + pct * range;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* Confidence interval area */}
          {areaPath && (
            <path
              d={areaPath}
              fill="rgba(148, 163, 184, 0.2)"
            />
          )}

          {/* Lower bound line */}
          {lowerPath && (
            <path
              d={lowerPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Upper bound line */}
          {upperPath && (
            <path
              d={upperPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Main forecast line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.datasets[0].data.map((value, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(value)}
              r="4"
              fill="#2563eb"
              className="hover:r-6 transition-all"
            >
              <title>{`${data.labels[i]}: ${Math.round(value)} units`}</title>
            </circle>
          ))}

          {/* X-axis labels */}
          {data.labels.map((label, i) => (
            <text
              key={i}
              x={getX(i)}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-sm text-center">
          <div>
            <div className="text-gray-500">Total Forecast</div>
            <div className="text-xl font-bold text-gray-900">
              {data.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">units</div>
          </div>
          <div>
            <div className="text-gray-500">Monthly Average</div>
            <div className="text-xl font-bold text-gray-900">
              {Math.round(data.datasets[0].data.reduce((a, b) => a + b, 0) / data.labels.length).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">units/month</div>
          </div>
          <div>
            <div className="text-gray-500">Peak Month</div>
            <div className="text-xl font-bold text-gray-900">
              {data.labels[data.datasets[0].data.indexOf(Math.max(...data.datasets[0].data))]}
            </div>
            <div className="text-xs text-gray-500">{Math.max(...data.datasets[0].data).toLocaleString()} units</div>
          </div>
        </div>
      </div>
    </div>
  );
}
