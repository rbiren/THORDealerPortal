'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from './OnboardingContext'
import { onboardingStep2Schema } from '@/lib/validations/dealer'

export function Step2BusinessDetails() {
  const { data, updateStep2, nextStep, prevStep } = useOnboarding()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [ein, setEin] = useState(data.step2.ein || '')
  const [licenseNumber, setLicenseNumber] = useState(data.step2.licenseNumber || '')
  const [insurancePolicy, setInsurancePolicy] = useState(data.step2.insurancePolicy || '')

  useEffect(() => {
    setEin(data.step2.ein || '')
    setLicenseNumber(data.step2.licenseNumber || '')
    setInsurancePolicy(data.step2.insurancePolicy || '')
  }, [data.step2])

  const formatEin = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`
  }

  const handleEinChange = (value: string) => {
    const formatted = formatEin(value)
    setEin(formatted)
    if (errors.ein) setErrors((prev) => ({ ...prev, ein: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = onboardingStep2Schema.safeParse({
      ein: ein || undefined,
      licenseNumber: licenseNumber || undefined,
      insurancePolicy: insurancePolicy || undefined,
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

    updateStep2({
      ein: ein || undefined,
      licenseNumber: licenseNumber || undefined,
      insurancePolicy: insurancePolicy || undefined,
    })
    nextStep()
  }

  const handleBack = () => {
    updateStep2({
      ein: ein || undefined,
      licenseNumber: licenseNumber || undefined,
      insurancePolicy: insurancePolicy || undefined,
    })
    prevStep()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add business identification numbers and documentation. These fields are optional but recommended.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="ein" className="block text-sm font-medium text-gray-700">
            Employer Identification Number (EIN)
          </label>
          <input
            type="text"
            id="ein"
            value={ein}
            onChange={(e) => handleEinChange(e.target.value)}
            placeholder="XX-XXXXXXX"
            maxLength={10}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.ein
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.ein && <p className="mt-1 text-sm text-red-600">{errors.ein}</p>}
          <p className="mt-1 text-xs text-gray-500">Federal tax identification number in XX-XXXXXXX format</p>
        </div>

        <div>
          <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
            Business License Number
          </label>
          <input
            type="text"
            id="licenseNumber"
            value={licenseNumber}
            onChange={(e) => {
              setLicenseNumber(e.target.value)
              if (errors.licenseNumber) setErrors((prev) => ({ ...prev, licenseNumber: '' }))
            }}
            placeholder="e.g., LIC-12345"
            maxLength={50}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.licenseNumber
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>}
        </div>

        <div>
          <label htmlFor="insurancePolicy" className="block text-sm font-medium text-gray-700">
            Insurance Policy Number
          </label>
          <input
            type="text"
            id="insurancePolicy"
            value={insurancePolicy}
            onChange={(e) => {
              setInsurancePolicy(e.target.value)
              if (errors.insurancePolicy) setErrors((prev) => ({ ...prev, insurancePolicy: '' }))
            }}
            placeholder="e.g., POL-67890"
            maxLength={50}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.insurancePolicy
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.insurancePolicy && <p className="mt-1 text-sm text-red-600">{errors.insurancePolicy}</p>}
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              These details help verify your business and may be required for certain transactions.
            </p>
          </div>
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
          Next: Contacts & Addresses
        </button>
      </div>
    </form>
  )
}
