/**
 * Forecasting Module Tests
 * Tests for demand analysis, order planning, and database models
 */

import { prisma } from '../setup';
import {
  calculateSeasonalFactors,
  analyzeTrend,
  calculateMovingAverage,
  calculateExponentialMA,
  detectOutliers,
  calculateConfidenceInterval,
  aggregateToMonthly,
} from '../../src/lib/services/forecasting/demand-analyzer';
import type { HistoricalDemandPoint } from '../../src/types/forecasting';

describe('Demand Analyzer', () => {
  describe('calculateSeasonalFactors', () => {
    it('should return neutral factors when insufficient data', () => {
      const data: HistoricalDemandPoint[] = [
        { date: new Date('2024-01-15'), quantity: 100, productId: 'p1' },
        { date: new Date('2024-02-15'), quantity: 110, productId: 'p1' },
      ];

      const result = calculateSeasonalFactors(data);

      expect(result.calculated).toBe(false);
      expect(result.monthly).toHaveLength(12);
      expect(result.monthly.every(f => f === 1.0)).toBe(true);
    });

    it('should calculate seasonal factors with sufficient data', () => {
      // Create 24 months of data with seasonal pattern
      const data: HistoricalDemandPoint[] = [];
      const seasonalPattern = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 1.5];

      for (let year = 0; year < 2; year++) {
        for (let month = 0; month < 12; month++) {
          data.push({
            date: new Date(2023 + year, month, 15),
            quantity: 100 * seasonalPattern[month],
            productId: 'p1',
          });
        }
      }

      const result = calculateSeasonalFactors(data);

      expect(result.calculated).toBe(true);
      expect(result.monthly).toHaveLength(12);
      expect(result.patternStrength).toBeGreaterThan(0);
    });
  });

  describe('analyzeTrend', () => {
    it('should detect upward trend', () => {
      const data: HistoricalDemandPoint[] = [
        { date: new Date('2024-01-01'), quantity: 100, productId: 'p1' },
        { date: new Date('2024-02-01'), quantity: 120, productId: 'p1' },
        { date: new Date('2024-03-01'), quantity: 140, productId: 'p1' },
        { date: new Date('2024-04-01'), quantity: 160, productId: 'p1' },
        { date: new Date('2024-05-01'), quantity: 180, productId: 'p1' },
      ];

      const result = analyzeTrend(data);

      expect(result.direction).toBe('up');
      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeGreaterThan(0.9);
    });

    it('should detect downward trend', () => {
      const data: HistoricalDemandPoint[] = [
        { date: new Date('2024-01-01'), quantity: 200, productId: 'p1' },
        { date: new Date('2024-02-01'), quantity: 180, productId: 'p1' },
        { date: new Date('2024-03-01'), quantity: 160, productId: 'p1' },
        { date: new Date('2024-04-01'), quantity: 140, productId: 'p1' },
        { date: new Date('2024-05-01'), quantity: 120, productId: 'p1' },
      ];

      const result = analyzeTrend(data);

      expect(result.direction).toBe('down');
      expect(result.slope).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const data: HistoricalDemandPoint[] = [
        { date: new Date('2024-01-01'), quantity: 100, productId: 'p1' },
        { date: new Date('2024-02-01'), quantity: 101, productId: 'p1' },
        { date: new Date('2024-03-01'), quantity: 99, productId: 'p1' },
        { date: new Date('2024-04-01'), quantity: 100, productId: 'p1' },
        { date: new Date('2024-05-01'), quantity: 100, productId: 'p1' },
      ];

      const result = analyzeTrend(data);

      expect(result.direction).toBe('stable');
    });

    it('should handle empty data', () => {
      const result = analyzeTrend([]);

      expect(result.slope).toBe(0);
      expect(result.direction).toBe('stable');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate correct moving average', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(data, 3);

      expect(result).toEqual([20, 30, 40]);
    });

    it('should return original data if window is too large', () => {
      const data = [10, 20];
      const result = calculateMovingAverage(data, 5);

      expect(result).toEqual(data);
    });
  });

  describe('calculateExponentialMA', () => {
    it('should calculate exponential moving average', () => {
      const data = [100, 110, 120, 130, 140];
      const result = calculateExponentialMA(data, 0.3);

      expect(result).toHaveLength(5);
      expect(result[0]).toBe(100);
      // EMA final value depends on the alpha factor - just check it's reasonable
      expect(result[result.length - 1]).toBeGreaterThan(100);
      expect(result[result.length - 1]).toBeLessThan(140);
    });

    it('should handle empty data', () => {
      const result = calculateExponentialMA([]);
      expect(result).toEqual([]);
    });
  });

  describe('detectOutliers', () => {
    it('should detect outliers using IQR method', () => {
      const data = [10, 11, 12, 13, 14, 100]; // 100 is an outlier

      const result = detectOutliers(data);

      expect(result.outliers).toContain(100);
      expect(result.cleanedData).not.toContain(100);
    });

    it('should handle small datasets', () => {
      const data = [10, 20];

      const result = detectOutliers(data);

      expect(result.outliers).toEqual([]);
      expect(result.cleanedData).toEqual(data);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should calculate 95% confidence interval', () => {
      const forecast = 100;
      const stdError = 10;

      const result = calculateConfidenceInterval(forecast, stdError, 0.95);

      expect(result.lower).toBeCloseTo(80.4, 1);
      expect(result.upper).toBeCloseTo(119.6, 1);
    });

    it('should not return negative lower bound', () => {
      const forecast = 10;
      const stdError = 20;

      const result = calculateConfidenceInterval(forecast, stdError);

      expect(result.lower).toBe(0);
    });
  });

  describe('aggregateToMonthly', () => {
    it('should aggregate daily data to monthly', () => {
      const data: HistoricalDemandPoint[] = [
        { date: new Date('2024-01-05'), quantity: 10, productId: 'p1' },
        { date: new Date('2024-01-15'), quantity: 20, productId: 'p1' },
        { date: new Date('2024-01-25'), quantity: 30, productId: 'p1' },
        { date: new Date('2024-02-10'), quantity: 50, productId: 'p1' },
      ];

      const result = aggregateToMonthly(data);

      expect(result).toHaveLength(2);
      expect(result[0].quantity).toBe(60); // Jan total
      expect(result[1].quantity).toBe(50); // Feb total
    });
  });
});

describe('Forecasting Database Models', () => {
  let testDealerId: string;
  let testProductId: string;

  beforeEach(async () => {
    // Create test dealer
    const dealer = await prisma.dealer.create({
      data: {
        code: `DLR-FORECAST-${Date.now()}`,
        name: 'Forecast Test Dealer',
        status: 'active',
      },
    });
    testDealerId = dealer.id;

    // Create test product
    const product = await prisma.product.create({
      data: {
        sku: `SKU-FORECAST-${Date.now()}`,
        name: 'Forecast Test Product',
        price: 99.99,
        costPrice: 59.99,
        status: 'active',
      },
    });
    testProductId = product.id;
  });

  describe('ForecastConfig', () => {
    it('should create forecast config with default values', async () => {
      const config = await prisma.forecastConfig.create({
        data: {
          dealerId: testDealerId,
        },
      });

      expect(config.forecastHorizon).toBe(18);
      expect(config.historyPeriod).toBe(24);
      expect(config.confidenceLevel).toBe(0.95);
      expect(config.useSeasonality).toBe(true);
      expect(config.safetyStockDays).toBe(14);
      expect(config.leadTimeDays).toBe(7);
      expect(config.isActive).toBe(true);
    });

    it('should enforce unique dealer constraint', async () => {
      await prisma.forecastConfig.create({
        data: { dealerId: testDealerId },
      });

      await expect(
        prisma.forecastConfig.create({
          data: { dealerId: testDealerId },
        })
      ).rejects.toThrow();
    });

    it('should update forecast config', async () => {
      const config = await prisma.forecastConfig.create({
        data: { dealerId: testDealerId },
      });

      const updated = await prisma.forecastConfig.update({
        where: { id: config.id },
        data: {
          forecastHorizon: 24,
          safetyStockDays: 21,
          marketGrowthRate: 5.0,
        },
      });

      expect(updated.forecastHorizon).toBe(24);
      expect(updated.safetyStockDays).toBe(21);
      expect(updated.marketGrowthRate).toBe(5.0);
    });
  });

  describe('DemandForecast', () => {
    let configId: string;

    beforeEach(async () => {
      const config = await prisma.forecastConfig.create({
        data: { dealerId: testDealerId },
      });
      configId = config.id;
    });

    it('should create demand forecast', async () => {
      const periodStart = new Date('2024-02-01');
      const periodEnd = new Date('2024-02-29');

      const forecast = await prisma.demandForecast.create({
        data: {
          forecastConfigId: configId,
          productId: testProductId,
          periodStart,
          periodEnd,
          forecastedDemand: 150,
          lowerBound: 120,
          upperBound: 180,
          historicalAverage: 140,
          yearOverYearChange: 7.1,
        },
      });

      expect(forecast.forecastedDemand).toBe(150);
      expect(forecast.lowerBound).toBe(120);
      expect(forecast.upperBound).toBe(180);
      expect(forecast.periodType).toBe('month');
    });

    it('should enforce unique constraint on config + product + period', async () => {
      const periodStart = new Date('2024-03-01');

      await prisma.demandForecast.create({
        data: {
          forecastConfigId: configId,
          productId: testProductId,
          periodStart,
          periodEnd: new Date('2024-03-31'),
          forecastedDemand: 100,
          lowerBound: 80,
          upperBound: 120,
        },
      });

      await expect(
        prisma.demandForecast.create({
          data: {
            forecastConfigId: configId,
            productId: testProductId,
            periodStart,
            periodEnd: new Date('2024-03-31'),
            forecastedDemand: 110,
            lowerBound: 90,
            upperBound: 130,
          },
        })
      ).rejects.toThrow();
    });

    it('should cascade delete on config deletion', async () => {
      await prisma.demandForecast.create({
        data: {
          forecastConfigId: configId,
          productId: testProductId,
          periodStart: new Date('2024-04-01'),
          periodEnd: new Date('2024-04-30'),
          forecastedDemand: 100,
          lowerBound: 80,
          upperBound: 120,
        },
      });

      await prisma.forecastConfig.delete({
        where: { id: configId },
      });

      const forecasts = await prisma.demandForecast.findMany({
        where: { forecastConfigId: configId },
      });

      expect(forecasts).toHaveLength(0);
    });
  });

  describe('SuggestedOrder', () => {
    let configId: string;

    beforeEach(async () => {
      const config = await prisma.forecastConfig.create({
        data: { dealerId: testDealerId },
      });
      configId = config.id;
    });

    it('should create suggested order with all fields', async () => {
      const order = await prisma.suggestedOrder.create({
        data: {
          forecastConfigId: configId,
          productId: testProductId,
          suggestedOrderDate: new Date('2024-02-15'),
          expectedDeliveryDate: new Date('2024-02-22'),
          suggestedQuantity: 100,
          minimumQuantity: 50,
          economicOrderQty: 75,
          currentStock: 25,
          projectedStock: 10,
          projectedDemand: 80,
          estimatedCost: 5999.0,
          estimatedValue: 9999.0,
          priority: 'high',
          status: 'pending',
          reasoning: JSON.stringify({
            primaryReason: 'Low stock alert',
            factors: ['Below reorder point', 'High demand period'],
            riskLevel: 'medium',
            stockoutRisk: 65,
            overstockRisk: 10,
          }),
        },
      });

      expect(order.suggestedQuantity).toBe(100);
      expect(order.priority).toBe('high');
      expect(order.status).toBe('pending');
      expect(JSON.parse(order.reasoning!).stockoutRisk).toBe(65);
    });

    it('should update order status', async () => {
      const order = await prisma.suggestedOrder.create({
        data: {
          forecastConfigId: configId,
          productId: testProductId,
          suggestedOrderDate: new Date('2024-03-01'),
          expectedDeliveryDate: new Date('2024-03-08'),
          suggestedQuantity: 50,
          minimumQuantity: 30,
          currentStock: 20,
          projectedStock: 5,
          projectedDemand: 45,
        },
      });

      const updated = await prisma.suggestedOrder.update({
        where: { id: order.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      });

      expect(updated.status).toBe('accepted');
      expect(updated.acceptedAt).toBeDefined();
    });
  });

  describe('SeasonalPattern', () => {
    it('should create global seasonal pattern', async () => {
      const pattern = await prisma.seasonalPattern.create({
        data: {
          patternName: 'Holiday Season',
          patternType: 'monthly',
          factors: JSON.stringify([0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 1.2, 1.5]),
          isActive: true,
        },
      });

      expect(pattern.patternName).toBe('Holiday Season');
      expect(JSON.parse(pattern.factors)).toHaveLength(12);
    });

    it('should create dealer-specific pattern', async () => {
      const pattern = await prisma.seasonalPattern.create({
        data: {
          dealerId: testDealerId,
          patternName: 'Local Peak Season',
          patternType: 'monthly',
          factors: JSON.stringify([1.0, 1.0, 1.0, 1.0, 1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 1.0, 1.0]),
        },
      });

      expect(pattern.dealerId).toBe(testDealerId);
    });
  });

  describe('MarketIndicator', () => {
    it('should create market indicator', async () => {
      const indicator = await prisma.marketIndicator.create({
        data: {
          region: 'CA',
          regionType: 'state',
          indicatorName: 'Housing Starts',
          indicatorType: 'industry',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          value: 150000,
          previousValue: 145000,
          percentChange: 3.45,
          impactFactor: 1.03,
          confidence: 0.85,
          source: 'Census Bureau',
        },
      });

      expect(indicator.region).toBe('CA');
      expect(indicator.value).toBe(150000);
      expect(indicator.impactFactor).toBe(1.03);
    });

    it('should enforce unique constraint on region + name + period', async () => {
      const baseData = {
        region: 'TX',
        regionType: 'state',
        indicatorName: 'Consumer Index',
        indicatorType: 'economic',
        periodStart: new Date('2024-02-01'),
        periodEnd: new Date('2024-02-29'),
        value: 100,
      };

      await prisma.marketIndicator.create({ data: baseData });

      await expect(
        prisma.marketIndicator.create({ data: { ...baseData, value: 105 } })
      ).rejects.toThrow();
    });
  });
});
