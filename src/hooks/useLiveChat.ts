'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRealtimeUpdates } from './useRealtimeUpdates'
import type {
  ChatMessageEvent,
  ChatTypingEvent,
  ChatStatusEvent,
} from '@/lib/services/realtime'

// ============================================================================
// TYPES
// ============================================================================

export interface ChatChannel {
  id: string
  channelNumber: string
  dealerId: string
  dealer: { id: string; name: string; code: string }
  initiatedById: string
  initiatedBy: { id: string; firstName: string; lastName: string; role: string }
  assignedToId: string | null
  assignedTo: { id: string; firstName: string; lastName: string; role: string } | null
  department: string
  subject: string | null
  status: string
  priority: string
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  sender: { id: string; firstName: string; lastName: string; role: string }
  content: string
  messageType: string
  attachments: string | null
  isSystemMessage: boolean
  systemAction: string | null
  isEdited: boolean
  isDeleted: boolean
  createdAt: string
}

export interface TypingUser {
  userId: string
  userName: string
  timestamp: number
}

// ============================================================================
// CHAT HOOK
// ============================================================================

interface UseLiveChatOptions {
  channelId?: string
  onNewMessage?: (message: ChatMessageEvent) => void
  onStatusChange?: (status: ChatStatusEvent) => void
  autoConnect?: boolean
}

interface UseLiveChatReturn {
  // State
  channel: ChatChannel | null
  messages: ChatMessage[]
  typingUsers: TypingUser[]
  isLoading: boolean
  error: string | null
  isSending: boolean

  // Actions
  loadChannel: (channelId: string) => Promise<void>
  sendMessage: (content: string, attachments?: unknown[]) => Promise<void>
  closeChat: () => Promise<void>
  setTyping: (isTyping: boolean) => void
  loadMoreMessages: () => Promise<void>

  // Connection
  isConnected: boolean
}

export function useLiveChat(options: UseLiveChatOptions = {}): UseLiveChatReturn {
  const { channelId, onNewMessage, onStatusChange, autoConnect = true } = options

  const [channel, setChannel] = useState<ChatChannel | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingRef = useRef<boolean>(false)

  // Handle real-time chat events
  const handleChatMessage = useCallback(
    (payload: ChatMessageEvent) => {
      if (payload.channelId !== channel?.id) return

      const newMessage: ChatMessage = {
        id: payload.messageId,
        channelId: payload.channelId,
        senderId: payload.senderId,
        sender: {
          id: payload.senderId,
          firstName: payload.senderName.split(' ')[0],
          lastName: payload.senderName.split(' ').slice(1).join(' '),
          role: payload.senderRole,
        },
        content: payload.content,
        messageType: payload.messageType,
        attachments: payload.attachments ? JSON.stringify(payload.attachments) : null,
        isSystemMessage: payload.isSystemMessage,
        systemAction: payload.systemAction || null,
        isEdited: false,
        isDeleted: false,
        createdAt: payload.createdAt,
      }

      setMessages((prev) => [...prev, newMessage])
      onNewMessage?.(payload)

      // Remove typing indicator for this user
      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.senderId))
    },
    [channel?.id, onNewMessage]
  )

  const handleTyping = useCallback(
    (payload: ChatTypingEvent) => {
      if (payload.channelId !== channel?.id) return

      if (payload.isTyping) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === payload.userId)
          if (existing) {
            return prev.map((u) =>
              u.userId === payload.userId ? { ...u, timestamp: Date.now() } : u
            )
          }
          return [...prev, { userId: payload.userId, userName: payload.userName, timestamp: Date.now() }]
        })
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId))
      }
    },
    [channel?.id]
  )

  const handleStatusChange = useCallback(
    (payload: ChatStatusEvent) => {
      if (payload.channelId !== channel?.id) return

      setChannel((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
            }
          : prev
      )
      onStatusChange?.(payload)
    },
    [channel?.id, onStatusChange]
  )

  // Set up real-time event listeners
  useRealtimeUpdates({
    enabled: autoConnect && !!channel,
    onNotification: (notification) => {
      // Handle chat-specific notifications
      if (notification.type === 'new_chat') {
        // Could trigger a refresh of channels list
      }
    },
  })

  // Manually subscribe to chat events via custom event listener
  useEffect(() => {
    if (!channel || !autoConnect) return

    const handleSSEMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'chat_message') {
          handleChatMessage(data.payload)
        } else if (data.type === 'chat_typing') {
          handleTyping(data.payload)
        } else if (data.type === 'chat_status') {
          handleStatusChange(data.payload)
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    // Listen on the EventSource if available
    window.addEventListener('sse-chat-message', handleSSEMessage as EventListener)

    return () => {
      window.removeEventListener('sse-chat-message', handleSSEMessage as EventListener)
    }
  }, [channel, autoConnect, handleChatMessage, handleTyping, handleStatusChange])

  // Clear stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) => prev.filter((u) => now - u.timestamp < 5000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Load channel data
  const loadChannel = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/chat/channels/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load channel')
      }

      const data = await response.json()
      setChannel(data.channel)
      setMessages(data.channel.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channel')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-load channel if ID provided
  useEffect(() => {
    if (channelId) {
      loadChannel(channelId)
    }
  }, [channelId, loadChannel])

  // Send a message
  const sendMessage = useCallback(
    async (content: string, attachments?: unknown[]) => {
      if (!channel || !content.trim()) return

      setIsSending(true)
      setError(null)

      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: channel.id,
            content: content.trim(),
            attachments,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const data = await response.json()
        setMessages((prev) => [...prev, data.message])

        // Reset typing indicator
        setTyping(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [channel]
  )

  // Close the chat
  const closeChat = useCallback(async () => {
    if (!channel) return

    try {
      const response = await fetch(`/api/chat/channels/${channel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })

      if (!response.ok) {
        throw new Error('Failed to close chat')
      }

      const data = await response.json()
      setChannel(data.channel)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close chat')
      throw err
    }
  }, [channel])

  // Set typing indicator
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channel || lastTypingRef.current === isTyping) return

      lastTypingRef.current = isTyping

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Send typing indicator
      fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id, isTyping }),
      }).catch(() => {
        // Ignore typing errors
      })

      // Auto-clear typing after 5 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false)
        }, 5000)
      }
    },
    [channel]
  )

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!channel || messages.length === 0) return

    const oldestMessage = messages[0]

    try {
      const response = await fetch(
        `/api/chat/messages/${channel.id}?before=${oldestMessage.createdAt}&limit=50`
      )

      if (!response.ok) {
        throw new Error('Failed to load messages')
      }

      const data = await response.json()
      setMessages((prev) => [...data.messages, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    }
  }, [channel, messages])

  return {
    channel,
    messages,
    typingUsers,
    isLoading,
    error,
    isSending,
    loadChannel,
    sendMessage,
    closeChat,
    setTyping,
    loadMoreMessages,
    isConnected: true, // TODO: Get from real-time connection
  }
}

// ============================================================================
// CREATE CHAT HOOK
// ============================================================================

interface UseCreateChatReturn {
  createChat: (options: {
    department?: string
    subject?: string
    initialMessage?: string
  }) => Promise<ChatChannel>
  isCreating: boolean
  error: string | null
}

export function useCreateChat(): UseCreateChatReturn {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChat = useCallback(
    async (options: { department?: string; subject?: string; initialMessage?: string }) => {
      setIsCreating(true)
      setError(null)

      try {
        const response = await fetch('/api/chat/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        })

        if (!response.ok) {
          throw new Error('Failed to create chat')
        }

        const data = await response.json()
        return data.channel
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create chat'
        setError(message)
        throw err
      } finally {
        setIsCreating(false)
      }
    },
    []
  )

  return { createChat, isCreating, error }
}

// ============================================================================
// CHAT LIST HOOK
// ============================================================================

interface UseChatListReturn {
  channels: ChatChannel[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useChatList(options?: {
  status?: string[]
  department?: string
  unassignedOnly?: boolean
}): UseChatListReturn {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options?.status) params.set('status', options.status.join(','))
      if (options?.department) params.set('department', options.department)
      if (options?.unassignedOnly) params.set('unassigned', 'true')

      const response = await fetch(`/api/chat/channels?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch channels')
      }

      const data = await response.json()
      setChannels(data.channels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels')
    } finally {
      setIsLoading(false)
    }
  }, [options?.status, options?.department, options?.unassignedOnly])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { channels, isLoading, error, refresh }
}
