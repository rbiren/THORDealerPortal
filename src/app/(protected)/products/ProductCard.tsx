'use client'

import Link from 'next/link'
import type { ProductListItem } from './actions'

type Props = {
  product: ProductListItem
  viewMode: 'grid' | 'list'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Out of Stock
      </span>
    )
  }
  if (stock <= 10) {
    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        Low Stock ({stock})
      </span>
    )
  }
  return (
    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
      In Stock ({stock})
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    discontinued: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

export function ProductCard({ product, viewMode }: Props) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
        <div className="flex items-center p-4 gap-4">
          {/* Image */}
          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
            {product.primaryImage ? (
              <img
                src={product.primaryImage.url}
                alt={product.primaryImage.altText || product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/products/${product.id}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
              >
                {product.name}
              </Link>
              <StatusBadge status={product.status} />
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
              <span className="font-mono">{product.sku}</span>
              {product.category && (
                <span>
                  {product.category.name}
                </span>
              )}
            </div>
            {product.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                {product.description}
              </p>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </div>
            {product.costPrice && (
              <div className="text-xs text-gray-500">
                Cost: {formatCurrency(product.costPrice)}
              </div>
            )}
            <div className="mt-1">
              <StockBadge stock={product.totalStock} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden group">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.altText || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={product.status} />
        </div>

        {/* Quick view overlay */}
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-md text-sm font-medium shadow-lg">
            View Details
          </span>
        </Link>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${product.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
            >
              {product.name}
            </Link>
            <div className="mt-1 text-xs text-gray-500 font-mono">
              {product.sku}
            </div>
          </div>
        </div>

        {product.category && (
          <div className="mt-2 text-xs text-gray-500">
            {product.category.name}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(product.price)}
          </div>
          <StockBadge stock={product.totalStock} />
        </div>
      </div>
    </div>
  )
}
