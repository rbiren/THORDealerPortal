'use client'

import { useState } from 'react'
import { useCartStore, useIsInCart } from '@/lib/stores/cart'

type Props = {
  product: {
    id: string
    sku: string
    name: string
    price: number
    imageUrl?: string
    maxQuantity?: number
  }
  className?: string
  showQuantity?: boolean
}

export function AddToCartButton({ product, className = '', showQuantity = true }: Props) {
  const { addItem, getItem, updateQuantity } = useCartStore()
  const isInCart = useIsInCart(product.id)
  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  const cartItem = getItem(product.id)
  const cartQuantity = cartItem?.quantity ?? 0
  const remaining = product.maxQuantity
    ? product.maxQuantity - cartQuantity
    : undefined

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        maxQuantity: product.maxQuantity,
      },
      quantity
    )

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
    setQuantity(1)
  }

  function handleUpdateQuantity(newQty: number) {
    if (newQty <= 0) {
      updateQuantity(product.id, 0)
    } else {
      updateQuantity(product.id, newQty)
    }
  }

  const isDisabled = product.maxQuantity !== undefined && cartQuantity >= product.maxQuantity

  if (isInCart && !showQuantity) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-olive font-medium">In Cart ({cartQuantity})</span>
      </div>
    )
  }

  if (isInCart && showQuantity) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center border border-light-gray rounded-md">
          <button
            onClick={() => handleUpdateQuantity(cartQuantity - 1)}
            className="h-10 w-10 flex items-center justify-center text-medium-gray hover:bg-light-beige"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-12 text-center font-medium">{cartQuantity}</span>
          <button
            onClick={() => handleUpdateQuantity(cartQuantity + 1)}
            disabled={isDisabled}
            className="h-10 w-10 flex items-center justify-center text-medium-gray hover:bg-light-beige disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {remaining !== undefined && remaining > 0 && remaining <= 10 && (
          <span className="text-sm text-burnt-orange">{remaining} left</span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showQuantity && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-medium-gray">Qty:</label>
          <div className="flex items-center border border-light-gray rounded-md">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 flex items-center justify-center text-medium-gray hover:bg-light-beige"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={remaining}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (!isNaN(val) && val > 0) {
                  setQuantity(remaining !== undefined ? Math.min(val, remaining) : val)
                }
              }}
              className="w-12 text-center border-0 focus:ring-0 text-sm"
            />
            <button
              onClick={() =>
                setQuantity((q) => (remaining !== undefined ? Math.min(q + 1, remaining) : q + 1))
              }
              disabled={remaining !== undefined && quantity >= remaining}
              className="h-8 w-8 flex items-center justify-center text-medium-gray hover:bg-light-beige disabled:opacity-50"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={isDisabled || (remaining !== undefined && remaining === 0)}
        className={`btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          showSuccess ? 'bg-olive hover:bg-olive' : ''
        }`}
      >
        {showSuccess ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added!
          </>
        ) : remaining !== undefined && remaining === 0 ? (
          'Out of Stock'
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Add to Cart
          </>
        )}
      </button>
    </div>
  )
}
