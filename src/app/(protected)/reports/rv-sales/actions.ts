'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export type RVSalesSummary = {
  totalUnitsSold: number
  totalRevenue: number
  totalCost: number
  totalGrossProfit: number
  avgGrossPerUnit: number
  avgDaysToSell: number
  newUnitsSold: number
  usedUnitsSold: number
}

export type RVSalesByMonth = {
  month: string
  monthLabel: string
  unitsSold: number
  revenue: number
  grossProfit: number
}

export type RVSalesBySeries = {
  series: string
  unitsSold: number
  revenue: number
  grossProfit: number
  avgGross: number
  percentage: number
}

export type RVSoldUnit = {
  id: string
  vin: string
  stockNumber: string | null
  modelYear: number
  series: string
  modelName: string
  condition: string
  soldDate: Date
  daysOnLot: number | null
  salePrice: number
  cost: number
  grossProfit: number
}

export async function getRVSalesSummary(
  dateFrom?: Date,
  dateTo?: Date
): Promise<RVSalesSummary> {
  const session = await auth()
  if (!session?.user?.dealerId) {
    return {
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalGrossProfit: 0,
      avgGrossPerUnit: 0,
      avgDaysToSell: 0,
      newUnitsSold: 0,
      usedUnitsSold: 0,
    }
  }

  const where: any = {
    dealerId: session.user.dealerId,
    status: 'sold',
    soldDate: { not: null },
  }

  if (dateFrom || dateTo) {
    where.soldDate = {}
    if (dateFrom) where.soldDate.gte = dateFrom
    if (dateTo) where.soldDate.lte = dateTo
  }

  const [aggregate, newCount, usedCount, avgDays] = await Promise.all([
    prisma.rVUnit.aggregate({
      where,
      _count: true,
      _sum: {
        msrp: true,
        invoiceCost: true,
      },
    }),
    prisma.rVUnit.count({ where: { ...where, condition: 'new' } }),
    prisma.rVUnit.count({ where: { ...where, condition: { in: ['used', 'demo'] } } }),
    prisma.rVUnit.aggregate({
      where: { ...where, daysOnLot: { not: null } },
      _avg: { daysOnLot: true },
    }),
  ])

  const totalRevenue = aggregate._sum.msrp || 0
  const totalCost = aggregate._sum.invoiceCost || 0
  const totalGrossProfit = totalRevenue - totalCost
  const unitsSold = aggregate._count || 0

  return {
    totalUnitsSold: unitsSold,
    totalRevenue,
    totalCost,
    totalGrossProfit,
    avgGrossPerUnit: unitsSold > 0 ? Math.round(totalGrossProfit / unitsSold) : 0,
    avgDaysToSell: Math.round(avgDays._avg.daysOnLot || 0),
    newUnitsSold: newCount,
    usedUnitsSold: usedCount,
  }
}

export async function getRVSalesByMonth(
  months: number = 12
): Promise<RVSalesByMonth[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const results: RVSalesByMonth[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const aggregate = await prisma.rVUnit.aggregate({
      where: {
        dealerId: session.user.dealerId,
        status: 'sold',
        soldDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: true,
      _sum: {
        msrp: true,
        invoiceCost: true,
      },
    })

    const revenue = aggregate._sum.msrp || 0
    const cost = aggregate._sum.invoiceCost || 0

    results.push({
      month: monthStart.toISOString().slice(0, 7),
      monthLabel: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      unitsSold: aggregate._count || 0,
      revenue,
      grossProfit: revenue - cost,
    })
  }

  return results
}

export async function getRVSalesBySeries(
  dateFrom?: Date,
  dateTo?: Date
): Promise<RVSalesBySeries[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const where: any = {
    dealerId: session.user.dealerId,
    status: 'sold',
    soldDate: { not: null },
  }

  if (dateFrom || dateTo) {
    where.soldDate = {}
    if (dateFrom) where.soldDate.gte = dateFrom
    if (dateTo) where.soldDate.lte = dateTo
  }

  const units = await prisma.rVUnit.findMany({
    where,
    include: { model: { select: { series: true } } },
  })

  // Group by series
  const seriesMap = new Map<string, { count: number; revenue: number; cost: number }>()
  let totalUnits = 0

  for (const unit of units) {
    const series = unit.model?.series || 'Unknown'
    const existing = seriesMap.get(series) || { count: 0, revenue: 0, cost: 0 }
    existing.count++
    existing.revenue += unit.msrp || 0
    existing.cost += unit.invoiceCost || 0
    seriesMap.set(series, existing)
    totalUnits++
  }

  const results: RVSalesBySeries[] = []
  for (const [series, data] of seriesMap) {
    const grossProfit = data.revenue - data.cost
    results.push({
      series,
      unitsSold: data.count,
      revenue: data.revenue,
      grossProfit,
      avgGross: data.count > 0 ? Math.round(grossProfit / data.count) : 0,
      percentage: totalUnits > 0 ? Math.round((data.count / totalUnits) * 100) : 0,
    })
  }

  return results.sort((a, b) => b.unitsSold - a.unitsSold)
}

export async function getRecentRVSales(limit: number = 20): Promise<RVSoldUnit[]> {
  const session = await auth()
  if (!session?.user?.dealerId) return []

  const units = await prisma.rVUnit.findMany({
    where: {
      dealerId: session.user.dealerId,
      status: 'sold',
      soldDate: { not: null },
    },
    include: {
      model: { select: { name: true, series: true } },
    },
    orderBy: { soldDate: 'desc' },
    take: limit,
  })

  return units.map((unit) => ({
    id: unit.id,
    vin: unit.vin,
    stockNumber: unit.stockNumber,
    modelYear: unit.modelYear,
    series: unit.model?.series || 'Unknown',
    modelName: unit.model?.name || 'Unknown',
    condition: unit.condition,
    soldDate: unit.soldDate!,
    daysOnLot: unit.daysOnLot,
    salePrice: unit.msrp || 0,
    cost: unit.invoiceCost || 0,
    grossProfit: (unit.msrp || 0) - (unit.invoiceCost || 0),
  }))
}
