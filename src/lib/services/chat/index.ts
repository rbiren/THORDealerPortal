/**
 * Live Chat Service
 *
 * Handles all chat-related business logic including:
 * - Creating chat channels
 * - Sending messages
 * - Assigning agents
 * - Closing/resolving chats
 * - Chat history and logs
 */

import { prisma } from '@/lib/prisma'
import {
  emitChatMessage,
  emitChatTyping,
  emitChatStatus,
  emitChatAssigned,
  emitNewChatNotification,
  type ChatMessageEvent,
} from '@/lib/services/realtime'

// ============================================================================
// TYPES
// ============================================================================

export type ChatDepartment = 'general' | 'sales' | 'service' | 'warranty' | 'billing' | 'technical'
export type ChatStatus = 'open' | 'waiting' | 'active' | 'resolved' | 'closed'
export type ChatPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface CreateChannelInput {
  dealerId: string
  userId: string
  department?: ChatDepartment
  subject?: string
  initialMessage?: string
}

export interface SendMessageInput {
  channelId: string
  senderId: string
  content: string
  messageType?: 'text' | 'system' | 'attachment'
  attachments?: Array<{ filename: string; url: string; mimeType: string; size: number }>
  isSystemMessage?: boolean
  systemAction?: string
}

export interface ChannelWithDetails {
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
  lastMessageAt: Date | null
  createdAt: Date
  updatedAt: Date
  messages?: MessageWithSender[]
}

export interface MessageWithSender {
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
  createdAt: Date
}

// ============================================================================
// CHANNEL NUMBER GENERATION
// ============================================================================

async function generateChannelNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CHAT-${year}-`

  // Find the latest channel number for this year
  const lastChannel = await prisma.chatChannel.findFirst({
    where: { channelNumber: { startsWith: prefix } },
    orderBy: { channelNumber: 'desc' },
    select: { channelNumber: true },
  })

  let nextNumber = 1
  if (lastChannel) {
    const lastNumber = parseInt(lastChannel.channelNumber.replace(prefix, ''), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`
}

// ============================================================================
// CHANNEL OPERATIONS
// ============================================================================

/**
 * Create a new chat channel
 */
export async function createChannel(input: CreateChannelInput): Promise<ChannelWithDetails> {
  const channelNumber = await generateChannelNumber()

  // Get dealer info for notifications
  const dealer = await prisma.dealer.findUnique({
    where: { id: input.dealerId },
    select: { id: true, name: true, code: true },
  })

  if (!dealer) {
    throw new Error('Dealer not found')
  }

  const channel = await prisma.chatChannel.create({
    data: {
      channelNumber,
      dealerId: input.dealerId,
      initiatedById: input.userId,
      department: input.department || 'general',
      subject: input.subject,
      status: 'open',
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  // Create initial message if provided
  if (input.initialMessage) {
    await sendMessage({
      channelId: channel.id,
      senderId: input.userId,
      content: input.initialMessage,
    })
  }

  // Notify admins about new chat
  emitNewChatNotification(
    channel.id,
    channel.channelNumber,
    dealer.name,
    channel.department,
    input.subject
  )

  return channel as ChannelWithDetails
}

/**
 * Get a channel by ID with full details
 */
export async function getChannel(channelId: string): Promise<ChannelWithDetails | null> {
  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
      messages: {
        where: { isDeleted: false },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 100, // Limit initial load
      },
    },
  })

  return channel as ChannelWithDetails | null
}

/**
 * Get channels for a dealer (their active chats)
 */
export async function getDealerChannels(
  dealerId: string,
  options?: { status?: ChatStatus[]; limit?: number }
): Promise<ChannelWithDetails[]> {
  const channels = await prisma.chatChannel.findMany({
    where: {
      dealerId,
      status: options?.status ? { in: options.status } : undefined,
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: options?.limit || 50,
  })

  return channels as ChannelWithDetails[]
}

/**
 * Get channels for admin dashboard
 */
export async function getAdminChannels(options?: {
  status?: ChatStatus[]
  department?: ChatDepartment
  assignedToId?: string
  unassignedOnly?: boolean
  limit?: number
}): Promise<ChannelWithDetails[]> {
  const channels = await prisma.chatChannel.findMany({
    where: {
      status: options?.status ? { in: options.status } : { not: 'closed' },
      department: options?.department,
      assignedToId: options?.unassignedOnly ? null : options?.assignedToId,
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: [
      { status: 'asc' }, // Open chats first
      { priority: 'desc' }, // High priority first
      { lastMessageAt: 'desc' },
    ],
    take: options?.limit || 100,
  })

  return channels as ChannelWithDetails[]
}

/**
 * Assign a channel to an agent
 */
export async function assignChannel(
  channelId: string,
  assignedToId: string,
  assignedByUserId: string
): Promise<ChannelWithDetails> {
  const previousChannel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      initiatedBy: { select: { id: true } },
      dealer: { select: { id: true, name: true, code: true } },
    },
  })

  if (!previousChannel) {
    throw new Error('Channel not found')
  }

  const newAgent = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true, firstName: true, lastName: true, role: true },
  })

  if (!newAgent) {
    throw new Error('Agent not found')
  }

  // Update channel
  const channel = await prisma.chatChannel.update({
    where: { id: channelId },
    data: {
      assignedToId,
      status: 'active',
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  // Add agent to channel members
  await prisma.chatChannelAgent.upsert({
    where: { channelId_userId: { channelId, userId: assignedToId } },
    create: { channelId, userId: assignedToId, role: 'agent' },
    update: { isActive: true, leftAt: null },
  })

  // Create system message
  await sendMessage({
    channelId,
    senderId: assignedByUserId,
    content: `${newAgent.firstName} ${newAgent.lastName} joined the chat`,
    isSystemMessage: true,
    systemAction: 'assigned',
  })

  // Emit assignment event
  const targetUsers = [previousChannel.initiatedById, assignedToId]
  if (previousChannel.assignedToId && previousChannel.assignedToId !== assignedToId) {
    targetUsers.push(previousChannel.assignedToId)
  }

  emitChatAssigned(
    {
      channelId,
      channelNumber: channel.channelNumber,
      assignedToId,
      assignedToName: `${newAgent.firstName} ${newAgent.lastName}`,
      previousAssigneeId: previousChannel.assignedTo?.id,
      previousAssigneeName: previousChannel.assignedTo
        ? `${previousChannel.assignedTo.firstName} ${previousChannel.assignedTo.lastName}`
        : undefined,
      department: channel.department,
    },
    targetUsers,
    channel.dealerId
  )

  return channel as ChannelWithDetails
}

/**
 * Close a chat channel
 */
export async function closeChannel(
  channelId: string,
  closedById: string,
  closeReason: 'resolved' | 'dealer_closed' | 'agent_closed' | 'timeout' = 'resolved'
): Promise<ChannelWithDetails> {
  const previousChannel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      initiatedBy: { select: { id: true } },
      assignedTo: { select: { id: true } },
    },
  })

  if (!previousChannel) {
    throw new Error('Channel not found')
  }

  const closedBy = await prisma.user.findUnique({
    where: { id: closedById },
    select: { firstName: true, lastName: true },
  })

  const channel = await prisma.chatChannel.update({
    where: { id: channelId },
    data: {
      status: 'closed',
      closedAt: new Date(),
      closedById,
      closeReason,
      resolvedAt: closeReason === 'resolved' ? new Date() : undefined,
      resolvedById: closeReason === 'resolved' ? closedById : undefined,
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  // Create system message
  const closeReasonText = {
    resolved: 'Chat resolved',
    dealer_closed: 'Chat closed by dealer',
    agent_closed: `Chat closed by ${closedBy?.firstName || 'agent'}`,
    timeout: 'Chat closed due to inactivity',
  }

  await sendMessage({
    channelId,
    senderId: closedById,
    content: closeReasonText[closeReason],
    isSystemMessage: true,
    systemAction: 'closed',
  })

  // Emit status change
  const targetUsers = [previousChannel.initiatedById]
  if (previousChannel.assignedToId) {
    targetUsers.push(previousChannel.assignedToId)
  }

  emitChatStatus(
    {
      channelId,
      channelNumber: channel.channelNumber,
      status: 'closed',
      previousStatus: previousChannel.status,
      updatedById: closedById,
      updatedByName: closedBy ? `${closedBy.firstName} ${closedBy.lastName}` : undefined,
      closeReason,
    },
    targetUsers,
    channel.dealerId
  )

  return channel as ChannelWithDetails
}

/**
 * Transfer a chat to another department or agent
 */
export async function transferChannel(
  channelId: string,
  department: ChatDepartment,
  newAssigneeId?: string,
  transferredById?: string
): Promise<ChannelWithDetails> {
  const previousChannel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      dealer: { select: { id: true, name: true } },
    },
  })

  if (!previousChannel) {
    throw new Error('Channel not found')
  }

  const channel = await prisma.chatChannel.update({
    where: { id: channelId },
    data: {
      department,
      assignedToId: newAssigneeId || null,
      status: newAssigneeId ? 'active' : 'open',
      transferCount: { increment: 1 },
    },
    include: {
      dealer: { select: { id: true, name: true, code: true } },
      initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  // Create system message
  if (transferredById) {
    await sendMessage({
      channelId,
      senderId: transferredById,
      content: `Chat transferred to ${department} department`,
      isSystemMessage: true,
      systemAction: 'transferred',
    })
  }

  // Notify admins about transfer
  emitNewChatNotification(
    channel.id,
    channel.channelNumber,
    previousChannel.dealer?.name || 'Unknown',
    department,
    `Transferred from ${previousChannel.department}`
  )

  return channel as ChannelWithDetails
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Send a message to a channel
 */
export async function sendMessage(input: SendMessageInput): Promise<MessageWithSender> {
  const channel = await prisma.chatChannel.findUnique({
    where: { id: input.channelId },
    include: {
      initiatedBy: { select: { id: true } },
      assignedTo: { select: { id: true } },
      agents: { where: { isActive: true }, select: { userId: true } },
    },
  })

  if (!channel) {
    throw new Error('Channel not found')
  }

  const sender = await prisma.user.findUnique({
    where: { id: input.senderId },
    select: { id: true, firstName: true, lastName: true, role: true },
  })

  if (!sender) {
    throw new Error('Sender not found')
  }

  // Create message
  const message = await prisma.chatMessage.create({
    data: {
      channelId: input.channelId,
      senderId: input.senderId,
      content: input.content,
      messageType: input.messageType || 'text',
      attachments: input.attachments ? JSON.stringify(input.attachments) : null,
      isSystemMessage: input.isSystemMessage || false,
      systemAction: input.systemAction,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  // Update channel stats
  await prisma.chatChannel.update({
    where: { id: input.channelId },
    data: {
      lastMessageAt: new Date(),
      lastMessageById: input.senderId,
      messageCount: { increment: 1 },
      // Set status to waiting if dealer sends message on open channel
      status:
        channel.status === 'open' && sender.role.includes('dealer')
          ? 'waiting'
          : channel.status,
    },
  })

  // Build target user list
  const targetUsers = new Set<string>()
  targetUsers.add(channel.initiatedById)
  if (channel.assignedToId) {
    targetUsers.add(channel.assignedToId)
  }
  channel.agents.forEach((a: { userId: string }) => targetUsers.add(a.userId))
  targetUsers.delete(input.senderId) // Don't notify sender

  // Emit message event
  if (!input.isSystemMessage || input.systemAction) {
    const messageEvent: ChatMessageEvent = {
      channelId: input.channelId,
      channelNumber: channel.channelNumber,
      messageId: message.id,
      senderId: sender.id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderRole: sender.role,
      content: input.content,
      messageType: (input.messageType || 'text') as 'text' | 'system' | 'attachment',
      attachments: input.attachments,
      isSystemMessage: input.isSystemMessage || false,
      systemAction: input.systemAction,
      createdAt: message.createdAt.toISOString(),
    }

    emitChatMessage(messageEvent, Array.from(targetUsers), channel.dealerId)
  }

  return message as MessageWithSender
}

/**
 * Get messages for a channel with pagination
 */
export async function getChannelMessages(
  channelId: string,
  options?: { limit?: number; before?: string }
): Promise<MessageWithSender[]> {
  const messages = await prisma.chatMessage.findMany({
    where: {
      channelId,
      isDeleted: false,
      ...(options?.before ? { createdAt: { lt: new Date(options.before) } } : {}),
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  })

  return messages.reverse() as MessageWithSender[]
}

/**
 * Mark messages as read
 */
export async function markMessagesRead(
  channelId: string,
  userId: string,
  upToMessageId?: string
): Promise<void> {
  const whereClause: Record<string, unknown> = {
    channelId,
    senderId: { not: userId },
    readAt: null,
  }

  if (upToMessageId) {
    const upToMessage = await prisma.chatMessage.findUnique({
      where: { id: upToMessageId },
      select: { createdAt: true },
    })
    if (upToMessage) {
      whereClause.createdAt = { lte: upToMessage.createdAt }
    }
  }

  await prisma.chatMessage.updateMany({
    where: whereClause,
    data: {
      readAt: new Date(),
      readById: userId,
    },
  })
}

// ============================================================================
// TYPING INDICATORS
// ============================================================================

/**
 * Broadcast typing indicator
 */
export async function broadcastTyping(
  channelId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: {
      initiatedBy: { select: { id: true } },
      assignedTo: { select: { id: true } },
      agents: { where: { isActive: true }, select: { userId: true } },
    },
  })

  if (!channel) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })

  if (!user) return

  // Update agent's last typing time
  await prisma.chatChannelAgent.updateMany({
    where: { channelId, userId },
    data: { lastTypingAt: isTyping ? new Date() : null },
  })

  // Build target users (everyone except the typer)
  const targetUsers = new Set<string>()
  targetUsers.add(channel.initiatedById)
  if (channel.assignedToId) {
    targetUsers.add(channel.assignedToId)
  }
  channel.agents.forEach((a: { userId: string }) => targetUsers.add(a.userId))
  targetUsers.delete(userId)

  emitChatTyping(
    {
      channelId,
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      isTyping,
    },
    Array.from(targetUsers)
  )
}

// ============================================================================
// AGENT STATUS
// ============================================================================

/**
 * Update agent availability status
 */
export async function updateAgentStatus(
  userId: string,
  status: 'online' | 'away' | 'busy' | 'offline',
  statusMessage?: string
): Promise<void> {
  await prisma.chatAgentStatus.upsert({
    where: { userId },
    create: {
      userId,
      status,
      statusMessage,
      lastOnlineAt: status === 'online' ? new Date() : undefined,
      lastActivityAt: new Date(),
    },
    update: {
      status,
      statusMessage,
      lastOnlineAt: status === 'online' ? new Date() : undefined,
      lastActivityAt: new Date(),
    },
  })
}

/**
 * Get available agents for a department
 */
export async function getAvailableAgents(department?: ChatDepartment): Promise<
  Array<{
    userId: string
    user: { firstName: string; lastName: string }
    status: string
    activeChatsCount: number
    maxActiveChats: number
  }>
> {
  const agents = await prisma.chatAgentStatus.findMany({
    where: {
      status: 'online',
      autoAssignEnabled: true,
      ...(department
        ? { departments: { contains: department } }
        : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { activeChatsCount: 'asc' }, // Prefer agents with fewer active chats
  })

  return agents.filter((a: { activeChatsCount: number; maxActiveChats: number }) => a.activeChatsCount < a.maxActiveChats)
}

// ============================================================================
// CHAT HISTORY & LOGS
// ============================================================================

/**
 * Get chat history for admin logs
 */
export async function getChatHistory(options: {
  dealerId?: string
  department?: ChatDepartment
  status?: ChatStatus
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<{ channels: ChannelWithDetails[]; total: number }> {
  const where: Record<string, unknown> = {}

  if (options.dealerId) where.dealerId = options.dealerId
  if (options.department) where.department = options.department
  if (options.status) where.status = options.status
  if (options.startDate || options.endDate) {
    where.createdAt = {
      ...(options.startDate ? { gte: options.startDate } : {}),
      ...(options.endDate ? { lte: options.endDate } : {}),
    }
  }

  const [channels, total] = await Promise.all([
    prisma.chatChannel.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, code: true } },
        initiatedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.chatChannel.count({ where }),
  ])

  return { channels: channels as ChannelWithDetails[], total }
}

/**
 * Get chat statistics for dashboard
 */
export async function getChatStats(options?: {
  startDate?: Date
  endDate?: Date
}): Promise<{
  totalChats: number
  openChats: number
  activeChats: number
  resolvedToday: number
  avgResponseTime: number | null
  byDepartment: Record<string, number>
}> {
  const dateFilter = {
    ...(options?.startDate ? { gte: options.startDate } : {}),
    ...(options?.endDate ? { lte: options.endDate } : {}),
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [total, open, active, resolvedToday, byDepartment] = await Promise.all([
    prisma.chatChannel.count({
      where: options?.startDate || options?.endDate ? { createdAt: dateFilter } : {},
    }),
    prisma.chatChannel.count({ where: { status: 'open' } }),
    prisma.chatChannel.count({ where: { status: 'active' } }),
    prisma.chatChannel.count({
      where: {
        status: 'closed',
        closeReason: 'resolved',
        resolvedAt: { gte: today },
      },
    }),
    prisma.chatChannel.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { status: { not: 'closed' } },
    }),
  ])

  const departmentCounts: Record<string, number> = {}
  byDepartment.forEach((d: { department: string; _count: { id: number } }) => {
    departmentCounts[d.department] = d._count.id
  })

  return {
    totalChats: total,
    openChats: open,
    activeChats: active,
    resolvedToday,
    avgResponseTime: null, // TODO: Calculate from first response times
    byDepartment: departmentCounts,
  }
}

/**
 * Submit satisfaction rating for a closed chat
 */
export async function submitSatisfactionRating(
  channelId: string,
  rating: number,
  comment?: string
): Promise<void> {
  await prisma.chatChannel.update({
    where: { id: channelId },
    data: {
      satisfactionRating: rating,
      satisfactionComment: comment,
    },
  })
}
