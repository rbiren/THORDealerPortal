'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import type { RealtimeEventType } from '@/lib/services/realtime'

interface RealtimeEvent {
  type: RealtimeEventType
  payload: unknown
  timestamp: string
}

interface UseRealtimeUpdatesOptions {
  onNotification?: (data: {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, unknown>
  }) => void
  onOrderUpdate?: (data: {
    orderId: string
    orderNumber: string
    status: string
    previousStatus?: string
  }) => void
  onInventoryUpdate?: (data: {
    productId: string
    sku: string
    quantity: number
    previousQuantity: number
    type: string
  }) => void
  onAnnouncement?: (data: {
    id: string
    title: string
    type: string
    priority: string
    showAsBanner: boolean
  }) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  enabled?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

interface UseRealtimeUpdatesReturn {
  isConnected: boolean
  connectionError: Error | null
  reconnectAttempts: number
  disconnect: () => void
  reconnect: () => void
}

/**
 * Hook for subscribing to real-time updates via Server-Sent Events
 */
export function useRealtimeUpdates(
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesReturn {
  const {
    onNotification,
    onOrderUpdate,
    onInventoryUpdate,
    onAnnouncement,
    onConnect,
    onDisconnect,
    onError,
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case 'notification':
          onNotification?.(event.payload as Parameters<NonNullable<typeof onNotification>>[0])
          break
        case 'order_update':
          onOrderUpdate?.(event.payload as Parameters<NonNullable<typeof onOrderUpdate>>[0])
          break
        case 'inventory_update':
          onInventoryUpdate?.(event.payload as Parameters<NonNullable<typeof onInventoryUpdate>>[0])
          break
        case 'announcement':
          onAnnouncement?.(event.payload as Parameters<NonNullable<typeof onAnnouncement>>[0])
          break
      }
    },
    [onNotification, onOrderUpdate, onInventoryUpdate, onAnnouncement]
  )

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource('/api/realtime/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (!mountedRef.current) return
        setIsConnected(true)
        setConnectionError(null)
        setReconnectAttempts(0)
        onConnect?.()
      }

      eventSource.onerror = () => {
        if (!mountedRef.current) return
        setIsConnected(false)

        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          const error = new Error('Connection lost')
          setConnectionError(error)
          onError?.(error)

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setReconnectAttempts((prev) => prev + 1)
              connect()
            }
          }, reconnectDelay * Math.pow(2, reconnectAttempts)) // Exponential backoff
        } else {
          const error = new Error('Max reconnection attempts reached')
          setConnectionError(error)
          onError?.(error)
          onDisconnect?.()
        }
      }

      // Handle connected event
      eventSource.addEventListener('connected', (e) => {
        if (!mountedRef.current) return
        console.log('Real-time connected:', JSON.parse(e.data))
      })

      // Handle different event types
      const eventTypes: RealtimeEventType[] = [
        'notification',
        'order_update',
        'inventory_update',
        'announcement',
        'system',
      ]

      eventTypes.forEach((type) => {
        eventSource.addEventListener(type, (e) => {
          if (!mountedRef.current) return
          try {
            const payload = JSON.parse(e.data)
            handleEvent({ type, payload, timestamp: payload.timestamp })
          } catch (err) {
            console.error('Failed to parse event:', err)
          }
        })
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect')
      setConnectionError(error)
      onError?.(error)
    }
  }, [
    enabled,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
    handleEvent,
    onConnect,
    onDisconnect,
    onError,
  ])

  const reconnect = useCallback(() => {
    setReconnectAttempts(0)
    disconnect()
    connect()
  }, [connect, disconnect])

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      connect()
    }

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    disconnect,
    reconnect,
  }
}

/**
 * Hook specifically for notification updates
 */
export function useNotificationUpdates(
  onNewNotification: (notification: {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, unknown>
  }) => void
) {
  return useRealtimeUpdates({
    onNotification: onNewNotification,
  })
}

/**
 * Hook specifically for order updates
 */
export function useOrderUpdates(
  onOrderUpdate: (update: {
    orderId: string
    orderNumber: string
    status: string
    previousStatus?: string
  }) => void
) {
  return useRealtimeUpdates({
    onOrderUpdate,
  })
}
