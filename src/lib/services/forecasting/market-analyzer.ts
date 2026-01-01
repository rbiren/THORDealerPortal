// Market Analysis Service
// Analyzes local market conditions and external factors affecting demand

import { prisma } from '@/lib/db';
import type { MarketAnalysis, MarketIndicatorSummary } from '@/types/forecasting';

/**
 * Get market analysis for a dealer's region
 */
export async function getMarketAnalysis(dealerId: string): Promise<MarketAnalysis> {
  // Get dealer's region from their primary address
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    include: {
      addresses: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const region = dealer?.addresses[0]?.state || 'national';

  // Get market indicators for the region
  const indicators = await prisma.marketIndicator.findMany({
    where: {
      OR: [
        { region },
        { region: 'national' },
      ],
      periodStart: {
        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      },
    },
    orderBy: { periodStart: 'desc' },
  });

  // Group by indicator name and get latest
  const latestByName = new Map<string, typeof indicators[0]>();
  for (const indicator of indicators) {
    if (!latestByName.has(indicator.indicatorName)) {
      latestByName.set(indicator.indicatorName, indicator);
    }
  }

  // Summarize indicators
  const indicatorSummaries: MarketIndicatorSummary[] = [];
  let positiveCount = 0;
  let negativeCount = 0;
  let totalImpactFactor = 0;
  let indicatorCount = 0;

  for (const [name, indicator] of latestByName) {
    const trend: 'up' | 'down' | 'stable' =
      indicator.percentChange && indicator.percentChange > 2
        ? 'up'
        : indicator.percentChange && indicator.percentChange < -2
          ? 'down'
          : 'stable';

    // Determine impact based on indicator type and trend
    let impact: 'positive' | 'neutral' | 'negative' = 'neutral';

    // Economic indicators: up is usually positive for demand
    if (indicator.indicatorType === 'economic') {
      impact = trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral';
    }
    // Demographic: population growth is positive
    else if (indicator.indicatorType === 'demographic') {
      impact = trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral';
    }
    // Industry-specific
    else if (indicator.indicatorType === 'industry') {
      impact = indicator.impactFactor > 1 ? 'positive' : indicator.impactFactor < 1 ? 'negative' : 'neutral';
    }

    if (impact === 'positive') positiveCount++;
    if (impact === 'negative') negativeCount++;
    totalImpactFactor += indicator.impactFactor;
    indicatorCount++;

    indicatorSummaries.push({
      name,
      type: indicator.indicatorType,
      currentValue: indicator.value,
      trend,
      impact,
    });
  }

  // Calculate overall outlook
  let overallOutlook: 'positive' | 'neutral' | 'negative';
  if (positiveCount > negativeCount + 1) {
    overallOutlook = 'positive';
  } else if (negativeCount > positiveCount + 1) {
    overallOutlook = 'negative';
  } else {
    overallOutlook = 'neutral';
  }

  // Calculate adjustment factor
  const adjustmentFactor = indicatorCount > 0
    ? totalImpactFactor / indicatorCount
    : 1.0;

  return {
    region,
    indicators: indicatorSummaries,
    overallOutlook,
    adjustmentFactor,
  };
}

/**
 * Create or update market indicators
 */
export async function upsertMarketIndicator(data: {
  region: string;
  regionType: string;
  indicatorName: string;
  indicatorType: string;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  previousValue?: number;
  impactFactor?: number;
  confidence?: number;
  source?: string;
  sourceUrl?: string;
}) {
  const percentChange = data.previousValue && data.previousValue !== 0
    ? ((data.value - data.previousValue) / data.previousValue) * 100
    : null;

  return prisma.marketIndicator.upsert({
    where: {
      region_indicatorName_periodStart: {
        region: data.region,
        indicatorName: data.indicatorName,
        periodStart: data.periodStart,
      },
    },
    update: {
      value: data.value,
      previousValue: data.previousValue,
      percentChange,
      impactFactor: data.impactFactor,
      confidence: data.confidence,
      source: data.source,
      sourceUrl: data.sourceUrl,
    },
    create: {
      ...data,
      percentChange,
    },
  });
}

/**
 * Get regional performance comparison
 */
export async function getRegionalComparison(regions: string[]) {
  const indicators = await prisma.marketIndicator.findMany({
    where: {
      region: { in: regions },
    },
    orderBy: { periodStart: 'desc' },
  });

  // Group by region
  const byRegion = new Map<string, typeof indicators>();
  for (const indicator of indicators) {
    if (!byRegion.has(indicator.region)) {
      byRegion.set(indicator.region, []);
    }
    byRegion.get(indicator.region)!.push(indicator);
  }

  return Object.fromEntries(byRegion);
}

/**
 * Seed sample market indicators for development
 */
export async function seedMarketIndicators() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const sampleIndicators = [
    {
      region: 'national',
      regionType: 'national',
      indicatorName: 'Consumer Confidence Index',
      indicatorType: 'economic',
      periodStart: lastMonth,
      periodEnd: now,
      value: 102.5,
      previousValue: 100.8,
      impactFactor: 1.02,
      confidence: 0.9,
      source: 'Conference Board',
    },
    {
      region: 'CA',
      regionType: 'state',
      indicatorName: 'Housing Starts',
      indicatorType: 'industry',
      periodStart: lastMonth,
      periodEnd: now,
      value: 145000,
      previousValue: 138000,
      impactFactor: 1.05,
      confidence: 0.85,
      source: 'Census Bureau',
    },
    {
      region: 'TX',
      regionType: 'state',
      indicatorName: 'Housing Starts',
      indicatorType: 'industry',
      periodStart: lastMonth,
      periodEnd: now,
      value: 180000,
      previousValue: 175000,
      impactFactor: 1.03,
      confidence: 0.85,
      source: 'Census Bureau',
    },
    {
      region: 'national',
      regionType: 'national',
      indicatorName: 'RV Industry Sales',
      indicatorType: 'industry',
      periodStart: lastMonth,
      periodEnd: now,
      value: 42500,
      previousValue: 40000,
      impactFactor: 1.06,
      confidence: 0.92,
      source: 'RV Industry Association',
    },
    {
      region: 'national',
      regionType: 'national',
      indicatorName: 'Fuel Price Index',
      indicatorType: 'economic',
      periodStart: lastMonth,
      periodEnd: now,
      value: 95.2,
      previousValue: 98.5,
      impactFactor: 1.03, // Lower fuel prices = higher demand
      confidence: 0.95,
      source: 'EIA',
    },
  ];

  for (const indicator of sampleIndicators) {
    await upsertMarketIndicator(indicator);
  }

  return sampleIndicators.length;
}
