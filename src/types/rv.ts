// RV Inventory Types

export type RVClassType =
  | 'Class A'
  | 'Class B'
  | 'Class C'
  | 'Fifth Wheel'
  | 'Travel Trailer'
  | 'Toy Hauler'
  | 'Pop-Up'

export type RVUnitStatus =
  | 'in_transit'
  | 'in_stock'
  | 'reserved'
  | 'sold'
  | 'wholesale'
  | 'service'

export type RVUnitCondition =
  | 'new'
  | 'used'
  | 'demo'
  | 'certified_preowned'

export type VehicleOrderStatus =
  | 'quote'
  | 'pending_approval'
  | 'approved'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type VehicleOrderType =
  | 'stock'
  | 'factory'
  | 'locate'

export type TradeInStatus =
  | 'pending'
  | 'appraised'
  | 'approved'
  | 'rejected'
  | 'completed'

export type TradeInCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'

// RV Model (what Thor manufactures)
export interface RVModel {
  id: string
  code: string
  name: string
  series: string
  classType: RVClassType
  modelYear: number

  // Physical specs
  lengthFeet: number
  lengthInches: number
  baseWeight: number
  hitchWeight?: number
  freshWaterCapacity?: number
  grayWaterCapacity?: number
  blackWaterCapacity?: number
  lpgCapacity?: number
  fuelCapacity?: number
  sleepingCapacity: number
  slideOuts: number

  // Engine/Chassis (motorized)
  chassisMake?: string
  chassisModel?: string
  engineType?: string
  engineSize?: string

  // Pricing
  baseMSRP: number
  dealerInvoice: number
  holdback?: number

  // Options & Colors
  availableExteriorColors?: string[]
  availableInteriorColors?: string[]
  standardFeatures?: string[]
  availableOptions?: string[]

  // Media
  heroImageUrl?: string
  galleryImages?: string[]
  brochureUrl?: string
  specSheetUrl?: string
  floorPlanUrl?: string

  status: 'active' | 'discontinued' | 'coming_soon'
  createdAt: Date
  updatedAt: Date
}

// RV Unit (individual unit tracked by VIN)
export interface RVUnit {
  id: string
  vin: string
  stockNumber?: string

  // Model
  modelId: string
  model?: RVModel
  modelYear: number

  // Configuration
  exteriorColor: string
  interiorColor?: string
  installedOptions?: string[]

  // Condition
  condition: RVUnitCondition
  mileage?: number
  hours?: number
  conditionNotes?: string

  // Status
  status: RVUnitStatus
  availableDate?: Date

  // Location
  dealerId: string
  dealerName?: string
  locationId?: string
  locationName?: string
  lotLocation?: string

  // Pricing
  msrp: number
  invoiceCost: number
  internetPrice?: number
  minimumPrice?: number

  // Floor Plan
  floorPlanLender?: string
  floorPlanNumber?: string
  floorPlanPayoff?: number
  floorPlanDueDate?: Date
  floorPlanInterestRate?: number

  // Dates
  receivedDate?: Date
  lastServiceDate?: Date
  soldDate?: Date
  daysOnLot?: number

  // Warranty
  warrantyStartDate?: Date
  warrantyEndDate?: Date
  extendedWarrantyId?: string

  // Media
  photos?: string[]
  videoUrl?: string

  createdAt: Date
  updatedAt: Date
}

// Vehicle Order
export interface VehicleOrder {
  id: string
  orderNumber: string

  dealerId: string
  dealerName?: string
  salesPersonId?: string
  salesPersonName?: string

  orderType: VehicleOrderType

  // Unit
  rvUnitId?: string
  rvUnit?: RVUnit

  // Or Factory Order
  rvModelId?: string
  rvModel?: RVModel
  requestedExteriorColor?: string
  requestedInteriorColor?: string
  requestedOptions?: string[]

  // Customer
  customerType: 'retail' | 'wholesale' | 'internal'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }

  // Trade-In
  tradeInId?: string
  tradeIn?: TradeIn

  // Pricing
  unitPrice: number
  optionsPrice: number
  freightPrice: number
  prepFee: number
  docFee: number
  additionalFees?: { name: string; amount: number }[]
  tradeInAllowance: number
  tradeInPayoff: number
  rebatesApplied: number
  taxAmount: number
  totalPrice: number

  // Payment
  depositAmount: number
  depositDate?: Date
  paymentMethod?: string
  financingDetails?: {
    lender: string
    term: number
    rate: number
    monthlyPayment: number
  }

  // Delivery
  deliveryMethod?: string
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  requestedDeliveryDate?: Date
  estimatedDeliveryDate?: Date
  actualDeliveryDate?: Date
  deliveryNotes?: string

  // Documentation
  documentsComplete: boolean
  titleReceived: boolean
  titleSent: boolean
  registrationComplete: boolean

  // Status
  status: VehicleOrderStatus

  // Notes
  internalNotes?: string
  customerNotes?: string

  // Timestamps
  quotedAt?: Date
  submittedAt?: Date
  approvedAt?: Date
  confirmedAt?: Date
  cancelledAt?: Date
  cancelReason?: string
  completedAt?: Date

  createdAt: Date
  updatedAt: Date
}

// Trade-In
export interface TradeIn {
  id: string

  vehicleType: 'rv' | 'auto' | 'truck' | 'motorcycle' | 'boat'
  year: number
  make: string
  model: string
  trim?: string
  vin?: string

  // Condition
  mileage?: number
  hours?: number
  condition: TradeInCondition
  conditionNotes?: string

  // RV-specific
  rvClass?: string
  lengthFeet?: number
  slideOuts?: number

  // Valuation
  estimatedValue: number
  nadaValue?: number
  appraisedValue?: number
  approvedValue?: number
  acv?: number

  // Lien
  hasLien: boolean
  lienHolder?: string
  lienPayoff?: number
  lienPayoffGoodThrough?: Date

  photos?: string[]
  status: TradeInStatus

  appraisalNotes?: string
  internalNotes?: string

  createdAt: Date
  updatedAt: Date
}

// Service Record
export interface ServiceRecord {
  id: string
  rvUnitId: string

  serviceType: 'warranty' | 'recall' | 'customer_pay' | 'pdi' | 'internal'
  serviceNumber?: string

  description: string
  complaint?: string
  cause?: string
  correction?: string

  laborHours?: number
  laborRate?: number
  laborCost?: number
  partsCost?: number
  subletCost?: number
  totalCost?: number

  partsUsed?: { partNumber: string; name: string; qty: number; cost: number }[]

  mileageIn?: number
  hoursIn?: number

  technicianId?: string
  technicianName?: string

  status: 'open' | 'in_progress' | 'completed' | 'cancelled'

  warrantyClaimId?: string

  dateIn: Date
  dateOut?: Date
  promisedDate?: Date

  createdAt: Date
  updatedAt: Date
}

// Dashboard Metrics
export interface RVInventoryMetrics {
  unitsInStock: number
  unitsInTransit: number
  unitsReserved: number
  unitsSoldMTD: number
  unitsSoldYTD: number

  totalInventoryValue: number
  totalFloorPlanExposure: number
  averageDaysOnLot: number

  newUnits: number
  usedUnits: number
  demoUnits: number

  // Aging buckets
  units0to30Days: number
  units31to60Days: number
  units61to90Days: number
  unitsOver90Days: number
}

// Filter options for inventory
export interface RVInventoryFilters {
  status?: RVUnitStatus[]
  condition?: RVUnitCondition[]
  classType?: RVClassType[]
  series?: string[]
  modelYear?: number[]
  priceMin?: number
  priceMax?: number
  search?: string
}
