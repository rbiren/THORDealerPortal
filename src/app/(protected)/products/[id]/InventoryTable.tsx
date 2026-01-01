'use client'

import type { ProductInventory } from './actions'

type Props = {
  inventory: ProductInventory[]
}

function getLocationTypeBadge(type: string) {
  const colors: Record<string, string> = {
    warehouse: 'bg-blue-100 text-blue-800',
    store: 'bg-green-100 text-green-800',
    distribution_center: 'bg-purple-100 text-purple-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

function formatLocationType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function InventoryTable({ inventory }: Props) {
  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No inventory records found
      </div>
    )
  }

  const totalQuantity = inventory.reduce((sum, inv) => sum + inv.quantity, 0)
  const totalReserved = inventory.reduce((sum, inv) => sum + inv.reserved, 0)
  const totalAvailable = totalQuantity - totalReserved

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Location
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Reserved
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Available
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inventory.map((inv) => {
            const available = inv.quantity - inv.reserved
            return (
              <tr key={inv.location.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {inv.location.name}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {inv.location.code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLocationTypeBadge(
                      inv.location.type
                    )}`}
                  >
                    {formatLocationType(inv.location.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {inv.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {inv.reserved}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  {available}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {available > 10 ? (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      In Stock
                    </span>
                  ) : available > 0 ? (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              Total ({inventory.length} location{inventory.length !== 1 ? 's' : ''})
            </td>
            <td className="px-6 py-4" />
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              {totalQuantity}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-500">
              {totalReserved}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              {totalAvailable}
            </td>
            <td className="px-6 py-4" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
