'use server'

import { getServerSession } from '@/lib/auth'
import {
  getVehicleOrders,
  getVehicleOrder,
  createVehicleOrder,
  updateVehicleOrderStatus,
  addTradeInToOrder,
} from '@/lib/services/vehicle-orders'
import { getRVUnitByVin, getRVModels, searchRVUnitsByVin } from '@/lib/services/rv-inventory'
import type { VehicleOrderStatus } from '@/types/rv'

export async function fetchVehicleOrders(
  filters: {
    status?: VehicleOrderStatus[]
    orderType?: string
    search?: string
  } = {},
  page: number = 1
) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return getVehicleOrders(session.user.dealerId, filters, page)
}

export async function fetchVehicleOrder(orderNumber: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return getVehicleOrder(orderNumber)
}

export async function createOrder(data: {
  orderType: 'stock' | 'factory' | 'locate'
  rvUnitId?: string
  rvModelId?: string
  requestedExteriorColor?: string
  requestedInteriorColor?: string
  requestedOptions?: string[]
  customerType?: 'retail' | 'wholesale' | 'internal'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  unitPrice: number
  optionsPrice?: number
  freightPrice?: number
  prepFee?: number
  docFee?: number
}) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return createVehicleOrder(session.user.dealerId, data)
}

export async function updateOrderStatus(
  orderNumber: string,
  status: VehicleOrderStatus,
  note?: string
) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return updateVehicleOrderStatus(orderNumber, status, session.user.id, note)
}

export async function addTradeIn(
  orderNumber: string,
  tradeInData: {
    vehicleType: string
    year: number
    make: string
    model: string
    trim?: string
    vin?: string
    mileage?: number
    condition: string
    estimatedValue: number
    hasLien?: boolean
    lienHolder?: string
    lienPayoff?: number
  }
) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return addTradeInToOrder(orderNumber, tradeInData)
}

export async function fetchRVUnitForOrder(vin: string) {
  return getRVUnitByVin(vin)
}

export async function fetchRVModelsForOrder() {
  return getRVModels({ status: 'active' })
}

export async function searchInventoryUnits(query: string) {
  const session = await getServerSession()
  if (!session?.user?.dealerId) {
    throw new Error('Unauthorized')
  }

  return searchRVUnitsByVin(session.user.dealerId, query)
}
