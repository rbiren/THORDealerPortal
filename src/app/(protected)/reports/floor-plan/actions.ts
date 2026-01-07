'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export type FloorPlanSummary = {
  totalExposure: number
  totalUnits: number
  avgPayoffPerUnit: number
  monthlyInterestEstimate: number
  unitsNearPayoff: number
  overdueUnits: number
  byLender: FloorPlanByLender[]
}

export type FloorPlanByLender = {
  lender: string
  unitCount: number
  totalPayoff: number
  avgInterestRate: number
  percentage: number
}

export type FloorPlanUnit = {
  id: string
  vin: string
  stockNumber: string | null
  modelYear: number
  series: string
  modelName: string
  condition: string
  floorPlanLender: string
  floorPlanNumber: string | null
  floorPlanPayoff: number
  floorPlanDueDate: Date | null
  floorPlanInterestRate: number | null
  daysOnFloorPlan: number
  monthlyInterest: number
  receivedDate: Date
  msrp: number
  invoiceCost: number
  isOverdue: boolean
  daysUntilDue: number | null
}

export async function getFloorPlanSummary(): Promise<FloorPlanSummary> {
  const session = await auth()
  if (!session?.user?.dealerId) {
    return {
      totalExposure: 0,
      totalUnits: 0,
      avgPayoffPerUnit: 0,
      monthlyInterestEstimate: 0,
      unitsNearPayoff: 0,
      overdueUnits: 0,
      byLender: [],
    }
  }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const baseWhere = {
    dealerId: session.user.dealerId,
    status: { in: ['in_stock', 'in_transit', 'reserved'] },
    floorPlanPayoff: { not: null, gt: 0 },
  }

  const [aggregate, nearPayoff, overdue, units] = await Promise.all([
    prisma.rVUnit.aggregate({
      where: baseWhere,
      _count: true,
      _sum: { floorPlanPayoff: true },
      _avg: { floorPlanInterestRate: true },
    }),
    prisma.rVUnit.count({
      where: {
        ...baseWhere,
        floorPlanDueDate: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    prisma.rVUnit.count({
      where: {
        ...baseWhere,
        floorPlanDueDate: { lt: now },
      },
    }),
    prisma.rVUnit.findMany({
      where: baseWhere,
      select: {
        floorPlanLender: true,
        floorPlanPayoff: true,
        floorPlanInterestRate: true,
      },
    }),
  ])

  // Group by lender
  const lenderMap = new Map<string, { count: number; payoff: number; totalRate: number; rateCount: number }>()
  let totalPayoff = 0

  for (const unit of units) {
    const lender = unit.floorPlanLender || 'Unknown'
    const existing = lenderMap.get(lender) || { count: 0, payoff: 0, totalRate: 0, rateCount: 0 }
    existing.count++
    existing.payoff += unit.floorPlanPayoff || 0
    if (unit.floorPlanInterestRate) {
      existing.totalRate += unit.floorPlanInterestRate
      existing.rateCount++
    }
    lenderMap.set(lender, existing)
    totalPayoff += unit.floorPlanPayoff || 0
  }

  const byLender: FloorPlanByLender[] = []
  for (const [lender, data] of lenderMap) {
    byLender.push({
      lender,
      unitCount: data.count,
      totalPayoff: data.payoff,
      avgInterestRate: data.rateCount > 0 ? Math.round((data.totalRate / data.rateCount) * 100) / 100 : 0,
      percentage: totalPayoff > 0 ? Math.round((data.payoff / totalPayoff) * 100) : 0,
    })
  }

  byLender.sort((a, b) => b.totalPayoff - a.totalPayoff)

  // Calculate estimated monthly interest
  const avgRate = aggregate._avg.floorPlanInterestRate || 5
  const monthlyInterest = Math.round((totalPayoff * (avgRate / 100)) / 12)

  return {
    totalExposure: aggregate._sum.floorPlanPayoff || 0,
    totalUnits: aggregate._count || 0,
    avgPayoffPerUnit: aggregate._count > 0 ? Math.round((aggregate._sum.floorPlanPayoff || 0) / aggregate._count) : 0,
    monthlyInterestEstimate: monthlyInterest,
    unitsNearPayoff: nearPayoff,
    overdueUnits: overdue,
    byLender,
  }
}

export async function getFloorPlanUnits(
  lender?: string,
  showOverdueOnly: boolean = false,
  sortBy: 'floorPlanPayoff' | 'floorPlanDueDate' | 'daysOnLot' = 'floorPlanDueDate',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<FloorPlanUnit[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const now = new Date()
  const where: any = {
    dealerId: session.user.dealerId,
    status: { in: ['in_stock', 'in_transit', 'reserved'] },
    floorPlanPayoff: { not: null, gt: 0 },
  }

  if (lender) {
    where.floorPlanLender = lender
  }

  if (showOverdueOnly) {
    where.floorPlanDueDate = { lt: now }
  }

  const units = await prisma.rVUnit.findMany({
    where,
    include: {
      model: { select: { name: true, series: true } },
    },
    orderBy: sortBy === 'daysOnLot' ? { receivedDate: sortOrder } : { [sortBy]: sortOrder },
  })

  return units.map((unit) => {
    const payoff = unit.floorPlanPayoff || 0
    const rate = unit.floorPlanInterestRate || 5
    const monthlyInterest = Math.round((payoff * (rate / 100)) / 12)
    const receivedDate = unit.receivedDate || now
    const daysOnFloorPlan = Math.floor((now.getTime() - receivedDate.getTime()) / (24 * 60 * 60 * 1000))

    let isOverdue = false
    let daysUntilDue: number | null = null
    if (unit.floorPlanDueDate) {
      const dueDate = new Date(unit.floorPlanDueDate)
      isOverdue = dueDate < now
      daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    }

    return {
      id: unit.id,
      vin: unit.vin,
      stockNumber: unit.stockNumber,
      modelYear: unit.modelYear,
      series: unit.model?.series || 'Unknown',
      modelName: unit.model?.name || 'Unknown',
      condition: unit.condition,
      floorPlanLender: unit.floorPlanLender || 'Unknown',
      floorPlanNumber: unit.floorPlanNumber,
      floorPlanPayoff: payoff,
      floorPlanDueDate: unit.floorPlanDueDate,
      floorPlanInterestRate: unit.floorPlanInterestRate,
      daysOnFloorPlan,
      monthlyInterest,
      receivedDate: unit.receivedDate!,
      msrp: unit.msrp || 0,
      invoiceCost: unit.invoiceCost || 0,
      isOverdue,
      daysUntilDue,
    }
  })
}

export async function getFloorPlanLenders(): Promise<string[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const lenders = await prisma.rVUnit.findMany({
    where: {
      dealerId: session.user.dealerId,
      status: { in: ['in_stock', 'in_transit', 'reserved'] },
      floorPlanPayoff: { not: null, gt: 0 },
      floorPlanLender: { not: null },
    },
    distinct: ['floorPlanLender'],
    select: { floorPlanLender: true },
  })

  return lenders.map((l) => l.floorPlanLender!).filter(Boolean).sort()
}
