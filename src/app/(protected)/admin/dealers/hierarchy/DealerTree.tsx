'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DealerHierarchyNode } from '../actions'

type Props = {
  dealers: DealerHierarchyNode[]
}

function TreeNode({ dealer, level = 0 }: { dealer: DealerHierarchyNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const hasChildren = dealer.children.length > 0

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      silver: 'bg-gray-200 text-gray-800 border-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
    }
    return colors[tier] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors ${
          level > 0 ? 'ml-6' : ''
        }`}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Dealer Icon */}
        <div className={`flex h-8 w-8 items-center justify-center rounded ${getTierColor(dealer.tier)} text-xs font-bold`}>
          {dealer.code.substring(0, 2)}
        </div>

        {/* Dealer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/dealers/${dealer.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {dealer.name}
            </Link>
            <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(dealer.status)}`}>
              {dealer.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-mono">{dealer.code}</span>
            <span>{dealer._count.users} users</span>
            <span>{dealer._count.orders} orders</span>
            {hasChildren && <span className="text-blue-600">{dealer.children.length} child dealers</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/dealers/${dealer.id}`}
            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
            title="View dealer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <Link
            href={`/admin/dealers/${dealer.id}?tab=settings`}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
            title="Edit dealer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {/* Vertical line connector */}
          <div
            className="absolute left-[17px] top-0 bottom-0 border-l-2 border-gray-200"
            style={{ marginLeft: `${level * 24}px` }}
          />
          {dealer.children.map((child, index) => (
            <div key={child.id} className="relative">
              {/* Horizontal line connector */}
              <div
                className="absolute top-5 w-4 border-t-2 border-gray-200"
                style={{ left: `${17 + level * 24}px` }}
              />
              <TreeNode dealer={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DealerTree({ dealers }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')

  // Flatten tree for searching
  const flattenTree = (nodes: DealerHierarchyNode[]): DealerHierarchyNode[] => {
    return nodes.reduce<DealerHierarchyNode[]>((acc, node) => {
      return [...acc, node, ...flattenTree(node.children)]
    }, [])
  }

  // Filter dealers based on search and filters
  const filterDealers = (nodes: DealerHierarchyNode[]): DealerHierarchyNode[] => {
    return nodes
      .map((node) => {
        const filteredChildren = filterDealers(node.children)

        const matchesSearch =
          !searchTerm ||
          node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.code.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || node.status === statusFilter
        const matchesTier = tierFilter === 'all' || node.tier === tierFilter

        const hasMatchingChildren = filteredChildren.length > 0
        const matchesFilters = matchesSearch && matchesStatus && matchesTier

        if (matchesFilters || hasMatchingChildren) {
          return {
            ...node,
            children: filteredChildren,
          }
        }
        return null
      })
      .filter((node): node is DealerHierarchyNode => node !== null)
  }

  const filteredDealers = filterDealers(dealers)
  const allDealers = flattenTree(dealers)
  const totalDealers = allDealers.length
  const rootDealers = dealers.length
  const activeCount = allDealers.filter((d) => d.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Dealers</div>
          <div className="text-2xl font-bold text-gray-900">{totalDealers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Top-Level Dealers</div>
          <div className="text-2xl font-bold text-gray-900">{rootDealers}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Active Dealers</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Max Depth</div>
          <div className="text-2xl font-bold text-gray-900">
            {(() => {
              const getDepth = (nodes: DealerHierarchyNode[], current = 1): number => {
                if (nodes.length === 0) return current - 1
                return Math.max(...nodes.map((n) => getDepth(n.children, current + 1)))
              }
              return getDepth(dealers)
            })()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or code..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tiers</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Dealer Hierarchy</h3>
          <p className="text-sm text-gray-500">Click on dealers to expand/collapse their sub-dealers</p>
        </div>
        <div className="p-4">
          {filteredDealers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || statusFilter !== 'all' || tierFilter !== 'all' ? (
                <p>No dealers match your filters</p>
              ) : (
                <p>No dealers found</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDealers.map((dealer) => (
                <TreeNode key={dealer.id} dealer={dealer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
