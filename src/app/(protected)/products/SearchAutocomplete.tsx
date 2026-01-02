'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { searchProducts, getSearchHistory, saveSearchTerm, clearSearchHistory, type SearchSuggestion } from './search-actions'

const DEBOUNCE_MS = 300
const SEARCH_HISTORY_KEY = 'product-search-history'

export function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Initialize from URL and load search history
  useEffect(() => {
    const searchQuery = searchParams.get('search') || ''
    setQuery(searchQuery)

    // Load search history from localStorage
    getSearchHistory().then(setRecentSearches)
  }, [searchParams])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchProducts(searchQuery)
      setSuggestions(results)
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setHighlightedIndex(-1)

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, DEBOUNCE_MS)
  }

  const handleSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery) {
      // Save to search history
      await saveSearchTerm(trimmedQuery)

      // Update recent searches
      const history = await getSearchHistory()
      setRecentSearches(history)
    }

    // Update URL and navigate
    const params = new URLSearchParams(searchParams.toString())
    if (trimmedQuery) {
      params.set('search', trimmedQuery)
    } else {
      params.delete('search')
    }
    params.set('page', '1')

    router.push(`${pathname}?${params.toString()}`)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = query ? suggestions : recentSearches

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          const selected = items[highlightedIndex]
          const searchTerm = typeof selected === 'string' ? selected : selected.name
          setQuery(searchTerm)
          handleSearch(searchTerm)
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleClearHistory = async () => {
    await clearSearchHistory()
    setRecentSearches([])
  }

  const showDropdown = isOpen && (suggestions.length > 0 || recentSearches.length > 0 || isLoading)

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSuggestions([])
              handleSearch('')
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
        >
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                Products
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion.name)
                    handleSearch(suggestion.name)
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                    highlightedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  {suggestion.imageUrl ? (
                    <img
                      src={suggestion.imageUrl}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="font-mono">{suggestion.sku}</span>
                      {suggestion.category && (
                        <span className="text-gray-400">
                          in {suggestion.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${suggestion.price.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && !query && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b flex items-center justify-between">
                <span>Recent Searches</span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term, index) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setQuery(term)
                    handleSearch(term)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 ${
                    highlightedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && query && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No products found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
