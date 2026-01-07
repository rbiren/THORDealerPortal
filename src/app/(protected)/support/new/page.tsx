'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  HelpCircle,
  Package,
  Shield,
  ShoppingCart,
  Receipt,
  Wrench,
  User,
  AlertCircle,
  CheckCircle,
  Search,
  X,
} from 'lucide-react'
import { createSupportTicketAction, searchVINForTicket, type VINSearchResult } from '../actions'
import {
  ticketCategoryOptions,
  ticketPriorityOptions,
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketSubcategories,
  type TicketCategory,
  type TicketPriority,
} from '@/lib/validations/support'

const categoryIcons: Record<TicketCategory, React.ReactNode> = {
  product: <Package className="h-5 w-5" />,
  warranty: <Shield className="h-5 w-5" />,
  order: <ShoppingCart className="h-5 w-5" />,
  billing: <Receipt className="h-5 w-5" />,
  technical: <Wrench className="h-5 w-5" />,
  account: <User className="h-5 w-5" />,
  other: <HelpCircle className="h-5 w-5" />,
}

export default function NewSupportTicketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ ticketNumber: string } | null>(null)

  const [category, setCategory] = useState<TicketCategory | ''>('')
  const [subcategory, setSubcategory] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('normal')

  // VIN search state
  const [vinQuery, setVinQuery] = useState('')
  const [vinResults, setVinResults] = useState<VINSearchResult[]>([])
  const [selectedUnit, setSelectedUnit] = useState<VINSearchResult | null>(null)
  const [vinSearching, setVinSearching] = useState(false)
  const [showVinDropdown, setShowVinDropdown] = useState(false)
  const vinInputRef = useRef<HTMLInputElement>(null)
  const vinDropdownRef = useRef<HTMLDivElement>(null)

  // VIN search debounce effect
  useEffect(() => {
    if (!vinQuery || vinQuery.length < 3) {
      setVinResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setVinSearching(true)
      try {
        const results = await searchVINForTicket(vinQuery)
        setVinResults(results)
        setShowVinDropdown(results.length > 0)
      } catch (e) {
        console.error('VIN search error:', e)
      } finally {
        setVinSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [vinQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        vinDropdownRef.current &&
        !vinDropdownRef.current.contains(event.target as Node) &&
        vinInputRef.current &&
        !vinInputRef.current.contains(event.target as Node)
      ) {
        setShowVinDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle VIN selection
  const handleSelectUnit = (unit: VINSearchResult) => {
    setSelectedUnit(unit)
    setVinQuery(unit.vin)
    setShowVinDropdown(false)
  }

  // Clear selected unit
  const clearSelectedUnit = () => {
    setSelectedUnit(null)
    setVinQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('category', category)
    if (subcategory) formData.append('subcategory', subcategory)
    formData.append('subject', subject)
    formData.append('description', description)
    formData.append('priority', priority)

    // Include RV unit info if selected
    if (selectedUnit) {
      formData.append('rvUnitId', selectedUnit.id)
      formData.append('vin', selectedUnit.vin)
    }

    const result = await createSupportTicketAction(formData)

    if (result.success && result.ticketNumber) {
      setSuccess({ ticketNumber: result.ticketNumber })
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/support/${result.ticketNumber}`)
      }, 2000)
    } else {
      setError(result.error || 'Failed to create ticket')
    }

    setIsSubmitting(false)
  }

  const subcategoryOptions = category ? ticketSubcategories[category] : []

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Ticket Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your ticket number is{' '}
            <span className="font-mono font-semibold text-primary">
              {success.ticketNumber}
            </span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will be redirected to your ticket shortly...
          </p>
          <Link
            href={`/support/${success.ticketNumber}`}
            className="text-primary hover:underline"
          >
            View Ticket Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/support"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Support
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Submit a Support Request</h1>
        <p className="mt-1 text-gray-600">
          Fill out the form below and our team will respond as soon as possible.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What do you need help with? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {ticketCategoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat)
                  setSubcategory('')
                }}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                  category === cat
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                }`}
              >
                {categoryIcons[cat]}
                <span className="mt-2 text-sm font-medium">
                  {ticketCategoryLabels[cat]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Subcategory - Only show when category is selected */}
        {category && subcategoryOptions.length > 0 && (
          <div>
            <label
              htmlFor="subcategory"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              More specifically...
            </label>
            <select
              id="subcategory"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Select a subcategory (optional)</option>
              {subcategoryOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <div className="flex flex-wrap gap-2">
            {ticketPriorityOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                  priority === p
                    ? p === 'urgent'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : p === 'high'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : p === 'normal'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {ticketPriorityLabels[p]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {priority === 'urgent' && 'For critical issues affecting your business operations'}
            {priority === 'high' && 'For important issues that need prompt attention'}
            {priority === 'normal' && 'For general questions and non-urgent requests'}
            {priority === 'low' && 'For minor issues or general feedback'}
          </p>
        </div>

        {/* VIN Lookup */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related RV Unit (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Link this ticket to a specific RV unit for faster support
          </p>

          {selectedUnit ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {selectedUnit.modelYear} {selectedUnit.series} {selectedUnit.modelName}
                </p>
                <p className="text-sm text-gray-500">
                  VIN: {selectedUnit.vin}
                  {selectedUnit.stockNumber && ` | Stock #: ${selectedUnit.stockNumber}`}
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelectedUnit}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={vinInputRef}
                type="text"
                value={vinQuery}
                onChange={(e) => {
                  setVinQuery(e.target.value)
                  if (e.target.value.length >= 3) {
                    setShowVinDropdown(true)
                  }
                }}
                onFocus={() => vinQuery.length >= 3 && vinResults.length > 0 && setShowVinDropdown(true)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Search by VIN (min 3 characters)..."
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              {vinSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}

              {showVinDropdown && vinResults.length > 0 && (
                <div
                  ref={vinDropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {vinResults.map((unit) => (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => handleSelectUnit(unit)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">
                        {unit.modelYear} {unit.series} {unit.modelName}
                      </p>
                      <p className="text-sm text-gray-500">
                        VIN: {unit.vin}
                        {unit.stockNumber && ` | Stock #: ${unit.stockNumber}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder="Brief summary of your issue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="mt-1 text-xs text-gray-500">
            {subject.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={20}
            maxLength={10000}
            rows={8}
            placeholder="Please describe your issue in detail. Include any relevant order numbers, product SKUs, or error messages."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
          />
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/10,000 characters (minimum 20)
          </p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Tips for a faster response:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Include relevant order numbers or invoice numbers</li>
            <li>• Attach screenshots if applicable</li>
            <li>• Describe what you expected vs. what happened</li>
            <li>• Include any error messages you received</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Link
            href="/support"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !category || !subject || description.length < 20}
            className="inline-flex items-center px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
