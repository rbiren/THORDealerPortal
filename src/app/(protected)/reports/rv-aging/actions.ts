'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export type AgingBucket = {
  bucket: string
  minDays: number
  maxDays: number | null
  unitCount: number
  totalValue: number
  percentage: number
}

export type AgingUnit = {
  id: string
  vin: string
  stockNumber: string | null
  modelYear: number
  series: string
  modelName: string
  condition: string
  receivedDate: Date
  daysOnLot: number
  msrp: number
  invoiceCost: number
  floorPlanPayoff: number | null
  dailyCarryingCost: number
  totalCarryingCost: number
}

export type AgingSummary = {
  totalUnits: number
  totalValue: number
  avgDaysOnLot: number
  unitsOver60Days: number
  unitsOver90Days: number
  unitsOver120Days: number
  totalCarryingCost: number
}

const AGING_BUCKETS = [
  { bucket: '0-30 days', minDays: 0, maxDays: 30 },
  { bucket: '31-60 days', minDays: 31, maxDays: 60 },
  { bucket: '61-90 days', minDays: 61, maxDays: 90 },
  { bucket: '91-120 days', minDays: 91, maxDays: 120 },
  { bucket: '120+ days', minDays: 121, maxDays: null },
]

// Assume ~5% annual floor plan interest rate -> daily rate
const DAILY_INTEREST_RATE = 0.05 / 365

export async function getRVAgingSummary(): Promise<AgingSummary> {
  const session = await auth()
  if (!session?.user?.dealerId) {
    return {
      totalUnits: 0,
      totalValue: 0,
      avgDaysOnLot: 0,
      unitsOver60Days: 0,
      unitsOver90Days: 0,
      unitsOver120Days: 0,
      totalCarryingCost: 0,
    }
  }

  const now = new Date()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const onetwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)

  const baseWhere = {
    dealerId: session.user.dealerId,
    status: { in: ['in_stock', 'reserved'] },
  }

  const [aggregate, over60, over90, over120, units] = await Promise.all([
    prisma.rVUnit.aggregate({
      where: baseWhere,
      _count: true,
      _sum: { invoiceCost: true },
      _avg: { daysOnLot: true },
    }),
    prisma.rVUnit.count({ where: { ...baseWhere, receivedDate: { lt: sixtyDaysAgo } } }),
    prisma.rVUnit.count({ where: { ...baseWhere, receivedDate: { lt: ninetyDaysAgo } } }),
    prisma.rVUnit.count({ where: { ...baseWhere, receivedDate: { lt: onetwentyDaysAgo } } }),
    prisma.rVUnit.findMany({
      where: baseWhere,
      select: { invoiceCost: true, daysOnLot: true },
    }),
  ])

  // Calculate total carrying cost
  let totalCarryingCost = 0
  for (const unit of units) {
    const days = unit.daysOnLot || 0
    const cost = unit.invoiceCost || 0
    totalCarryingCost += cost * DAILY_INTEREST_RATE * days
  }

  return {
    totalUnits: aggregate._count || 0,
    totalValue: aggregate._sum.invoiceCost || 0,
    avgDaysOnLot: Math.round(aggregate._avg.daysOnLot || 0),
    unitsOver60Days: over60,
    unitsOver90Days: over90,
    unitsOver120Days: over120,
    totalCarryingCost: Math.round(totalCarryingCost),
  }
}

export async function getRVAgingBuckets(): Promise<AgingBucket[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const now = new Date()

  const results: AgingBucket[] = []
  let totalUnits = 0

  for (const bucket of AGING_BUCKETS) {
    const maxDate = new Date(now.getTime() - bucket.minDays * 24 * 60 * 60 * 1000)
    const minDate = bucket.maxDays
      ? new Date(now.getTime() - bucket.maxDays * 24 * 60 * 60 * 1000)
      : undefined

    const where: any = {
      dealerId: session.user.dealerId,
      status: { in: ['in_stock', 'reserved'] },
      receivedDate: { lte: maxDate },
    }

    if (minDate) {
      where.receivedDate.gt = minDate
    }

    const aggregate = await prisma.rVUnit.aggregate({
      where,
      _count: true,
      _sum: { invoiceCost: true },
    })

    results.push({
      bucket: bucket.bucket,
      minDays: bucket.minDays,
      maxDays: bucket.maxDays,
      unitCount: aggregate._count || 0,
      totalValue: aggregate._sum.invoiceCost || 0,
      percentage: 0,
    })

    totalUnits += aggregate._count || 0
  }

  // Calculate percentages
  for (const result of results) {
    result.percentage = totalUnits > 0 ? Math.round((result.unitCount / totalUnits) * 100) : 0
  }

  return results
}

export async function getAgingUnits(
  minDays?: number,
  maxDays?: number,
  sortBy: 'daysOnLot' | 'invoiceCost' | 'receivedDate' = 'daysOnLot',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<AgingUnit[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const now = new Date()
  const where: any = {
    dealerId: session.user.dealerId,
    status: { in: ['in_stock', 'reserved'] },
  }

  if (minDays !== undefined || maxDays !== undefined) {
    where.receivedDate = {}
    if (minDays !== undefined) {
      where.receivedDate.lte = new Date(now.getTime() - minDays * 24 * 60 * 60 * 1000)
    }
    if (maxDays !== undefined) {
      where.receivedDate.gt = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000)
    }
  }

  const units = await prisma.rVUnit.findMany({
    where,
    include: {
      model: { select: { name: true, series: true } },
    },
    orderBy: { [sortBy]: sortOrder },
  })

  return units.map((unit) => {
    const daysOnLot = unit.daysOnLot || 0
    const cost = unit.invoiceCost || 0
    const dailyCarryingCost = Math.round(cost * DAILY_INTEREST_RATE)
    const totalCarryingCost = Math.round(dailyCarryingCost * daysOnLot)

    return {
      id: unit.id,
      vin: unit.vin,
      stockNumber: unit.stockNumber,
      modelYear: unit.modelYear,
      series: unit.model?.series || 'Unknown',
      modelName: unit.model?.name || 'Unknown',
      condition: unit.condition,
      receivedDate: unit.receivedDate!,
      daysOnLot,
      msrp: unit.msrp || 0,
      invoiceCost: cost,
      floorPlanPayoff: unit.floorPlanPayoff,
      dailyCarryingCost,
      totalCarryingCost,
    }
  })
}

export async function getOldestInventory(limit: number = 20): Promise<AgingUnit[]> {
  return getAgingUnits(undefined, undefined, 'daysOnLot', 'desc').then((units) =>
    units.slice(0, limit)
  )
}
