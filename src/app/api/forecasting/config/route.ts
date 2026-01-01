// Forecasting Configuration API
// GET /api/forecasting/config - Get forecast config for a dealer
// PUT /api/forecasting/config - Update forecast config

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getOrCreateForecastConfig,
  updateForecastConfig,
} from '@/lib/services/forecasting';

const UpdateConfigSchema = z.object({
  dealerId: z.string(),
  forecastHorizon: z.number().min(1).max(36).optional(),
  historyPeriod: z.number().min(6).max(60).optional(),
  confidenceLevel: z.number().min(0.8).max(0.99).optional(),
  useSeasonality: z.boolean().optional(),
  seasonalityType: z.enum(['additive', 'multiplicative']).optional(),
  safetyStockDays: z.number().min(0).max(90).optional(),
  leadTimeDays: z.number().min(0).max(60).optional(),
  reorderPointMethod: z.enum(['fixed', 'dynamic', 'min_max']).optional(),
  minOrderQuantity: z.number().min(1).optional(),
  orderMultiple: z.number().min(1).optional(),
  marketGrowthRate: z.number().min(-50).max(100).optional(),
  localMarketFactor: z.number().min(0.5).max(2).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DEALER_ID', message: 'Dealer ID is required' } },
        { status: 400 }
      );
    }

    const config = await getOrCreateForecastConfig(dealerId);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error getting forecast config:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get forecast config' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateConfigSchema.parse(body);
    const { dealerId, ...updates } = validated;

    const config = await updateForecastConfig(dealerId, updates);

    return NextResponse.json({
      success: true,
      data: config,
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

    console.error('Error updating forecast config:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update forecast config' } },
      { status: 500 }
    );
  }
}
