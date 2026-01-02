'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type NotificationDisplay = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: Date | null
  createdAt: Date
  icon: string
  color: string
  typeLabel: string
  relativeTime: string
}

type GroupedNotifications = {
  today: NotificationDisplay[]
  yesterday: NotificationDisplay[]
  thisWeek: NotificationDisplay[]
  older: NotificationDisplay[]
}

// Mock data for demonstration
const mockNotifications: NotificationDisplay[] = [
  {
    id: '1',
    type: 'order_shipped',
    title: 'Order ORD-2026-001 Shipped',
    body: 'Your order has been shipped and is on its way.',
    data: { orderNumber: 'ORD-2026-001' },
    readAt: null,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    icon: 'truck',
    color: 'purple',
    typeLabel: 'Order Shipped',
    relativeTime: '1h ago',
  },
  {
    id: '2',
    type: 'invoice_created',
    title: 'Invoice INV-2026-001 Created',
    body: 'A new invoice for $1,234.56 has been generated.',
    data: { invoiceNumber: 'INV-2026-001' },
    readAt: null,
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    icon: 'document',
    color: 'blue',
    typeLabel: 'New Invoice',
    relativeTime: '2h ago',
  },
  {
    id: '3',
    type: 'low_stock',
    title: 'Low Stock Alert',
    body: 'Product SKU-001 has only 5 units remaining.',
    data: { productSku: 'SKU-001', quantity: 5 },
    readAt: new Date(),
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    icon: 'alert-triangle',
    color: 'orange',
    typeLabel: 'Low Stock',
    relativeTime: '1d ago',
  },
]

// Icon component
function NotificationIcon({ type, color }: { type: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-100',
    green: 'text-green-500 bg-green-100',
    purple: 'text-purple-500 bg-purple-100',
    orange: 'text-orange-500 bg-orange-100',
    red: 'text-red-500 bg-red-100',
    yellow: 'text-yellow-500 bg-yellow-100',
    gray: 'text-gray-500 bg-gray-100',
    olive: 'text-olive bg-olive/10',
  }

  const iconPaths: Record<string, string> = {
    'shopping-cart':
      'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    truck:
      'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'alert-triangle':
      'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    'alert-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    document:
      'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  }

  return (
    <div className={`p-2 rounded-full ${colorClasses[color] || 'text-gray-500 bg-gray-100'}`}>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d={iconPaths[type] || iconPaths.bell}
        />
      </svg>
    </div>
  )
}

// Notification group component
function NotificationGroup({
  title,
  notifications,
  onMarkAsRead,
  onDelete,
}: {
  title: string
  notifications: NotificationDisplay[]
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (notifications.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-lg border p-4 flex items-start gap-4 ${
              !notification.readAt ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <NotificationIcon type={notification.icon} color={notification.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm ${!notification.readAt ? 'font-medium' : ''}`}>
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{notification.body}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {notification.relativeTime}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                  {notification.typeLabel}
                </span>
                {!notification.readAt && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-xs text-olive hover:underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // In a real implementation, this would fetch from the server
    setNotifications(mockNotifications)
  }, [])

  // Group notifications by date
  const groupNotifications = (): GroupedNotifications => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)

    const filteredNotifications = notifications.filter((n) => {
      if (filter === 'unread' && n.readAt) return false
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      return true
    })

    const grouped: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    }

    for (const notification of filteredNotifications) {
      const notificationDate = new Date(notification.createdAt)

      if (notificationDate >= today) {
        grouped.today.push(notification)
      } else if (notificationDate >= yesterday) {
        grouped.yesterday.push(notification)
      } else if (notificationDate >= weekAgo) {
        grouped.thisWeek.push(notification)
      } else {
        grouped.older.push(notification)
      }
    }

    return grouped
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const grouped = groupNotifications()
  const totalFiltered =
    grouped.today.length + grouped.yesterday.length + grouped.thisWeek.length + grouped.older.length

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm bg-olive text-white rounded-lg hover:bg-olive/90"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            <option value="order_update">Order Updates</option>
            <option value="order_shipped">Order Shipped</option>
            <option value="order_delivered">Order Delivered</option>
            <option value="low_stock">Low Stock</option>
            <option value="invoice_created">Invoices</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>

        <Link
          href="/notifications/preferences"
          className="ml-auto text-sm text-olive hover:underline flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Preferences
        </Link>
      </div>

      {/* Notification List */}
      {totalFiltered === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <svg
            className="h-16 w-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? "You've read all your notifications."
              : "You don't have any notifications yet."}
          </p>
        </div>
      ) : (
        <>
          <NotificationGroup
            title="Today"
            notifications={grouped.today}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
          <NotificationGroup
            title="Yesterday"
            notifications={grouped.yesterday}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
          <NotificationGroup
            title="This Week"
            notifications={grouped.thisWeek}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
          <NotificationGroup
            title="Older"
            notifications={grouped.older}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
