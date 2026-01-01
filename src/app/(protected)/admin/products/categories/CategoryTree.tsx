'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategory, type CategoryListItem } from './actions'

type Props = {
  categories: CategoryListItem[]
  onEdit: (category: CategoryListItem) => void
}

type TreeNodeProps = {
  category: CategoryListItem
  level: number
  onEdit: (category: CategoryListItem) => void
  onDelete: (id: string) => void
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function TreeNode({ category, level, onEdit, onDelete, expandedIds, onToggle }: TreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)

  // Calculate total products including children
  const getTotalProducts = (cat: CategoryListItem): number => {
    let total = cat.productCount
    if (cat.children) {
      for (const child of cat.children) {
        total += getTotalProducts(child)
      }
    }
    return total
  }
  const totalProducts = getTotalProducts(category)

  return (
    <div className="category-tree-node">
      <div
        className={`flex items-center group py-2 px-3 rounded-lg hover:bg-gray-50 ${
          level > 0 ? 'ml-6 border-l-2 border-gray-200' : ''
        }`}
      >
        {/* Expand/Collapse */}
        <div className="w-6 flex-shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(category.id)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <span className="w-5 h-5 flex items-center justify-center text-gray-300">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
            </span>
          )}
        </div>

        {/* Category info */}
        <div className="flex-1 min-w-0 ml-2">
          <div className="flex items-center">
            <span className="font-medium text-gray-900 truncate">{category.name}</span>
            <span className="ml-2 text-xs text-gray-500 font-mono">{category.slug}</span>
          </div>
          {category.description && (
            <p className="text-sm text-gray-500 truncate">{category.description}</p>
          )}
        </div>

        {/* Product count */}
        <div className="flex-shrink-0 mx-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {category.productCount} product{category.productCount !== 1 ? 's' : ''}
            {hasChildren && totalProducts > category.productCount && (
              <span className="text-gray-500 ml-1">({totalProducts} total)</span>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            {category.productCount === 0 && (!category.children || category.children.length === 0) && (
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({ categories, onEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand all by default
    const ids = new Set<string>()
    const collectIds = (cats: CategoryListItem[]) => {
      for (const cat of cats) {
        if (cat.children && cat.children.length > 0) {
          ids.add(cat.id)
          collectIds(cat.children)
        }
      }
    }
    collectIds(categories)
    return ids
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const ids = new Set<string>()
    const collectIds = (cats: CategoryListItem[]) => {
      for (const cat of cats) {
        if (cat.children && cat.children.length > 0) {
          ids.add(cat.id)
          collectIds(cat.children)
        }
      }
    }
    collectIds(categories)
    setExpandedIds(ids)
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setMessage(null)
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  // Count total categories
  const countCategories = (cats: CategoryListItem[]): number => {
    let count = cats.length
    for (const cat of cats) {
      if (cat.children) {
        count += countCategories(cat.children)
      }
    }
    return count
  }
  const totalCategories = countCategories(categories)

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-600">
            {totalCategories} categor{totalCategories === 1 ? 'y' : 'ies'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tree */}
      <div className="p-6">
        {categories.length > 0 ? (
          <div className="space-y-1">
            {categories.map((category) => (
              <TreeNode
                key={category.id}
                category={category}
                level={0}
                onEdit={onEdit}
                onDelete={handleDelete}
                expandedIds={expandedIds}
                onToggle={handleToggle}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <p className="mt-2">No categories yet</p>
            <p className="text-sm">Create your first category to get started</p>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
    </div>
  )
}
