'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from './OnboardingContext'
import { onboardingStep1Schema } from '@/lib/validations/dealer'

type Props = {
  parentDealers: { id: string; name: string; code: string }[]
}

export function Step1BasicInfo({ parentDealers }: Props) {
  const { data, updateStep1, nextStep } = useOnboarding()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [code, setCode] = useState(data.step1.code || '')
  const [name, setName] = useState(data.step1.name || '')
  const [tier, setTier] = useState(data.step1.tier || 'bronze')
  const [parentDealerId, setParentDealerId] = useState(data.step1.parentDealerId || '')

  useEffect(() => {
    setCode(data.step1.code || '')
    setName(data.step1.name || '')
    setTier(data.step1.tier || 'bronze')
    setParentDealerId(data.step1.parentDealerId || '')
  }, [data.step1])

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(upperValue)
    if (errors.code) setErrors((prev) => ({ ...prev, code: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = onboardingStep1Schema.safeParse({
      code,
      name,
      tier,
      parentDealerId: parentDealerId || null,
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    updateStep1(result.data)
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Enter the dealer&apos;s basic details to get started.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Dealer Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="e.g., DEALER001"
            maxLength={20}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.code
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          <p className="mt-1 text-xs text-gray-500">Uppercase letters and numbers only (max 20 characters)</p>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Dealer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
            }}
            placeholder="e.g., ABC Motors"
            maxLength={100}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.name
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
            Dealer Tier
          </label>
          <select
            id="tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as 'platinum' | 'gold' | 'silver' | 'bronze')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Determines pricing and service levels</p>
        </div>

        <div>
          <label htmlFor="parentDealerId" className="block text-sm font-medium text-gray-700">
            Parent Dealer (Optional)
          </label>
          <select
            id="parentDealerId"
            value={parentDealerId}
            onChange={(e) => setParentDealerId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">None (Top-level dealer)</option>
            {parentDealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name} ({dealer.code})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Select if this dealer is a sub-dealer</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Next: Business Details
        </button>
      </div>
    </form>
  )
}
