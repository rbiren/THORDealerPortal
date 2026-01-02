'use client'

import { useState, useEffect, useTransition, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getOrder, getOrderStatusHistory, cancelDealerOrder, reorderItems, ORDER_STATUSES, type OrderStatus } from '../actions'
import { useCartStore } from '@/lib/stores/cart'

type OrderDetail = {
  id: string
  orderNumber: string
  status: string
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  poNumber: string | null
  notes: string | null
  shippingAddress: string | null
  billingAddress: string | null
  items: Array<{
    id: string
    productId: string
    product: {
      id: string
      name: string
      sku: string
      images: string[] | null
    }
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  dealer: {
    id: string
    name: string
    code: string
  }
  statusHistory: Array<{
    status: string
    note: string | null
    createdAt: string
  }>
  submittedAt: string | null
  confirmedAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  createdAt: string
}

type StatusHistoryEntry = {
  status: string
  statusLabel: string
  note: string | null
  changedBy: string | null
  createdAt: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-olive/10 text-olive',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusSteps = ['submitted', 'confirmed', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { addItem } = useCartStore()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadOrder()
  }, [resolvedParams.orderNumber])

  async function loadOrder() {
    setLoading(true)
    try {
      const [orderData, historyData] = await Promise.all([
        getOrder(resolvedParams.orderNumber),
        getOrderStatusHistory(resolvedParams.orderNumber),
      ])
      setOrder(orderData as unknown as OrderDetail)
      setHistory(historyData)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelOrder() {
    if (!order || !cancelReason.trim()) return

    startTransition(async () => {
      const result = await cancelDealerOrder(order.id, cancelReason)
      if (result.success) {
        setMessage({ type: 'success', text: 'Order cancelled successfully' })
        setShowCancelModal(false)
        setCancelReason('')
        loadOrder()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cancel order' })
      }
    })
  }

  async function handleReorder() {
    if (!order) return

    startTransition(async () => {
      const result = await reorderItems(order.id)
      if (result.success && result.items) {
        result.items.forEach((item) => {
          addItem(
            {
              productId: item.productId,
              sku: item.sku,
              name: item.name,
              price: item.price,
              imageUrl: item.image || undefined,
            },
            item.quantity
          )
        })
        setMessage({ type: 'success', text: 'Items added to cart' })
        setTimeout(() => router.push('/cart'), 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add items to cart' })
      }
    })
  }

  function parseAddress(addressJson: string | null) {
    if (!addressJson) return null
    try {
      return JSON.parse(addressJson)
    } catch {
      return null
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getCurrentStepIndex(status: string) {
    if (status === 'cancelled') return -1
    return statusSteps.indexOf(status)
  }

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
        <p className="mt-2 text-medium-gray">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link href="/orders" className="btn-primary mt-4 inline-flex">
          Back to Orders
        </Link>
      </div>
    )
  }

  const shippingAddress = parseAddress(order.shippingAddress)
  const currentStepIndex = getCurrentStepIndex(order.status)
  const canCancel = ['draft', 'submitted', 'confirmed'].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/orders">Orders</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{order.orderNumber}</span>
          </nav>
          <h1 className="page-title">Order {order.orderNumber}</h1>
          {order.poNumber && <p className="page-subtitle">PO: {order.poNumber}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={handleReorder} disabled={isPending} className="btn-outline">
            Reorder
          </button>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={isPending}
              className="btn-ghost text-error hover:bg-error-light"
            >
              Cancel Order
            </button>
          )}
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

      {/* Status Progress */}
      {order.status !== 'cancelled' && (
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-heading font-semibold mb-6">Order Status</h2>
            <div className="relative">
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const isComplete = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                          isComplete
                            ? 'bg-olive text-white'
                            : 'bg-light-gray text-medium-gray'
                        } ${isCurrent ? 'ring-4 ring-olive/20' : ''}`}
                      >
                        {isComplete ? (
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium ${
                          isComplete ? 'text-olive' : 'text-medium-gray'
                        }`}
                      >
                        {ORDER_STATUSES[step as OrderStatus].label}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-light-gray -z-0" style={{ margin: '0 40px' }}>
                <div
                  className="h-full bg-olive transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {order.status === 'cancelled' && (
        <div className="alert-error">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">This order has been cancelled</p>
              {order.cancelledAt && (
                <p className="text-sm">Cancelled on {formatDate(order.cancelledAt)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Order Items</h2>
            </div>
            <div className="divide-y divide-light-gray">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-light-gray bg-light-beige">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-medium-gray">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-medium text-charcoal hover:text-olive"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-medium-gray">{item.product.sku}</p>
                    <div className="mt-2 flex justify-between">
                      <span className="text-sm text-medium-gray">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                      </span>
                      <span className="font-medium text-charcoal">
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Status History</h2>
            </div>
            <div className="card-body">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-light-gray" />
                <ul className="space-y-6">
                  {history.map((entry, index) => (
                    <li key={index} className="relative pl-10">
                      <div
                        className={`absolute left-2 w-4 h-4 rounded-full ${
                          index === 0 ? 'bg-olive' : 'bg-light-gray'
                        }`}
                      />
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[entry.status] || statusColors.draft
                          }`}
                        >
                          {entry.statusLabel}
                        </span>
                        <p className="mt-1 text-sm text-medium-gray">
                          {formatDate(entry.createdAt)}
                        </p>
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

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Order Summary</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Tax</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Shipping</span>
                <span>{order.shippingAmount === 0 ? 'FREE' : `$${order.shippingAmount.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-light-gray pt-4">
                <span>Total</span>
                <span className="text-olive">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Ship To</h2>
              </div>
              <div className="card-body">
                <p className="font-medium">{shippingAddress.name}</p>
                <p className="text-sm text-medium-gray">
                  {shippingAddress.street}
                  {shippingAddress.street2 && <><br />{shippingAddress.street2}</>}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                  <br />
                  {shippingAddress.country}
                </p>
                {shippingAddress.phone && (
                  <p className="text-sm text-medium-gray mt-2">{shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Order Notes</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-medium-gray">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center">
          <div className="modal-backdrop" onClick={() => setShowCancelModal(false)} />
          <div className="modal-content w-full max-w-md mx-4">
            <div className="card-header">
              <h3 className="text-lg font-heading font-semibold">Cancel Order</h3>
            </div>
            <div className="card-body">
              <p className="text-medium-gray mb-4">
                Are you sure you want to cancel order {order.orderNumber}? This action cannot be undone.
              </p>
              <label className="label">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
                className="input w-full"
              />
            </div>
            <div className="card-footer flex justify-end gap-3">
              <button onClick={() => setShowCancelModal(false)} className="btn-ghost">
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || isPending}
                className="btn-primary bg-error hover:bg-error/90 disabled:opacity-50"
              >
                {isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
