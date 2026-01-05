import { Suspense } from 'react'
import Link from 'next/link'
import { getProducts, getCategoriesFlat, getCategories, getProductStats } from './actions'
import { ProductGrid } from './ProductGrid'
import { CategorySidebar } from './CategorySidebar'
import { productFilterSchema } from '@/lib/validations/product'

export const metadata = {
  title: 'Products - THOR Dealer Portal',
  description: 'Browse the product catalog',
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function CategorySidebarWrapper({ searchParams }: Props) {
  const params = await searchParams
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : null
  const categories = await getCategories()

  return <CategorySidebar categories={categories} activeCategoryId={categoryId} />
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
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Total Products</div>
          <div className="text-2xl font-heading font-bold text-charcoal">{stats.total}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Active</div>
          <div className="text-2xl font-heading font-bold text-olive">{stats.active}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Draft</div>
          <div className="text-2xl font-heading font-bold text-medium-gray">{stats.draft}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Discontinued</div>
          <div className="text-2xl font-heading font-bold text-error">{stats.discontinued}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Low Stock</div>
          <div className="text-2xl font-heading font-bold text-burnt-orange">{stats.lowStock}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <div className="text-sm font-medium text-medium-gray">Out of Stock</div>
          <div className="text-2xl font-heading font-bold text-error">{stats.outOfStock}</div>
        </div>
      </div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="h-4 w-24 bg-light-gray rounded mb-4" />
          <div className="space-y-2">
            <div className="h-8 bg-light-gray rounded" />
            <div className="h-px bg-light-gray my-3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-light-gray rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="flex-1 space-y-4">
      <div className="card animate-pulse">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="h-10 w-48 bg-light-gray rounded" />
            <div className="h-10 w-36 bg-light-gray rounded" />
            <div className="h-10 w-36 bg-light-gray rounded" />
            <div className="h-10 w-36 bg-light-gray rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden animate-pulse">
            <div className="aspect-square bg-light-gray" />
            <div className="card-body space-y-2">
              <div className="h-4 w-3/4 bg-light-gray rounded" />
              <div className="h-3 w-1/2 bg-light-gray rounded" />
              <div className="h-6 w-1/3 bg-light-gray rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Products</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Browse and search the product catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/products/categories" className="btn-outline">
              <svg
                className="-ml-0.5 mr-1.5 h-5 w-5"
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
      </div>

      <Suspense fallback={<div className="animate-pulse h-24 bg-light-gray rounded-lg mb-6" />}>
        <ProductStats />
      </Suspense>

      {/* Two-column layout with sidebar */}
      <div className="flex gap-6">
        {/* Category Sidebar - hidden on mobile, visible on larger screens */}
        <div className="hidden lg:block">
          <Suspense fallback={<SidebarSkeleton />}>
            <CategorySidebarWrapper searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Main Product Grid */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<GridSkeleton />}>
            <ProductGridWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
