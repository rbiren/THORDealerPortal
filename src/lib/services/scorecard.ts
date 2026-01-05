/**
 * Dealer Performance Scorecard Service
 * Phase 8.4: Metrics, Scoring, Tier Recommendations
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface ScorecardPeriod {
  periodType: 'monthly' | 'quarterly' | 'annual';
  periodStart: Date;
  periodEnd: Date;
}

export interface ScorecardInput {
  salesActual?: number;
  salesTarget?: number;
  csiScore?: number;
  csiSampleSize?: number;
  warrantyClaimCount?: number;
  inventoryTurnRate?: number;
  avgDaysToPay?: number;
}

export interface ScoreWeights {
  salesWeight: number;
  growthWeight: number;
  csiWeight: number;
  warrantyWeight: number;
  trainingWeight: number;
  inventoryWeight: number;
  paymentWeight: number;
}

// Default weights
const DEFAULT_WEIGHTS: ScoreWeights = {
  salesWeight: 30,
  growthWeight: 15,
  csiWeight: 20,
  warrantyWeight: 10,
  trainingWeight: 10,
  inventoryWeight: 10,
  paymentWeight: 5,
};

// ============================================================================
// SCORECARD CALCULATION
// ============================================================================

/**
 * Calculate dealer scorecard for a period
 */
export async function calculateScorecard(dealerId: string, period: ScorecardPeriod) {
  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  if (!dealer) throw new Error('Dealer not found');

  // Get score weights for this tier
  const weights = await getScoreWeights(dealer.tier);

  // Calculate each metric component
  const salesMetrics = await calculateSalesMetrics(dealerId, period);
  const growthMetrics = await calculateGrowthMetrics(dealerId, period);
  const csiMetrics = await calculateCSIMetrics(dealerId, period);
  const warrantyMetrics = await calculateWarrantyMetrics(dealerId, period);
  const trainingMetrics = await calculateTrainingMetrics(dealerId);
  const inventoryMetrics = await calculateInventoryMetrics(dealerId, period);
  const paymentMetrics = await calculatePaymentMetrics(dealerId, period);

  // Calculate composite score
  const compositeScore = Math.round(
    (salesMetrics.score * weights.salesWeight +
      growthMetrics.score * weights.growthWeight +
      csiMetrics.score * weights.csiWeight +
      warrantyMetrics.score * weights.warrantyWeight +
      trainingMetrics.score * weights.trainingWeight +
      inventoryMetrics.score * weights.inventoryWeight +
      paymentMetrics.score * weights.paymentWeight) / 100
  );

  // Get previous period for trend
  const previousScorecard = await getPreviousScorecard(dealerId, period);
  const scoreTrend = previousScorecard
    ? compositeScore > previousScorecard.compositeScore
      ? 'up'
      : compositeScore < previousScorecard.compositeScore
        ? 'down'
        : 'stable'
    : null;

  // Determine tier recommendation
  const tierRecommendation = await determineTierRecommendation(compositeScore, dealerId);

  // Calculate rank among all dealers
  const rank = await calculateRank(dealerId, period, compositeScore);

  // Upsert scorecard
  const scorecard = await prisma.dealerScorecard.upsert({
    where: {
      dealerId_periodStart_periodType: {
        dealerId,
        periodStart: period.periodStart,
        periodType: period.periodType,
      },
    },
    create: {
      dealerId,
      periodType: period.periodType,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      salesActual: salesMetrics.actual,
      salesTarget: salesMetrics.target,
      salesScore: salesMetrics.score,
      salesYoYChange: growthMetrics.yoyChange,
      revenueGrowth: growthMetrics.revenueGrowth,
      unitGrowth: growthMetrics.unitGrowth,
      growthScore: growthMetrics.score,
      csiScore: csiMetrics.csiValue,
      csiSampleSize: csiMetrics.sampleSize,
      csiScore100: csiMetrics.score,
      warrantyClaimRate: warrantyMetrics.claimRate,
      warrantyClaimCount: warrantyMetrics.claimCount,
      warrantyScore: warrantyMetrics.score,
      trainingComplianceRate: trainingMetrics.complianceRate,
      certifiedStaffCount: trainingMetrics.certifiedCount,
      totalStaffCount: trainingMetrics.totalCount,
      trainingScore: trainingMetrics.score,
      inventoryTurnRate: inventoryMetrics.turnRate,
      daysOfSupply: inventoryMetrics.daysOfSupply,
      stockoutRate: inventoryMetrics.stockoutRate,
      inventoryScore: inventoryMetrics.score,
      avgDaysToPay: paymentMetrics.avgDays,
      onTimePaymentRate: paymentMetrics.onTimeRate,
      paymentScore: paymentMetrics.score,
      compositeScore,
      scoreRank: rank,
      tierRecommendation,
      previousCompositeScore: previousScorecard?.compositeScore,
      scoreTrend,
      calculatedAt: new Date(),
      calculatedBy: 'system',
    },
    update: {
      periodEnd: period.periodEnd,
      salesActual: salesMetrics.actual,
      salesTarget: salesMetrics.target,
      salesScore: salesMetrics.score,
      salesYoYChange: growthMetrics.yoyChange,
      revenueGrowth: growthMetrics.revenueGrowth,
      unitGrowth: growthMetrics.unitGrowth,
      growthScore: growthMetrics.score,
      csiScore: csiMetrics.csiValue,
      csiSampleSize: csiMetrics.sampleSize,
      csiScore100: csiMetrics.score,
      warrantyClaimRate: warrantyMetrics.claimRate,
      warrantyClaimCount: warrantyMetrics.claimCount,
      warrantyScore: warrantyMetrics.score,
      trainingComplianceRate: trainingMetrics.complianceRate,
      certifiedStaffCount: trainingMetrics.certifiedCount,
      totalStaffCount: trainingMetrics.totalCount,
      trainingScore: trainingMetrics.score,
      inventoryTurnRate: inventoryMetrics.turnRate,
      daysOfSupply: inventoryMetrics.daysOfSupply,
      stockoutRate: inventoryMetrics.stockoutRate,
      inventoryScore: inventoryMetrics.score,
      avgDaysToPay: paymentMetrics.avgDays,
      onTimePaymentRate: paymentMetrics.onTimeRate,
      paymentScore: paymentMetrics.score,
      compositeScore,
      scoreRank: rank,
      tierRecommendation,
      previousCompositeScore: previousScorecard?.compositeScore,
      scoreTrend,
      calculatedAt: new Date(),
    },
    include: {
      dealer: { select: { id: true, name: true, code: true, tier: true } },
    },
  });

  return scorecard;
}

// ============================================================================
// METRIC CALCULATIONS
// ============================================================================

async function calculateSalesMetrics(dealerId: string, period: ScorecardPeriod) {
  // Get actual sales
  const orders = await prisma.order.aggregate({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped'] },
      createdAt: { gte: period.periodStart, lte: period.periodEnd },
    },
    _sum: { totalAmount: true },
  });

  // Get target
  const target = await prisma.salesTarget.findFirst({
    where: {
      dealerId,
      year: period.periodStart.getFullYear(),
      status: 'active',
    },
  });

  const actual = orders._sum.totalAmount || 0;
  const targetAmount = target?.revenueTarget || actual; // Use actual if no target

  // Score: 100 if at or above target, scaled down from there
  const score = targetAmount > 0
    ? Math.min(100, Math.round((actual / targetAmount) * 100))
    : 50;

  return { actual, target: targetAmount, score };
}

async function calculateGrowthMetrics(dealerId: string, period: ScorecardPeriod) {
  const currentSales = await prisma.order.aggregate({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped'] },
      createdAt: { gte: period.periodStart, lte: period.periodEnd },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  // Get same period last year
  const lastYearStart = new Date(period.periodStart);
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
  const lastYearEnd = new Date(period.periodEnd);
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

  const lastYearSales = await prisma.order.aggregate({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped'] },
      createdAt: { gte: lastYearStart, lte: lastYearEnd },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  const currentRevenue = currentSales._sum.totalAmount || 0;
  const lastYearRevenue = lastYearSales._sum.totalAmount || 0;
  const currentUnits = currentSales._count.id || 0;
  const lastYearUnits = lastYearSales._count.id || 0;

  const revenueGrowth = lastYearRevenue > 0
    ? ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100
    : 0;
  const unitGrowth = lastYearUnits > 0
    ? ((currentUnits - lastYearUnits) / lastYearUnits) * 100
    : 0;
  const yoyChange = revenueGrowth;

  // Score: 50 is flat, +2 points per % growth, max 100
  const score = Math.min(100, Math.max(0, Math.round(50 + revenueGrowth * 2)));

  return { revenueGrowth, unitGrowth, yoyChange, score };
}

async function calculateCSIMetrics(dealerId: string, _period: ScorecardPeriod) {
  // CSI typically comes from surveys - here we use a placeholder
  // In production, this would integrate with survey systems
  // For now, calculate based on ticket satisfaction ratings
  const ratings = await prisma.supportTicket.findMany({
    where: {
      dealerId,
      status: 'closed',
      satisfactionRating: { not: null },
    },
    select: { satisfactionRating: true },
    take: 100,
    orderBy: { closedAt: 'desc' },
  });

  if (ratings.length === 0) {
    return { csiValue: null, sampleSize: 0, score: 75 }; // Neutral default
  }

  const totalRating = ratings.reduce((sum, r) => sum + (r.satisfactionRating || 0), 0);
  const csiValue = totalRating / ratings.length; // 1-5 scale

  // Convert 1-5 to 0-100 score
  const score = Math.round(((csiValue - 1) / 4) * 100);

  return { csiValue, sampleSize: ratings.length, score };
}

async function calculateWarrantyMetrics(dealerId: string, period: ScorecardPeriod) {
  // Get warranty claims
  const claims = await prisma.warrantyClaim.count({
    where: {
      dealerId,
      createdAt: { gte: period.periodStart, lte: period.periodEnd },
    },
  });

  // Get units sold for rate calculation
  const unitsSold = await prisma.orderItem.aggregate({
    where: {
      order: {
        dealerId,
        status: { in: ['delivered', 'shipped'] },
        createdAt: { gte: period.periodStart, lte: period.periodEnd },
      },
    },
    _sum: { quantity: true },
  });

  const units = unitsSold._sum.quantity || 1;
  const claimRate = (claims / units) * 100; // Claims per 100 units

  // Score: Lower is better. 0% = 100, 5% = 0
  const score = Math.max(0, Math.round(100 - claimRate * 20));

  return { claimCount: claims, claimRate, score };
}

async function calculateTrainingMetrics(dealerId: string) {
  // Get all active users for the dealer
  const users = await prisma.user.count({
    where: { dealerId, status: 'active' },
  });

  // Get required certifications
  const requiredCourses = await prisma.trainingCourse.count({
    where: { isRequired: true, status: 'published' },
  });

  // Get active certifications
  const certifications = await prisma.certification.findMany({
    where: {
      dealerId,
      status: 'active',
      expiresAt: { gt: new Date() },
    },
    select: { userId: true, courseId: true },
  });

  // Calculate unique certified users and courses
  const certifiedUsers = new Set(certifications.map((c) => c.userId));

  const complianceRate = users > 0 && requiredCourses > 0
    ? (certifiedUsers.size / users) * 100
    : 100;

  const score = Math.round(complianceRate);

  return {
    certifiedCount: certifiedUsers.size,
    totalCount: users,
    complianceRate,
    score,
  };
}

async function calculateInventoryMetrics(dealerId: string, _period: ScorecardPeriod) {
  // This is a simplified calculation
  // In production, would need more complex inventory tracking

  // For now, use placeholder metrics based on order patterns
  // Ideal turn rate is 4-6 times per year
  const turnRate = 5; // Placeholder
  const daysOfSupply = 60; // Placeholder
  const stockoutRate = 5; // Placeholder %

  // Score based on turn rate (4-6 is optimal)
  let score = 70;
  if (turnRate >= 4 && turnRate <= 6) score = 100;
  else if (turnRate >= 3 && turnRate <= 8) score = 80;
  else if (turnRate >= 2 && turnRate <= 10) score = 60;
  else score = 40;

  // Penalize for stockouts
  score = Math.max(0, score - stockoutRate * 2);

  return { turnRate, daysOfSupply, stockoutRate, score };
}

async function calculatePaymentMetrics(dealerId: string, period: ScorecardPeriod) {
  // Get invoices and their payment status
  const invoices = await prisma.invoice.findMany({
    where: {
      dealerId,
      status: 'paid',
      createdAt: { gte: period.periodStart, lte: period.periodEnd },
    },
    select: { createdAt: true, paidDate: true, dueDate: true },
  });

  if (invoices.length === 0) {
    return { avgDays: 0, onTimeRate: 100, score: 100 };
  }

  let totalDays = 0;
  let onTimeCount = 0;

  for (const invoice of invoices) {
    if (invoice.paidDate) {
      const days = Math.round(
        (invoice.paidDate.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalDays += days;

      if (invoice.dueDate && invoice.paidDate <= invoice.dueDate) {
        onTimeCount++;
      }
    }
  }

  const avgDays = totalDays / invoices.length;
  const onTimeRate = (onTimeCount / invoices.length) * 100;

  // Score: On-time rate weighted heavily
  const score = Math.round(onTimeRate);

  return { avgDays, onTimeRate, score };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getScoreWeights(tier: string): Promise<ScoreWeights> {
  const weights = await prisma.scoreWeight.findFirst({
    where: {
      isActive: true,
      OR: [{ dealerTier: tier }, { dealerTier: null }],
    },
    orderBy: { dealerTier: 'desc' }, // Prefer tier-specific weights
  });

  if (weights) {
    return {
      salesWeight: weights.salesWeight,
      growthWeight: weights.growthWeight,
      csiWeight: weights.csiWeight,
      warrantyWeight: weights.warrantyWeight,
      trainingWeight: weights.trainingWeight,
      inventoryWeight: weights.inventoryWeight,
      paymentWeight: weights.paymentWeight,
    };
  }

  return DEFAULT_WEIGHTS;
}

async function getPreviousScorecard(dealerId: string, currentPeriod: ScorecardPeriod) {
  // Get the previous period's scorecard
  const previousPeriodStart = new Date(currentPeriod.periodStart);
  if (currentPeriod.periodType === 'monthly') {
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
  } else if (currentPeriod.periodType === 'quarterly') {
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
  } else {
    previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
  }

  return prisma.dealerScorecard.findFirst({
    where: {
      dealerId,
      periodType: currentPeriod.periodType,
      periodStart: previousPeriodStart,
    },
  });
}

async function determineTierRecommendation(score: number, dealerId: string): Promise<string> {
  const thresholds = await prisma.tierThreshold.findMany({
    where: { isActive: true },
    orderBy: { minScore: 'desc' },
  });

  // Get dealer's annual revenue for additional criteria
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const annualRevenue = await prisma.order.aggregate({
    where: {
      dealerId,
      status: { in: ['delivered', 'shipped'] },
      createdAt: { gte: yearStart },
    },
    _sum: { totalAmount: true },
  });

  const revenue = annualRevenue._sum.totalAmount || 0;

  for (const threshold of thresholds) {
    if (score >= threshold.minScore) {
      // Check additional criteria if specified
      if (threshold.minAnnualRevenue && revenue < threshold.minAnnualRevenue) {
        continue;
      }
      return threshold.tierName;
    }
  }

  return 'bronze'; // Default tier
}

async function calculateRank(
  dealerId: string,
  period: ScorecardPeriod,
  compositeScore: number
): Promise<number> {
  const higherScores = await prisma.dealerScorecard.count({
    where: {
      periodType: period.periodType,
      periodStart: period.periodStart,
      compositeScore: { gt: compositeScore },
      dealerId: { not: dealerId },
    },
  });

  return higherScores + 1;
}

// ============================================================================
// RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Get dealer's scorecard
 */
export async function getDealerScorecard(dealerId: string, period?: ScorecardPeriod) {
  const where: Prisma.DealerScorecardWhereInput = { dealerId };

  if (period) {
    where.periodType = period.periodType;
    where.periodStart = period.periodStart;
  }

  const scorecard = await prisma.dealerScorecard.findFirst({
    where,
    include: {
      dealer: { select: { id: true, name: true, code: true, tier: true } },
    },
    orderBy: { periodStart: 'desc' },
  });

  return scorecard;
}

/**
 * Get scorecard history
 */
export async function getScorecardHistory(dealerId: string, months = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  return prisma.dealerScorecard.findMany({
    where: {
      dealerId,
      periodStart: { gte: cutoffDate },
    },
    orderBy: { periodStart: 'asc' },
  });
}

/**
 * Get network rankings
 */
export async function getNetworkRankings(period: ScorecardPeriod, options?: {
  tier?: string;
  limit?: number;
}) {
  const where: Prisma.DealerScorecardWhereInput = {
    periodType: period.periodType,
    periodStart: period.periodStart,
  };

  if (options?.tier) {
    where.dealer = { tier: options.tier };
  }

  const rankings = await prisma.dealerScorecard.findMany({
    where,
    include: {
      dealer: { select: { id: true, name: true, code: true, tier: true } },
    },
    orderBy: { compositeScore: 'desc' },
    take: options?.limit || 100,
  });

  return rankings.map((r, index) => ({
    ...r,
    rank: index + 1,
  }));
}

/**
 * Get tier change recommendations
 */
export async function getTierChangeRecommendations() {
  // Find dealers whose recommended tier differs from current tier
  const scorecards = await prisma.dealerScorecard.findMany({
    where: {
      tierRecommendation: { not: null },
    },
    include: {
      dealer: { select: { id: true, name: true, code: true, tier: true } },
    },
    orderBy: { calculatedAt: 'desc' },
  });

  // Group by dealer and take latest
  const latestByDealer = new Map<string, typeof scorecards[0]>();
  for (const sc of scorecards) {
    if (!latestByDealer.has(sc.dealerId)) {
      latestByDealer.set(sc.dealerId, sc);
    }
  }

  // Filter to those with tier mismatch
  return Array.from(latestByDealer.values()).filter(
    (sc) => sc.tierRecommendation !== sc.dealer.tier
  );
}

// ============================================================================
// TARGETS MANAGEMENT
// ============================================================================

/**
 * Set sales target for a dealer
 */
export async function setSalesTarget(options: {
  dealerId: string;
  year: number;
  quarter?: number;
  month?: number;
  revenueTarget: number;
  unitTarget?: number;
  marginTarget?: number;
  categoryTargets?: Record<string, { revenue: number; units: number }>;
  approvedById?: string;
}) {
  return prisma.salesTarget.upsert({
    where: {
      dealerId_year_quarter_month: {
        dealerId: options.dealerId,
        year: options.year,
        quarter: options.quarter || null,
        month: options.month || null,
      },
    },
    create: {
      dealerId: options.dealerId,
      year: options.year,
      quarter: options.quarter,
      month: options.month,
      revenueTarget: options.revenueTarget,
      unitTarget: options.unitTarget || 0,
      marginTarget: options.marginTarget,
      categoryTargets: options.categoryTargets
        ? JSON.stringify(options.categoryTargets)
        : null,
      status: 'active',
      approvedById: options.approvedById,
      approvedAt: options.approvedById ? new Date() : null,
    },
    update: {
      revenueTarget: options.revenueTarget,
      unitTarget: options.unitTarget,
      marginTarget: options.marginTarget,
      categoryTargets: options.categoryTargets
        ? JSON.stringify(options.categoryTargets)
        : null,
    },
  });
}

/**
 * Get dealer targets
 */
export async function getDealerTargets(dealerId: string, year?: number) {
  const where: Prisma.SalesTargetWhereInput = { dealerId };
  if (year) where.year = year;

  return prisma.salesTarget.findMany({
    where,
    orderBy: [{ year: 'desc' }, { quarter: 'asc' }, { month: 'asc' }],
  });
}

// ============================================================================
// BENCHMARK DATA
// ============================================================================

/**
 * Get network benchmarks
 */
export async function getNetworkBenchmarks(periodType: string, tier?: string) {
  const where: Prisma.DealerScorecardWhereInput = { periodType };
  if (tier) where.dealer = { tier };

  // Get latest period's scorecards
  const latestPeriod = await prisma.dealerScorecard.findFirst({
    where: { periodType },
    orderBy: { periodStart: 'desc' },
    select: { periodStart: true },
  });

  if (!latestPeriod) return null;

  where.periodStart = latestPeriod.periodStart;

  const stats = await prisma.dealerScorecard.aggregate({
    where,
    _avg: {
      compositeScore: true,
      salesScore: true,
      growthScore: true,
      csiScore100: true,
      warrantyScore: true,
      trainingScore: true,
      inventoryScore: true,
      paymentScore: true,
    },
    _max: {
      compositeScore: true,
    },
    _min: {
      compositeScore: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    periodStart: latestPeriod.periodStart,
    dealerCount: stats._count.id,
    averages: {
      composite: Math.round(stats._avg.compositeScore || 0),
      sales: Math.round(stats._avg.salesScore || 0),
      growth: Math.round(stats._avg.growthScore || 0),
      csi: Math.round(stats._avg.csiScore100 || 0),
      warranty: Math.round(stats._avg.warrantyScore || 0),
      training: Math.round(stats._avg.trainingScore || 0),
      inventory: Math.round(stats._avg.inventoryScore || 0),
      payment: Math.round(stats._avg.paymentScore || 0),
    },
    range: {
      max: stats._max.compositeScore,
      min: stats._min.compositeScore,
    },
  };
}
