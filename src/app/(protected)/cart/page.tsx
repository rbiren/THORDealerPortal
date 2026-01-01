'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/stores/cart'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { validateCart, saveCurrentCart, getSavedCarts, restoreSavedCart, type SavedCartSummary } from './actions'

export default function CartPage() {
  const { cart, clearCart, getItemCount, getSubtotal } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savedCarts, setSavedCarts] = useState<SavedCartSummary[]>([])
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? getItemCount() : 0
  const subtotal = mounted ? getSubtotal() : 0

  // Estimated values (would be calculated based on dealer settings)
  const taxRate = 0.08 // 8%
  const estimatedTax = subtotal * taxRate
  const shippingEstimate = subtotal > 500 ? 0 : 25 // Free shipping over $500
  const estimatedTotal = subtotal + estimatedTax + shippingEstimate

  async function handleValidate() {
    if (!cart.id) return

    startTransition(async () => {
      const result = await validateCart(cart.id!)
      if (!result.isValid) {
        setValidationIssues(result.issues.map((i) => i.message))
      } else {
        setValidationIssues([])
        setMessage({ type: 'success', text: 'Cart validated - ready for checkout!' })
      }
    })
  }

  async function handleSaveCart() {
    if (!cart.id || !saveName.trim()) return

    startTransition(async () => {
      const result = await saveCurrentCart(cart.id!, saveName.trim())
      if (result.success) {
        setMessage({ type: 'success', text: 'Cart saved successfully!' })
        setShowSaveModal(false)
        setSaveName('')
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  async function loadSavedCarts() {
    // In real app, get dealerId from session
    const dealerId = cart.dealerId
    if (!dealerId) return

    const carts = await getSavedCarts(dealerId)
    setSavedCarts(carts)
  }

  async function handleRestoreCart(savedCartId: string) {
    const dealerId = cart.dealerId
    if (!dealerId) return

    startTransition(async () => {
      const result = await restoreSavedCart(savedCartId, dealerId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Cart restored!' })
        // Refresh page to sync with restored cart
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    })
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <nav className="breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Cart</span>
          </nav>
          <h1 className="page-title">Shopping Cart</h1>
          {itemCount > 0 && (
            <p className="page-subtitle">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>
        {itemCount > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-outline"
            >
              Save Cart
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all items from your cart?')) {
                  clearCart()
                }
              }}
              className="btn-ghost text-error hover:bg-error-light"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="alert-warning">
          <p className="font-medium mb-2">Some items have issues:</p>
          <ul className="list-disc list-inside space-y-1">
            {validationIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {itemCount === 0 ? (
        /* Empty Cart */
        <div className="card">
          <div className="card-body py-16 text-center">
            <svg
              className="mx-auto h-24 w-24 text-light-gray"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-heading font-semibold text-charcoal">
              Your cart is empty
            </h3>
            <p className="mt-2 text-medium-gray">
              Start adding products to build your order.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/products" className="btn-primary">
                Browse Products
              </Link>
              <button
                onClick={loadSavedCarts}
                className="btn-outline"
              >
                Load Saved Cart
              </button>
            </div>

            {/* Saved Carts List */}
            {savedCarts.length > 0 && (
              <div className="mt-8 text-left max-w-md mx-auto">
                <h4 className="font-medium text-charcoal mb-3">Saved Carts</h4>
                <ul className="divide-y divide-light-gray border border-light-gray rounded-lg">
                  {savedCarts.map((saved) => (
                    <li key={saved.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{saved.name}</p>
                        <p className="text-sm text-medium-gray">
                          {saved.itemCount} items - ${saved.subtotal.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreCart(saved.id)}
                        disabled={isPending}
                        className="btn-primary btn-sm"
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Cart Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-beige">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-heading font-semibold text-charcoal uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-heading font-semibold text-charcoal uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-heading font-semibold text-charcoal uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => (
                      <CartItemRow key={item.productId} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-4">
              <Link
                href="/products"
                className="text-olive hover:text-olive-800 font-medium inline-flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="card sticky top-4">
              <div className="card-header">
                <h2 className="text-lg font-heading font-semibold">Order Summary</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">Subtotal</span>
                  <span className="text-charcoal">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">Estimated Tax (8%)</span>
                  <span className="text-charcoal">${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">
                    Shipping
                    {shippingEstimate === 0 && (
                      <span className="text-olive ml-1">(Free!)</span>
                    )}
                  </span>
                  <span className="text-charcoal">
                    {shippingEstimate === 0 ? 'FREE' : `$${shippingEstimate.toFixed(2)}`}
                  </span>
                </div>

                {subtotal < 500 && (
                  <div className="bg-success-light rounded-lg p-3 text-sm text-olive-800">
                    Add ${(500 - subtotal).toFixed(2)} more for free shipping!
                  </div>
                )}

                <div className="border-t border-light-gray pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-charcoal">Estimated Total</span>
                    <span className="text-xl font-heading font-bold text-charcoal">
                      ${estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleValidate}
                    disabled={isPending}
                    className="btn-outline w-full"
                  >
                    {isPending ? 'Validating...' : 'Validate Cart'}
                  </button>
                  <Link
                    href="/cart/checkout"
                    className="btn-primary w-full py-3 text-center block"
                  >
                    Proceed to Checkout
                  </Link>
                </div>

                <p className="text-xs text-medium-gray text-center">
                  Final totals will be calculated at checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Cart Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-modal flex items-center justify-center">
          <div className="modal-backdrop" onClick={() => setShowSaveModal(false)} />
          <div className="modal-content w-full max-w-sm mx-4">
            <div className="card-header">
              <h3 className="text-lg font-heading font-semibold">Save Cart</h3>
            </div>
            <div className="card-body">
              <label className="label">Cart Name</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Monthly Order"
                className="input"
                autoFocus
              />
            </div>
            <div className="card-footer flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCart}
                disabled={!saveName.trim() || isPending}
                className="btn-primary disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
