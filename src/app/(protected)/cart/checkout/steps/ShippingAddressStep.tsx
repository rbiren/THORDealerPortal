'use client'

import { useState } from 'react'
import { type ShippingAddress } from '../page'

type Props = {
  selectedAddress: ShippingAddress | null
  onSelect: (address: ShippingAddress) => void
  onNext: () => void
  onBack: () => void
}

// Mock saved addresses - in real app, these would come from the dealer's profile
const savedAddresses: ShippingAddress[] = [
  {
    id: 'addr-1',
    name: 'Main Warehouse',
    street: '123 Industrial Blvd',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46201',
    country: 'US',
    phone: '(317) 555-0100',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Secondary Location',
    street: '456 Commerce Way',
    street2: 'Suite 200',
    city: 'Fort Wayne',
    state: 'IN',
    zipCode: '46802',
    country: 'US',
    phone: '(260) 555-0200',
  },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

export function ShippingAddressStep({ selectedAddress, onSelect, onNext, onBack }: Props) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSelectSaved(address: ShippingAddress) {
    onSelect(address)
    setShowNewForm(false)
  }

  function handleNewAddressChange(field: keyof ShippingAddress, value: string) {
    setNewAddress((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function validateNewAddress(): boolean {
    const newErrors: Record<string, string> = {}

    if (!newAddress.name.trim()) newErrors.name = 'Name is required'
    if (!newAddress.street.trim()) newErrors.street = 'Street address is required'
    if (!newAddress.city.trim()) newErrors.city = 'City is required'
    if (!newAddress.state) newErrors.state = 'State is required'
    if (!newAddress.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(newAddress.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleUseNewAddress() {
    if (validateNewAddress()) {
      onSelect({ ...newAddress, id: 'new-' + Date.now() })
    }
  }

  function handleContinue() {
    if (!selectedAddress) {
      if (showNewForm) {
        if (validateNewAddress()) {
          onSelect({ ...newAddress, id: 'new-' + Date.now() })
          onNext()
        }
      } else {
        // No address selected
        setErrors({ general: 'Please select or enter a shipping address' })
      }
    } else {
      onNext()
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-heading font-semibold">Shipping Address</h2>
        <p className="text-sm text-medium-gray mt-1">
          Select a saved address or enter a new one
        </p>
      </div>

      <div className="card-body space-y-6">
        {errors.general && (
          <div className="alert-error">{errors.general}</div>
        )}

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && !showNewForm && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-charcoal">Saved Addresses</h3>
            <div className="grid gap-3">
              {savedAddresses.map((address) => (
                <label
                  key={address.id}
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                    selectedAddress?.id === address.id
                      ? 'border-olive bg-success-light'
                      : 'border-light-gray hover:border-olive'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping-address"
                    checked={selectedAddress?.id === address.id}
                    onChange={() => handleSelectSaved(address)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-charcoal">{address.name}</span>
                      {address.isDefault && (
                        <span className="badge badge-success">Default</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-medium-gray">
                      {address.street}
                      {address.street2 && `, ${address.street2}`}
                    </p>
                    <p className="text-sm text-medium-gray">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-medium-gray mt-1">{address.phone}</p>
                    )}
                  </div>
                  {selectedAddress?.id === address.id && (
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

            <button
              onClick={() => setShowNewForm(true)}
              className="text-olive hover:underline text-sm font-medium"
            >
              + Add New Address
            </button>
          </div>
        )}

        {/* New Address Form */}
        {(showNewForm || savedAddresses.length === 0) && (
          <div className="space-y-4">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-charcoal">New Address</h3>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="text-sm text-medium-gray hover:text-charcoal"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Address Name / Label</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => handleNewAddressChange('name', e.target.value)}
                  placeholder="e.g., Main Warehouse"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="label">Street Address</label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => handleNewAddressChange('street', e.target.value)}
                  placeholder="123 Main St"
                  className={`input ${errors.street ? 'input-error' : ''}`}
                />
                {errors.street && <p className="error-text">{errors.street}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="label">Apt, Suite, Unit (optional)</label>
                <input
                  type="text"
                  value={newAddress.street2}
                  onChange={(e) => handleNewAddressChange('street2', e.target.value)}
                  placeholder="Suite 200"
                  className="input"
                />
              </div>

              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => handleNewAddressChange('city', e.target.value)}
                  placeholder="City"
                  className={`input ${errors.city ? 'input-error' : ''}`}
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">State</label>
                  <select
                    value={newAddress.state}
                    onChange={(e) => handleNewAddressChange('state', e.target.value)}
                    className={`select ${errors.state ? 'input-error' : ''}`}
                  >
                    <option value="">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="error-text">{errors.state}</p>}
                </div>

                <div>
                  <label className="label">ZIP Code</label>
                  <input
                    type="text"
                    value={newAddress.zipCode}
                    onChange={(e) => handleNewAddressChange('zipCode', e.target.value)}
                    placeholder="12345"
                    className={`input ${errors.zipCode ? 'input-error' : ''}`}
                  />
                  {errors.zipCode && <p className="error-text">{errors.zipCode}</p>}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="label">Phone (optional)</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => handleNewAddressChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="input"
                />
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <button
                onClick={handleUseNewAddress}
                className="btn-outline"
              >
                Use This Address
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card-footer flex justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedAddress && !showNewForm}
          className="btn-primary px-8 disabled:opacity-50"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
