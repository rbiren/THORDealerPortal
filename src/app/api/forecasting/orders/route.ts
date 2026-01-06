// Suggested Order Plan API
// GET /api/forecasting/orders - Get suggested order plan
// POST /api/forecasting/orders - Generate new order plan
// PATCH /api/forecasting/orders - Update order status

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateSuggestedOrderPlan,
  getSuggestedOrders,
  updateSuggestedOrderStatus,
  getOrderTimelineData,
} from '@/lib/services/forecasting';

const GenerateOrderPlanSchema = z.object({
  dealerId: z.string(),
});

const UpdateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['accepted', 'skipped']),
  actualOrderId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get('dealerId');
    const status = request.nextUrl.searchParams.get('status') as 'pending' | 'accepted' | 'ordered' | 'skipped' | null;
    const format = request.nextUrl.searchParams.get('format') || 'list';

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DEALER_ID', message: 'Dealer ID is required' } },
        { status: 400 }
      );
    }

    if (format === 'timeline') {
      const timelineData = await getOrderTimelineData(dealerId);
      return NextResponse.json({
        success: true,
        data: timelineData,
      });
    }

    const orders = await getSuggestedOrders(dealerId, status || undefined);

    // Transform to response format
    type SuggestedOrderItem = {
      id: string
      productId: string
      product: { name: string; sku: string }
      suggestedOrderDate: Date
      expectedDeliveryDate: Date | null
      suggestedQuantity: number
      minimumQuantity: number | null
      economicOrderQty: number | null
      currentStock: number
      projectedStock: number | null
      projectedDemand: number | null
      estimatedCost: number | null
      estimatedValue: number | null
      priority: string
      status: string
      reasoning: string | null
      acceptedAt: Date | null
      orderedAt: Date | null
      actualOrderId: string | null
    }

    const transformedOrders = orders.map((order: SuggestedOrderItem) => ({
      id: order.id,
      productId: order.productId,
      productName: order.product.name,
      productSku: order.product.sku,
      suggestedOrderDate: order.suggestedOrderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      suggestedQuantity: order.suggestedQuantity,
      minimumQuantity: order.minimumQuantity,
      economicOrderQty: order.economicOrderQty,
      currentStock: order.currentStock,
      projectedStock: order.projectedStock,
      projectedDemand: order.projectedDemand,
      estimatedCost: order.estimatedCost,
      estimatedValue: order.estimatedValue,
      priority: order.priority,
      status: order.status,
      reasoning: order.reasoning ? JSON.parse(order.reasoning) : null,
      acceptedAt: order.acceptedAt,
      orderedAt: order.orderedAt,
      actualOrderId: order.actualOrderId,
    }));

    // Calculate summary
    type TransformedOrder = {
      suggestedQuantity: number
      estimatedCost: number | null
      estimatedValue: number | null
      priority: string
      status: string
    }

    const summary = {
      totalOrders: transformedOrders.length,
      totalUnits: transformedOrders.reduce((sum: number, o: TransformedOrder) => sum + o.suggestedQuantity, 0),
      totalEstimatedCost: transformedOrders.reduce((sum: number, o: TransformedOrder) => sum + (o.estimatedCost || 0), 0),
      totalEstimatedValue: transformedOrders.reduce((sum: number, o: TransformedOrder) => sum + (o.estimatedValue || 0), 0),
      criticalOrders: transformedOrders.filter((o: TransformedOrder) => o.priority === 'critical').length,
      pendingOrders: transformedOrders.filter((o: TransformedOrder) => o.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        summary,
      },
    });
  } catch (error) {
    console.error('Error getting suggested orders:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get suggested orders' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId } = GenerateOrderPlanSchema.parse(body);

    const orderPlan = await generateSuggestedOrderPlan(dealerId);

    return NextResponse.json({
      success: true,
      data: orderPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error generating order plan:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate order plan' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, actualOrderId } = UpdateOrderStatusSchema.parse(body);

    const updatedOrder = await updateSuggestedOrderStatus(orderId, status, actualOrderId);

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update order status' } },
      { status: 500 }
    );
  }
}
