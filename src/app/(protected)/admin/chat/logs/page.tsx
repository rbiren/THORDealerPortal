'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  Search,
  Filter,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  Clock,
  User,
  X,
} from 'lucide-react'
import { useLiveChat, type ChatChannel } from '@/hooks/useLiveChat'
import { ChatMessages } from '@/components/chat/ChatMessages'

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ChatLogsPage() {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('closed')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  const pageSize = 20

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        type: 'history',
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      })

      if (filterDepartment !== 'all') params.set('department', filterDepartment)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (dateRange.start) params.set('startDate', dateRange.start)
      if (dateRange.end) params.set('endDate', dateRange.end)

      const response = await fetch(`/api/chat/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [page, filterDepartment, filterStatus, dateRange])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Get active chat for transcript viewer
  const {
    channel: viewingChannel,
    messages,
    isLoading: isLoadingTranscript,
    loadChannel,
  } = useLiveChat({
    channelId: selectedChannelId || undefined,
    autoConnect: false,
  })

  // Handle view transcript
  const handleViewTranscript = useCallback((channelId: string) => {
    setSelectedChannelId(channelId)
    setShowTranscript(true)
  }, [])

  // Filter channels by search
  const filteredChannels = channels.filter((ch) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ch.channelNumber.toLowerCase().includes(query) ||
      ch.dealer.name.toLowerCase().includes(query) ||
      ch.subject?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Logs</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and export historical chat transcripts
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by dealer, chat ID, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="closed">Closed</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => {
              setFilterDepartment(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
          >
            <option value="all">All Departments</option>
            <option value="general">General</option>
            <option value="sales">Sales</option>
            <option value="service">Service</option>
            <option value="warranty">Warranty</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Chat ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Dealer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="w-8 h-8 border-2 border-charcoal-200 border-t-charcoal-600 rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-3">Loading chat logs...</p>
                    </td>
                  </tr>
                ) : filteredChannels.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-medium text-gray-600">No chat logs found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredChannels.map((channel) => (
                    <tr key={channel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">{channel.channelNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{channel.dealer.name}</p>
                          <p className="text-xs text-gray-500">{channel.dealer.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 truncate max-w-[200px]">
                          {channel.subject || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 capitalize">{channel.department}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={channel.status} />
                      </td>
                      <td className="px-4 py-3">
                        {channel.assignedTo ? (
                          <p className="text-sm text-gray-700">
                            {channel.assignedTo.firstName} {channel.assignedTo.lastName}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {new Date(channel.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(channel.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{channel.messageCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleViewTranscript(channel.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-burnt-orange-600 hover:text-burnt-orange-700 hover:bg-burnt-orange-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {showTranscript && (
        <TranscriptModal
          channel={viewingChannel}
          messages={messages}
          isLoading={isLoadingTranscript}
          onClose={() => {
            setShowTranscript(false)
            setSelectedChannelId(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TranscriptModalProps {
  channel: ReturnType<typeof useLiveChat>['channel']
  messages: ReturnType<typeof useLiveChat>['messages']
  isLoading: boolean
  onClose: () => void
}

function TranscriptModal({ channel, messages, isLoading, onClose }: TranscriptModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chat Transcript</h2>
            {channel && (
              <p className="text-sm text-gray-500">{channel.channelNumber}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Channel Info */}
        {channel && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{channel.dealer.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {channel.initiatedBy.firstName} {channel.initiatedBy.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {new Date(channel.createdAt).toLocaleString()}
              </span>
            </div>
            <StatusBadge status={channel.status} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <ChatMessages
            messages={messages}
            typingUsers={[]}
            isLoading={isLoading}
            currentUserId=""
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {messages.length} messages in this conversation
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-charcoal-800 text-white rounded-lg text-sm font-medium hover:bg-charcoal-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
    waiting: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Waiting' },
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    resolved: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Resolved' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Closed' },
  }

  const { bg, text, label } = config[status] || config.open

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
