'use client'

import { type CartItem } from '@/lib/stores/cart'
import { type CheckoutData, type CheckoutStep } from '../page'

type Props = {
  items: CartItem[]
  checkoutData: CheckoutData
  subtotal: number
  isSubmitting: boolean
  onSubmit: () => void
  onBack: () => void
  onEditStep: (step: CheckoutStep) => void
}

export function ReviewConfirmStep({
  items,
  checkoutData,
  subtotal,
  isSubmitting,
  onSubmit,
  onBack,
  onEditStep,
}: Props) {
  const { shippingAddress, paymentMethod, poNumber, notes } = checkoutData

  const taxRate = 0.08
  const tax = subtotal * taxRate
  const shipping = subtotal > 500 ? 0 : 25
  const total = subtotal + tax + shipping

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Order Items</h2>
          <button
            onClick={() => onEditStep('cart')}
            className="text-sm text-olive hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="divide-y divide-light-gray">
          {items.map((item) => (
            <div key={item.productId} className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-light-gray bg-light-beige">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-medium-gray">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{item.name}</p>
                <p className="text-xs text-medium-gray">
                  {item.sku} • Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-charcoal">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Shipping Address</h2>
          <button
            onClick={() => onEditStep('shipping')}
            className="text-sm text-olive hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="card-body">
          {shippingAddress ? (
            <div className="text-sm">
              <p className="font-medium text-charcoal">{shippingAddress.name}</p>
              <p className="text-medium-gray">{shippingAddress.street}</p>
              {shippingAddress.street2 && (
                <p className="text-medium-gray">{shippingAddress.street2}</p>
              )}
              <p className="text-medium-gray">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </p>
              {shippingAddress.phone && (
                <p className="text-medium-gray mt-1">{shippingAddress.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-medium-gray">No address selected</p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold">Payment Method</h2>
          <button
            onClick={() => onEditStep('payment')}
            className="text-sm text-olive hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="card-body">
          {paymentMethod ? (
            <div className="flex items-center gap-3">
              {paymentMethod.type === 'credit_terms' && (
                <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {paymentMethod.type === 'credit_card' && (
                <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {paymentMethod.type === 'ach' && (
                <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
              <div>
                <p className="font-medium text-charcoal">{paymentMethod.label}</p>
                <p className="text-sm text-medium-gray">{paymentMethod.details}</p>
              </div>
            </div>
          ) : (
            <p className="text-medium-gray">No payment method selected</p>
          )}

          {poNumber && (
            <div className="mt-4 pt-4 border-t border-light-gray">
              <p className="text-sm">
                <span className="text-medium-gray">PO Number:</span>{' '}
                <span className="font-medium text-charcoal">{poNumber}</span>
              </p>
            </div>
          )}

          {notes && (
            <div className="mt-4 pt-4 border-t border-light-gray">
              <p className="text-sm text-medium-gray">Order Notes:</p>
              <p className="text-sm text-charcoal mt-1">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Total */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-heading font-semibold">Order Total</h2>
        </div>
        <div className="card-body space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-medium-gray">Subtotal</span>
            <span className="text-charcoal">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-medium-gray">Tax (8%)</span>
            <span className="text-charcoal">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-medium-gray">
              Shipping
              {shipping === 0 && <span className="text-olive ml-1">(Free!)</span>}
            </span>
            <span className="text-charcoal">
              {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="border-t border-light-gray pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-medium text-charcoal">Total</span>
              <span className="text-2xl font-heading font-bold text-charcoal">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-light-beige rounded-lg p-4">
        <p className="text-sm text-medium-gray">
          By placing this order, you agree to our{' '}
          <a href="/terms" className="text-olive hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-olive hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !shippingAddress || !paymentMethod}
          className="btn-primary px-8 py-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : (
            <>
              Place Order - ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
