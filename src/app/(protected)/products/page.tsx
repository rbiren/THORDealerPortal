import { Suspense } from 'react'
import Link from 'next/link'
import { getProducts, getCategoriesFlat, getProductStats } from './actions'
import { ProductGrid } from './ProductGrid'
import { productFilterSchema } from '@/lib/validations/product'

export const metadata = {
  title: 'Products - THOR Dealer Portal',
  description: 'Browse the product catalog',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function ProductGridWrapper({ searchParams }: Props) {
  const params = await searchParams

  const filters = productFilterSchema.parse({
    search: typeof params.search === 'string' ? params.search : undefined,
    categoryId: typeof params.categoryId === 'string' ? params.categoryId : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    minPrice: typeof params.minPrice === 'string' ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === 'string' ? params.maxPrice : undefined,
    inStock: typeof params.inStock === 'string' ? params.inStock : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    viewMode: typeof params.viewMode === 'string' ? params.viewMode : undefined,
  })

  const [data, categories] = await Promise.all([
    getProducts(filters),
    getCategoriesFlat(),
  ])

  return <ProductGrid data={data} categories={categories} />
}

async function ProductStats() {
  const stats = await getProductStats()

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Total Products</div>
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Active</div>
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Draft</div>
        <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Discontinued</div>
        <div className="text-2xl font-bold text-red-600">{stats.discontinued}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Low Stock</div>
        <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Out of Stock</div>
        <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
              <div className="h-6 w-1/3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                      />
                    </svg>
                  </div>
                  <span className="ml-2 text-lg font-semibold text-gray-900">
                    THOR Dealer Portal
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Products
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Orders
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse and search the product catalog
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products/categories"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
              Categories
            </Link>
          </div>
        </div>

        <Suspense fallback={<div className="animate-pulse h-24 bg-gray-200 rounded-lg mb-6" />}>
          <ProductStats />
        </Suspense>

        <Suspense fallback={<GridSkeleton />}>
          <ProductGridWrapper searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}
