// Demand Forecast API
// GET /api/forecasting/demand - Get demand forecasts for a dealer
// POST /api/forecasting/demand - Generate new demand forecasts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateDemandForecasts,
  getForecastChartData,
  getOrCreateForecastConfig,
} from '@/lib/services/forecasting';
import { prisma } from '@/lib/db';

const GenerateForecastSchema = z.object({
  dealerId: z.string(),
  productIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get('dealerId');
    const productId = request.nextUrl.searchParams.get('productId');
    const format = request.nextUrl.searchParams.get('format') || 'detail';

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DEALER_ID', message: 'Dealer ID is required' } },
        { status: 400 }
      );
    }

    if (format === 'chart') {
      const chartData = await getForecastChartData(dealerId, productId || undefined);
      return NextResponse.json({
        success: true,
        data: chartData,
      });
    }

    // Get stored forecasts
    const config = await getOrCreateForecastConfig(dealerId);

    const forecasts = await prisma.demandForecast.findMany({
      where: {
        forecastConfigId: config.id,
        ...(productId ? { productId } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
          },
        },
      },
      orderBy: [
        { productId: 'asc' },
        { periodStart: 'asc' },
      ],
    });

    // Group by product
    const byProduct = new Map<string, typeof forecasts>();
    for (const forecast of forecasts) {
      if (!byProduct.has(forecast.productId)) {
        byProduct.set(forecast.productId, []);
      }
      byProduct.get(forecast.productId)!.push(forecast);
    }

    const results = Array.from(byProduct.entries()).map(([productId, productForecasts]) => ({
      productId,
      productName: productForecasts[0].product.name,
      productSku: productForecasts[0].product.sku,
      periods: productForecasts.map(f => ({
        periodStart: f.periodStart,
        periodEnd: f.periodEnd,
        periodLabel: f.periodStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        forecastedDemand: f.forecastedDemand,
        lowerBound: f.lowerBound,
        upperBound: f.upperBound,
        historicalAverage: f.historicalAverage,
        yearOverYearChange: f.yearOverYearChange,
        trendComponent: f.trendComponent,
        seasonalComponent: f.seasonalComponent,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        dealerId,
        lastCalculatedAt: config.lastCalculatedAt,
        forecasts: results,
      },
    });
  } catch (error) {
    console.error('Error getting demand forecasts:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get demand forecasts' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId, productIds } = GenerateForecastSchema.parse(body);

    const forecasts = await generateDemandForecasts(dealerId, productIds);

    return NextResponse.json({
      success: true,
      data: {
        dealerId,
        generatedAt: new Date(),
        forecasts,
      },
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

    console.error('Error generating demand forecasts:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate demand forecasts' } },
      { status: 500 }
    );
  }
}
