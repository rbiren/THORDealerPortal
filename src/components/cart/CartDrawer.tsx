'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/stores/cart'
import { CartItemRow } from './CartItemRow'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: Props) {
  const { cart, clearCart, getItemCount, getSubtotal } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const itemCount = mounted ? getItemCount() : 0
  const subtotal = mounted ? getSubtotal() : 0

  return (
    <div className="fixed inset-0 z-modal">
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-light-gray">
              <h2 className="text-lg font-heading font-semibold text-charcoal">
                Shopping Cart
                {itemCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-medium-gray">
                    ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="text-medium-gray hover:text-charcoal transition-colors"
              >
                <span className="sr-only">Close cart</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!mounted ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-6 w-6 border-2 border-olive border-t-transparent rounded-full" />
                </div>
              ) : cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <svg
                    className="h-16 w-16 text-light-gray mb-4"
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
                  <p className="text-medium-gray">Your cart is empty</p>
                  <Link
                    href="/products"
                    onClick={onClose}
                    className="mt-4 text-olive hover:text-olive-800 font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-light-gray">
                  {cart.items.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      compact
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {mounted && cart.items.length > 0 && (
              <div className="border-t border-light-gray px-4 py-4 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-charcoal">Subtotal</span>
                  <span className="text-lg font-heading font-bold text-charcoal">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <p className="text-sm text-medium-gray">
                  Shipping and taxes calculated at checkout.
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    href="/cart/checkout"
                    onClick={onClose}
                    className="btn-primary w-full py-3 text-center"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="btn-outline w-full py-3 text-center"
                  >
                    View Cart
                  </Link>
                </div>

                {/* Clear Cart */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your cart?')) {
                      clearCart()
                    }
                  }}
                  className="text-sm text-medium-gray hover:text-error underline w-full text-center"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
