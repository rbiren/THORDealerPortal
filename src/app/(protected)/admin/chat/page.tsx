'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Send,
  X,
  ChevronDown,
  MoreVertical,
  UserPlus,
  ArrowRightLeft,
} from 'lucide-react'
import { useChatList, useLiveChat, type ChatChannel } from '@/hooks/useLiveChat'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'

// ============================================================================
// TYPES
// ============================================================================

type ChatDepartment = 'general' | 'sales' | 'service' | 'warranty' | 'billing' | 'technical'
type ViewMode = 'list' | 'chat'

interface ChatStats {
  totalChats: number
  openChats: number
  activeChats: number
  resolvedToday: number
  avgResponseTime: number | null
  byDepartment: Record<string, number>
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AdminChatPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<ChatDepartment | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active_open')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Map filter value to actual status array
  const getStatusFilter = (filter: string): string[] | undefined => {
    switch (filter) {
      case 'active_open': return ['open', 'waiting', 'active']
      case 'open': return ['open']
      case 'waiting': return ['waiting']
      case 'active': return ['active']
      case 'closed': return ['closed']
      case 'all': return undefined
      default: return ['open', 'waiting', 'active']
    }
  }

  // Get channels based on filter
  const { channels, isLoading: isLoadingChannels, refresh } = useChatList({
    status: getStatusFilter(filterStatus),
    department: filterDepartment === 'all' ? undefined : filterDepartment,
    unassignedOnly: filterStatus === 'unassigned',
  })

  // Get active chat details
  const {
    channel: activeChannel,
    messages,
    typingUsers,
    isLoading: isLoadingChat,
    isSending,
    sendMessage,
    closeChat,
    setTyping,
    loadChannel,
  } = useLiveChat({
    channelId: selectedChannelId || undefined,
  })

  // Load stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/chat/stats?type=stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  // Handle channel selection
  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId)
    setViewMode('chat')
  }, [])

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setSelectedChannelId(null)
    setViewMode('list')
    refresh()
  }, [refresh])

  // Handle assign to self
  const handleAssignToSelf = useCallback(async (channelId: string) => {
    try {
      await fetch(`/api/chat/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', assignedToId: 'current' }), // Backend will use session user
      })
      refresh()
      if (selectedChannelId === channelId) {
        loadChannel(channelId)
      }
    } catch (error) {
      console.error('Failed to assign chat:', error)
    }
  }, [refresh, selectedChannelId, loadChannel])

  // Handle close chat
  const handleCloseChat = useCallback(async (channelId: string) => {
    try {
      await fetch(`/api/chat/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', closeReason: 'resolved' }),
      })
      refresh()
      if (selectedChannelId === channelId) {
        handleBackToList()
      }
    } catch (error) {
      console.error('Failed to close chat:', error)
    }
  }, [refresh, selectedChannelId, handleBackToList])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Chat Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage dealer conversations and support requests
            </p>
          </div>
          <button
            onClick={() => refresh()}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<MessageCircle className="w-5 h-5" />}
            label="Open Chats"
            value={stats?.openChats ?? '-'}
            color="blue"
            isLoading={isLoadingStats}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Active Chats"
            value={stats?.activeChats ?? '-'}
            color="green"
            isLoading={isLoadingStats}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Resolved Today"
            value={stats?.resolvedToday ?? '-'}
            color="purple"
            isLoading={isLoadingStats}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Response"
            value={stats?.avgResponseTime ? `${stats.avgResponseTime}m` : 'N/A'}
            color="orange"
            isLoading={isLoadingStats}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {viewMode === 'list' ? (
            <>
              {/* Filters */}
              <div className="p-4 border-b flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500"
                >
                  <option value="active_open">Active & Open</option>
                  <option value="open">Open (New)</option>
                  <option value="waiting">Waiting for Agent</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="all">All Chats</option>
                </select>

                {/* Department Filter */}
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value as ChatDepartment | 'all')}
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
              </div>

              {/* Chat List */}
              <div className="divide-y">
                {isLoadingChannels ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-charcoal-200 border-t-charcoal-600 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-3">Loading chats...</p>
                  </div>
                ) : filteredChannels.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium text-gray-600">No chats found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {filterStatus === 'open' ? 'All chats are assigned' : 'Try adjusting your filters'}
                    </p>
                  </div>
                ) : (
                  filteredChannels.map((channel) => (
                    <ChatListItem
                      key={channel.id}
                      channel={channel}
                      onSelect={() => handleSelectChannel(channel.id)}
                      onAssign={() => handleAssignToSelf(channel.id)}
                      onClose={() => handleCloseChat(channel.id)}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            /* Chat View */
            <div className="flex h-[calc(100vh-280px)] min-h-[500px]">
              {/* Chat Sidebar */}
              <div className="w-80 border-r flex flex-col">
                <div className="p-4 border-b">
                  <button
                    onClick={handleBackToList}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    ← Back to all chats
                  </button>
                </div>

                {activeChannel && (
                  <div className="p-4 space-y-4 overflow-y-auto">
                    {/* Channel Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900">{activeChannel.channelNumber}</h3>
                      {activeChannel.subject && (
                        <p className="text-sm text-gray-600 mt-1">{activeChannel.subject}</p>
                      )}
                      <div className="mt-2">
                        <StatusBadge status={activeChannel.status} />
                      </div>
                    </div>

                    {/* Dealer Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                        <Building2 className="w-4 h-4" />
                        Dealer
                      </div>
                      <p className="text-sm text-gray-800">{activeChannel.dealer.name}</p>
                      <p className="text-xs text-gray-500">{activeChannel.dealer.code}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                        <Users className="w-4 h-4" />
                        Contact
                      </div>
                      <p className="text-sm text-gray-800">
                        {activeChannel.initiatedBy.firstName} {activeChannel.initiatedBy.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{activeChannel.initiatedBy.role.replace('_', ' ')}</p>
                    </div>

                    {/* Department */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                        <Filter className="w-4 h-4" />
                        Department
                      </div>
                      <p className="text-sm text-gray-800 capitalize">{activeChannel.department}</p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      {!activeChannel.assignedToId && (
                        <button
                          onClick={() => handleAssignToSelf(activeChannel.id)}
                          className="w-full py-2 px-3 bg-burnt-orange-500 text-white rounded-lg text-sm font-medium hover:bg-burnt-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign to Me
                        </button>
                      )}

                      <button
                        onClick={() => {/* TODO: Transfer modal */}}
                        className="w-full py-2 px-3 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Transfer
                      </button>

                      {activeChannel.status !== 'closed' && (
                        <button
                          onClick={() => handleCloseChat(activeChannel.id)}
                          className="w-full py-2 px-3 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Resolve & Close
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                {activeChannel ? (
                  <>
                    <ChatMessages
                      messages={messages}
                      typingUsers={typingUsers}
                      isLoading={isLoadingChat}
                      currentUserId="" // Will be set from session
                    />
                    {activeChannel.status !== 'closed' ? (
                      <ChatInput
                        onSend={sendMessage}
                        onTyping={setTyping}
                        isSending={isSending}
                        disabled={activeChannel.status === 'closed'}
                        placeholder="Type your response..."
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-500">
                        This chat has been closed
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Select a chat to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange'
  isLoading: boolean
}

function StatCard({ icon, label, value, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {isLoading ? (
            <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChatListItemProps {
  channel: ChatChannel
  onSelect: () => void
  onAssign: () => void
  onClose: () => void
}

function ChatListItem({ channel, onSelect, onAssign, onClose }: ChatListItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-4"
      onClick={onSelect}
    >
      {/* Status Indicator */}
      <div className="pt-1">
        <div
          className={`w-3 h-3 rounded-full ${
            channel.status === 'open'
              ? 'bg-blue-500 animate-pulse'
              : channel.status === 'active'
              ? 'bg-green-500'
              : channel.status === 'waiting'
              ? 'bg-yellow-500'
              : 'bg-gray-400'
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{channel.dealer.name}</span>
              <StatusBadge status={channel.status} />
            </div>
            <p className="text-sm text-gray-500">{channel.channelNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              {formatRelativeTime(channel.lastMessageAt || channel.createdAt)}
            </p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{channel.department}</p>
          </div>
        </div>

        {channel.subject && (
          <p className="text-sm text-gray-600 mt-1 truncate">{channel.subject}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{channel.initiatedBy.firstName} {channel.initiatedBy.lastName}</span>
            <span>{channel.messageCount} messages</span>
          </div>

          {/* Quick Actions */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                  {!channel.assignedToId && (
                    <button
                      onClick={() => {
                        onAssign()
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign to Me
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onSelect()
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Open Chat
                  </button>
                  {channel.status !== 'closed' && (
                    <button
                      onClick={() => {
                        onClose()
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Close Chat
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
    resolved: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Resolved' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Closed' },
  }

  const { bg, text, label } = config[status] || config.open

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
