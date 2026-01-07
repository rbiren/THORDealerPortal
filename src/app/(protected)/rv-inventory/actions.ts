'use server'

import { getServerSession } from '@/lib/auth'
import {
  getRVInventory,
  getRVInventoryMetrics,
  getRVModels,
  getRVSeries,
  getRVModelYears,
  searchRVUnitsByVin,
  updateRVUnitStatus,
} from '@/lib/services/rv-inventory'
import type { RVInventoryFilters } from '@/types/rv'

export async function fetchRVInventory(filters: RVInventoryFilters = {}, page: number = 1) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return getRVInventory(session.user.dealerId, filters, page)
}

export async function fetchRVInventoryMetrics() {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return getRVInventoryMetrics(session.user.dealerId)
}

export async function fetchRVModels(filters?: { status?: string; classType?: string; modelYear?: number }) {
  return getRVModels(filters)
}

export async function fetchRVSeries() {
  return getRVSeries()
}

export async function fetchRVModelYears() {
  return getRVModelYears()
}

export async function searchUnits(query: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return searchRVUnitsByVin(session.user.dealerId, query)
}

export async function updateUnitStatus(vin: string, status: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return updateRVUnitStatus(vin, status)
}
