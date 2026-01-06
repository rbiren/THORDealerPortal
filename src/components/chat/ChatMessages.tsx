'use client'

import { useEffect, useRef } from 'react'
import { User, Bot, Clock, Check, CheckCheck } from 'lucide-react'
import type { ChatMessage, TypingUser } from '@/hooks/useLiveChat'

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessagesProps {
  messages: ChatMessage[]
  typingUsers: TypingUser[]
  isLoading: boolean
  currentUserId: string
}

// ============================================================================
// CHAT MESSAGES
// ============================================================================

export function ChatMessages({ messages, typingUsers, isLoading, currentUserId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-charcoal-200 border-t-charcoal-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4 space-y-4"
    >
      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-burnt-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-burnt-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Welcome to Live Chat!</h4>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            An agent will be with you shortly. Feel free to start typing your question.
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId
        const isSystem = message.isSystemMessage
        const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId

        if (isSystem) {
          return (
            <SystemMessage key={message.id} message={message} />
          )
        }

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={isOwn}
            showAvatar={showAvatar}
          />
        )
      })}

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showAvatar: boolean
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const isAgent = message.sender.role === 'admin' || message.sender.role === 'super_admin'

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold
            ${isAgent ? 'bg-gradient-to-br from-charcoal-600 to-charcoal-700' : 'bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600'}
          `}
        >
          {isAgent ? (
            <Bot className="w-4 h-4" />
          ) : (
            message.sender.firstName.charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for agents) */}
        {showAvatar && isAgent && !isOwn && (
          <span className="text-xs text-gray-500 mb-1 ml-1">
            {message.sender.firstName} {message.sender.lastName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={`
            px-4 py-2.5 rounded-2xl
            ${isOwn
              ? 'bg-gradient-to-br from-burnt-orange-500 to-burnt-orange-600 text-white rounded-tr-md'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachments */}
          {message.attachments && (
            <div className="mt-2 space-y-1">
              {JSON.parse(message.attachments).map((attachment: { filename: string; url: string }, idx: number) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-2 text-xs underline
                    ${isOwn ? 'text-white/90' : 'text-burnt-orange-600'}
                  `}
                >
                  📎 {attachment.filename}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <CheckCheck className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SYSTEM MESSAGE
// ============================================================================

interface SystemMessageProps {
  message: ChatMessage
}

function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center">
      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full">
        {message.content}
      </div>
    </div>
  )
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

interface TypingIndicatorProps {
  users: TypingUser[]
}

function TypingIndicator({ users }: TypingIndicatorProps) {
  const names = users.map(u => u.userName.split(' ')[0]).join(', ')

  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-charcoal-100 flex items-center justify-center">
        <Bot className="w-4 h-4 text-charcoal-500" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-400">{names} typing...</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
