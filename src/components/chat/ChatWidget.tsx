'use client'

import { useState, useCallback } from 'react'
import { MessageCircle, X, Minus, Send, Paperclip, ChevronDown } from 'lucide-react'
import { useLiveChat, useCreateChat, useChatList, type ChatChannel } from '@/hooks/useLiveChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'

// ============================================================================
// TYPES
// ============================================================================

type ChatDepartment = 'general' | 'sales' | 'service' | 'warranty' | 'billing' | 'technical'

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left'
  defaultDepartment?: ChatDepartment
}

// ============================================================================
// DEPARTMENT CONFIG
// ============================================================================

const DEPARTMENTS: { value: ChatDepartment; label: string; description: string }[] = [
  { value: 'general', label: 'General', description: 'General inquiries' },
  { value: 'sales', label: 'Sales', description: 'Product & pricing questions' },
  { value: 'service', label: 'Service', description: 'Service & repairs' },
  { value: 'warranty', label: 'Warranty', description: 'Warranty claims & support' },
  { value: 'billing', label: 'Billing', description: 'Invoices & payments' },
  { value: 'technical', label: 'Technical', description: 'Technical support' },
]

// ============================================================================
// CHAT WIDGET
// ============================================================================

export function ChatWidget({ position = 'bottom-right', defaultDepartment = 'general' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list')
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  // Hooks
  const { channels, isLoading: isLoadingList, refresh } = useChatList({
    status: ['open', 'waiting', 'active'],
  })
  const { createChat, isCreating } = useCreateChat()
  const {
    channel,
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

  // Handlers
  const handleToggle = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(!isOpen)
    }
  }, [isOpen, isMinimized])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
  }, [])

  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId)
    setView('chat')
  }, [])

  const handleStartNewChat = useCallback(async (department: ChatDepartment, subject: string, message: string) => {
    try {
      const newChannel = await createChat({
        department,
        subject: subject || undefined,
        initialMessage: message,
      })
      setSelectedChannelId(newChannel.id)
      setView('chat')
      refresh()
    } catch {
      // Error handled in hook
    }
  }, [createChat, refresh])

  const handleBack = useCallback(() => {
    setSelectedChannelId(null)
    setView('list')
    refresh()
  }, [refresh])

  const handleEndChat = useCallback(async () => {
    await closeChat()
    handleBack()
  }, [closeChat, handleBack])

  // Position classes
  const positionClasses = position === 'bottom-right'
    ? 'right-6 bottom-6'
    : 'left-6 bottom-6'

  // Unread count
  const unreadCount = channels.filter(c => c.status === 'active' || c.status === 'waiting').length

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-charcoal-800 to-charcoal-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {view === 'chat' && channel ? channel.channelNumber : 'Live Chat'}
                </h3>
                <p className="text-xs text-white/70">
                  {view === 'chat' && channel
                    ? channel.assignedTo
                      ? `${channel.assignedTo.firstName} ${channel.assignedTo.lastName}`
                      : 'Waiting for agent...'
                    : 'We typically reply in minutes'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[450px] flex flex-col">
            {view === 'list' && (
              <ChatList
                channels={channels}
                isLoading={isLoadingList}
                onSelectChannel={handleSelectChannel}
                onNewChat={() => setView('new')}
              />
            )}

            {view === 'new' && (
              <NewChatForm
                defaultDepartment={defaultDepartment}
                isCreating={isCreating}
                onSubmit={handleStartNewChat}
                onBack={handleBack}
              />
            )}

            {view === 'chat' && channel && (
              <>
                <ChatMessages
                  messages={messages}
                  typingUsers={typingUsers}
                  isLoading={isLoadingChat}
                  currentUserId="" // Will be set from session
                />
                {channel.status !== 'closed' ? (
                  <ChatInput
                    onSend={sendMessage}
                    onTyping={setTyping}
                    isSending={isSending}
                    disabled={channel.status === 'closed'}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-500">
                    This chat has ended
                  </div>
                )}
                {/* Chat Actions */}
                <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to chats
                  </button>
                  {channel.status !== 'closed' && (
                    <button
                      onClick={handleEndChat}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      End Chat
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Minimized Bar */}
      {isOpen && isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="mb-4 w-[300px] bg-charcoal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between hover:bg-charcoal-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium text-sm">
              {channel ? channel.channelNumber : 'Live Chat'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>
      )}

      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300 hover:scale-110
          ${isOpen
            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            : 'bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600 text-white hover:from-burnt-orange-600 hover:to-burnt-orange-700'
          }
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  )
}

// ============================================================================
// CHAT LIST
// ============================================================================

interface ChatListProps {
  channels: ChatChannel[]
  isLoading: boolean
  onSelectChannel: (channelId: string) => void
  onNewChat: () => void
}

function ChatList({ channels, isLoading, onSelectChannel, onNewChat }: ChatListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-charcoal-200 border-t-charcoal-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b">
        <button
          onClick={onNewChat}
          className="w-full py-3 px-4 bg-gradient-to-r from-burnt-orange-500 to-burnt-orange-600 text-white rounded-xl font-medium hover:from-burnt-orange-600 hover:to-burnt-orange-700 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Start New Chat
        </button>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No active chats</p>
            <p className="text-sm mt-1">Start a new conversation!</p>
          </div>
        ) : (
          <div className="divide-y">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {ch.subject || ch.channelNumber}
                      </span>
                      <StatusBadge status={ch.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 capitalize">
                      {ch.department} Department
                    </p>
                    {ch.assignedTo && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Agent: {ch.assignedTo.firstName} {ch.assignedTo.lastName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(ch.lastMessageAt || ch.createdAt)}
                    </span>
                    {ch.messageCount > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-400">
                          {ch.messageCount} messages
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// NEW CHAT FORM
// ============================================================================

interface NewChatFormProps {
  defaultDepartment: ChatDepartment
  isCreating: boolean
  onSubmit: (department: ChatDepartment, subject: string, message: string) => void
  onBack: () => void
}

function NewChatForm({ defaultDepartment, isCreating, onSubmit, onBack }: NewChatFormProps) {
  const [department, setDepartment] = useState<ChatDepartment>(defaultDepartment)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    onSubmit(department, subject, message)
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 self-start"
        >
          ← Back
        </button>

        <h4 className="font-semibold text-gray-900 mb-4">Start a new conversation</h4>

        {/* Department Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.value}
                type="button"
                onClick={() => setDepartment(dept.value)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${department === dept.value
                    ? 'border-burnt-orange-500 bg-burnt-orange-50 text-burnt-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-sm">{dept.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{dept.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject (optional)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your inquiry"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500 focus:border-transparent"
          />
        </div>

        {/* Message */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you today?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burnt-orange-500 focus:border-transparent resize-none"
            required
          />
        </div>
      </div>

      {/* Fixed submit button at bottom */}
      <div className="p-4 pt-2 border-t bg-white">
        <button
          type="submit"
          disabled={isCreating || !message.trim()}
          className="w-full py-3 bg-gradient-to-r from-burnt-orange-500 to-burnt-orange-600 text-white rounded-xl font-medium hover:from-burnt-orange-600 hover:to-burnt-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting chat...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Start Chat
            </>
          )}
        </button>
      </div>
    </form>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

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
