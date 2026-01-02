// Market Analysis API
// GET /api/forecasting/market - Get market analysis for a dealer's region
// POST /api/forecasting/market/seed - Seed sample market indicators (dev only)

import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketAnalysis,
  seedMarketIndicators,
} from '@/lib/services/forecasting';

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DEALER_ID', message: 'Dealer ID is required' } },
        { status: 400 }
      );
    }

    const analysis = await getMarketAnalysis(dealerId);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error getting market analysis:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get market analysis' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'seed') {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Seeding not allowed in production' } },
          { status: 403 }
        );
      }

      const count = await seedMarketIndicators();

      return NextResponse.json({
        success: true,
        data: { seededCount: count },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action parameter' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in market API:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Operation failed' } },
      { status: 500 }
    );
  }
}
