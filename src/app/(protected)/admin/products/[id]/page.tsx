import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminProduct, getAdminCategories } from '../actions'
import { ProductForm } from '../ProductForm'
import { ImageManager } from './ImageManager'

export const metadata = {
  title: 'Edit Product - Admin',
  description: 'Edit product details',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ])

  if (!product) {
    notFound()
  }

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
            <li className="font-medium text-gray-900">{product.name}</li>
          </ol>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-1 text-sm text-gray-500 font-mono">{product.sku}</p>
          </div>
          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on site
          </Link>
        </div>
      </div>

      {/* Image Manager */}
      <ImageManager product={product} />

      {/* Form */}
      <ProductForm product={product} categories={categories} mode="edit" />
    </div>
  )
}
