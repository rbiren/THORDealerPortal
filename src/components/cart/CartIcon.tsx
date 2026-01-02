'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartItemCount } from '@/lib/stores/cart'

type Props = {
  onClick?: () => void
  showLink?: boolean
}

export function CartIcon({ onClick, showLink = true }: Props) {
  const itemCount = useCartItemCount()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const content = (
    <div className="relative cursor-pointer">
      <svg
        className="h-6 w-6 text-charcoal hover:text-olive transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {mounted && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold text-white bg-burnt-orange rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="focus:outline-none">
        {content}
      </button>
    )
  }

  if (showLink) {
    return <Link href="/cart">{content}</Link>
  }

  return content
}
