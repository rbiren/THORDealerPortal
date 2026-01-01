import Link from 'next/link'
import { getAdminCategories } from '../actions'
import { ProductForm } from '../ProductForm'

export const metadata = {
  title: 'New Product - Admin',
  description: 'Create a new product',
}

export default async function NewProductPage() {
  const categories = await getAdminCategories()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/admin/products" className="hover:text-gray-700">
                Products
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li className="font-medium text-gray-900">New Product</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new product to the catalog
        </p>
      </div>

      {/* Form */}
      <ProductForm categories={categories} mode="create" />
    </div>
  )
}
