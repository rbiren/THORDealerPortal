import { Suspense } from 'react'
import Link from 'next/link'
import { getAdminProducts, getAdminCategories } from './actions'
import { ProductTable } from './ProductTable'

export const metadata = {
  title: 'Product Management - Admin',
  description: 'Manage products in the catalog',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function ProductTableWrapper({ searchParams }: Props) {
  const params = await searchParams

  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    categoryId: typeof params.categoryId === 'string' ? params.categoryId : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    page: typeof params.page === 'string' ? parseInt(params.page) : 1,
    pageSize: 20,
  }

  const [data, categories] = await Promise.all([
    getAdminProducts(filters),
    getAdminCategories(),
  ])

  return <ProductTable data={data} categories={categories} />
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="flex gap-4">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
          <div className="h-10 w-36 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b flex items-center gap-4 px-6">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-10 w-10 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function AdminProductsPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage product catalog, pricing, and inventory
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/categories"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Categories
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <ProductTableWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
