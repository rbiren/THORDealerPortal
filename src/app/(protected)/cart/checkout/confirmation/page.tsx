'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') ?? 'ORD-000000'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center py-12">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-success-light rounded-full flex items-center justify-center mb-6">
          <svg
            className="h-8 w-8 text-olive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-heading font-bold text-charcoal mb-2">
          Order Confirmed!
        </h1>
        <p className="text-medium-gray mb-6">
          Thank you for your order. We&apos;ve received your order and will begin
          processing it shortly.
        </p>

        {/* Order Number */}
        <div className="bg-light-beige rounded-lg p-6 mb-8 inline-block">
          <p className="text-sm text-medium-gray mb-1">Order Number</p>
          <p className="text-xl font-heading font-bold text-charcoal">
            {orderNumber}
          </p>
        </div>

        {/* What's Next */}
        <div className="text-left bg-white border border-light-gray rounded-lg p-6 mb-8">
          <h2 className="font-heading font-semibold text-charcoal mb-4">
            What&apos;s Next?
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-olive/10 rounded-full flex items-center justify-center">
                <span className="text-olive font-semibold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-charcoal">Order Confirmation Email</p>
                <p className="text-sm text-medium-gray">
                  You&apos;ll receive an email confirmation with your order details.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-olive/10 rounded-full flex items-center justify-center">
                <span className="text-olive font-semibold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-charcoal">Order Processing</p>
                <p className="text-sm text-medium-gray">
                  Our team will process your order within 1-2 business days.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-olive/10 rounded-full flex items-center justify-center">
                <span className="text-olive font-semibold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-charcoal">Shipping Notification</p>
                <p className="text-sm text-medium-gray">
                  You&apos;ll be notified when your order ships with tracking information.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/orders/${orderNumber}`} className="btn-primary px-6">
            View Order Details
          </Link>
          <Link href="/products" className="btn-outline px-6">
            Continue Shopping
          </Link>
        </div>

        {/* Support */}
        <p className="text-sm text-medium-gray mt-8">
          Questions about your order?{' '}
          <Link href="/support" className="text-olive hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
