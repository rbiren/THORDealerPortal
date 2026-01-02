'use client';

// Order Timeline Component
// Visual 18-month timeline of suggested orders

import type { OrderTimelineData } from '@/types/forecasting';

interface OrderTimelineProps {
  data: OrderTimelineData | null;
  isLoading?: boolean;
}

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
};

export function OrderTimeline({ data, isLoading }: OrderTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.months.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
        <div className="h-40 flex items-center justify-center text-gray-500">
          No order plan available. Generate order plan to see timeline.
        </div>
      </div>
    );
  }

  // Find max values for scaling
  const maxUnits = Math.max(...data.months.map(m => m.units));
  const maxOrders = Math.max(...data.months.map(m => m.orders));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Order Timeline</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span className="text-gray-500">Normal</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
            <span className="text-gray-500">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
            <span className="text-gray-500">Critical</span>
          </div>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {data.months.map((month, index) => {
            const barHeight = maxUnits > 0 ? (month.units / maxUnits) * 100 : 0;
            const criticalCount = month.products.filter(p => p.priority === 'critical').length;
            const highCount = month.products.filter(p => p.priority === 'high').length;
            const normalCount = month.products.filter(p => p.priority === 'normal').length;

            return (
              <div
                key={index}
                className="flex flex-col items-center w-16"
              >
                {/* Bar */}
                <div className="relative w-full h-32 bg-gray-100 rounded flex flex-col justify-end">
                  {/* Stacked bars by priority */}
                  <div className="w-full flex flex-col-reverse">
                    {normalCount > 0 && (
                      <div
                        className={`w-full ${priorityColors.normal} rounded-b first:rounded-t`}
                        style={{ height: `${(normalCount / month.orders) * barHeight}%` }}
                        title={`${normalCount} normal priority`}
                      />
                    )}
                    {highCount > 0 && (
                      <div
                        className={`w-full ${priorityColors.high}`}
                        style={{ height: `${(highCount / month.orders) * barHeight}%` }}
                        title={`${highCount} high priority`}
                      />
                    )}
                    {criticalCount > 0 && (
                      <div
                        className={`w-full ${priorityColors.critical} rounded-t`}
                        style={{ height: `${(criticalCount / month.orders) * barHeight}%` }}
                        title={`${criticalCount} critical priority`}
                      />
                    )}
                  </div>

                  {/* Order count badge */}
                  {month.orders > 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {month.orders}
                    </div>
                  )}
                </div>

                {/* Month label */}
                <div className="mt-2 text-xs text-gray-600 text-center">
                  {month.month}
                </div>

                {/* Units */}
                <div className="text-xs text-gray-400">
                  {month.units > 0 ? `${month.units}u` : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-500">Total Orders</div>
            <div className="font-bold text-gray-900">
              {data.months.reduce((sum, m) => sum + m.orders, 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Total Units</div>
            <div className="font-bold text-gray-900">
              {data.months.reduce((sum, m) => sum + m.units, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Est. Cost</div>
            <div className="font-bold text-gray-900">
              ${(data.months.reduce((sum, m) => sum + m.estimatedCost, 0) / 1000).toFixed(0)}K
            </div>
          </div>
          <div>
            <div className="text-gray-500">Avg/Month</div>
            <div className="font-bold text-gray-900">
              {Math.round(data.months.reduce((sum, m) => sum + m.units, 0) / data.months.length)}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly breakdown (expandable) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
          View monthly breakdown
        </summary>
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {data.months.filter(m => m.orders > 0).map((month, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">{month.month}</span>
                <span className="text-sm text-gray-500">
                  {month.orders} orders · ${month.estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {month.products.map((product, pIndex) => (
                  <span
                    key={pIndex}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                      product.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      product.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                    <span className="ml-1 font-medium">×{product.quantity}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
