/**
 * Real-time Updates Infrastructure
 *
 * This module provides a simple event-based real-time update system.
 * It uses Server-Sent Events (SSE) for browser connections and
 * can be extended to use WebSockets (Socket.io) for more complex needs.
 *
 * For production with multiple servers, this should be backed by Redis pub/sub.
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

export type RealtimeEventType =
  | 'notification'
  | 'order_update'
  | 'inventory_update'
  | 'announcement'
  | 'document_update'
  | 'system'
  | 'chat_message'
  | 'chat_typing'
  | 'chat_status'
  | 'chat_assigned'

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType
  payload: T
  timestamp: Date
  targetUserIds?: string[]
  targetDealerIds?: string[]
  targetRoles?: string[]
}

export interface NotificationEvent {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface OrderUpdateEvent {
  orderId: string
  orderNumber: string
  status: string
  previousStatus?: string
  updatedBy?: string
}

export interface InventoryUpdateEvent {
  productId: string
  sku: string
  locationId: string
  quantity: number
  previousQuantity: number
  type: 'adjustment' | 'sale' | 'return' | 'transfer'
}

export interface AnnouncementEvent {
  id: string
  title: string
  type: 'info' | 'warning' | 'alert' | 'maintenance'
  priority: 'low' | 'normal' | 'high' | 'critical'
  showAsBanner: boolean
}

// Chat Events
export interface ChatMessageEvent {
  channelId: string
  channelNumber: string
  messageId: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  messageType: 'text' | 'system' | 'attachment'
  attachments?: Array<{ filename: string; url: string; mimeType: string; size: number }>
  isSystemMessage: boolean
  systemAction?: string
  createdAt: string
}

export interface ChatTypingEvent {
  channelId: string
  userId: string
  userName: string
  isTyping: boolean
}

export interface ChatStatusEvent {
  channelId: string
  channelNumber: string
  status: 'open' | 'waiting' | 'active' | 'resolved' | 'closed'
  previousStatus?: string
  updatedById?: string
  updatedByName?: string
  closeReason?: string
}

export interface ChatAssignedEvent {
  channelId: string
  channelNumber: string
  assignedToId: string
  assignedToName: string
  previousAssigneeId?: string
  previousAssigneeName?: string
  department: string
}

// ============================================================================
// EVENT EMITTER (In-Memory for Single Server)
// ============================================================================

type EventCallback = (event: RealtimeEvent) => void

class RealtimeEventEmitter {
  private subscribers: Map<string, Set<EventCallback>> = new Map()
  private userSubscribers: Map<string, Set<EventCallback>> = new Map()
  private dealerSubscribers: Map<string, Set<EventCallback>> = new Map()
  private roleSubscribers: Map<string, Set<EventCallback>> = new Map()

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: EventCallback): () => void {
    const key = 'all'
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    return () => {
      this.subscribers.get(key)?.delete(callback)
    }
  }

  /**
   * Subscribe to events for a specific user
   */
  subscribeUser(userId: string, callback: EventCallback): () => void {
    if (!this.userSubscribers.has(userId)) {
      this.userSubscribers.set(userId, new Set())
    }
    this.userSubscribers.get(userId)!.add(callback)

    return () => {
      this.userSubscribers.get(userId)?.delete(callback)
    }
  }

  /**
   * Subscribe to events for a specific dealer
   */
  subscribeDealer(dealerId: string, callback: EventCallback): () => void {
    if (!this.dealerSubscribers.has(dealerId)) {
      this.dealerSubscribers.set(dealerId, new Set())
    }
    this.dealerSubscribers.get(dealerId)!.add(callback)

    return () => {
      this.dealerSubscribers.get(dealerId)?.delete(callback)
    }
  }

  /**
   * Subscribe to events for a specific role
   */
  subscribeRole(role: string, callback: EventCallback): () => void {
    if (!this.roleSubscribers.has(role)) {
      this.roleSubscribers.set(role, new Set())
    }
    this.roleSubscribers.get(role)!.add(callback)

    return () => {
      this.roleSubscribers.get(role)?.delete(callback)
    }
  }

  /**
   * Emit an event to relevant subscribers
   */
  emit(event: RealtimeEvent): void {
    // Notify all subscribers
    this.subscribers.get('all')?.forEach((cb) => cb(event))

    // Notify targeted users
    if (event.targetUserIds) {
      for (const userId of event.targetUserIds) {
        this.userSubscribers.get(userId)?.forEach((cb) => cb(event))
      }
    }

    // Notify targeted dealers
    if (event.targetDealerIds) {
      for (const dealerId of event.targetDealerIds) {
        this.dealerSubscribers.get(dealerId)?.forEach((cb) => cb(event))
      }
    }

    // Notify targeted roles
    if (event.targetRoles) {
      for (const role of event.targetRoles) {
        this.roleSubscribers.get(role)?.forEach((cb) => cb(event))
      }
    }
  }

  /**
   * Get subscriber counts for monitoring
   */
  getStats(): {
    allSubscribers: number
    userSubscribers: number
    dealerSubscribers: number
    roleSubscribers: number
  } {
    let userCount = 0
    let dealerCount = 0
    let roleCount = 0

    this.userSubscribers.forEach((set) => (userCount += set.size))
    this.dealerSubscribers.forEach((set) => (dealerCount += set.size))
    this.roleSubscribers.forEach((set) => (roleCount += set.size))

    return {
      allSubscribers: this.subscribers.get('all')?.size || 0,
      userSubscribers: userCount,
      dealerSubscribers: dealerCount,
      roleSubscribers: roleCount,
    }
  }
}

// Singleton instance
export const realtimeEmitter = new RealtimeEventEmitter()

// ============================================================================
// EVENT EMISSION HELPERS
// ============================================================================

/**
 * Emit a notification event
 */
export function emitNotification(
  notification: NotificationEvent,
  targetUserIds: string[]
): void {
  realtimeEmitter.emit({
    type: 'notification',
    payload: notification,
    timestamp: new Date(),
    targetUserIds,
  })
}

/**
 * Emit an order update event
 */
export function emitOrderUpdate(
  update: OrderUpdateEvent,
  targetDealerId: string
): void {
  realtimeEmitter.emit({
    type: 'order_update',
    payload: update,
    timestamp: new Date(),
    targetDealerIds: [targetDealerId],
    targetRoles: ['admin', 'super_admin'], // Admins see all order updates
  })
}

/**
 * Emit an inventory update event
 */
export function emitInventoryUpdate(update: InventoryUpdateEvent): void {
  realtimeEmitter.emit({
    type: 'inventory_update',
    payload: update,
    timestamp: new Date(),
    targetRoles: ['admin', 'super_admin', 'dealer_admin'],
  })
}

/**
 * Emit an announcement event
 */
export function emitAnnouncement(
  announcement: AnnouncementEvent,
  targetUserIds?: string[],
  targetRoles?: string[]
): void {
  realtimeEmitter.emit({
    type: 'announcement',
    payload: announcement,
    timestamp: new Date(),
    targetUserIds,
    targetRoles,
  })
}

/**
 * Emit a system event (for maintenance, errors, etc.)
 */
export function emitSystemEvent(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  realtimeEmitter.emit({
    type: 'system',
    payload: { message, level },
    timestamp: new Date(),
    targetRoles: ['admin', 'super_admin'],
  })
}

// ============================================================================
// CLIENT CONNECTION HELPER
// ============================================================================

/**
 * Connection info for a client
 */
export interface ClientConnection {
  userId: string
  dealerId?: string
  role: string
  connectedAt: Date
}

/**
 * Create a subscription for a connected client
 * Returns an unsubscribe function
 */
export function createClientSubscription(
  connection: ClientConnection,
  onEvent: (event: RealtimeEvent) => void
): () => void {
  const unsubscribers: Array<() => void> = []

  // Subscribe to user-specific events
  unsubscribers.push(realtimeEmitter.subscribeUser(connection.userId, onEvent))

  // Subscribe to dealer-specific events
  if (connection.dealerId) {
    unsubscribers.push(realtimeEmitter.subscribeDealer(connection.dealerId, onEvent))
  }

  // Subscribe to role-specific events
  unsubscribers.push(realtimeEmitter.subscribeRole(connection.role, onEvent))

  // Return combined unsubscribe function
  return () => {
    unsubscribers.forEach((unsub) => unsub())
  }
}

// ============================================================================
// CHAT EVENT EMISSION HELPERS
// ============================================================================

/**
 * Emit a chat message event to channel participants
 */
export function emitChatMessage(
  message: ChatMessageEvent,
  targetUserIds: string[],
  targetDealerId?: string
): void {
  realtimeEmitter.emit({
    type: 'chat_message',
    payload: message,
    timestamp: new Date(),
    targetUserIds,
    targetDealerIds: targetDealerId ? [targetDealerId] : undefined,
  })
}

/**
 * Emit a typing indicator event
 */
export function emitChatTyping(
  typing: ChatTypingEvent,
  targetUserIds: string[]
): void {
  realtimeEmitter.emit({
    type: 'chat_typing',
    payload: typing,
    timestamp: new Date(),
    targetUserIds,
  })
}

/**
 * Emit a chat status change event
 */
export function emitChatStatus(
  status: ChatStatusEvent,
  targetUserIds: string[],
  targetDealerId?: string
): void {
  realtimeEmitter.emit({
    type: 'chat_status',
    payload: status,
    timestamp: new Date(),
    targetUserIds,
    targetDealerIds: targetDealerId ? [targetDealerId] : undefined,
    targetRoles: ['admin', 'super_admin'], // Admins see all status changes
  })
}

/**
 * Emit a chat assignment event
 */
export function emitChatAssigned(
  assignment: ChatAssignedEvent,
  targetUserIds: string[],
  targetDealerId?: string
): void {
  realtimeEmitter.emit({
    type: 'chat_assigned',
    payload: assignment,
    timestamp: new Date(),
    targetUserIds,
    targetDealerIds: targetDealerId ? [targetDealerId] : undefined,
    targetRoles: ['admin', 'super_admin'],
  })
}

/**
 * Emit a new chat notification to available agents
 */
export function emitNewChatNotification(
  channelId: string,
  channelNumber: string,
  dealerName: string,
  department: string,
  subject?: string
): void {
  realtimeEmitter.emit({
    type: 'notification',
    payload: {
      id: channelId,
      type: 'new_chat',
      title: 'New Chat Request',
      body: `${dealerName} started a chat${subject ? `: ${subject}` : ''} (${department})`,
      data: { channelId, channelNumber, department },
    },
    timestamp: new Date(),
    targetRoles: ['admin', 'super_admin'],
  })
}
