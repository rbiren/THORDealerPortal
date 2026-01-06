'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCategory,
  updateCategory,
  type CategoryListItem,
} from './actions'

type Props = {
  category?: CategoryListItem | null
  allCategories: CategoryListItem[]
  onClose: () => void
  onSuccess: () => void
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Flatten categories for dropdown, excluding the current category and its descendants
function flattenCategories(
  categories: CategoryListItem[],
  excludeId?: string,
  depth = 0
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = []

  for (const cat of categories) {
    if (cat.id === excludeId) continue // Skip the category being edited

    result.push({ id: cat.id, name: cat.name, depth })

    if (cat.children && cat.children.length > 0) {
      // Skip children if we're excluding this category's descendants
      const descendants = flattenCategories(cat.children, excludeId, depth + 1)
      result.push(...descendants)
    }
  }

  return result
}

export function CategoryForm({ category, allCategories, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    parentId: category?.parentId || '',
  })

  const [autoSlug, setAutoSlug] = useState(!category)

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }))
    }
  }, [formData.name, autoSlug])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    if (name === 'slug') {
      setAutoSlug(false)
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)

    startTransition(async () => {
      const input = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        parentId: formData.parentId || null,
        sortOrder: category?.sortOrder ?? 0,
      }

      const result = category
        ? await updateCategory(category.id, input)
        : await createCategory(input)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        router.refresh()
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        setMessage({ type: 'error', text: result.message })
        if (result.errors) {
          setErrors(result.errors)
        }
      }
    })
  }

  // Get available parent options (excluding self and descendants, max depth 2)
  const getParentOptions = () => {
    const flattened = flattenCategories(allCategories, category?.id)
    // Only allow up to depth 1 as parents (so children can be depth 2, grandchildren depth 3)
    return flattened.filter((c) => c.depth <= 1)
  }

  const parentOptions = getParentOptions()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {category ? 'Edit Category' : 'New Category'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
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

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Category Name
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

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL Slug
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.slug ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Parent Category */}
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
                Parent Category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                id="parentId"
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">No parent (top-level)</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {'  '.repeat(opt.depth)}
                    {opt.depth > 0 ? '└ ' : ''}
                    {opt.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Categories can be nested up to 3 levels deep
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
