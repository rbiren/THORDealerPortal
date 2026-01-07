'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Truck,
  Factory,
  MapPin,
  X,
  ChevronRight,
  DollarSign,
  User,
  FileText,
} from 'lucide-react'
import {
  createOrder,
  searchInventoryUnits,
  fetchRVModelsForOrder,
} from '../actions'

type OrderType = 'stock' | 'factory' | 'locate'

type InventoryUnit = {
  id: string
  vin: string
  stockNumber: string | null
  modelYear: number
  modelName: string
  series: string
  condition: string
  status: string
  msrp: number
  invoiceCost: number
}

type RVModel = {
  id: string
  code: string
  name: string
  series: string
  modelYear: number
  baseMSRP: number
  dealerInvoice: number
}

export default function NewVehicleOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order type
  const [orderType, setOrderType] = useState<OrderType | null>(null)

  // Stock order - unit selection
  const [vinQuery, setVinQuery] = useState('')
  const [vinResults, setVinResults] = useState<InventoryUnit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null)
  const [vinSearching, setVinSearching] = useState(false)
  const [showVinDropdown, setShowVinDropdown] = useState(false)
  const vinInputRef = useRef<HTMLInputElement>(null)
  const vinDropdownRef = useRef<HTMLDivElement>(null)

  // Factory order - model selection
  const [models, setModels] = useState<RVModel[]>([])
  const [selectedModel, setSelectedModel] = useState<RVModel | null>(null)
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [requestedExteriorColor, setRequestedExteriorColor] = useState('')
  const [requestedInteriorColor, setRequestedInteriorColor] = useState('')

  // Customer info
  const [customerType, setCustomerType] = useState<'retail' | 'wholesale' | 'internal'>('retail')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Pricing
  const [unitPrice, setUnitPrice] = useState(0)
  const [optionsPrice, setOptionsPrice] = useState(0)
  const [freightPrice, setFreightPrice] = useState(0)
  const [prepFee, setPrepFee] = useState(495)
  const [docFee, setDocFee] = useState(299)

  // Calculate total
  const totalPrice = unitPrice + optionsPrice + freightPrice + prepFee + docFee

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      const result = await fetchRVModelsForOrder()
      setModels(result)
    }
    loadModels()
  }, [])

  // VIN search debounce effect
  useEffect(() => {
    if (!vinQuery || vinQuery.length < 2) {
      setVinResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setVinSearching(true)
      try {
        const results = await searchInventoryUnits(vinQuery)
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

  // Handle unit selection
  function handleSelectUnit(unit: InventoryUnit) {
    setSelectedUnit(unit)
    setVinQuery(unit.vin)
    setShowVinDropdown(false)
    setUnitPrice(unit.msrp)
  }

  // Handle model selection
  function handleSelectModel(model: RVModel) {
    setSelectedModel(model)
    setUnitPrice(model.baseMSRP)
    setModelSearchQuery('')
  }

  // Filter models by search query
  const filteredModels = models.filter((model) =>
    modelSearchQuery
      ? model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.series.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        model.code.toLowerCase().includes(modelSearchQuery.toLowerCase())
      : true
  )

  // Validate current step
  function canProceed(): boolean {
    if (step === 1) {
      return orderType !== null
    }
    if (step === 2) {
      if (orderType === 'stock') {
        return selectedUnit !== null
      }
      if (orderType === 'factory') {
        return selectedModel !== null
      }
      return true // locate can proceed without selection
    }
    if (step === 3) {
      return unitPrice > 0
    }
    return true
  }

  // Handle form submission
  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createOrder({
        orderType: orderType!,
        rvUnitId: selectedUnit?.id,
        rvModelId: selectedModel?.id,
        requestedExteriorColor: requestedExteriorColor || undefined,
        requestedInteriorColor: requestedInteriorColor || undefined,
        customerType,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        unitPrice,
        optionsPrice: optionsPrice || undefined,
        freightPrice: freightPrice || undefined,
        prepFee: prepFee || undefined,
        docFee: docFee || undefined,
      })

      if (result.orderNumber) {
        router.push(`/vehicle-orders/${result.orderNumber}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/vehicle-orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Vehicle Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Vehicle Order</h1>
        <p className="mt-1 text-gray-600">
          Start a new quote or order for an RV unit
        </p>
      </div>

      {/* Progress Steps */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Order Type' },
            { num: 2, label: 'Unit Selection' },
            { num: 3, label: 'Pricing' },
            { num: 4, label: 'Review' },
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`ml-2 text-sm hidden sm:block ${
                  step >= s.num ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
              {index < 3 && (
                <ChevronRight className="h-4 w-4 mx-4 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Order Type Selection */}
      {step === 1 && (
        <div className="border rounded-lg p-6 bg-white space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Select Order Type</h2>
          <p className="text-gray-600">Choose how you want to acquire this vehicle</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stock Order */}
            <button
              onClick={() => setOrderType('stock')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                orderType === 'stock'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Truck className={`h-8 w-8 mb-3 ${orderType === 'stock' ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Stock Order</h3>
              <p className="text-sm text-gray-500 mt-1">
                Reserve a unit from your current inventory
              </p>
            </button>

            {/* Factory Order */}
            <button
              onClick={() => setOrderType('factory')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                orderType === 'factory'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Factory className={`h-8 w-8 mb-3 ${orderType === 'factory' ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Factory Order</h3>
              <p className="text-sm text-gray-500 mt-1">
                Order a new unit built to spec from the factory
              </p>
            </button>

            {/* Locate */}
            <button
              onClick={() => setOrderType('locate')}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                orderType === 'locate'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin className={`h-8 w-8 mb-3 ${orderType === 'locate' ? 'text-blue-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Locate</h3>
              <p className="text-sm text-gray-500 mt-1">
                Find and transfer a unit from another dealer
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Unit/Model Selection */}
      {step === 2 && (
        <div className="border rounded-lg p-6 bg-white space-y-6">
          {orderType === 'stock' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Select Unit from Inventory</h2>
              <p className="text-gray-600">Search for an available unit by VIN or stock number</p>

              {selectedUnit ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedUnit.modelYear} {selectedUnit.series} {selectedUnit.modelName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        VIN: {selectedUnit.vin}
                        {selectedUnit.stockNumber && ` | Stock #: ${selectedUnit.stockNumber}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Condition: {selectedUnit.condition} | Status: {selectedUnit.status.replace('_', ' ')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        MSRP: {formatCurrency(selectedUnit.msrp)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUnit(null)
                        setVinQuery('')
                        setUnitPrice(0)
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={vinInputRef}
                    type="text"
                    value={vinQuery}
                    onChange={(e) => {
                      setVinQuery(e.target.value)
                      if (e.target.value.length >= 2) {
                        setShowVinDropdown(true)
                      }
                    }}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Search by VIN, stock number, or model..."
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {vinSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                  )}

                  {showVinDropdown && vinResults.length > 0 && (
                    <div
                      ref={vinDropdownRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                    >
                      {vinResults.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => handleSelectUnit(unit)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {unit.modelYear} {unit.series} {unit.modelName}
                              </p>
                              <p className="text-sm text-gray-500">
                                VIN: {unit.vin}
                                {unit.stockNumber && ` | Stock #: ${unit.stockNumber}`}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(unit.msrp)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {orderType === 'factory' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Select Model for Factory Order</h2>
              <p className="text-gray-600">Choose the model and configuration</p>

              {selectedModel ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedModel.modelYear} {selectedModel.series} {selectedModel.name}
                      </h3>
                      <p className="text-sm text-gray-600">Model Code: {selectedModel.code}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        Base MSRP: {formatCurrency(selectedModel.baseMSRP)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedModel(null)
                        setUnitPrice(0)
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Filter models..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {filteredModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className="p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50"
                      >
                        <p className="font-medium text-gray-900">
                          {model.modelYear} {model.series} {model.name}
                        </p>
                        <p className="text-sm text-gray-500">{model.code}</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(model.baseMSRP)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedModel && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exterior Color
                    </label>
                    <input
                      type="text"
                      value={requestedExteriorColor}
                      onChange={(e) => setRequestedExteriorColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Shadow Black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interior Color
                    </label>
                    <input
                      type="text"
                      value={requestedInteriorColor}
                      onChange={(e) => setRequestedInteriorColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Charcoal"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {orderType === 'locate' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Locate Request</h2>
              <p className="text-gray-600">
                A locate request will be submitted to find a matching unit from other dealers.
                You can specify the model and configuration you&apos;re looking for in the next step.
              </p>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Select a model configuration or skip to pricing to create a general locate request.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={(e) => setModelSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="Filter models (optional)..."
                />
                {modelSearchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {filteredModels.slice(0, 6).map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className={`p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 ${
                          selectedModel?.id === model.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">
                          {model.modelYear} {model.series} {model.name}
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatCurrency(model.baseMSRP)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="border rounded-lg p-6 bg-white space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Pricing & Fees</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options/Add-ons
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={optionsPrice || ''}
                    onChange={(e) => setOptionsPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freight
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={freightPrice || ''}
                    onChange={(e) => setFreightPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Fee
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={prepFee || ''}
                    onChange={(e) => setPrepFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doc Fee
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={docFee || ''}
                    onChange={(e) => setDocFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900">Total Price:</span>
                <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information (Optional)
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <div className="flex gap-3">
                {(['retail', 'wholesale', 'internal'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCustomerType(type)}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium capitalize ${
                      customerType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="border rounded-lg p-6 bg-white space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Quote
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Order Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Type:</span>
                  <span className="font-medium capitalize">{orderType}</span>
                </div>
                {selectedUnit && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium">
                        {selectedUnit.modelYear} {selectedUnit.series} {selectedUnit.modelName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-medium">{selectedUnit.vin}</span>
                    </div>
                  </>
                )}
                {selectedModel && !selectedUnit && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">
                        {selectedModel.modelYear} {selectedModel.series} {selectedModel.name}
                      </span>
                    </div>
                    {requestedExteriorColor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exterior:</span>
                        <span className="font-medium">{requestedExteriorColor}</span>
                      </div>
                    )}
                    {requestedInteriorColor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interior:</span>
                        <span className="font-medium">{requestedInteriorColor}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Customer</h3>
              {customerName || customerEmail || customerPhone ? (
                <div className="space-y-2">
                  {customerName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{customerName}</span>
                    </div>
                  )}
                  {customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{customerEmail}</span>
                    </div>
                  )}
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{customerType}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No customer info provided</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Pricing Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-medium">{formatCurrency(unitPrice)}</span>
              </div>
              {optionsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Options:</span>
                  <span className="font-medium">{formatCurrency(optionsPrice)}</span>
                </div>
              )}
              {freightPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Freight:</span>
                  <span className="font-medium">{formatCurrency(freightPrice)}</span>
                </div>
              )}
              {prepFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Prep Fee:</span>
                  <span className="font-medium">{formatCurrency(prepFee)}</span>
                </div>
              )}
              {docFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Doc Fee:</span>
                  <span className="font-medium">{formatCurrency(docFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t text-lg font-semibold">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              This will create a <strong>quote</strong> that can be reviewed and approved before
              becoming a confirmed order.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Creating Quote...
              </>
            ) : (
              'Create Quote'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
