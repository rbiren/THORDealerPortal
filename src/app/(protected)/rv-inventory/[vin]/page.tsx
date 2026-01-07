'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Wrench,
  FileText,
  AlertCircle,
  CheckCircle,
  Shield,
  Settings,
  Image as ImageIcon,
  ExternalLink,
  Phone,
  Building,
  Scale,
  Fuel,
  Bed,
  Maximize,
} from 'lucide-react'
import { fetchRVUnitByVin, fetchUnitServiceHistory, fetchUnitWarrantyClaims } from './actions'
import type { RVUnit, RVUnitStatus, RVUnitCondition } from '@/types/rv'

const STATUS_COLORS: Record<RVUnitStatus, string> = {
  in_transit: 'bg-blue-100 text-blue-800',
  in_stock: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-purple-100 text-purple-800',
  wholesale: 'bg-gray-100 text-gray-800',
  service: 'bg-orange-100 text-orange-800',
}

const STATUS_LABELS: Record<RVUnitStatus, string> = {
  in_transit: 'In Transit',
  in_stock: 'In Stock',
  reserved: 'Reserved',
  sold: 'Sold',
  wholesale: 'Wholesale',
  service: 'In Service',
}

const CONDITION_LABELS: Record<RVUnitCondition, string> = {
  new: 'New',
  used: 'Used',
  demo: 'Demo',
  certified_preowned: 'Certified Pre-Owned',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function RVUnitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vin = params.vin as string

  const [unit, setUnit] = useState<RVUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'service' | 'warranty' | 'orders'>('details')

  useEffect(() => {
    async function loadUnit() {
      try {
        const data = await fetchRVUnitByVin(vin)
        if (!data) {
          setError('Unit not found')
        } else {
          setUnit(data)
        }
      } catch (err) {
        setError('Failed to load unit details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadUnit()
  }, [vin])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading unit details...</div>
      </div>
    )
  }

  if (error || !unit) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">{error || 'Unit not found'}</h2>
        <Link href="/rv-inventory" className="mt-4 text-blue-600 hover:text-blue-700">
          Back to Inventory
        </Link>
      </div>
    )
  }

  const warrantyActive = unit.warrantyEndDate && new Date(unit.warrantyEndDate) > new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {unit.modelYear} {unit.model?.series} {unit.model?.name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  STATUS_COLORS[unit.status as RVUnitStatus]
                }`}
              >
                {STATUS_LABELS[unit.status as RVUnitStatus]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
              <span className="font-mono">VIN: {unit.vin}</span>
              {unit.stockNumber && <span>Stock #: {unit.stockNumber}</span>}
              <span>{CONDITION_LABELS[unit.condition as RVUnitCondition]}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/warranty/new?vin=${unit.vin}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Wrench className="h-4 w-4" />
            Warranty Claim
          </Link>
          <Link
            href={`/vehicle-orders/new?vin=${unit.vin}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            MSRP
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(unit.msrp)}</div>
          {unit.internetPrice && (
            <div className="text-sm text-green-600">
              Internet: {formatCurrency(unit.internetPrice)}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="h-4 w-4" />
            Invoice Cost
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(unit.invoiceCost)}</div>
          <div className="text-sm text-gray-500">
            Margin: {formatCurrency(unit.msrp - unit.invoiceCost)}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Days on Lot
          </div>
          <div
            className={`mt-1 text-xl font-bold ${
              (unit.daysOnLot || 0) > 90
                ? 'text-red-600'
                : (unit.daysOnLot || 0) > 60
                ? 'text-orange-600'
                : 'text-gray-900'
            }`}
          >
            {unit.daysOnLot ?? 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Received: {formatDate(unit.receivedDate)}</div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <div className="mt-1 text-lg font-medium text-gray-900">
            {unit.locationName || 'Main Lot'}
          </div>
          {unit.lotLocation && <div className="text-sm text-gray-500">{unit.lotLocation}</div>}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            Warranty
          </div>
          <div
            className={`mt-1 flex items-center gap-2 text-lg font-medium ${
              warrantyActive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {warrantyActive ? (
              <>
                <CheckCircle className="h-4 w-4" /> Active
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" /> Expired
              </>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Expires: {formatDate(unit.warrantyEndDate)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-8">
          {(['details', 'service', 'warranty', 'orders'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-4 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab === 'warranty' ? 'Warranty Claims' : tab === 'orders' ? 'Order History' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle Specifications */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Vehicle Specifications</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Class Type</dt>
                <dd className="font-medium text-gray-900">{unit.model?.classType}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Model Year</dt>
                <dd className="font-medium text-gray-900">{unit.modelYear}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Series</dt>
                <dd className="font-medium text-gray-900">{unit.model?.series}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Model</dt>
                <dd className="font-medium text-gray-900">{unit.model?.name}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Maximize className="h-3 w-3" /> Length
                </dt>
                <dd className="font-medium text-gray-900">
                  {unit.model?.lengthFeet}&apos;{unit.model?.lengthInches || 0}&quot;
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Scale className="h-3 w-3" /> GVWR
                </dt>
                <dd className="font-medium text-gray-900">
                  {unit.model?.baseWeight?.toLocaleString()} lbs
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Bed className="h-3 w-3" /> Sleeps
                </dt>
                <dd className="font-medium text-gray-900">{unit.model?.sleepingCapacity}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Slide Outs</dt>
                <dd className="font-medium text-gray-900">{unit.model?.slideOuts}</dd>
              </div>
              {unit.model?.engineType && (
                <>
                  <div>
                    <dt className="flex items-center gap-1 text-sm text-gray-500">
                      <Fuel className="h-3 w-3" /> Engine
                    </dt>
                    <dd className="font-medium text-gray-900">
                      {unit.model.engineSize} {unit.model.engineType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Chassis</dt>
                    <dd className="font-medium text-gray-900">
                      {unit.model.chassisMake} {unit.model.chassisModel}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Configuration */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Unit Configuration</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Exterior Color</dt>
                <dd className="font-medium text-gray-900">{unit.exteriorColor}</dd>
              </div>
              {unit.interiorColor && (
                <div>
                  <dt className="text-sm text-gray-500">Interior Color</dt>
                  <dd className="font-medium text-gray-900">{unit.interiorColor}</dd>
                </div>
              )}
              {unit.condition !== 'new' && (
                <>
                  <div>
                    <dt className="text-sm text-gray-500">Mileage</dt>
                    <dd className="font-medium text-gray-900">
                      {unit.mileage?.toLocaleString() || 'N/A'} miles
                    </dd>
                  </div>
                  {unit.hours && (
                    <div>
                      <dt className="text-sm text-gray-500">Engine Hours</dt>
                      <dd className="font-medium text-gray-900">{unit.hours.toLocaleString()}</dd>
                    </div>
                  )}
                </>
              )}
              {unit.installedOptions && unit.installedOptions.length > 0 && (
                <div>
                  <dt className="mb-2 text-sm text-gray-500">Installed Options</dt>
                  <dd className="space-y-1">
                    {unit.installedOptions.map((option, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {option}
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Floor Plan Financing */}
          {unit.floorPlanLender && (
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Floor Plan Financing</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-gray-500">Lender</dt>
                  <dd className="font-medium text-gray-900">{unit.floorPlanLender}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Account Number</dt>
                  <dd className="font-medium text-gray-900">{unit.floorPlanNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Current Payoff</dt>
                  <dd className="font-medium text-gray-900">
                    {unit.floorPlanPayoff ? formatCurrency(unit.floorPlanPayoff) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Curtailment Date</dt>
                  <dd
                    className={`font-medium ${
                      unit.floorPlanDueDate && new Date(unit.floorPlanDueDate) < new Date()
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {formatDate(unit.floorPlanDueDate)}
                  </dd>
                </div>
                {unit.floorPlanInterestRate && (
                  <div>
                    <dt className="text-sm text-gray-500">Interest Rate</dt>
                    <dd className="font-medium text-gray-900">{unit.floorPlanInterestRate}%</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Important Dates */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Important Dates</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Received Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(unit.receivedDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Service</dt>
                <dd className="font-medium text-gray-900">{formatDate(unit.lastServiceDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Warranty Start</dt>
                <dd className="font-medium text-gray-900">{formatDate(unit.warrantyStartDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Warranty End</dt>
                <dd
                  className={`font-medium ${
                    warrantyActive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatDate(unit.warrantyEndDate)}
                </dd>
              </div>
              {unit.soldDate && (
                <div>
                  <dt className="text-sm text-gray-500">Sold Date</dt>
                  <dd className="font-medium text-gray-900">{formatDate(unit.soldDate)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'service' && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
            <Link
              href={`/service/new?vin=${unit.vin}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Service Record
            </Link>
          </div>
          <div className="text-center py-8 text-gray-500">
            <Settings className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No service records found for this unit.</p>
          </div>
        </div>
      )}

      {activeTab === 'warranty' && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Warranty Claims</h3>
            <Link
              href={`/warranty/new?vin=${unit.vin}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Submit New Claim
            </Link>
          </div>
          <div className="text-center py-8 text-gray-500">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No warranty claims found for this unit.</p>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
            <Link
              href={`/vehicle-orders/new?vin=${unit.vin}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Create Order
            </Link>
          </div>
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No orders found for this unit.</p>
          </div>
        </div>
      )}
    </div>
  )
}
