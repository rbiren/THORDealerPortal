import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct, getRelatedProducts, type ProductDetail } from './actions'
import { ImageGallery } from './ImageGallery'
import { InventoryTable } from './InventoryTable'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: `${product.name} - THOR Dealer Portal`,
    description: product.description || `View details for ${product.name}`,
  }
}

type Props = {
  params: Promise<{ id: string }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    discontinued: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function Specifications({ specs }: { specs: Record<string, unknown> | null }) {
  if (!specs || Object.keys(specs).length === 0) {
    return (
      <p className="text-gray-500 italic">No specifications available</p>
    )
  }

  return (
    <dl className="divide-y divide-gray-200">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="py-3 flex justify-between">
          <dt className="text-sm font-medium text-gray-500">{key}</dt>
          <dd className="text-sm text-gray-900">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}

async function RelatedProducts({ productId, categoryId }: { productId: string; categoryId: string | null }) {
  if (!categoryId) return null

  const related = await getRelatedProducts(productId, categoryId)

  if (related.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden group"
          >
            <div className="aspect-square bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                {product.name}
              </h3>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {formatCurrency(product.price)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-lg" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded w-1/3" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  // Calculate total available stock
  const totalStock = product.inventory.reduce(
    (sum, inv) => sum + (inv.quantity - inv.reserved),
    0
  )

  // Parse specifications if stored as JSON string
  let specifications: Record<string, unknown> | null = null
  if (product.specifications) {
    try {
      specifications = JSON.parse(product.specifications)
    } catch {
      specifications = null
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav>
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/products" className="hover:text-gray-700">
                Products
              </Link>
            </li>
            <li>/</li>
            {product.category && (
              <>
                <li>
                  <Link
                    href={`/products?categoryId=${product.category.id}`}
                    className="hover:text-gray-700"
                  >
                    {product.category.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <Suspense fallback={<ProductDetailSkeleton />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <ImageGallery images={product.images} productName={product.name} />

            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  <p className="mt-1 text-sm font-mono text-gray-500">{product.sku}</p>
                </div>
                <StatusBadge status={product.status} />
              </div>

              {product.category && (
                <p className="mt-2 text-sm text-gray-600">
                  Category:{' '}
                  <Link
                    href={`/products?categoryId=${product.category.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {product.category.name}
                  </Link>
                </p>
              )}

              {/* Price */}
              <div className="mt-6">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(product.price)}
                </div>
                {product.costPrice && (
                  <div className="text-sm text-gray-500 mt-1">
                    Cost: {formatCurrency(product.costPrice)} | Margin:{' '}
                    {(((product.price - product.costPrice) / product.price) * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-4">
                {totalStock > 10 ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    In Stock ({totalStock} available)
                  </span>
                ) : totalStock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-yellow-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Low Stock ({totalStock} remaining)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h2 className="text-sm font-medium text-gray-900">Description</h2>
                  <p className="mt-2 text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Add to Cart */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium">1</span>
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={totalStock <= 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* Tabs: Specifications, Inventory */}
          <div className="mt-12">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <span className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
                  Specifications
                </span>
              </nav>
            </div>

            <div className="py-6">
              <div className="bg-white rounded-lg shadow p-6">
                <Specifications specs={specifications} />
              </div>
            </div>
          </div>

          {/* Inventory by Location */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Location</h2>
            <InventoryTable inventory={product.inventory} />
          </div>

          {/* Related Products */}
          <RelatedProducts productId={product.id} categoryId={product.categoryId} />
        </Suspense>
      </div>
    </div>
  )
}
