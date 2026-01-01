'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ProductCard } from './ProductCard'
import type { ProductListResult } from './actions'

type Props = {
  data: ProductListResult
  categories: { id: string; name: string; slug: string; parentId: string | null }[]
}

export function ProductGrid({ data, categories }: Props) {
  const [, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { products, total, page, pageSize, totalPages } = data

  const viewMode = (searchParams.get('viewMode') as 'grid' | 'list') || 'grid'

  const updateFilters = (updates: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = () => {
    return (
      searchParams.has('search') ||
      searchParams.has('categoryId') ||
      searchParams.has('status') ||
      searchParams.has('minPrice') ||
      searchParams.has('maxPrice') ||
      searchParams.has('inStock')
    )
  }

  // Build category options with hierarchy
  const getCategoryOptions = () => {
    const roots = categories.filter((c) => !c.parentId)
    const children = categories.filter((c) => c.parentId)

    const options: { id: string; name: string; level: number }[] = []

    roots.forEach((root) => {
      options.push({ id: root.id, name: root.name, level: 0 })
      children
        .filter((c) => c.parentId === root.id)
        .forEach((child) => {
          options.push({ id: child.id, name: `  ${child.name}`, level: 1 })
        })
    })

    return options
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={searchParams.get('search') || ''}
              onChange={(e) => updateFilters({ search: e.target.value, page: '1' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <select
            value={searchParams.get('categoryId') || ''}
            onChange={(e) => updateFilters({ categoryId: e.target.value, page: '1' })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {getCategoryOptions().map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={searchParams.get('status') || 'all'}
            onChange={(e) => updateFilters({ status: e.target.value, page: '1' })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="discontinued">Discontinued</option>
          </select>

          {/* Stock Filter */}
          <select
            value={searchParams.get('inStock') || 'all'}
            onChange={(e) => updateFilters({ inStock: e.target.value, page: '1' })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Stock</option>
            <option value="yes">In Stock</option>
            <option value="no">Out of Stock</option>
          </select>
        </div>

        {/* Price Range & Sort */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Price:</span>
            <input
              type="number"
              placeholder="Min"
              min="0"
              step="0.01"
              defaultValue={searchParams.get('minPrice') || ''}
              onChange={(e) => updateFilters({ minPrice: e.target.value, page: '1' })}
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              step="0.01"
              defaultValue={searchParams.get('maxPrice') || ''}
              onChange={(e) => updateFilters({ maxPrice: e.target.value, page: '1' })}
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={`${searchParams.get('sortBy') || 'name'}_${searchParams.get('sortOrder') || 'asc'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_')
                updateFilters({ sortBy, sortOrder })
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low-High)</option>
              <option value="price_desc">Price (High-Low)</option>
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => updateFilters({ viewMode: 'grid' })}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => updateFilters({ viewMode: 'list' })}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} viewMode="list" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between rounded-lg shadow sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => updateFilters({ page: String(page - 1) })}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => updateFilters({ page: String(page + 1) })}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                <span className="font-medium">{total}</span> products
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => updateFilters({ page: String(page - 1) })}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateFilters({ page: String(pageNum) })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => updateFilters({ page: String(page + 1) })}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
