'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCategoriesTree, type CategoryListItem } from './actions'
import { CategoryTree } from './CategoryTree'
import { CategoryForm } from './CategoryForm'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null)

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const data = await getCategoriesTree()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleEdit = (category: CategoryListItem) => {
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingCategory(null)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingCategory(null)
    loadCategories()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex mb-2" aria-label="Breadcrumb">
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
              <li className="font-medium text-gray-900">Categories</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-600">
            Organize products into hierarchical categories
          </p>
        </div>
        <button
          onClick={handleCreate}
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
          Add Category
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CategoryTree categories={categories} onEdit={handleEdit} />
      )}

      {/* Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          allCategories={categories}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
