'use client'

import { useState } from 'react'
import { useOnboarding } from './OnboardingContext'
import {
  onboardingContactSchema,
  onboardingAddressSchema,
  type OnboardingContactInput,
  type OnboardingAddressInput,
} from '@/lib/validations/dealer'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

type ContactFormData = {
  name: string
  email: string
  phone: string
  type: 'primary' | 'billing' | 'sales' | 'support' | 'technical'
  isPrimary: boolean
}

type AddressFormData = {
  type: 'billing' | 'shipping' | 'both'
  street: string
  street2: string
  city: string
  state: string
  zipCode: string
  country: string
  isPrimary: boolean
}

const defaultContact: ContactFormData = {
  name: '',
  email: '',
  phone: '',
  type: 'primary',
  isPrimary: true,
}

const defaultAddress: AddressFormData = {
  type: 'billing',
  street: '',
  street2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'USA',
  isPrimary: true,
}

export function Step3Contacts() {
  const { data, updateStep3, nextStep, prevStep } = useOnboarding()
  const [errors, setErrors] = useState<{
    contacts: Record<number, Record<string, string>>
    addresses: Record<number, Record<string, string>>
    general?: string
  }>({ contacts: {}, addresses: {} })

  const [contacts, setContacts] = useState<ContactFormData[]>(
    data.step3.contacts.length > 0
      ? data.step3.contacts.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          type: c.type,
          isPrimary: c.isPrimary,
        }))
      : [{ ...defaultContact }]
  )

  const [addresses, setAddresses] = useState<AddressFormData[]>(
    data.step3.addresses.length > 0
      ? data.step3.addresses.map((a) => ({
          type: a.type,
          street: a.street,
          street2: a.street2 || '',
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          country: a.country,
          isPrimary: a.isPrimary,
        }))
      : [{ ...defaultAddress }]
  )

  const addContact = () => {
    setContacts([...contacts, { ...defaultContact, isPrimary: false }])
  }

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const newContacts = contacts.filter((_, i) => i !== index)
      if (!newContacts.some((c) => c.isPrimary) && newContacts.length > 0) {
        newContacts[0].isPrimary = true
      }
      setContacts(newContacts)
    }
  }

  const updateContact = (index: number, field: keyof ContactFormData, value: string | boolean) => {
    const newContacts = [...contacts]
    if (field === 'isPrimary' && value === true) {
      newContacts.forEach((c) => (c.isPrimary = false))
    }
    newContacts[index] = { ...newContacts[index], [field]: value }
    setContacts(newContacts)
    setErrors((prev) => ({
      ...prev,
      contacts: { ...prev.contacts, [index]: {} },
    }))
  }

  const addAddress = () => {
    setAddresses([...addresses, { ...defaultAddress, isPrimary: false }])
  }

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index)
      if (!newAddresses.some((a) => a.isPrimary) && newAddresses.length > 0) {
        newAddresses[0].isPrimary = true
      }
      setAddresses(newAddresses)
    }
  }

  const updateAddress = (index: number, field: keyof AddressFormData, value: string | boolean) => {
    const newAddresses = [...addresses]
    if (field === 'isPrimary' && value === true) {
      newAddresses.forEach((a) => (a.isPrimary = false))
    }
    newAddresses[index] = { ...newAddresses[index], [field]: value }
    setAddresses(newAddresses)
    setErrors((prev) => ({
      ...prev,
      addresses: { ...prev.addresses, [index]: {} },
    }))
  }

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = { contacts: {}, addresses: {} }
    let hasErrors = false

    // Validate contacts
    contacts.forEach((contact, index) => {
      const result = onboardingContactSchema.safeParse(contact)
      if (!result.success) {
        newErrors.contacts[index] = {}
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors.contacts[index][err.path[0] as string] = err.message
          }
        })
        hasErrors = true
      }
    })

    // Validate addresses
    addresses.forEach((address, index) => {
      const result = onboardingAddressSchema.safeParse(address)
      if (!result.success) {
        newErrors.addresses[index] = {}
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors.addresses[index][err.path[0] as string] = err.message
          }
        })
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Transform and save data
    const validContacts: OnboardingContactInput[] = contacts.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone || undefined,
      type: c.type,
      isPrimary: c.isPrimary,
    }))

    const validAddresses: OnboardingAddressInput[] = addresses.map((a) => ({
      type: a.type,
      street: a.street,
      street2: a.street2 || undefined,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      country: a.country,
      isPrimary: a.isPrimary,
    }))

    updateStep3({ contacts: validContacts, addresses: validAddresses })
    nextStep()
  }

  const handleBack = () => {
    const validContacts: OnboardingContactInput[] = contacts
      .filter((c) => c.name && c.email)
      .map((c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone || undefined,
        type: c.type,
        isPrimary: c.isPrimary,
      }))

    const validAddresses: OnboardingAddressInput[] = addresses
      .filter((a) => a.street && a.city && a.state && a.zipCode)
      .map((a) => ({
        type: a.type,
        street: a.street,
        street2: a.street2 || undefined,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
        country: a.country,
        isPrimary: a.isPrimary,
      }))

    updateStep3({ contacts: validContacts, addresses: validAddresses })
    prevStep()
  }

  return (
    <form onSubmit={validateAndSubmit} className="space-y-8">
      {/* Contacts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <p className="text-sm text-gray-500">Add at least one contact for this dealer.</p>
          </div>
          <button
            type="button"
            onClick={addContact}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add Contact
          </button>
        </div>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
              {contacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeContact(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  title="Remove contact"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.contacts[index]?.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.contacts[index]?.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.contacts[index].name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.contacts[index]?.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.contacts[index]?.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.contacts[index].email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={contact.type}
                    onChange={(e) => updateContact(index, 'type', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="primary">Primary</option>
                    <option value="billing">Billing</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(e) => updateContact(index, 'isPrimary', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Primary contact</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
            <p className="text-sm text-gray-500">Add at least one address for this dealer.</p>
          </div>
          <button
            type="button"
            onClick={addAddress}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add Address
          </button>
        </div>

        <div className="space-y-4">
          {addresses.map((address, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
              {addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAddress(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  title="Remove address"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={address.type}
                    onChange={(e) => updateAddress(index, 'type', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="billing">Billing</option>
                    <option value="shipping">Shipping</option>
                    <option value="both">Both (Billing & Shipping)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => updateAddress(index, 'street', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.addresses[index]?.street
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.addresses[index]?.street && (
                    <p className="mt-1 text-xs text-red-600">{errors.addresses[index].street}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street Address 2</label>
                  <input
                    type="text"
                    value={address.street2}
                    onChange={(e) => updateAddress(index, 'street2', e.target.value)}
                    placeholder="Apt, Suite, Building (optional)"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.addresses[index]?.city
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.addresses[index]?.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.addresses[index].city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => updateAddress(index, 'state', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.addresses[index]?.state
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.addresses[index]?.state && (
                    <p className="mt-1 text-xs text-red-600">{errors.addresses[index].state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => updateAddress(index, 'zipCode', e.target.value)}
                    maxLength={10}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.addresses[index]?.zipCode
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.addresses[index]?.zipCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.addresses[index].zipCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={address.country}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={address.isPrimary}
                      onChange={(e) => updateAddress(index, 'isPrimary', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Primary address</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Next: Review & Submit
        </button>
      </div>
    </form>
  )
}
