'use client'

import { type PaymentMethod } from '../page'

type Props = {
  selectedMethod: PaymentMethod | null
  poNumber: string
  notes: string
  onSelect: (method: PaymentMethod) => void
  onUpdatePO: (po: string) => void
  onUpdateNotes: (notes: string) => void
  onNext: () => void
  onBack: () => void
}

// Available payment methods for B2B dealers
const paymentMethods: PaymentMethod[] = [
  {
    type: 'credit_terms',
    label: 'Net 30 Credit Terms',
    details: 'Pay within 30 days of invoice date',
  },
  {
    type: 'credit_card',
    label: 'Credit Card',
    details: 'Pay now with Visa, Mastercard, or American Express',
  },
  {
    type: 'ach',
    label: 'ACH Bank Transfer',
    details: 'Direct bank transfer (2-3 business days)',
  },
]

export function PaymentStep({
  selectedMethod,
  poNumber,
  notes,
  onSelect,
  onUpdatePO,
  onUpdateNotes,
  onNext,
  onBack,
}: Props) {
  function handleContinue() {
    if (selectedMethod) {
      onNext()
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-heading font-semibold">Payment Method</h2>
        <p className="text-sm text-medium-gray mt-1">
          Select how you would like to pay for this order
        </p>
      </div>

      <div className="card-body space-y-6">
        {/* Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label
              key={method.type}
              className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                selectedMethod?.type === method.type
                  ? 'border-olive bg-success-light'
                  : 'border-light-gray hover:border-olive'
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                checked={selectedMethod?.type === method.type}
                onChange={() => onSelect(method)}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  {method.type === 'credit_terms' && (
                    <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {method.type === 'credit_card' && (
                    <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                  {method.type === 'ach' && (
                    <svg className="h-6 w-6 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  <div>
                    <span className="font-medium text-charcoal">{method.label}</span>
                    <p className="text-sm text-medium-gray">{method.details}</p>
                  </div>
                </div>
              </div>
              {selectedMethod?.type === method.type && (
                <div className="ml-3 flex-shrink-0">
                  <svg className="h-6 w-6 text-olive" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </label>
          ))}
        </div>

        {/* Credit Card Form - shown when credit card is selected */}
        {selectedMethod?.type === 'credit_card' && (
          <div className="bg-light-beige rounded-lg p-4">
            <p className="text-sm text-medium-gray mb-4">
              Credit card payment will be processed securely at final confirmation.
            </p>
            <div className="flex items-center gap-2">
              <img src="/images/visa.svg" alt="Visa" className="h-8" />
              <img src="/images/mastercard.svg" alt="Mastercard" className="h-8" />
              <img src="/images/amex.svg" alt="American Express" className="h-8" />
            </div>
          </div>
        )}

        {/* PO Number */}
        <div>
          <label className="label">PO Number (optional)</label>
          <input
            type="text"
            value={poNumber}
            onChange={(e) => onUpdatePO(e.target.value)}
            placeholder="Enter your purchase order number"
            className="input"
          />
          <p className="helper-text">
            This will appear on your order confirmation and invoice
          </p>
        </div>

        {/* Order Notes */}
        <div>
          <label className="label">Order Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Special instructions for this order..."
            rows={3}
            className="input"
          />
        </div>
      </div>

      <div className="card-footer flex justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedMethod}
          className="btn-primary px-8 disabled:opacity-50"
        >
          Review Order
        </button>
      </div>
    </div>
  )
}
