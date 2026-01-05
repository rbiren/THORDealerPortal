'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWarrantyClaimAction } from '../actions'

const claimTypes = [
  { value: 'product_defect', label: 'Product Defect', description: 'Manufacturing or quality issue with the product' },
  { value: 'shipping_damage', label: 'Shipping Damage', description: 'Product was damaged during shipping' },
  { value: 'missing_parts', label: 'Missing Parts', description: 'Components or parts are missing from the order' },
  { value: 'installation_issue', label: 'Installation Issue', description: 'Problem occurred during installation' },
  { value: 'other', label: 'Other', description: 'Other warranty-related issue' },
]

const priorityOptions = [
  { value: 'low', label: 'Low', description: 'Minor issue, not time-sensitive' },
  { value: 'normal', label: 'Normal', description: 'Standard warranty claim' },
  { value: 'high', label: 'High', description: 'Significant impact, needs attention' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue affecting customer' },
]

const issueTypes = [
  { value: 'defective', label: 'Defective' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing', label: 'Missing' },
  { value: 'worn', label: 'Worn/Degraded' },
  { value: 'other', label: 'Other' },
]

type ClaimItem = {
  id: string
  partNumber: string
  partName: string
  quantity: number
  unitCost: number
  issueType: string
  issueDescription: string
}

export default function NewWarrantyClaimPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  // Form state
  const [claimType, setClaimType] = useState('')
  const [productName, setProductName] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [installDate, setInstallDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [failureDate, setFailureDate] = useState('')
  const [isUnderWarranty, setIsUnderWarranty] = useState(true)
  const [laborHours, setLaborHours] = useState('')
  const [laborRate, setLaborRate] = useState('')
  const [shippingAmount, setShippingAmount] = useState('')
  const [priority, setPriority] = useState('normal')
  const [items, setItems] = useState<ClaimItem[]>([])

  // Calculate totals
  const partsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
  const laborTotal = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0)
  const shipping = parseFloat(shippingAmount) || 0
  const grandTotal = partsTotal + laborTotal + shipping

  function addItem() {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        partNumber: '',
        partName: '',
        quantity: 1,
        unitCost: 0,
        issueType: 'defective',
        issueDescription: '',
      },
    ])
  }

  function updateItem(id: string, updates: Partial<ClaimItem>) {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id))
  }

  function validateStep1() {
    if (!claimType) {
      setError('Please select a claim type')
      return false
    }
    if (!productName.trim()) {
      setError('Product name is required')
      return false
    }
    setError(null)
    return true
  }

  function validateStep2() {
    if (!issueDescription.trim() || issueDescription.length < 10) {
      setError('Please provide a detailed description of the issue (at least 10 characters)')
      return false
    }
    setError(null)
    return true
  }

  function nextStep() {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  function prevStep() {
    setError(null)
    setStep(step - 1)
  }

  async function handleSubmit(submitNow: boolean) {
    setError(null)

    const formData = new FormData()
    formData.set('claimType', claimType)
    formData.set('productName', productName)
    formData.set('serialNumber', serialNumber)
    formData.set('modelNumber', modelNumber)
    formData.set('purchaseDate', purchaseDate)
    formData.set('installDate', installDate)
    formData.set('customerName', customerName)
    formData.set('customerPhone', customerPhone)
    formData.set('customerEmail', customerEmail)
    formData.set('customerAddress', customerAddress)
    formData.set('issueDescription', issueDescription)
    formData.set('failureDate', failureDate)
    formData.set('isUnderWarranty', String(isUnderWarranty))
    formData.set('laborHours', laborHours)
    formData.set('laborRate', laborRate)
    formData.set('shippingAmount', shippingAmount)
    formData.set('priority', priority)
    formData.set('submitNow', String(submitNow))

    if (items.length > 0) {
      formData.set(
        'items',
        JSON.stringify(
          items.map((item) => ({
            partNumber: item.partNumber,
            partName: item.partName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            issueType: item.issueType,
            issueDescription: item.issueDescription,
          }))
        )
      )
    }

    startTransition(async () => {
      const result = await createWarrantyClaimAction(formData)
      if (result.success) {
        router.push(`/warranty/${result.claimId}`)
      } else {
        setError(result.error || 'Failed to create warranty claim')
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <nav className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/warranty">Warranty Claims</Link>
          <span className="breadcrumb-separator">/</span>
          <span>New Claim</span>
        </nav>
        <h1 className="page-title">Submit Warranty Claim</h1>
        <p className="page-subtitle">File a new warranty claim for a defective or damaged product</p>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-olive text-white'
                      : 'bg-light-gray text-medium-gray'
                  }`}
                >
                  {s}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s ? 'text-charcoal font-medium' : 'text-medium-gray'
                  }`}
                >
                  {s === 1 ? 'Product Info' : s === 2 ? 'Issue Details' : 'Review & Submit'}
                </span>
                {s < 3 && (
                  <div
                    className={`hidden sm:block w-24 h-0.5 mx-4 ${
                      step > s ? 'bg-olive' : 'bg-light-gray'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Step 1: Product Information */}
      {step === 1 && (
        <div className="card">
          <div className="card-body space-y-6">
            <h2 className="text-lg font-heading font-semibold text-charcoal">Product Information</h2>

            {/* Claim Type */}
            <div className="form-group">
              <label className="form-label">Claim Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {claimTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      claimType === type.value
                        ? 'border-olive bg-olive/5'
                        : 'border-light-gray hover:border-medium-gray'
                    }`}
                  >
                    <input
                      type="radio"
                      name="claimType"
                      value={type.value}
                      checked={claimType === type.value}
                      onChange={(e) => setClaimType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-charcoal">{type.label}</p>
                      <p className="text-sm text-medium-gray">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <label htmlFor="productName" className="form-label">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input w-full"
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="serialNumber" className="form-label">
                  Serial Number
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="input w-full"
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modelNumber" className="form-label">
                  Model Number
                </label>
                <input
                  type="text"
                  id="modelNumber"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="input w-full"
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchaseDate" className="form-label">
                  Purchase Date
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="form-group">
                <label htmlFor="installDate" className="form-label">
                  Installation Date
                </label>
                <input
                  type="date"
                  id="installDate"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Customer Information */}
            <h3 className="text-md font-heading font-medium text-charcoal border-t border-light-gray pt-6">
              Customer Information (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="customerName" className="form-label">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input w-full"
                  placeholder="End customer name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone" className="form-label">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input w-full"
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail" className="form-label">
                  Customer Email
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="input w-full"
                  placeholder="Email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerAddress" className="form-label">
                  Customer Address
                </label>
                <input
                  type="text"
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="input w-full"
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Issue Details */}
      {step === 2 && (
        <div className="card">
          <div className="card-body space-y-6">
            <h2 className="text-lg font-heading font-semibold text-charcoal">Issue Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="failureDate" className="form-label">
                  Date Issue Occurred
                </label>
                <input
                  type="date"
                  id="failureDate"
                  value={failureDate}
                  onChange={(e) => setFailureDate(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Under Warranty?</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={isUnderWarranty}
                      onChange={() => setIsUnderWarranty(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!isUnderWarranty}
                      onChange={() => setIsUnderWarranty(false)}
                    />
                    <span>No / Unknown</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="issueDescription" className="form-label">
                Issue Description *
              </label>
              <textarea
                id="issueDescription"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="input w-full h-32"
                placeholder="Please describe the issue in detail. Include symptoms, when it started, and any troubleshooting steps already taken..."
              />
              <p className="text-sm text-medium-gray mt-1">
                Minimum 10 characters. Be as detailed as possible.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {priorityOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                      priority === opt.value
                        ? 'border-olive bg-olive/5'
                        : 'border-light-gray hover:border-medium-gray'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={opt.value}
                      checked={priority === opt.value}
                      onChange={(e) => setPriority(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-charcoal">{opt.label}</span>
                    <span className="text-xs text-medium-gray mt-1">{opt.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Affected Parts */}
            <div className="border-t border-light-gray pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-heading font-medium text-charcoal">
                  Affected Parts (Optional)
                </h3>
                <button type="button" onClick={addItem} className="btn-outline btn-sm">
                  Add Part
                </button>
              </div>

              {items.length > 0 && (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="border border-light-gray rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-charcoal">Part #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Part Number"
                          value={item.partNumber}
                          onChange={(e) => updateItem(item.id, { partNumber: e.target.value })}
                          className="input"
                        />
                        <input
                          type="text"
                          placeholder="Part Name *"
                          value={item.partName}
                          onChange={(e) => updateItem(item.id, { partName: e.target.value })}
                          className="input"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                          className="input"
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Unit Cost"
                          value={item.unitCost || ''}
                          onChange={(e) => updateItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                          className="input"
                          min="0"
                          step="0.01"
                        />
                        <select
                          value={item.issueType}
                          onChange={(e) => updateItem(item.id, { issueType: e.target.value })}
                          className="input"
                        >
                          {issueTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Issue description"
                          value={item.issueDescription}
                          onChange={(e) => updateItem(item.id, { issueDescription: e.target.value })}
                          className="input col-span-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labor & Shipping */}
            <div className="border-t border-light-gray pt-6">
              <h3 className="text-md font-heading font-medium text-charcoal mb-4">
                Labor & Shipping Costs (Optional)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">Labor Hours</label>
                  <input
                    type="number"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    className="input w-full"
                    min="0"
                    step="0.5"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Labor Rate ($/hr)</label>
                  <input
                    type="number"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    className="input w-full"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shipping Cost</label>
                  <input
                    type="number"
                    value={shippingAmount}
                    onChange={(e) => setShippingAmount(e.target.value)}
                    className="input w-full"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Labor Total</label>
                  <input
                    type="text"
                    value={`$${laborTotal.toFixed(2)}`}
                    className="input w-full bg-light-beige"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn-outline">
                Back
              </button>
              <button onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="card">
          <div className="card-body space-y-6">
            <h2 className="text-lg font-heading font-semibold text-charcoal">Review & Submit</h2>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Product</h3>
                <p className="font-medium text-charcoal">{productName}</p>
                {serialNumber && <p className="text-sm text-medium-gray">S/N: {serialNumber}</p>}
                {modelNumber && <p className="text-sm text-medium-gray">Model: {modelNumber}</p>}
              </div>
              <div>
                <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Claim Type</h3>
                <p className="font-medium text-charcoal">
                  {claimTypes.find((t) => t.value === claimType)?.label}
                </p>
                <p className="text-sm text-medium-gray">Priority: {priorityOptions.find((p) => p.value === priority)?.label}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">Issue Description</h3>
              <p className="text-charcoal whitespace-pre-wrap bg-light-beige p-3 rounded">
                {issueDescription}
              </p>
            </div>

            {items.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-medium-gray uppercase mb-2">
                  Affected Parts ({items.length})
                </h3>
                <div className="border border-light-gray rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-light-beige">
                      <tr>
                        <th className="px-3 py-2 text-left">Part</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-light-gray">
                          <td className="px-3 py-2">
                            {item.partName}
                            {item.partNumber && (
                              <span className="text-medium-gray ml-1">({item.partNumber})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            ${(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-light-gray pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  {partsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-medium-gray">Parts Total</span>
                      <span>${partsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {laborTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-medium-gray">Labor Total</span>
                      <span>${laborTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-medium-gray">Shipping</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t border-light-gray pt-2">
                    <span>Total Requested</span>
                    <span className="text-olive">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-light-gray">
              <button onClick={prevStep} className="btn-outline" disabled={isPending}>
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(false)}
                  className="btn-outline"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  className="btn-primary"
                  disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
