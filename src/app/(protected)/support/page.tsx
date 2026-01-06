'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react'
import {
  getSupportTickets,
  getSupportStatsAction,
  type SupportTicketListItem,
  type SupportTicketStats,
} from './actions'
import {
  ticketStatusOptions,
  ticketCategoryOptions,
  ticketPriorityOptions,
  ticketStatusLabels,
  ticketCategoryLabels,
  ticketPriorityLabels,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from '@/lib/validations/support'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function TicketRow({ ticket }: { ticket: SupportTicketListItem }) {
  return (
    <Link
      href={`/support/${ticket.ticketNumber}`}
      className="block bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-gray-500">
                {ticket.ticketNumber}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ticket.statusColor.bg} ${ticket.statusColor.text}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${ticket.statusColor.dot}`}
                />
                {ticket.statusLabel}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ticket.priorityColor.bg} ${ticket.priorityColor.text}`}
              >
                {ticket.priorityLabel}
              </span>
            </div>
            <h3 className="text-base font-medium text-gray-900 truncate">
              {ticket.subject}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {ticket.categoryLabel}
              {ticket.assignedToName && (
                <span className="text-gray-400"> · Assigned to {ticket.assignedToName}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(ticket.updatedAt)}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {ticket.messageCount} {ticket.messageCount === 1 ? 'message' : 'messages'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function SupportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tickets, setTickets] = useState<SupportTicketListItem[]>([])
  const [stats, setStats] = useState<SupportTicketStats | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))

  const hasActiveFilters = status !== 'all' || category !== 'all' || priority !== 'all' || search

  const loadTickets = useCallback(async () => {
    setIsLoading(true)
    const result = await getSupportTickets({
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      category: category !== 'all' ? category : undefined,
      priority: priority !== 'all' ? priority : undefined,
      page,
      pageSize: 20,
    })
    setTickets(result.tickets)
    setPagination(result.pagination)
    setIsLoading(false)
  }, [search, status, category, priority, page])

  const loadStats = useCallback(async () => {
    const result = await getSupportStatsAction()
    setStats(result)
  }, [])

  useEffect(() => {
    loadTickets()
    loadStats()
  }, [loadTickets, loadStats])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (category !== 'all') params.set('category', category)
    if (priority !== 'all') params.set('priority', priority)
    if (page > 1) params.set('page', page.toString())

    const queryString = params.toString()
    router.replace(`/support${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [search, status, category, priority, page, router])

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setCategory('all')
    setPriority('all')
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            Get help from our support team
          </p>
        </div>
        <Link
          href="/support/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Tickets" value={stats.total} color="text-gray-900" />
          <StatCard label="Open" value={stats.open} color="text-blue-600" />
          <StatCard label="In Progress" value={stats.inProgress} color="text-yellow-600" />
          <StatCard label="Awaiting Response" value={stats.pendingDealer} color="text-orange-600" />
          <StatCard label="Resolved" value={stats.resolved} color="text-green-600" />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-primary text-primary bg-primary/5'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                {[status !== 'all', category !== 'all', priority !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  {ticketStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {ticketStatusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  {ticketCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {ticketCategoryLabels[c]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="all">All Priorities</option>
                  {ticketPriorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {ticketPriorityLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-gray-500">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets found</h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms.'
                : "You haven't submitted any support tickets yet."}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/support/new"
                className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Link>
            )}
          </div>
        ) : (
          <>
            {tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} tickets
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
