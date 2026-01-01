'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductDetail,
  type CreateProductState,
  type UpdateProductState,
} from './actions'

type Props = {
  product?: ProductDetail | null
  categories: { id: string; name: string; slug: string; parentId: string | null }[]
  mode: 'create' | 'edit'
}

const statuses = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'discontinued', label: 'Discontinued', color: 'bg-red-100 text-red-800' },
]

export function ProductForm({ product, categories, mode }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Parse specifications from JSON string
  const parseSpecifications = (specs: string | null): Record<string, string> => {
    if (!specs) return {}
    try {
      return JSON.parse(specs)
    } catch {
      return {}
    }
  }

  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    price: product?.price?.toString() || '',
    costPrice: product?.costPrice?.toString() || '',
    status: product?.status || 'draft',
    specifications: parseSpecifications(product?.specifications || null),
  })

  // Specification management
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleAddSpec = () => {
    if (!newSpecKey.trim()) return
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newSpecKey.trim()]: newSpecValue.trim(),
      },
    }))
    setNewSpecKey('')
    setNewSpecValue('')
  }

  const handleRemoveSpec = (key: string) => {
    setFormData((prev) => {
      const specs = { ...prev.specifications }
      delete specs[key]
      return { ...prev, specifications: specs }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)

    startTransition(async () => {
      let result: CreateProductState | UpdateProductState

      const priceValue = parseFloat(formData.price) || 0
      const costPriceValue = formData.costPrice ? parseFloat(formData.costPrice) : null

      if (mode === 'create') {
        result = await createProduct({
          sku: formData.sku.toUpperCase(),
          name: formData.name,
          description: formData.description || undefined,
          categoryId: formData.categoryId || null,
          price: priceValue,
          costPrice: costPriceValue,
          status: formData.status as 'active' | 'draft' | 'discontinued',
          specifications:
            Object.keys(formData.specifications).length > 0 ? formData.specifications : undefined,
        })
      } else {
        result = await updateProduct({
          id: product!.id,
          sku: formData.sku !== product?.sku ? formData.sku.toUpperCase() : undefined,
          name: formData.name !== product?.name ? formData.name : undefined,
          description:
            formData.description !== (product?.description || '')
              ? formData.description || null
              : undefined,
          categoryId:
            formData.categoryId !== (product?.categoryId || '')
              ? formData.categoryId || null
              : undefined,
          price: priceValue !== product?.price ? priceValue : undefined,
          costPrice: costPriceValue !== product?.costPrice ? costPriceValue : undefined,
          status:
            formData.status !== product?.status
              ? (formData.status as 'active' | 'draft' | 'discontinued')
              : undefined,
          specifications:
            JSON.stringify(formData.specifications) !== product?.specifications
              ? formData.specifications
              : undefined,
        })
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (mode === 'create' && 'productId' in result) {
          setTimeout(() => router.push(`/admin/products/${result.productId}`), 1000)
        }
      } else {
        setMessage({ type: 'error', text: result.message })
        if (result.errors) {
          setErrors(result.errors)
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!product) return

    startTransition(async () => {
      const result = await deleteProduct(product.id)
      if (result.success) {
        router.push('/admin/products')
      } else {
        setMessage({ type: 'error', text: result.message })
        setShowDeleteConfirm(false)
      }
    })
  }

  // Build category tree for display
  const getCategoryPath = (categoryId: string | null): string => {
    if (!categoryId) return ''
    const buildPath = (id: string): string[] => {
      const cat = categories.find((c) => c.id === id)
      if (!cat) return []
      if (cat.parentId) {
        return [...buildPath(cat.parentId), cat.name]
      }
      return [cat.name]
    }
    return buildPath(categoryId).join(' > ')
  }

  // Sort categories by path for proper indentation
  const sortedCategories = [...categories].sort((a, b) => {
    const pathA = getCategoryPath(a.id)
    const pathB = getCategoryPath(b.id)
    return pathA.localeCompare(pathB)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              SKU
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              placeholder="e.g., PROD-001"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase ${
                errors.sku ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku[0]}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Uppercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Category */}
          <div className="sm:col-span-2">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
              Category <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">No category</option>
              {sortedCategories.map((category) => {
                const path = getCategoryPath(category.id)
                const depth = path.split(' > ').length - 1
                return (
                  <option key={category.id} value={category.id}>
                    {'  '.repeat(depth)}
                    {depth > 0 ? '└ ' : ''}
                    {category.name}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Pricing</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={`block w-full pl-7 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>}
          </div>

          {/* Cost Price */}
          <div>
            <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">
              Cost Price <span className="text-gray-400">(optional)</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Used for margin calculations</p>
          </div>

          {/* Margin Preview */}
          {formData.price && formData.costPrice && (
            <div className="sm:col-span-2 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Calculated Margin</span>
                <span className="text-lg font-semibold text-gray-900">
                  {(
                    ((parseFloat(formData.price) - parseFloat(formData.costPrice)) /
                      parseFloat(formData.price)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Specifications</h3>

        {/* Existing specs */}
        {Object.keys(formData.specifications).length > 0 && (
          <div className="mb-6 space-y-2">
            {Object.entries(formData.specifications).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
              >
                <div>
                  <span className="font-medium text-gray-700">{key}:</span>
                  <span className="ml-2 text-gray-600">{value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(key)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new spec */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newSpecKey}
              onChange={(e) => setNewSpecKey(e.target.value)}
              placeholder="Specification name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newSpecValue}
              onChange={(e) => setNewSpecValue(e.target.value)}
              placeholder="Value"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSpec}
            disabled={!newSpecKey.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Add custom specifications like weight, dimensions, material, etc.
        </p>
      </div>

      {/* Images preview (edit mode only) */}
      {mode === 'edit' && product?.images && product.images.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Current Images</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images.map((image) => (
              <div key={image.id} className="flex-shrink-0">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.altText || ''}
                    className="w-full h-full object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      Primary
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Manage images from the product detail page
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {mode === 'edit' && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Delete this product?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Delete Product
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
