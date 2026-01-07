import { prisma } from '@/lib/prisma'
import type { RVUnit, RVModel, RVInventoryMetrics, RVInventoryFilters } from '@/types/rv'

// Get RV inventory for a dealer with filters
export async function getRVInventory(
  dealerId: string,
  filters: RVInventoryFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ units: RVUnit[]; total: number; pages: number }> {
  const where: any = { dealerId }

  // Apply filters
  if (filters.status?.length) {
    where.status = { in: filters.status }
  }
  if (filters.condition?.length) {
    where.condition = { in: filters.condition }
  }
  if (filters.modelYear?.length) {
    where.modelYear = { in: filters.modelYear }
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.msrp = {}
    if (filters.priceMin !== undefined) where.msrp.gte = filters.priceMin
    if (filters.priceMax !== undefined) where.msrp.lte = filters.priceMax
  }
  if (filters.search) {
    where.OR = [
      { vin: { contains: filters.search } },
      { stockNumber: { contains: filters.search } },
      { model: { name: { contains: filters.search } } },
      { model: { series: { contains: filters.search } } },
    ]
  }
  if (filters.classType?.length) {
    where.model = { ...where.model, classType: { in: filters.classType } }
  }
  if (filters.series?.length) {
    where.model = { ...where.model, series: { in: filters.series } }
  }

  const [units, total] = await Promise.all([
    prisma.rVUnit.findMany({
      where,
      include: {
        model: true,
        location: true,
      },
      orderBy: [
        { status: 'asc' },
        { receivedDate: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.rVUnit.count({ where }),
  ])

  return {
    units: units.map(mapRVUnit),
    total,
    pages: Math.ceil(total / pageSize),
  }
}

// Get a single RV unit by VIN
export async function getRVUnitByVin(vin: string): Promise<RVUnit | null> {
  const unit = await prisma.rVUnit.findUnique({
    where: { vin },
    include: {
      model: true,
      location: true,
      dealer: true,
      warrantyClaims: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      serviceRecords: {
        orderBy: { dateIn: 'desc' },
        take: 10,
      },
      vehicleOrders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!unit) return null
  return mapRVUnit(unit)
}

// Get RV inventory metrics/dashboard data
export async function getRVInventoryMetrics(dealerId: string): Promise<RVInventoryMetrics> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const [
    inStock,
    inTransit,
    reserved,
    soldMTD,
    soldYTD,
    newUnits,
    usedUnits,
    demoUnits,
    inventoryValue,
    floorPlanExposure,
    units0to30,
    units31to60,
    units61to90,
    unitsOver90,
    avgDaysOnLot,
  ] = await Promise.all([
    prisma.rVUnit.count({ where: { dealerId, status: 'in_stock' } }),
    prisma.rVUnit.count({ where: { dealerId, status: 'in_transit' } }),
    prisma.rVUnit.count({ where: { dealerId, status: 'reserved' } }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'sold', soldDate: { gte: startOfMonth } },
    }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'sold', soldDate: { gte: startOfYear } },
    }),
    prisma.rVUnit.count({ where: { dealerId, condition: 'new', status: { in: ['in_stock', 'in_transit'] } } }),
    prisma.rVUnit.count({ where: { dealerId, condition: 'used', status: { in: ['in_stock', 'in_transit'] } } }),
    prisma.rVUnit.count({ where: { dealerId, condition: 'demo', status: { in: ['in_stock', 'in_transit'] } } }),
    prisma.rVUnit.aggregate({
      where: { dealerId, status: { in: ['in_stock', 'in_transit', 'reserved'] } },
      _sum: { invoiceCost: true },
    }),
    prisma.rVUnit.aggregate({
      where: { dealerId, status: { in: ['in_stock', 'in_transit', 'reserved'] }, floorPlanPayoff: { not: null } },
      _sum: { floorPlanPayoff: true },
    }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'in_stock', receivedDate: { gte: thirtyDaysAgo } },
    }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'in_stock', receivedDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'in_stock', receivedDate: { gte: ninetyDaysAgo, lt: sixtyDaysAgo } },
    }),
    prisma.rVUnit.count({
      where: { dealerId, status: 'in_stock', receivedDate: { lt: ninetyDaysAgo } },
    }),
    prisma.rVUnit.aggregate({
      where: { dealerId, status: 'in_stock', daysOnLot: { not: null } },
      _avg: { daysOnLot: true },
    }),
  ])

  return {
    unitsInStock: inStock,
    unitsInTransit: inTransit,
    unitsReserved: reserved,
    unitsSoldMTD: soldMTD,
    unitsSoldYTD: soldYTD,
    totalInventoryValue: inventoryValue._sum.invoiceCost || 0,
    totalFloorPlanExposure: floorPlanExposure._sum.floorPlanPayoff || 0,
    averageDaysOnLot: Math.round(avgDaysOnLot._avg.daysOnLot || 0),
    newUnits,
    usedUnits,
    demoUnits,
    units0to30Days: units0to30,
    units31to60Days: units31to60,
    units61to90Days: units61to90,
    unitsOver90Days: unitsOver90,
  }
}

// Get all RV models for filtering/selection
export async function getRVModels(filters?: {
  status?: string
  classType?: string
  modelYear?: number
}): Promise<RVModel[]> {
  const where: any = {}
  if (filters?.status) where.status = filters.status
  if (filters?.classType) where.classType = filters.classType
  if (filters?.modelYear) where.modelYear = filters.modelYear

  const models = await prisma.rVModel.findMany({
    where,
    orderBy: [{ series: 'asc' }, { name: 'asc' }],
  })

  return models.map(mapRVModel)
}

// Get unique series for filtering
export async function getRVSeries(): Promise<string[]> {
  const series = await prisma.rVModel.findMany({
    where: { status: 'active' },
    distinct: ['series'],
    select: { series: true },
    orderBy: { series: 'asc' },
  })
  return series.map((s) => s.series)
}

// Get model years for filtering
export async function getRVModelYears(): Promise<number[]> {
  const years = await prisma.rVModel.findMany({
    distinct: ['modelYear'],
    select: { modelYear: true },
    orderBy: { modelYear: 'desc' },
  })
  return years.map((y) => y.modelYear)
}

// Update RV unit status
export async function updateRVUnitStatus(
  vin: string,
  status: string,
  updates?: Partial<{
    soldDate: Date
    lotLocation: string
    internetPrice: number
  }>
): Promise<RVUnit> {
  const unit = await prisma.rVUnit.update({
    where: { vin },
    data: {
      status,
      ...updates,
      updatedAt: new Date(),
    },
    include: { model: true, location: true },
  })
  return mapRVUnit(unit)
}

// Search RV units by VIN (for autocomplete)
export async function searchRVUnitsByVin(
  dealerId: string,
  query: string,
  limit: number = 10
): Promise<{ vin: string; stockNumber: string | null; modelName: string; status: string }[]> {
  const units = await prisma.rVUnit.findMany({
    where: {
      dealerId,
      OR: [
        { vin: { contains: query } },
        { stockNumber: { contains: query } },
      ],
    },
    include: { model: true },
    take: limit,
  })

  return units.map((u) => ({
    vin: u.vin,
    stockNumber: u.stockNumber,
    modelName: `${u.modelYear} ${u.model.series} ${u.model.name}`,
    status: u.status,
  }))
}

// Map database model to type
function mapRVUnit(unit: any): RVUnit {
  return {
    id: unit.id,
    vin: unit.vin,
    stockNumber: unit.stockNumber,
    modelId: unit.modelId,
    model: unit.model ? mapRVModel(unit.model) : undefined,
    modelYear: unit.modelYear,
    exteriorColor: unit.exteriorColor,
    interiorColor: unit.interiorColor,
    installedOptions: unit.installedOptions ? JSON.parse(unit.installedOptions) : undefined,
    condition: unit.condition,
    mileage: unit.mileage,
    hours: unit.hours,
    conditionNotes: unit.conditionNotes,
    status: unit.status,
    availableDate: unit.availableDate,
    dealerId: unit.dealerId,
    dealerName: unit.dealer?.name,
    locationId: unit.locationId,
    locationName: unit.location?.name,
    lotLocation: unit.lotLocation,
    msrp: unit.msrp,
    invoiceCost: unit.invoiceCost,
    internetPrice: unit.internetPrice,
    minimumPrice: unit.minimumPrice,
    floorPlanLender: unit.floorPlanLender,
    floorPlanNumber: unit.floorPlanNumber,
    floorPlanPayoff: unit.floorPlanPayoff,
    floorPlanDueDate: unit.floorPlanDueDate,
    floorPlanInterestRate: unit.floorPlanInterestRate,
    receivedDate: unit.receivedDate,
    lastServiceDate: unit.lastServiceDate,
    soldDate: unit.soldDate,
    daysOnLot: unit.daysOnLot,
    warrantyStartDate: unit.warrantyStartDate,
    warrantyEndDate: unit.warrantyEndDate,
    extendedWarrantyId: unit.extendedWarrantyId,
    photos: unit.photos ? JSON.parse(unit.photos) : undefined,
    videoUrl: unit.videoUrl,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  }
}

function mapRVModel(model: any): RVModel {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    series: model.series,
    classType: model.classType,
    modelYear: model.modelYear,
    lengthFeet: model.lengthFeet,
    lengthInches: model.lengthInches,
    baseWeight: model.baseWeight,
    hitchWeight: model.hitchWeight,
    freshWaterCapacity: model.freshWaterCapacity,
    grayWaterCapacity: model.grayWaterCapacity,
    blackWaterCapacity: model.blackWaterCapacity,
    lpgCapacity: model.lpgCapacity,
    fuelCapacity: model.fuelCapacity,
    sleepingCapacity: model.sleepingCapacity,
    slideOuts: model.slideOuts,
    chassisMake: model.chassisMake,
    chassisModel: model.chassisModel,
    engineType: model.engineType,
    engineSize: model.engineSize,
    baseMSRP: model.baseMSRP,
    dealerInvoice: model.dealerInvoice,
    holdback: model.holdback,
    availableExteriorColors: model.availableExteriorColors ? JSON.parse(model.availableExteriorColors) : undefined,
    availableInteriorColors: model.availableInteriorColors ? JSON.parse(model.availableInteriorColors) : undefined,
    standardFeatures: model.standardFeatures ? JSON.parse(model.standardFeatures) : undefined,
    availableOptions: model.availableOptions ? JSON.parse(model.availableOptions) : undefined,
    heroImageUrl: model.heroImageUrl,
    galleryImages: model.galleryImages ? JSON.parse(model.galleryImages) : undefined,
    brochureUrl: model.brochureUrl,
    specSheetUrl: model.specSheetUrl,
    floorPlanUrl: model.floorPlanUrl,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  }
}
