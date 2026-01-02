'use client'

import { useState, useEffect, useTransition, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  getAdminOrderDetail,
  updateOrderItem,
  removeOrderItem,
  addOrderNote,
  deleteOrderNote,
  bulkUpdateOrderStatus,
  ADMIN_ORDER_STATUSES,
  type AdminOrderStatus,
} from '../actions'
import { createInvoiceFromOrder } from '@/lib/services/invoice'

type OrderDetail = {
  id: string
  orderNumber: string
  status: string
  statusLabel: string
  availableActions: string[]
  poNumber: string | null
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: Record<string, string> | null
  billingAddress: Record<string, string> | null
  orderNotes: string | null
  dealer: { id: string; name: string; code: string; tier: string }
  items: Array<{
    id: string
    productId: string
    productName: string
    productSku: string
    currentPrice: number
    quantity: number
    unitPrice: number
    totalPrice: number
    image: string | null
  }>
  statusHistory: Array<{
    status: string
    statusLabel: string
    note: string | null
    changedBy: string | null
    createdAt: string
  }>
  notes: Array<{
    id: string
    content: string
    isInternal: boolean
    authorName: string
    authorId: string
    createdAt: string
  }>
  createdAt: string
  submittedAt: string | null
}

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  olive: 'bg-olive/10 text-olive',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [newNote, setNewNote] = useState('')
  const [noteIsInternal, setNoteIsInternal] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [resolvedParams.orderId])

  async function loadOrder() {
    setLoading(true)
    try {
      const data = await getAdminOrderDetail(resolvedParams.orderId)
      setOrder(data as OrderDetail)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: AdminOrderStatus) {
    if (!order) return

    startTransition(async () => {
      const result = await bulkUpdateOrderStatus([order.id], newStatus)
      if (result.success) {
        setMessage({ type: 'success', text: `Order status updated to ${ADMIN_ORDER_STATUSES[newStatus].label}` })
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.errors[0] || 'Failed to update status' })
      }
    })
  }

  async function handleCreateInvoice() {
    if (!order) return

    startTransition(async () => {
      const result = await createInvoiceFromOrder(order.id)
      if (result.success) {
        setMessage({ type: 'success', text: 'Invoice created successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create invoice' })
      }
    })
  }

  function startEditingItem(item: OrderDetail['items'][0]) {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
    setEditPrice(item.unitPrice)
  }

  async function saveItemEdit() {
    if (!order || !editingItem) return

    startTransition(async () => {
      const result = await updateOrderItem(order.id, editingItem, editQuantity, editPrice)
      if (result.success) {
        setMessage({ type: 'success', text: 'Item updated successfully' })
        setEditingItem(null)
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update item' })
      }
    })
  }

  async function handleRemoveItem(itemId: string) {
    if (!order) return
    if (!confirm('Are you sure you want to remove this item?')) return

    startTransition(async () => {
      const result = await removeOrderItem(order.id, itemId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Item removed successfully' })
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove item' })
      }
    })
  }

  async function handleAddNote() {
    if (!order || !newNote.trim()) return

    startTransition(async () => {
      // TODO: Get actual user ID from session
      const result = await addOrderNote(order.id, newNote, 'admin-user', noteIsInternal)
      if (result.success) {
        setMessage({ type: 'success', text: 'Note added successfully' })
        setNewNote('')
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add note' })
      }
    })
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return

    startTransition(async () => {
      const result = await deleteOrderNote(noteId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Note deleted' })
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete note' })
      }
    })
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const canEdit = order && ['draft', 'submitted', 'confirmed'].includes(order.status)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-heading font-semibold text-charcoal">Order not found</h2>
        <Link href="/admin/orders" className="btn-primary mt-4 inline-flex">
          Back to Orders
        </Link>
      </div>
    )
  }

  const statusConfig = ADMIN_ORDER_STATUSES[order.status as AdminOrderStatus]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/admin">Admin</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/admin/orders">Orders</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{order.orderNumber}</span>
          </nav>
          <h1 className="page-title">Order {order.orderNumber}</h1>
          <p className="page-subtitle">
            {order.dealer.name} ({order.dealer.code})
          </p>
        </div>
        <div className="flex gap-3">
          {order.availableActions.includes('confirm') && (
            <button
              onClick={() => handleStatusChange('confirmed')}
              disabled={isPending}
              className="btn-primary"
            >
              Confirm Order
            </button>
          )}
          {order.availableActions.includes('process') && (
            <button
              onClick={() => handleStatusChange('processing')}
              disabled={isPending}
              className="btn-primary"
            >
              Start Processing
            </button>
          )}
          {order.availableActions.includes('ship') && (
            <button
              onClick={() => handleStatusChange('shipped')}
              disabled={isPending}
              className="btn-primary"
            >
              Mark Shipped
            </button>
          )}
          {order.availableActions.includes('deliver') && (
            <button
              onClick={() => handleStatusChange('delivered')}
              disabled={isPending}
              className="btn-primary"
            >
              Mark Delivered
            </button>
          )}
          {order.availableActions.includes('cancel') && (
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={isPending}
              className="btn-ghost text-error"
            >
              Cancel Order
            </button>
          )}
          <button onClick={handleCreateInvoice} disabled={isPending} className="btn-outline">
            Create Invoice
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[statusConfig?.color || 'gray']
                  }`}
                >
                  {order.statusLabel}
                </span>
                <span className="text-sm text-medium-gray">
                  Created: {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-medium-gray uppercase">Order Number</p>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">PO Number</p>
                  <p className="font-medium">{order.poNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">Dealer</p>
                  <Link href={`/admin/dealers/${order.dealer.id}`} className="font-medium text-olive hover:underline">
                    {order.dealer.code}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-medium-gray uppercase">Submitted</p>
                  <p className="font-medium">
                    {order.submittedAt ? formatDate(order.submittedAt) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold">Order Items</h2>
              {canEdit && (
                <span className="text-sm text-medium-gray">Click item to edit</span>
              )}
            </div>
            <div className="divide-y divide-light-gray">
              {order.items.map((item) => (
                <div key={item.id} className="p-4">
                  {editingItem === item.id ? (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-light-gray bg-light-beige">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.productName}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-medium-gray">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-medium-gray">{item.productSku}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="label">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="input w-full"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem(null)} className="btn-ghost btn-sm">
                          Cancel
                        </button>
                        <button onClick={saveItemEdit} disabled={isPending} className="btn-primary btn-sm">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`flex gap-4 ${canEdit ? 'cursor-pointer hover:bg-light-beige/50 -m-4 p-4 rounded-lg' : ''}`}
                      onClick={() => canEdit && startEditingItem(item)}
                    >
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-light-gray bg-light-beige">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-medium-gray">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-charcoal">{item.productName}</p>
                        <p className="text-sm text-medium-gray">{item.productSku}</p>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-sm text-medium-gray">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </span>
                          <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        {item.unitPrice !== item.currentPrice && (
                          <p className="text-xs text-burnt-orange mt-1">
                            Current price: {formatCurrency(item.currentPrice)}
                          </p>
                        )}
                      </div>
                      {canEdit && order.items.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveItem(item.id)
                          }}
                          className="text-error hover:text-error/80"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Order Notes</h2>
            </div>
            <div className="card-body">
              {/* Add Note Form */}
              <div className="space-y-3 mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="input w-full"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={noteIsInternal}
                      onChange={(e) => setNoteIsInternal(e.target.checked)}
                      className="rounded border-medium-gray"
                    />
                    <span className="text-sm text-medium-gray">Internal note (hidden from dealer)</span>
                  </label>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isPending}
                    className="btn-primary btn-sm"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              {order.notes.length === 0 ? (
                <p className="text-center text-medium-gray py-4">No notes yet</p>
              ) : (
                <div className="space-y-4">
                  {order.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg ${
                        note.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-light-beige'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-charcoal">{note.authorName}</span>
                            {note.isInternal && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                Internal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-medium-gray">{formatDate(note.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-medium-gray hover:text-error"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-charcoal whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Status History</h2>
            </div>
            <div className="card-body">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-light-gray" />
                <ul className="space-y-6">
                  {order.statusHistory.map((entry, index) => (
                    <li key={index} className="relative pl-10">
                      <div
                        className={`absolute left-2 w-4 h-4 rounded-full ${
                          index === 0 ? 'bg-olive' : 'bg-light-gray'
                        }`}
                      />
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[ADMIN_ORDER_STATUSES[entry.status as AdminOrderStatus]?.color || 'gray']
                          }`}
                        >
                          {entry.statusLabel}
                        </span>
                        <p className="mt-1 text-sm text-medium-gray">{formatDate(entry.createdAt)}</p>
                        {entry.note && (
                          <p className="mt-1 text-sm text-charcoal">{entry.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Order Summary</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Shipping</span>
                <span>{order.shippingAmount === 0 ? 'FREE' : formatCurrency(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-light-gray pt-4">
                <span>Total</span>
                <span className="text-olive">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Ship To</h2>
              </div>
              <div className="card-body">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-sm text-medium-gray">
                  {order.shippingAddress.street}
                  {order.shippingAddress.street2 && <><br />{order.shippingAddress.street2}</>}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          )}

          {/* Customer Notes */}
          {order.orderNotes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Customer Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-medium-gray">{order.orderNotes}</p>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Quick Links</h2>
            </div>
            <div className="card-body space-y-2">
              <Link
                href={`/admin/dealers/${order.dealer.id}`}
                className="flex items-center gap-2 text-olive hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                View Dealer Profile
              </Link>
              <Link
                href={`/orders/${order.orderNumber}`}
                className="flex items-center gap-2 text-olive hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View as Dealer
              </Link>
              <Link
                href={`/invoices?order=${order.orderNumber}`}
                className="flex items-center gap-2 text-olive hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
