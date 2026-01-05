'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from './actions'

type DocumentWithDetails = {
  id: string
  name: string
  category: string
  mimeType: string
  size: number
  url: string
  version: number
  isPublic: boolean
  expiresAt: Date | null
  createdAt: Date
  dealerName?: string
  isExpired: boolean
  isExpiringSoon: boolean
  formattedSize: string
  fileExtension: string
}

type ViewMode = 'grid' | 'list'

// Mock data for demonstration
const mockDocuments: DocumentWithDetails[] = [
  {
    id: '1',
    name: 'Dealer Agreement 2026.pdf',
    category: 'contract',
    mimeType: 'application/pdf',
    size: 1234567,
    url: '/documents/dealer-agreement.pdf',
    version: 1,
    isPublic: false,
    expiresAt: new Date('2026-12-31'),
    createdAt: new Date('2026-01-10'),
    dealerName: 'Acme Dealers',
    isExpired: false,
    isExpiringSoon: false,
    formattedSize: '1.2 MB',
    fileExtension: 'PDF',
  },
  {
    id: '2',
    name: 'Product Catalog Q1 2026.pdf',
    category: 'marketing',
    mimeType: 'application/pdf',
    size: 5678901,
    url: '/documents/product-catalog.pdf',
    version: 2,
    isPublic: true,
    expiresAt: null,
    createdAt: new Date('2026-01-05'),
    isExpired: false,
    isExpiringSoon: false,
    formattedSize: '5.4 MB',
    fileExtension: 'PDF',
  },
  {
    id: '3',
    name: 'Compliance Training Guide.docx',
    category: 'training',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 890123,
    url: '/documents/training-guide.docx',
    version: 3,
    isPublic: true,
    expiresAt: new Date('2026-02-15'),
    createdAt: new Date('2025-12-20'),
    isExpired: false,
    isExpiringSoon: true,
    formattedSize: '869 KB',
    fileExtension: 'DOCX',
  },
]

// File icon component
function FileIcon({ extension, className = '' }: { extension: string; className?: string }) {
  const colorMap: Record<string, string> = {
    PDF: 'text-red-500',
    DOC: 'text-blue-500',
    DOCX: 'text-blue-500',
    XLS: 'text-green-500',
    XLSX: 'text-green-500',
    PPT: 'text-orange-500',
    PPTX: 'text-orange-500',
    PNG: 'text-purple-500',
    JPG: 'text-purple-500',
    JPEG: 'text-purple-500',
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        className={`h-10 w-10 ${colorMap[extension] || 'text-medium-gray'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">
        {extension}
      </span>
    </div>
  )
}

// Category badge
function CategoryBadge({ category }: { category: string }) {
  const config = DOCUMENT_CATEGORIES[category as DocumentCategory] || {
    label: category,
    color: 'gray',
  }

  const colorClasses: Record<string, string> = {
    blue: 'badge badge-info',
    purple: 'badge badge-primary',
    green: 'badge badge-success',
    yellow: 'badge badge-warning',
    orange: 'badge badge-warning',
    gray: 'badge',
    indigo: 'badge badge-primary',
  }

  return (
    <span
      className={colorClasses[config.color] || 'badge'}
    >
      {config.label}
    </span>
  )
}

// Document card (grid view)
function DocumentCard({ document }: { document: DocumentWithDetails }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <FileIcon extension={document.fileExtension} />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-charcoal truncate">{document.name}</h3>
          <p className="text-sm text-medium-gray mt-1">{document.formattedSize}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <CategoryBadge category={document.category} />
        <div className="flex items-center gap-2">
          {document.isPublic && (
            <span className="text-xs text-medium-gray">Public</span>
          )}
          {document.isExpiringSoon && (
            <span className="badge badge-warning">
              Expiring
            </span>
          )}
          {document.isExpired && (
            <span className="badge badge-error">
              Expired
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t">
        <span className="text-xs text-medium-gray">
          {new Date(document.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <button className="text-olive hover:underline text-sm">View</button>
          <button className="text-medium-gray hover:underline text-sm">Download</button>
        </div>
      </div>
    </div>
  )
}

// Document row (list view)
function DocumentRow({ document }: { document: DocumentWithDetails }) {
  return (
    <tr className="hover:bg-light-beige">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon extension={document.fileExtension} className="h-8 w-8" />
          <div>
            <p className="font-medium text-charcoal">{document.name}</p>
            {document.dealerName && (
              <p className="text-sm text-medium-gray">{document.dealerName}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <CategoryBadge category={document.category} />
      </td>
      <td className="px-4 py-3 text-sm text-medium-gray">{document.formattedSize}</td>
      <td className="px-4 py-3 text-sm text-medium-gray">
        {new Date(document.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {document.isPublic && (
            <span className="badge">
              Public
            </span>
          )}
          {document.isExpiringSoon && (
            <span className="badge badge-warning">
              Expiring
            </span>
          )}
          {document.isExpired && (
            <span className="badge badge-error">
              Expired
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="text-olive hover:underline text-sm">View</button>
          <button className="text-medium-gray hover:underline text-sm">Download</button>
          <button className="text-medium-gray hover:text-charcoal">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function DocumentsPage() {
  const [mounted, setMounted] = useState(false)
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')

  useEffect(() => {
    setMounted(true)
    // In real implementation, this would fetch from the server
    setDocuments(mockDocuments)
  }, [])

  const filteredDocuments = documents.filter((doc) => {
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'category':
        return a.category.localeCompare(b.category)
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Documents</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Documents</h1>
            <p className="page-subtitle">{filteredDocuments.length} documents</p>
          </div>
          <button className="btn-primary">Upload</button>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              categoryFilter === 'all'
                ? 'bg-olive text-white'
                : 'bg-light-gray text-charcoal hover:bg-light-beige'
            }`}
          >
            All
          </button>
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                categoryFilter === key
                  ? 'bg-olive text-white'
                  : 'bg-light-gray text-charcoal hover:bg-light-beige'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-medium-gray"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-medium-gray">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="category">Category</option>
          </select>
        </div>

        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-light-gray' : 'hover:bg-light-beige'}`}
            title="Grid view"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-light-gray' : 'hover:bg-light-beige'}`}
            title="List view"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Documents */}
      {sortedDocuments.length === 0 ? (
        <div className="card p-12 text-center">
          <svg
            className="h-16 w-16 mx-auto text-medium-gray mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-charcoal mb-1">No documents found</h3>
          <p className="text-medium-gray">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first document to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-light-beige border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-medium-gray uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-gray">
              {sortedDocuments.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
