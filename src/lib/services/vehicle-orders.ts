import { prisma } from '@/lib/prisma'
import type { VehicleOrder, VehicleOrderStatus } from '@/types/rv'

// Generate order number
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const lastOrder = await prisma.vehicleOrder.findFirst({
    where: {
      orderNumber: { startsWith: `VO-${year}` },
    },
    orderBy: { orderNumber: 'desc' },
  })

  let nextNum = 1
  if (lastOrder) {
    const match = lastOrder.orderNumber.match(/VO-\d{4}-(\d{5})/)
    if (match) {
      nextNum = parseInt(match[1]) + 1
    }
  }

  return `VO-${year}-${nextNum.toString().padStart(5, '0')}`
}

// Get vehicle orders for a dealer
export async function getVehicleOrders(
  dealerId: string,
  filters: {
    status?: VehicleOrderStatus[]
    orderType?: string
    search?: string
  } = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{ orders: VehicleOrder[]; total: number; pages: number }> {
  const where: any = { dealerId }

  if (filters.status?.length) {
    where.status = { in: filters.status }
  }
  if (filters.orderType) {
    where.orderType = filters.orderType
  }
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search } },
      { customerName: { contains: filters.search } },
      { rvUnit: { vin: { contains: filters.search } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.vehicleOrder.findMany({
      where,
      include: {
        rvUnit: {
          include: { model: true },
        },
        rvModel: true,
        tradeIn: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vehicleOrder.count({ where }),
  ])

  return {
    orders: orders.map(mapVehicleOrder),
    total,
    pages: Math.ceil(total / pageSize),
  }
}

// Get a single vehicle order
export async function getVehicleOrder(orderNumber: string): Promise<VehicleOrder | null> {
  const order = await prisma.vehicleOrder.findUnique({
    where: { orderNumber },
    include: {
      dealer: true,
      rvUnit: {
        include: { model: true },
      },
      rvModel: true,
      tradeIn: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order) return null
  return mapVehicleOrder(order)
}

// Create a new vehicle order (quote)
export async function createVehicleOrder(
  dealerId: string,
  data: {
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
  }
): Promise<VehicleOrder> {
  const orderNumber = await generateOrderNumber()

  const totalPrice =
    data.unitPrice +
    (data.optionsPrice || 0) +
    (data.freightPrice || 0) +
    (data.prepFee || 0) +
    (data.docFee || 0)

  const order = await prisma.vehicleOrder.create({
    data: {
      orderNumber,
      dealerId,
      orderType: data.orderType,
      rvUnitId: data.rvUnitId,
      rvModelId: data.rvModelId,
      requestedExteriorColor: data.requestedExteriorColor,
      requestedInteriorColor: data.requestedInteriorColor,
      requestedOptions: data.requestedOptions ? JSON.stringify(data.requestedOptions) : null,
      customerType: data.customerType || 'retail',
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      unitPrice: data.unitPrice,
      optionsPrice: data.optionsPrice || 0,
      freightPrice: data.freightPrice || 0,
      prepFee: data.prepFee || 0,
      docFee: data.docFee || 0,
      totalPrice,
      status: 'quote',
      quotedAt: new Date(),
    },
    include: {
      rvUnit: { include: { model: true } },
      rvModel: true,
    },
  })

  // Create status history entry
  await prisma.vehicleOrderStatusHistory.create({
    data: {
      orderId: order.id,
      toStatus: 'quote',
      note: 'Order created as quote',
    },
  })

  // If stock order, reserve the unit
  if (data.orderType === 'stock' && data.rvUnitId) {
    await prisma.rVUnit.update({
      where: { id: data.rvUnitId },
      data: { status: 'reserved' },
    })
  }

  return mapVehicleOrder(order)
}

// Update vehicle order status
export async function updateVehicleOrderStatus(
  orderNumber: string,
  newStatus: VehicleOrderStatus,
  userId?: string,
  note?: string
): Promise<VehicleOrder> {
  const order = await prisma.vehicleOrder.findUnique({
    where: { orderNumber },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  const updated = await prisma.vehicleOrder.update({
    where: { orderNumber },
    data: {
      status: newStatus,
      ...(newStatus === 'submitted' && { submittedAt: new Date() }),
      ...(newStatus === 'approved' && { approvedAt: new Date() }),
      ...(newStatus === 'confirmed' && { confirmedAt: new Date() }),
      ...(newStatus === 'completed' && { completedAt: new Date() }),
      ...(newStatus === 'cancelled' && { cancelledAt: new Date() }),
    },
    include: {
      rvUnit: { include: { model: true } },
      rvModel: true,
    },
  })

  // Create status history
  await prisma.vehicleOrderStatusHistory.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: newStatus,
      changedById: userId,
      note,
    },
  })

  // Update unit status if completed or cancelled
  if (updated.rvUnitId) {
    if (newStatus === 'completed') {
      await prisma.rVUnit.update({
        where: { id: updated.rvUnitId },
        data: {
          status: 'sold',
          soldDate: new Date(),
        },
      })
    } else if (newStatus === 'cancelled') {
      await prisma.rVUnit.update({
        where: { id: updated.rvUnitId },
        data: { status: 'in_stock' },
      })
    }
  }

  return mapVehicleOrder(updated)
}

// Add trade-in to order
export async function addTradeInToOrder(
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
): Promise<VehicleOrder> {
  // Create the trade-in
  const tradeIn = await prisma.tradeIn.create({
    data: {
      ...tradeInData,
      hasLien: tradeInData.hasLien || false,
      status: 'pending',
    },
  })

  // Link to order
  const order = await prisma.vehicleOrder.update({
    where: { orderNumber },
    data: {
      tradeInId: tradeIn.id,
      tradeInAllowance: tradeInData.estimatedValue,
      tradeInPayoff: tradeInData.lienPayoff || 0,
      totalPrice: {
        decrement: tradeInData.estimatedValue - (tradeInData.lienPayoff || 0),
      },
    },
    include: {
      rvUnit: { include: { model: true } },
      rvModel: true,
      tradeIn: true,
    },
  })

  return mapVehicleOrder(order)
}

// Map database record to type
function mapVehicleOrder(order: any): VehicleOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    dealerId: order.dealerId,
    dealerName: order.dealer?.name,
    salesPersonId: order.salesPersonId,
    orderType: order.orderType,
    rvUnitId: order.rvUnitId,
    rvUnit: order.rvUnit
      ? {
          id: order.rvUnit.id,
          vin: order.rvUnit.vin,
          stockNumber: order.rvUnit.stockNumber,
          modelId: order.rvUnit.modelId,
          model: order.rvUnit.model,
          modelYear: order.rvUnit.modelYear,
          exteriorColor: order.rvUnit.exteriorColor,
          interiorColor: order.rvUnit.interiorColor,
          condition: order.rvUnit.condition,
          status: order.rvUnit.status,
          dealerId: order.rvUnit.dealerId,
          msrp: order.rvUnit.msrp,
          invoiceCost: order.rvUnit.invoiceCost,
          createdAt: order.rvUnit.createdAt,
          updatedAt: order.rvUnit.updatedAt,
        }
      : undefined,
    rvModelId: order.rvModelId,
    rvModel: order.rvModel,
    requestedExteriorColor: order.requestedExteriorColor,
    requestedInteriorColor: order.requestedInteriorColor,
    requestedOptions: order.requestedOptions ? JSON.parse(order.requestedOptions) : undefined,
    customerType: order.customerType,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress ? JSON.parse(order.customerAddress) : undefined,
    tradeInId: order.tradeInId,
    tradeIn: order.tradeIn,
    unitPrice: order.unitPrice,
    optionsPrice: order.optionsPrice,
    freightPrice: order.freightPrice,
    prepFee: order.prepFee,
    docFee: order.docFee,
    additionalFees: order.additionalFees ? JSON.parse(order.additionalFees) : undefined,
    tradeInAllowance: order.tradeInAllowance,
    tradeInPayoff: order.tradeInPayoff,
    rebatesApplied: order.rebatesApplied,
    taxAmount: order.taxAmount,
    totalPrice: order.totalPrice,
    depositAmount: order.depositAmount,
    depositDate: order.depositDate,
    paymentMethod: order.paymentMethod,
    financingDetails: order.financingDetails ? JSON.parse(order.financingDetails) : undefined,
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress ? JSON.parse(order.deliveryAddress) : undefined,
    requestedDeliveryDate: order.requestedDeliveryDate,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    actualDeliveryDate: order.actualDeliveryDate,
    deliveryNotes: order.deliveryNotes,
    documentsComplete: order.documentsComplete,
    titleReceived: order.titleReceived,
    titleSent: order.titleSent,
    registrationComplete: order.registrationComplete,
    status: order.status,
    internalNotes: order.internalNotes,
    customerNotes: order.customerNotes,
    quotedAt: order.quotedAt,
    submittedAt: order.submittedAt,
    approvedAt: order.approvedAt,
    confirmedAt: order.confirmedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
