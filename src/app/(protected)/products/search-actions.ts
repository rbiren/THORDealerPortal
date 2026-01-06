'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const SEARCH_HISTORY_COOKIE = 'product-search-history'
const MAX_HISTORY_ITEMS = 10
const MAX_SUGGESTIONS = 8

export type SearchSuggestion = {
  id: string
  name: string
  sku: string
  price: number
  category: string | null
  imageUrl: string | null
  relevanceScore: number
}

/**
 * Search products with relevance scoring
 * SQLite doesn't have native full-text search, so we use LIKE with basic relevance scoring
 */
export async function searchProducts(query: string): Promise<SearchSuggestion[]> {
  const searchTerm = query.trim().toLowerCase()

  if (!searchTerm) {
    return []
  }

  // Fetch matching products
  const products = await prisma.product.findMany({
    where: {
      status: 'active',
      OR: [
        { name: { contains: searchTerm } },
        { sku: { contains: searchTerm.toUpperCase() } },
        { description: { contains: searchTerm } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      description: true,
      category: {
        select: {
          name: true,
        },
      },
      images: {
        where: { isPrimary: true },
        select: {
          url: true,
        },
        take: 1,
      },
    },
    take: 50, // Get more than needed so we can sort by relevance
  })

  // Calculate relevance scores
  type ProductSearchItem = {
    id: string
    name: string
    sku: string
    description: string | null
    price: number
    category: { name: string } | null
    images: Array<{ url: string }>
  }

  const scoredProducts = products.map((product: ProductSearchItem) => {
    let score = 0

    const nameLower = product.name.toLowerCase()
    const skuLower = product.sku.toLowerCase()
    const descLower = (product.description || '').toLowerCase()

    // Exact matches in name get highest score
    if (nameLower === searchTerm) {
      score += 100
    } else if (nameLower.startsWith(searchTerm)) {
      score += 80
    } else if (nameLower.includes(searchTerm)) {
      score += 50
    }

    // SKU matches
    if (skuLower === searchTerm) {
      score += 90
    } else if (skuLower.startsWith(searchTerm)) {
      score += 70
    } else if (skuLower.includes(searchTerm)) {
      score += 40
    }

    // Description matches (lower weight)
    if (descLower.includes(searchTerm)) {
      score += 10
    }

    // Word boundary bonus
    const words = searchTerm.split(/\s+/)
    words.forEach((word: string) => {
      if (nameLower.split(/\s+/).includes(word)) {
        score += 20
      }
    })

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      category: product.category?.name || null,
      imageUrl: product.images[0]?.url || null,
      relevanceScore: score,
    }
  })

  // Sort by relevance and limit results
  return scoredProducts
    .sort((a: { relevanceScore: number }, b: { relevanceScore: number }) => b.relevanceScore - a.relevanceScore)
    .slice(0, MAX_SUGGESTIONS)
}

/**
 * Get search history from cookies
 */
export async function getSearchHistory(): Promise<string[]> {
  try {
    const cookieStore = await cookies()
    const historyCookie = cookieStore.get(SEARCH_HISTORY_COOKIE)

    if (!historyCookie?.value) {
      return []
    }

    return JSON.parse(historyCookie.value)
  } catch {
    return []
  }
}

/**
 * Save a search term to history
 */
export async function saveSearchTerm(term: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    const existing = await getSearchHistory()

    // Remove duplicate if exists, add to front
    const filtered = existing.filter((t) => t.toLowerCase() !== term.toLowerCase())
    const updated = [term, ...filtered].slice(0, MAX_HISTORY_ITEMS)

    cookieStore.set(SEARCH_HISTORY_COOKIE, JSON.stringify(updated), {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'strict',
    })
  } catch (error) {
    console.error('Failed to save search term:', error)
  }
}

/**
 * Clear search history
 */
export async function clearSearchHistory(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SEARCH_HISTORY_COOKIE)
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}

/**
 * Get popular/trending searches (for future use)
 */
export async function getPopularSearches(): Promise<string[]> {
  // In a real implementation, this could be based on:
  // - Analytics tracking of search terms
  // - Product views/sales data
  // - Time-weighted popularity

  // For now, return most commonly ordered product categories
  const categories = await prisma.productCategory.findMany({
    select: { name: true },
    take: 5,
    orderBy: {
      products: {
        _count: 'desc',
      },
    },
  })

  return categories.map((c: { name: string }) => c.name)
}
