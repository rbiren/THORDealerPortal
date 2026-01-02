'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { CategoryWithCount } from './actions'

type Props = {
  categories: CategoryWithCount[]
  activeCategoryId?: string | null
}

type CategoryNodeProps = {
  category: CategoryWithCount
  activeCategoryId?: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string | null) => void
  level: number
}

function getCategoryProductCount(category: CategoryWithCount): number {
  let count = category._count.products
  if (category.children) {
    for (const child of category.children) {
      count += getCategoryProductCount(child)
    }
  }
  return count
}

function CategoryNode({
  category,
  activeCategoryId,
  expandedIds,
  onToggle,
  onSelect,
  level,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isActive = activeCategoryId === category.id
  const totalCount = getCategoryProductCount(category)

  return (
    <div className="category-node">
      <div
        className={`flex items-center group ${level > 0 ? 'ml-4' : ''}`}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(category.id)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
          <span className="w-6" />
        )}

        {/* Category link */}
        <button
          type="button"
          onClick={() => onSelect(category.id)}
          className={`flex-1 flex items-center justify-between py-2 px-2 rounded-md text-left transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <span className="truncate">{category.name}</span>
          <span
            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
            }`}
          >
            {totalCount}
          </span>
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              activeCategoryId={activeCategoryId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategorySidebar({ categories, activeCategoryId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize expanded state: expand all ancestors of the active category
  const getInitialExpanded = useCallback(() => {
    const expanded = new Set<string>()
    if (!activeCategoryId) return expanded

    // Find and expand all ancestors
    const findAncestors = (cats: CategoryWithCount[], targetId: string, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return path
        }
        if (cat.children && cat.children.length > 0) {
          const result = findAncestors(cat.children, targetId, [...path, cat.id])
          if (result) {
            return result
          }
        }
      }
      return null
    }

    const ancestors = findAncestors(categories, activeCategoryId)
    if (ancestors) {
      ancestors.forEach((id) => expanded.add(id))
    }

    return expanded
  }, [activeCategoryId, categories])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(getInitialExpanded)

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (categoryId) {
        params.set('categoryId', categoryId)
      } else {
        params.delete('categoryId')
      }
      // Reset to page 1 when changing category
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>()
    const collectIds = (cats: CategoryWithCount[]) => {
      for (const cat of cats) {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id)
          collectIds(cat.children)
        }
      }
    }
    collectIds(categories)
    setExpandedIds(allIds)
  }, [categories])

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  // Calculate total product count
  const totalProductCount = categories.reduce((sum, cat) => sum + getCategoryProductCount(cat), 0)

  // Check if any categories have children
  const hasNestedCategories = categories.some((cat) => cat.children && cat.children.length > 0)

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Categories
          </h2>
          {hasNestedCategories && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleExpandAll}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Expand all"
                aria-label="Expand all categories"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Collapse all"
                aria-label="Collapse all categories"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* All Products link */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center justify-between py-2 px-2 rounded-md text-left transition-colors ${
              !activeCategoryId
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              All Products
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                !activeCategoryId
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {totalProductCount}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* Category tree */}
        {categories.length > 0 ? (
          <nav className="space-y-1" aria-label="Product categories">
            {categories.map((category) => (
              <CategoryNode
                key={category.id}
                category={category}
                activeCategoryId={activeCategoryId}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onSelect={handleSelect}
                level={0}
              />
            ))}
          </nav>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No categories available
          </p>
        )}
      </div>
    </aside>
  )
}
