'use client'

import Link from 'next/link'
import { type CartItem } from '@/lib/stores/cart'

type Props = {
  items: CartItem[]
  onNext: () => void
}

export function CartReviewStep({ items, onNext }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Review Your Cart</h2>
        <Link href="/cart" className="text-sm text-olive hover:underline">
          Edit Cart
        </Link>
      </div>

      <div className="divide-y divide-light-gray">
        {items.map((item) => (
          <div key={item.productId} className="p-4 flex items-center gap-4">
            {/* Product Image */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-light-gray bg-light-beige">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-medium-gray">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-charcoal">{item.name}</p>
              <p className="text-sm text-medium-gray">{item.sku}</p>
              <p className="text-sm text-medium-gray mt-1">
                ${item.price.toFixed(2)} x {item.quantity}
              </p>
            </div>

            {/* Line Total */}
            <div className="text-right">
              <p className="font-medium text-charcoal">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between mb-4">
          <span className="text-medium-gray">{itemCount} items</span>
          <span className="text-lg font-heading font-bold text-charcoal">
            Subtotal: ${subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end">
          <button onClick={onNext} className="btn-primary px-8">
            Continue to Shipping
          </button>
        </div>
      </div>
    </div>
  )
}
