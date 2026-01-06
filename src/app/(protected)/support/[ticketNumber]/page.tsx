'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  Building2,
  MessageSquare,
  Paperclip,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  getSupportTicketAction,
  addTicketMessageAction,
  isUserAdmin,
} from '../actions'
import {
  ticketStatusLabels,
  ticketStatusColors,
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketPriorityColors,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from '@/lib/validations/support'

type TicketMessage = {
  id: string
  content: string
  isInternal: boolean
  isSystemMessage: boolean
  createdAt: Date
  user: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

type TicketDetails = {
  id: string
  ticketNumber: string
  status: string
  category: string
  subcategory: string | null
  subject: string
  description: string
  priority: string
  slaResponseDue: Date | null
  slaResolutionDue: Date | null
  firstResponseAt: Date | null
  resolvedAt: Date | null
  closedAt: Date | null
  createdAt: Date
  updatedAt: Date
  dealer: {
    id: string
    name: string
    code: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  messages: TicketMessage[]
  attachments: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date
  }[]
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateTime(d)
}

function SLAIndicator({
  dueDate,
  responseTime,
  isResponse,
}: {
  dueDate: Date | null
  responseTime: Date | null
  isResponse: boolean
}) {
  if (!dueDate) return null

  const now = new Date()
  const due = new Date(dueDate)
  const isOverdue = now > due && !responseTime
  const isMet = responseTime && new Date(responseTime) <= due

  if (isMet) {
    return (
      <span className="inline-flex items-center text-xs text-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        {isResponse ? 'Response' : 'Resolution'} SLA met
      </span>
    )
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center text-xs text-red-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {isResponse ? 'Response' : 'Resolution'} SLA breached
      </span>
    )
  }

  const hoursLeft = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60))
  const minsLeft = Math.floor((due.getTime() - now.getTime()) / (1000 * 60))

  return (
    <span
      className={`inline-flex items-center text-xs ${
        hoursLeft < 2 ? 'text-orange-600' : 'text-gray-500'
      }`}
    >
      <Clock className="h-3 w-3 mr-1" />
      {isResponse ? 'Response' : 'Resolution'} due in{' '}
      {hoursLeft > 0 ? `${hoursLeft}h` : `${minsLeft}m`}
    </span>
  )
}

function MessageBubble({
  message,
  isCurrentUser,
}: {
  message: TicketMessage
  isCurrentUser: boolean
}) {
  const isStaff = ['super_admin', 'admin'].includes(message.user.role)

  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
          {message.content}
          <span className="text-gray-400 ml-2">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] ${
          isCurrentUser ? 'order-1' : 'order-2'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {!isCurrentUser && (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isStaff
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {message.user.firstName[0]}
              {message.user.lastName[0]}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900">
            {message.user.firstName} {message.user.lastName}
            {isStaff && (
              <span className="ml-1 text-xs text-primary font-normal">
                (Support)
              </span>
            )}
          </span>
          {message.isInternal && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
              Internal Note
            </span>
          )}
        </div>
        <div
          className={`rounded-lg px-4 py-3 ${
            isCurrentUser
              ? 'bg-primary text-white'
              : isStaff
                ? 'bg-blue-50 text-gray-900 border border-blue-100'
                : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p
          className={`text-xs text-gray-400 mt-1 ${
            isCurrentUser ? 'text-right' : ''
          }`}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketNumber = params.ticketNumber as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<TicketDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const loadTicket = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getSupportTicketAction(ticketNumber)
    if (result) {
      setTicket(result as TicketDetails)
      // Get current user ID from submittedBy if it matches (simple heuristic)
      setCurrentUserId(result.submittedBy.id)
    } else {
      setError('Ticket not found or access denied')
    }
    setIsLoading(false)
  }, [ticketNumber])

  useEffect(() => {
    loadTicket()
    isUserAdmin().then(setIsAdmin)
  }, [loadTicket])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !ticket) return

    setIsSending(true)
    setSendError(null)

    const result = await addTicketMessageAction(ticket.id, newMessage.trim(), false)

    if (result.success) {
      setNewMessage('')
      await loadTicket() // Reload to get the new message
    } else {
      setSendError(result.error || 'Failed to send message')
    }

    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/support"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Support
        </Link>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Ticket Not Found'}
          </h2>
          <p className="text-gray-500 mb-6">
            The ticket you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link
            href="/support"
            className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90"
          >
            View All Tickets
          </Link>
        </div>
      </div>
    )
  }

  const status = ticket.status as TicketStatus
  const statusColor = ticketStatusColors[status] || ticketStatusColors.open
  const category = ticket.category as TicketCategory
  const priority = ticket.priority as TicketPriority
  const priorityColor = ticketPriorityColors[priority] || ticketPriorityColors.normal
  const isClosed = ['resolved', 'closed'].includes(ticket.status)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/support"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Support
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500">
                {ticket.ticketNumber}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${statusColor.dot}`} />
                {ticketStatusLabels[status]}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${priorityColor.bg} ${priorityColor.text}`}
              >
                {ticketPriorityLabels[priority]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Original Request
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
            <p className="text-xs text-gray-400 mt-4">
              Submitted {formatDateTime(ticket.createdAt)}
            </p>
          </div>

          {/* Messages Thread */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversation
                <span className="text-sm text-gray-500 font-normal">
                  ({ticket.messages.length} messages)
                </span>
              </h2>
            </div>

            <div className="p-6 max-h-[500px] overflow-y-auto">
              {ticket.messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation below.
                </p>
              ) : (
                ticket.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isCurrentUser={message.user.id === currentUserId}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Form */}
            {!isClosed ? (
              <div className="px-6 py-4 border-t border-gray-100">
                <form onSubmit={handleSendMessage}>
                  {sendError && (
                    <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                      {sendError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="self-end px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
                This ticket is {ticket.status}. To continue the conversation, please open a new ticket.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-medium text-gray-900 mb-4">Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {ticketCategoryLabels[category]}
                  {ticket.subcategory && (
                    <span className="text-gray-500"> · {ticket.subcategory}</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Submitted By</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  {ticket.submittedBy.firstName} {ticket.submittedBy.lastName}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Dealer</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {ticket.dealer.name}
                  <span className="text-gray-500">({ticket.dealer.code})</span>
                </dd>
              </div>

              {ticket.assignedTo && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">
                    Assigned To
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDateTime(ticket.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatRelativeTime(ticket.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* SLA Status */}
          {!isClosed && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="font-medium text-gray-900 mb-4">Response Time</h2>
              <div className="space-y-3">
                <SLAIndicator
                  dueDate={ticket.slaResponseDue}
                  responseTime={ticket.firstResponseAt}
                  isResponse={true}
                />
                <SLAIndicator
                  dueDate={ticket.slaResolutionDue}
                  responseTime={ticket.resolvedAt}
                  isResponse={false}
                />
              </div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </h2>
              <ul className="space-y-2">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-2"
                    >
                      <Paperclip className="h-3 w-3" />
                      {attachment.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
