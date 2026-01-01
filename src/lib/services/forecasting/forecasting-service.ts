// Forecasting Service
// Main service for generating demand forecasts and order recommendations

import { prisma } from '@/lib/db';
import type {
  DemandForecastResult,
  ForecastConfigInput,
  ForecastPeriod,
  ForecastSummary,
  HistoricalDemandPoint,
  SuggestedOrderPlan,
  SuggestedOrderItem,
  OrderPlanSummary,
  OrderReasoning,
  ForecastChartData,
  OrderTimelineData,
  MonthlyOrderSummary,
} from '@/types/forecasting';
import {
  calculateSeasonalFactors,
  analyzeTrend,
  calculateConfidenceInterval,
  calculateStandardError,
  aggregateToMonthly,
} from './demand-analyzer';

/**
 * Get or create forecast configuration for a dealer
 */
export async function getOrCreateForecastConfig(dealerId: string) {
  let config = await prisma.forecastConfig.findUnique({
    where: { dealerId },
  });

  if (!config) {
    config = await prisma.forecastConfig.create({
      data: { dealerId },
    });
  }

  return config;
}

/**
 * Update forecast configuration
 */
export async function updateForecastConfig(
  dealerId: string,
  input: Partial<ForecastConfigInput>
) {
  return prisma.forecastConfig.upsert({
    where: { dealerId },
    update: input,
    create: { dealerId, ...input },
  });
}

/**
 * Get historical demand data for a dealer's products
 */
export async function getHistoricalDemand(
  dealerId: string,
  productId?: string,
  monthsBack: number = 24
): Promise<HistoricalDemandPoint[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const whereClause: Record<string, unknown> = {
    dealerId,
    status: { in: ['confirmed', 'processing', 'shipped', 'delivered'] },
    submittedAt: { gte: startDate },
  };

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: {
        where: productId ? { productId } : undefined,
        include: {
          product: true,
        },
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  const demandPoints: HistoricalDemandPoint[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (order.submittedAt) {
        demandPoints.push({
          date: order.submittedAt,
          quantity: item.quantity,
          productId: item.productId,
        });
      }
    }
  }

  return demandPoints;
}

/**
 * Generate demand forecasts for a dealer's products
 */
export async function generateDemandForecasts(
  dealerId: string,
  productIds?: string[]
): Promise<DemandForecastResult[]> {
  const config = await getOrCreateForecastConfig(dealerId);

  // Get products to forecast
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  const products = await prisma.product.findMany({
    where: productIds ? { id: { in: productIds } } : { status: 'active' },
    include: {
      inventory: true,
    },
  });

  const results: DemandForecastResult[] = [];

  for (const product of products) {
    // Get historical demand for this product
    const historicalDemand = await getHistoricalDemand(
      dealerId,
      product.id,
      config.historyPeriod
    );

    // Aggregate to monthly
    const monthlyDemand = aggregateToMonthly(historicalDemand);

    // Calculate seasonal factors
    const seasonalFactors = config.useSeasonality
      ? calculateSeasonalFactors(monthlyDemand)
      : { monthly: Array(12).fill(1), calculated: false, patternStrength: 0 };

    // Analyze trend
    const trendAnalysis = analyzeTrend(monthlyDemand);

    // Generate forecast periods
    const periods = generateForecastPeriods(
      config.forecastHorizon,
      monthlyDemand,
      seasonalFactors.monthly,
      trendAnalysis,
      config.confidenceLevel,
      config.marketGrowthRate,
      config.localMarketFactor
    );

    // Calculate summary
    const summary = calculateForecastSummary(periods, trendAnalysis);

    // Store forecasts in database
    await storeDemandForecasts(config.id, product.id, periods);

    results.push({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      periods,
      summary,
    });
  }

  // Update last calculated timestamp
  await prisma.forecastConfig.update({
    where: { id: config.id },
    data: { lastCalculatedAt: new Date() },
  });

  return results;
}

/**
 * Generate forecast periods for a product
 */
function generateForecastPeriods(
  horizonMonths: number,
  historicalData: HistoricalDemandPoint[],
  seasonalFactors: number[],
  trend: { slope: number; intercept: number },
  confidenceLevel: number,
  marketGrowthRate: number,
  localMarketFactor: number
): ForecastPeriod[] {
  const periods: ForecastPeriod[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();

  // Calculate base demand from recent history
  const recentDemand = historicalData.slice(-6);
  const baseDemand = recentDemand.length > 0
    ? recentDemand.reduce((sum, d) => sum + d.quantity, 0) / recentDemand.length
    : 10; // Default if no history

  // Calculate historical standard deviation for confidence intervals
  const quantities = historicalData.map(d => d.quantity);
  const stdError = calculateStandardError(quantities);

  // Get same-period historical data for YoY comparison
  const historicalByMonth = new Map<number, number[]>();
  for (const point of historicalData) {
    const month = point.date.getMonth();
    if (!historicalByMonth.has(month)) {
      historicalByMonth.set(month, []);
    }
    historicalByMonth.get(month)!.push(point.quantity);
  }

  for (let i = 0; i < horizonMonths; i++) {
    const periodStart = new Date(now.getFullYear(), currentMonth + i + 1, 1);
    const periodEnd = new Date(now.getFullYear(), currentMonth + i + 2, 0);
    const forecastMonth = periodStart.getMonth();

    // Calculate trend component
    const monthsFromNow = i + 1;
    const trendValue = trend.slope * monthsFromNow;

    // Apply seasonal factor
    const seasonalFactor = seasonalFactors[forecastMonth];

    // Apply market growth
    const growthFactor = 1 + (marketGrowthRate / 100) * (monthsFromNow / 12);

    // Calculate forecast
    let forecast = (baseDemand + trendValue) * seasonalFactor * growthFactor * localMarketFactor;
    forecast = Math.max(0, Math.round(forecast));

    // Calculate confidence interval
    const { lower, upper } = calculateConfidenceInterval(
      forecast,
      stdError * Math.sqrt(1 + monthsFromNow / 12), // Widen interval for further forecasts
      confidenceLevel
    );

    // Get historical average for this month
    const historicalForMonth = historicalByMonth.get(forecastMonth) || [];
    const historicalAverage = historicalForMonth.length > 0
      ? historicalForMonth.reduce((a, b) => a + b, 0) / historicalForMonth.length
      : null;

    // Calculate YoY change
    const lastYearValue = historicalForMonth.length > 0
      ? historicalForMonth[historicalForMonth.length - 1]
      : null;
    const yearOverYearChange = lastYearValue && lastYearValue > 0
      ? ((forecast - lastYearValue) / lastYearValue) * 100
      : null;

    periods.push({
      periodStart,
      periodEnd,
      periodLabel: periodStart.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      forecastedDemand: forecast,
      lowerBound: Math.round(lower),
      upperBound: Math.round(upper),
      historicalAverage,
      yearOverYearChange,
      trendComponent: trendValue,
      seasonalComponent: seasonalFactor - 1, // Deviation from 1.0
    });
  }

  return periods;
}

/**
 * Calculate forecast summary statistics
 */
function calculateForecastSummary(
  periods: ForecastPeriod[],
  trend: { direction: 'up' | 'down' | 'stable' }
): ForecastSummary {
  const demands = periods.map(p => p.forecastedDemand);
  const totalForecastedDemand = demands.reduce((a, b) => a + b, 0);
  const averageMonthlyDemand = totalForecastedDemand / periods.length;

  const maxDemand = Math.max(...demands);
  const minDemand = Math.min(...demands);
  const peakMonth = periods.find(p => p.forecastedDemand === maxDemand)?.periodLabel || '';
  const lowMonth = periods.find(p => p.forecastedDemand === minDemand)?.periodLabel || '';

  // Confidence score based on data quality
  const confidenceScore = Math.min(
    0.95,
    0.5 + (periods.filter(p => p.historicalAverage !== null).length / periods.length) * 0.45
  );

  return {
    totalForecastedDemand,
    averageMonthlyDemand,
    peakMonth,
    lowMonth,
    trendDirection: trend.direction,
    confidenceScore,
  };
}

/**
 * Store demand forecasts in database
 */
async function storeDemandForecasts(
  forecastConfigId: string,
  productId: string,
  periods: ForecastPeriod[]
) {
  // Delete existing forecasts for this config/product
  await prisma.demandForecast.deleteMany({
    where: { forecastConfigId, productId },
  });

  // Create new forecasts
  await prisma.demandForecast.createMany({
    data: periods.map(period => ({
      forecastConfigId,
      productId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      periodType: 'month',
      forecastedDemand: period.forecastedDemand,
      lowerBound: period.lowerBound,
      upperBound: period.upperBound,
      historicalAverage: period.historicalAverage,
      yearOverYearChange: period.yearOverYearChange,
      trendComponent: period.trendComponent,
      seasonalComponent: period.seasonalComponent,
    })),
  });
}

/**
 * Generate suggested order plan for a dealer
 */
export async function generateSuggestedOrderPlan(
  dealerId: string
): Promise<SuggestedOrderPlan> {
  const config = await getOrCreateForecastConfig(dealerId);

  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new Error('Dealer not found');
  }

  // Get forecasts
  const forecasts = await prisma.demandForecast.findMany({
    where: { forecastConfigId: config.id },
    include: { product: { include: { inventory: true } } },
    orderBy: { periodStart: 'asc' },
  });

  // Group forecasts by product
  const forecastsByProduct = new Map<string, typeof forecasts>();
  for (const forecast of forecasts) {
    if (!forecastsByProduct.has(forecast.productId)) {
      forecastsByProduct.set(forecast.productId, []);
    }
    forecastsByProduct.get(forecast.productId)!.push(forecast);
  }

  const suggestedOrders: SuggestedOrderItem[] = [];

  for (const [productId, productForecasts] of forecastsByProduct) {
    const product = productForecasts[0].product;
    const currentStock = product.inventory.reduce(
      (sum, inv) => sum + (inv.quantity - inv.reserved),
      0
    );

    // Calculate reorder points and generate orders
    const orders = calculateReorderSchedule(
      productId,
      product.name,
      product.sku,
      product.price,
      product.costPrice || product.price * 0.6,
      currentStock,
      productForecasts,
      config
    );

    suggestedOrders.push(...orders);
  }

  // Sort by date
  suggestedOrders.sort(
    (a, b) => a.suggestedOrderDate.getTime() - b.suggestedOrderDate.getTime()
  );

  // Store suggested orders
  await storeSuggestedOrders(config.id, suggestedOrders);

  // Calculate summary
  const summary = calculateOrderPlanSummary(suggestedOrders);

  return {
    dealerId,
    dealerName: dealer.name,
    generatedAt: new Date(),
    horizonMonths: config.forecastHorizon,
    orders: suggestedOrders,
    summary,
  };
}

/**
 * Calculate reorder schedule for a product
 */
function calculateReorderSchedule(
  productId: string,
  productName: string,
  productSku: string,
  price: number,
  costPrice: number,
  currentStock: number,
  forecasts: { periodStart: Date; forecastedDemand: number }[],
  config: {
    safetyStockDays: number;
    leadTimeDays: number;
    minOrderQuantity: number;
    orderMultiple: number;
  }
): SuggestedOrderItem[] {
  const orders: SuggestedOrderItem[] = [];
  let projectedStock = currentStock;
  const dailyDemand = forecasts[0]?.forecastedDemand / 30 || 1;

  // Safety stock calculation
  const safetyStock = Math.ceil(dailyDemand * config.safetyStockDays);
  const reorderPoint = safetyStock + Math.ceil(dailyDemand * config.leadTimeDays);

  for (let i = 0; i < forecasts.length; i++) {
    const forecast = forecasts[i];
    const monthlyDemand = forecast.forecastedDemand;

    // Project stock at end of period
    projectedStock -= monthlyDemand;

    // Check if reorder needed
    if (projectedStock < reorderPoint) {
      // Calculate order quantity
      const deficit = reorderPoint - projectedStock + monthlyDemand * 2; // Cover 2 months
      let orderQty = Math.max(config.minOrderQuantity, deficit);

      // Round to order multiple
      if (config.orderMultiple > 1) {
        orderQty = Math.ceil(orderQty / config.orderMultiple) * config.orderMultiple;
      }

      // Calculate dates
      const orderDate = new Date(forecast.periodStart);
      orderDate.setDate(orderDate.getDate() - config.leadTimeDays);

      const deliveryDate = new Date(forecast.periodStart);

      // Calculate priority
      const stockoutRisk = projectedStock <= 0 ? 100 : Math.max(0, 100 - (projectedStock / reorderPoint) * 100);
      let priority: 'critical' | 'high' | 'normal' | 'low';

      if (stockoutRisk > 80) {
        priority = 'critical';
      } else if (stockoutRisk > 50) {
        priority = 'high';
      } else if (stockoutRisk > 20) {
        priority = 'normal';
      } else {
        priority = 'low';
      }

      // Generate reasoning
      const reasoning: OrderReasoning = {
        primaryReason: stockoutRisk > 50
          ? 'Prevent stockout before delivery'
          : 'Maintain safety stock levels',
        factors: [
          `Projected stock: ${Math.round(projectedStock)} units`,
          `Reorder point: ${reorderPoint} units`,
          `Expected demand: ${Math.round(monthlyDemand)} units/month`,
          `Lead time: ${config.leadTimeDays} days`,
        ],
        riskLevel: stockoutRisk > 80 ? 'high' : stockoutRisk > 40 ? 'medium' : 'low',
        stockoutRisk: Math.round(stockoutRisk),
        overstockRisk: Math.round(Math.max(0, (orderQty / monthlyDemand - 3) * 20)), // Risk if > 3 months supply
      };

      orders.push({
        id: `order-${productId}-${i}`,
        productId,
        productName,
        productSku,
        suggestedOrderDate: orderDate,
        expectedDeliveryDate: deliveryDate,
        suggestedQuantity: orderQty,
        minimumQuantity: Math.max(config.minOrderQuantity, deficit),
        economicOrderQty: calculateEOQ(monthlyDemand * 12, costPrice, costPrice * 0.2),
        currentStock: i === 0 ? currentStock : Math.round(projectedStock + monthlyDemand),
        projectedStock: Math.round(projectedStock),
        projectedDemand: Math.round(monthlyDemand),
        estimatedCost: orderQty * costPrice,
        estimatedValue: orderQty * price,
        priority,
        status: 'pending',
        reasoning,
      });

      // Update projected stock
      projectedStock += orderQty;
    }
  }

  return orders;
}

/**
 * Calculate Economic Order Quantity
 */
function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number
): number {
  if (holdingCostPerUnit <= 0) return Math.round(annualDemand / 12);
  return Math.round(Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit));
}

/**
 * Store suggested orders in database
 */
async function storeSuggestedOrders(
  forecastConfigId: string,
  orders: SuggestedOrderItem[]
) {
  // Delete existing pending orders
  await prisma.suggestedOrder.deleteMany({
    where: { forecastConfigId, status: 'pending' },
  });

  // Create new orders
  await prisma.suggestedOrder.createMany({
    data: orders.map(order => ({
      forecastConfigId,
      productId: order.productId,
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
      reasoning: JSON.stringify(order.reasoning),
    })),
  });
}

/**
 * Calculate order plan summary
 */
function calculateOrderPlanSummary(orders: SuggestedOrderItem[]): OrderPlanSummary {
  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    totalOrders: orders.length,
    totalUnits: orders.reduce((sum, o) => sum + o.suggestedQuantity, 0),
    totalEstimatedCost: orders.reduce((sum, o) => sum + (o.estimatedCost || 0), 0),
    totalEstimatedValue: orders.reduce((sum, o) => sum + (o.estimatedValue || 0), 0),
    criticalOrders: orders.filter(o => o.priority === 'critical').length,
    upcomingWeek: orders.filter(o => o.suggestedOrderDate <= oneWeek).length,
    upcomingMonth: orders.filter(o => o.suggestedOrderDate <= oneMonth).length,
  };
}

/**
 * Get forecast chart data for visualization
 */
export async function getForecastChartData(
  dealerId: string,
  productId?: string
): Promise<ForecastChartData> {
  const config = await getOrCreateForecastConfig(dealerId);

  const forecasts = await prisma.demandForecast.findMany({
    where: {
      forecastConfigId: config.id,
      ...(productId ? { productId } : {}),
    },
    orderBy: { periodStart: 'asc' },
  });

  // Aggregate if multiple products
  const aggregated = new Map<string, { forecast: number; lower: number; upper: number }>();

  for (const f of forecasts) {
    const label = f.periodStart.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const current = aggregated.get(label) || { forecast: 0, lower: 0, upper: 0 };
    aggregated.set(label, {
      forecast: current.forecast + f.forecastedDemand,
      lower: current.lower + f.lowerBound,
      upper: current.upper + f.upperBound,
    });
  }

  const labels = Array.from(aggregated.keys());
  const forecastData = Array.from(aggregated.values()).map(v => v.forecast);
  const lowerData = Array.from(aggregated.values()).map(v => v.lower);
  const upperData = Array.from(aggregated.values()).map(v => v.upper);

  return {
    labels,
    datasets: [
      {
        label: 'Forecasted Demand',
        data: forecastData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Lower Bound',
        data: lowerData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Upper Bound',
        data: upperData,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        fill: '-1',
        tension: 0.4,
      },
    ],
  };
}

/**
 * Get order timeline data for visualization
 */
export async function getOrderTimelineData(
  dealerId: string
): Promise<OrderTimelineData> {
  const config = await getOrCreateForecastConfig(dealerId);

  const orders = await prisma.suggestedOrder.findMany({
    where: { forecastConfigId: config.id },
    include: { product: true },
    orderBy: { suggestedOrderDate: 'asc' },
  });

  // Group by month
  const monthlyMap = new Map<string, MonthlyOrderSummary>();

  for (const order of orders) {
    const monthKey = order.suggestedOrderDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        orders: 0,
        units: 0,
        estimatedCost: 0,
        products: [],
      });
    }

    const monthly = monthlyMap.get(monthKey)!;
    monthly.orders++;
    monthly.units += order.suggestedQuantity;
    monthly.estimatedCost += order.estimatedCost || 0;
    monthly.products.push({
      name: order.product.name,
      quantity: order.suggestedQuantity,
      priority: order.priority,
    });
  }

  return {
    months: Array.from(monthlyMap.values()),
  };
}

/**
 * Accept or skip a suggested order
 */
export async function updateSuggestedOrderStatus(
  orderId: string,
  status: 'accepted' | 'skipped',
  actualOrderId?: string
) {
  return prisma.suggestedOrder.update({
    where: { id: orderId },
    data: {
      status,
      acceptedAt: status === 'accepted' ? new Date() : undefined,
      actualOrderId,
    },
  });
}

/**
 * Get suggested orders for a dealer
 */
export async function getSuggestedOrders(
  dealerId: string,
  status?: 'pending' | 'accepted' | 'ordered' | 'skipped'
) {
  const config = await getOrCreateForecastConfig(dealerId);

  return prisma.suggestedOrder.findMany({
    where: {
      forecastConfigId: config.id,
      ...(status ? { status } : {}),
    },
    include: { product: true },
    orderBy: { suggestedOrderDate: 'asc' },
  });
}
