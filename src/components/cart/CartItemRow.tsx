'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore, type CartItem } from '@/lib/stores/cart'

type Props = {
  item: CartItem
  compact?: boolean
}

export function CartItemRow({ item, compact = false }: Props) {
  const { updateQuantity, removeItem } = useCartStore()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.productId)
    } else {
      updateQuantity(item.productId, newQuantity)
    }
  }

  const lineTotal = item.price * item.quantity

  if (compact) {
    return (
      <li className="py-4 flex items-start gap-4">
        {/* Product Image */}
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-light-gray bg-light-beige">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={64}
              height={64}
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
          <Link
            href={`/products/${item.productId}`}
            className="text-sm font-medium text-charcoal hover:text-olive line-clamp-2"
          >
            {item.name}
          </Link>
          <p className="mt-0.5 text-xs text-medium-gray">{item.sku}</p>

          <div className="mt-2 flex items-center justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                className="h-6 w-6 flex items-center justify-center rounded border border-light-gray text-medium-gray hover:bg-light-beige"
              >
                <span className="sr-only">Decrease quantity</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                className="h-6 w-6 flex items-center justify-center rounded border border-light-gray text-medium-gray hover:bg-light-beige disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Increase quantity</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.productId)}
              className="text-xs text-medium-gray hover:text-error"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-sm font-medium text-charcoal">${lineTotal.toFixed(2)}</p>
          <p className="text-xs text-medium-gray">${item.price.toFixed(2)} each</p>
        </div>
      </li>
    )
  }

  // Full cart page layout
  return (
    <tr className="border-b border-light-gray">
      <td className="py-4">
        <div className="flex items-center gap-4">
          {/* Product Image */}
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-light-gray bg-light-beige">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={80}
                height={80}
                className="h-full w-full object-cover object-center"
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

          {/* Product Info */}
          <div>
            <Link
              href={`/products/${item.productId}`}
              className="font-medium text-charcoal hover:text-olive"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-sm text-medium-gray">{item.sku}</p>
            {item.maxQuantity !== undefined && (
              <p className="mt-1 text-xs text-medium-gray">
                {item.maxQuantity} available
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 text-center">
        <span className="text-charcoal">${item.price.toFixed(2)}</span>
      </td>

      <td className="py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="h-8 w-8 flex items-center justify-center rounded border border-light-gray text-medium-gray hover:bg-light-beige"
          >
            <span className="sr-only">Decrease quantity</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <input
            type="number"
            min="1"
            max={item.maxQuantity}
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (!isNaN(val) && val > 0) {
                handleQuantityChange(val)
              }
            }}
            className="w-16 text-center border border-light-gray rounded py-1 text-sm"
          />

          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
            className="h-8 w-8 flex items-center justify-center rounded border border-light-gray text-medium-gray hover:bg-light-beige disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Increase quantity</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </td>

      <td className="py-4 text-right">
        <span className="font-medium text-charcoal">${lineTotal.toFixed(2)}</span>
      </td>

      <td className="py-4 text-right">
        <button
          onClick={() => removeItem(item.productId)}
          className="text-medium-gray hover:text-error"
        >
          <span className="sr-only">Remove</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </td>
    </tr>
  )
}
