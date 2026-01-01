'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart'
import { CartReviewStep } from './steps/CartReviewStep'
import { ShippingAddressStep } from './steps/ShippingAddressStep'
import { PaymentStep } from './steps/PaymentStep'
import { ReviewConfirmStep } from './steps/ReviewConfirmStep'

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'review'

export type ShippingAddress = {
  id?: string
  name: string
  street: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault?: boolean
}

export type PaymentMethod = {
  type: 'credit_terms' | 'credit_card' | 'ach'
  label: string
  details?: string
}

export type CheckoutData = {
  shippingAddress: ShippingAddress | null
  billingAddress: ShippingAddress | null
  sameAsBilling: boolean
  paymentMethod: PaymentMethod | null
  poNumber: string
  notes: string
}

const steps: { id: CheckoutStep; label: string; shortLabel: string }[] = [
  { id: 'cart', label: 'Review Cart', shortLabel: 'Cart' },
  { id: 'shipping', label: 'Shipping Address', shortLabel: 'Shipping' },
  { id: 'payment', label: 'Payment Method', shortLabel: 'Payment' },
  { id: 'review', label: 'Review & Confirm', shortLabel: 'Confirm' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getItemCount, getSubtotal, clearCart } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart')
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    shippingAddress: null,
    billingAddress: null,
    sameAsBilling: true,
    paymentMethod: null,
    poNumber: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? getItemCount() : 0
  const subtotal = mounted ? getSubtotal() : 0

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && itemCount === 0) {
      router.push('/cart')
    }
  }, [mounted, itemCount, router])

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  function goToStep(step: CheckoutStep) {
    const targetIndex = steps.findIndex((s) => s.id === step)
    // Only allow going to previous steps or the next step if current is complete
    if (targetIndex <= currentStepIndex) {
      setCurrentStep(step)
    }
  }

  function nextStep() {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  function prevStep() {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  function updateCheckoutData(updates: Partial<CheckoutData>) {
    setCheckoutData((prev) => ({ ...prev, ...updates }))
  }

  async function handleSubmitOrder() {
    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Call order creation API
      // For now, simulate order creation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Clear cart and redirect to confirmation
      clearCart()
      router.push('/cart/checkout/confirmation?order=ORD-' + Date.now())
    } catch (err) {
      setError('Failed to submit order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-olive border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/cart">Cart</Link>
          <span className="breadcrumb-separator">/</span>
          <span>Checkout</span>
        </nav>
        <h1 className="page-title">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <div className="card-body">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => {
                const isComplete = index < currentStepIndex
                const isCurrent = step.id === currentStep

                return (
                  <li
                    key={step.id}
                    className={`relative ${
                      index !== steps.length - 1 ? 'flex-1 pr-8' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => goToStep(step.id)}
                        disabled={index > currentStepIndex}
                        className={`relative flex h-10 w-10 items-center justify-center rounded-full font-heading font-semibold text-sm transition-colors ${
                          isComplete
                            ? 'bg-olive text-white hover:bg-olive-800'
                            : isCurrent
                            ? 'border-2 border-olive bg-white text-olive'
                            : 'border-2 border-light-gray bg-white text-medium-gray'
                        } ${index > currentStepIndex ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isComplete ? (
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </button>

                      <span
                        className={`ml-3 text-sm font-medium hidden sm:block ${
                          isCurrent ? 'text-olive' : isComplete ? 'text-charcoal' : 'text-medium-gray'
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Connector line */}
                      {index !== steps.length - 1 && (
                        <div
                          className={`absolute top-5 left-10 -ml-px h-0.5 w-full ${
                            isComplete ? 'bg-olive' : 'bg-light-gray'
                          }`}
                          style={{ width: 'calc(100% - 2.5rem)' }}
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentStep === 'cart' && (
            <CartReviewStep
              items={cart.items}
              onNext={nextStep}
            />
          )}

          {currentStep === 'shipping' && (
            <ShippingAddressStep
              selectedAddress={checkoutData.shippingAddress}
              onSelect={(address) => updateCheckoutData({ shippingAddress: address })}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentStep
              selectedMethod={checkoutData.paymentMethod}
              poNumber={checkoutData.poNumber}
              notes={checkoutData.notes}
              onSelect={(method) => updateCheckoutData({ paymentMethod: method })}
              onUpdatePO={(po) => updateCheckoutData({ poNumber: po })}
              onUpdateNotes={(notes) => updateCheckoutData({ notes })}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'review' && (
            <ReviewConfirmStep
              items={cart.items}
              checkoutData={checkoutData}
              subtotal={subtotal}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmitOrder}
              onBack={prevStep}
              onEditStep={goToStep}
            />
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="card sticky top-4">
            <div className="card-header">
              <h2 className="text-lg font-heading font-semibold">Order Summary</h2>
            </div>
            <div className="card-body space-y-4">
              {/* Items Summary */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-medium-gray truncate flex-1 mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-charcoal font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-light-gray pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">Subtotal ({itemCount} items)</span>
                  <span className="text-charcoal">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">Estimated Tax</span>
                  <span className="text-charcoal">${(subtotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-medium-gray">Shipping</span>
                  <span className="text-charcoal">
                    {subtotal > 500 ? 'FREE' : '$25.00'}
                  </span>
                </div>
              </div>

              <div className="border-t border-light-gray pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-medium">Estimated Total</span>
                  <span className="text-xl font-heading font-bold text-charcoal">
                    ${(subtotal + subtotal * 0.08 + (subtotal > 500 ? 0 : 25)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Secure Checkout Badge */}
              <div className="flex items-center justify-center gap-2 pt-4 text-sm text-medium-gray">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
