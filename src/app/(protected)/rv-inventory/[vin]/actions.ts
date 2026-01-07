'use server'

import { getServerSession } from '@/lib/auth'
import { getRVUnitByVin } from '@/lib/services/rv-inventory'
import { prisma } from '@/lib/prisma'

export async function fetchRVUnitByVin(vin: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return getRVUnitByVin(vin)
}

export async function fetchUnitServiceHistory(vin: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  const unit = await prisma.rVUnit.findUnique({
    where: { vin },
    include: {
      serviceRecords: {
        orderBy: { dateIn: 'desc' },
      },
    },
  })

  return unit?.serviceRecords || []
}

export async function fetchUnitWarrantyClaims(vin: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  const claims = await prisma.warrantyClaim.findMany({
    where: { vin },
    orderBy: { createdAt: 'desc' },
    include: {
      submittedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  return claims
}

export async function fetchUnitOrders(vin: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  const unit = await prisma.rVUnit.findUnique({
    where: { vin },
    include: {
      vehicleOrders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return unit?.vehicleOrders || []
}
