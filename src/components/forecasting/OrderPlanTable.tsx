'use client';

// Order Plan Table Component
// Displays the 18-month suggested order plan with actions

import { useState } from 'react';
import type { SuggestedOrderItem } from '@/types/forecasting';

interface OrderPlanTableProps {
  orders: SuggestedOrderItem[];
  onAccept?: (orderId: string) => void;
  onSkip?: (orderId: string) => void;
  isLoading?: boolean;
}

const priorityColors = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  ordered: 'bg-blue-100 text-blue-800',
  skipped: 'bg-gray-100 text-gray-800',
};

export function OrderPlanTable({
  orders,
  onAccept,
  onSkip,
  isLoading,
}: OrderPlanTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return order.priority === 'critical' || order.priority === 'high';
    if (filter === 'pending') return order.status === 'pending';
    return order.priority === filter || order.status === filter;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            18-Month Order Plan
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="urgent">Urgent ({orders.filter(o => o.priority === 'critical' || o.priority === 'high').length})</option>
              <option value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</option>
              <option value="accepted">Accepted ({orders.filter(o => o.status === 'accepted').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Cost
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No orders match the current filter
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.productSku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.suggestedOrderDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.suggestedQuantity.toLocaleString()} units
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {order.minimumQuantity.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${(order.estimatedCost || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Value: ${(order.estimatedValue || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[order.priority]}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {order.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAccept?.(order.id);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSkip?.(order.id);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {/* Expanded Details Row */}
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-details`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Inventory Status */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Inventory Status</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current Stock:</span>
                                <span className="font-medium">{order.currentStock} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Projected at Order:</span>
                                <span className={`font-medium ${order.projectedStock < 0 ? 'text-red-600' : ''}`}>
                                  {order.projectedStock} units
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Expected Demand:</span>
                                <span className="font-medium">{order.projectedDemand} units/mo</span>
                              </div>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Order Details</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Economic Qty:</span>
                                <span className="font-medium">{order.economicOrderQty || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Lead Time:</span>
                                <span className="font-medium">
                                  {Math.ceil((new Date(order.expectedDeliveryDate).getTime() - new Date(order.suggestedOrderDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reasoning */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Why This Order?</h4>
                            <p className="text-sm text-gray-600 mb-2">{order.reasoning.primaryReason}</p>
                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">Stockout Risk:</span>
                                <span className={`font-medium ${order.reasoning.stockoutRisk > 50 ? 'text-red-600' : 'text-green-600'}`}>
                                  {order.reasoning.stockoutRisk}%
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-1">Overstock Risk:</span>
                                <span className={`font-medium ${order.reasoning.overstockRisk > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {order.reasoning.overstockRisk}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
