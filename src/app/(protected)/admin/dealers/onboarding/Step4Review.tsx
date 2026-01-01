'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from './OnboardingContext'
import { submitDealerOnboarding } from './actions'
import type { FullOnboardingInput } from '@/lib/validations/dealer'

type Props = {
  parentDealers: { id: string; name: string; code: string }[]
}

export function Step4Review({ parentDealers }: Props) {
  const router = useRouter()
  const { data, prevStep, goToStep, resetWizard } = useOnboarding()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const parentDealer = data.step1.parentDealerId
    ? parentDealers.find((d) => d.id === data.step1.parentDealerId)
    : null

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      platinum: 'Platinum',
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze',
    }
    return labels[tier] || tier
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-purple-100 text-purple-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-200 text-gray-800',
      bronze: 'bg-orange-100 text-orange-800',
    }
    return colors[tier] || 'bg-gray-100 text-gray-800'
  }

  const handleSubmit = () => {
    setError(null)

    const fullData: FullOnboardingInput = {
      code: data.step1.code || '',
      name: data.step1.name || '',
      tier: data.step1.tier || 'bronze',
      parentDealerId: data.step1.parentDealerId || null,
      ein: data.step2.ein || undefined,
      licenseNumber: data.step2.licenseNumber || undefined,
      insurancePolicy: data.step2.insurancePolicy || undefined,
      contacts: data.step3.contacts,
      addresses: data.step3.addresses,
    }

    startTransition(async () => {
      const result = await submitDealerOnboarding(fullData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          resetWizard()
          router.push(`/admin/dealers/${result.dealerId}`)
        }, 2000)
      } else {
        setError(result.error || 'Failed to create dealer')
      }
    })
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Dealer Created Successfully!</h3>
        <p className="mt-2 text-sm text-gray-500">Redirecting to dealer details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please review all information before submitting. Click on a section to edit.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Basic Info */}
      <div
        className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => goToStep(1)}
      >
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
          <span className="text-xs text-blue-600">Edit</span>
        </div>
        <div className="px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <dt className="text-xs text-gray-500">Dealer Code</dt>
              <dd className="text-sm font-medium text-gray-900 font-mono">{data.step1.code || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Dealer Name</dt>
              <dd className="text-sm font-medium text-gray-900">{data.step1.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Tier</dt>
              <dd>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getTierColor(data.step1.tier || 'bronze')}`}>
                  {getTierLabel(data.step1.tier || 'bronze')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Parent Dealer</dt>
              <dd className="text-sm font-medium text-gray-900">
                {parentDealer ? `${parentDealer.name} (${parentDealer.code})` : 'None'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Step 2: Business Details */}
      <div
        className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => goToStep(2)}
      >
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Business Details</h3>
          <span className="text-xs text-blue-600">Edit</span>
        </div>
        <div className="px-4 py-3">
          <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
            <div>
              <dt className="text-xs text-gray-500">EIN</dt>
              <dd className="text-sm font-medium text-gray-900">{data.step2.ein || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">License Number</dt>
              <dd className="text-sm font-medium text-gray-900">{data.step2.licenseNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">Insurance Policy</dt>
              <dd className="text-sm font-medium text-gray-900">{data.step2.insurancePolicy || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Step 3: Contacts */}
      <div
        className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => goToStep(3)}
      >
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Contacts ({data.step3.contacts.length})</h3>
          <span className="text-xs text-blue-600">Edit</span>
        </div>
        <div className="px-4 py-3">
          {data.step3.contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No contacts added</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.step3.contacts.map((contact, index) => (
                <li key={index} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{contact.type}</span>
                    {contact.isPrimary && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Primary</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Step 3: Addresses */}
      <div
        className="bg-white border rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
        onClick={() => goToStep(3)}
      >
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Addresses ({data.step3.addresses.length})</h3>
          <span className="text-xs text-blue-600">Edit</span>
        </div>
        <div className="px-4 py-3">
          {data.step3.addresses.length === 0 ? (
            <p className="text-sm text-gray-500">No addresses added</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.step3.addresses.map((address, index) => (
                <li key={index} className="py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{address.street}</p>
                      {address.street2 && <p className="text-sm text-gray-900">{address.street2}</p>}
                      <p className="text-xs text-gray-500">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{address.type}</span>
                      {address.isPrimary && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Primary</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              The dealer will be created with <strong>Pending</strong> status and will require admin approval before activation.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={isPending}
          className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="inline-flex justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Dealer...
            </>
          ) : (
            'Create Dealer'
          )}
        </button>
      </div>
    </div>
  )
}
