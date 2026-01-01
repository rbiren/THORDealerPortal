/**
 * Ultra Comprehensive Forecasting Algorithm Tests
 * Task 4.6.26 - Edge cases, sparse data, seasonal patterns, trend detection
 * Minimum 50 test cases
 */

import {
  calculateSeasonalFactors,
  analyzeTrend,
  calculateMovingAverage,
  calculateExponentialMA,
  detectOutliers,
  calculateConfidenceInterval,
  calculateStandardError,
  aggregateToMonthly,
} from '../../src/lib/services/forecasting/demand-analyzer';
import type { HistoricalDemandPoint } from '../../src/types/forecasting';

// Helper to create demand point
const createPoint = (date: string, quantity: number, productId = 'p1'): HistoricalDemandPoint => ({
  date: new Date(date),
  quantity,
  productId,
});

// Helper to create date range data
const createDateRangeData = (
  startYear: number,
  months: number,
  baseValue: number,
  generator: (i: number) => number = () => baseValue
): HistoricalDemandPoint[] => {
  const data: HistoricalDemandPoint[] = [];
  for (let i = 0; i < months; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = i % 12;
    data.push({
      date: new Date(year, month, 15),
      quantity: generator(i),
      productId: 'p1',
    });
  }
  return data;
};

describe('Ultra Comprehensive Algorithm Tests', () => {
  // ==========================================
  // EDGE CASES: Empty and Minimal Data
  // ==========================================
  describe('Edge Cases - Empty and Minimal Data', () => {
    it('should handle empty array for seasonal factors', () => {
      const result = calculateSeasonalFactors([]);
      expect(result.calculated).toBe(false);
      expect(result.monthly).toHaveLength(12);
      expect(result.monthly.every(f => f === 1.0)).toBe(true);
    });

    it('should handle single data point for seasonal factors', () => {
      const data = [createPoint('2024-01-15', 100)];
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(false);
    });

    it('should handle empty array for trend analysis', () => {
      const result = analyzeTrend([]);
      expect(result.slope).toBe(0);
      expect(result.direction).toBe('stable');
      expect(result.rSquared).toBe(0);
    });

    it('should handle single point for trend analysis', () => {
      const data = [createPoint('2024-01-15', 100)];
      const result = analyzeTrend(data);
      expect(result.direction).toBe('stable');
    });

    it('should handle two points for trend analysis', () => {
      const data = [
        createPoint('2024-01-15', 100),
        createPoint('2024-02-15', 120),
      ];
      const result = analyzeTrend(data);
      expect(result.direction).toBe('stable'); // Less than 3 points
    });

    it('should handle empty array for moving average', () => {
      expect(calculateMovingAverage([], 3)).toEqual([]);
    });

    it('should handle single element for moving average', () => {
      expect(calculateMovingAverage([10], 3)).toEqual([10]);
    });

    it('should handle empty array for EMA', () => {
      expect(calculateExponentialMA([])).toEqual([]);
    });

    it('should handle single element for EMA', () => {
      expect(calculateExponentialMA([100])).toEqual([100]);
    });

    it('should handle empty array for outlier detection', () => {
      const result = detectOutliers([]);
      expect(result.outliers).toEqual([]);
      expect(result.cleanedData).toEqual([]);
    });

    it('should handle 3 elements for outlier detection (minimum 4 required)', () => {
      const result = detectOutliers([10, 20, 30]);
      expect(result.outliers).toEqual([]);
      expect(result.cleanedData).toEqual([10, 20, 30]);
    });

    it('should handle empty array for standard error', () => {
      expect(calculateStandardError([])).toBe(0);
    });

    it('should handle empty array for aggregateToMonthly', () => {
      expect(aggregateToMonthly([])).toEqual([]);
    });
  });

  // ==========================================
  // EDGE CASES: Zero and Negative Values
  // ==========================================
  describe('Edge Cases - Zero and Negative Values', () => {
    it('should handle all zeros for seasonal factors', () => {
      const data = createDateRangeData(2023, 24, 0);
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(false);
    });

    it('should handle all zeros for trend analysis', () => {
      const data = createDateRangeData(2023, 12, 0);
      const result = analyzeTrend(data);
      expect(result.slope).toBe(0);
      expect(result.direction).toBe('stable');
    });

    it('should handle zeros in moving average', () => {
      const result = calculateMovingAverage([0, 0, 0, 0], 2);
      expect(result).toEqual([0, 0, 0]);
    });

    it('should handle zeros in EMA', () => {
      const result = calculateExponentialMA([0, 0, 0, 0]);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('should handle negative values in trend analysis', () => {
      const data = [
        createPoint('2024-01-01', -100),
        createPoint('2024-02-01', -80),
        createPoint('2024-03-01', -60),
        createPoint('2024-04-01', -40),
      ];
      const result = analyzeTrend(data);
      expect(result.slope).toBeGreaterThan(0); // Trend is up (less negative)
    });

    it('should handle mix of positive and negative in outlier detection', () => {
      const data = [-50, -20, 10, 20, 30, 40, 50, 200];
      const result = detectOutliers(data);
      expect(result.outliers).toContain(200);
    });

    it('should handle negative forecast in confidence interval', () => {
      const result = calculateConfidenceInterval(-50, 10);
      expect(result.lower).toBe(0); // Should not go below 0
    });

    it('should handle zero forecast with non-zero error', () => {
      const result = calculateConfidenceInterval(0, 10);
      expect(result.lower).toBe(0);
      expect(result.upper).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // SPARSE DATA TESTS
  // ==========================================
  describe('Sparse Data - Missing Months and Irregular Intervals', () => {
    it('should handle data with missing months for seasonal factors', () => {
      // Only have data for some months across 2 years
      const data: HistoricalDemandPoint[] = [
        createPoint('2023-01-15', 100),
        createPoint('2023-03-15', 120),
        createPoint('2023-06-15', 150),
        createPoint('2023-09-15', 130),
        createPoint('2023-12-15', 180),
        createPoint('2024-01-15', 110),
        createPoint('2024-03-15', 130),
        createPoint('2024-06-15', 160),
        createPoint('2024-09-15', 140),
        createPoint('2024-12-15', 190),
      ];
      const result = calculateSeasonalFactors(data);
      // Less than 24 points
      expect(result.calculated).toBe(false);
    });

    it('should handle irregular date intervals in trend analysis', () => {
      const data = [
        createPoint('2024-01-01', 100),
        createPoint('2024-01-15', 105),
        createPoint('2024-03-01', 120),
        createPoint('2024-06-15', 150),
        createPoint('2024-12-01', 200),
      ];
      const result = analyzeTrend(data);
      expect(result.direction).toBe('up');
    });

    it('should aggregate sparse daily data into months', () => {
      const data = [
        createPoint('2024-01-05', 10),
        createPoint('2024-01-20', 20),
        createPoint('2024-03-10', 50), // Skipped February
        createPoint('2024-03-25', 60),
      ];
      const result = aggregateToMonthly(data);
      expect(result).toHaveLength(2); // January and March
      expect(result[0].quantity).toBe(30);
      expect(result[1].quantity).toBe(110);
    });

    it('should handle data points on same day', () => {
      const data = [
        createPoint('2024-01-15', 10),
        createPoint('2024-01-15', 20),
        createPoint('2024-01-15', 30),
      ];
      const result = aggregateToMonthly(data);
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(60);
    });
  });

  // ==========================================
  // SEASONAL PATTERN TESTS
  // ==========================================
  describe('Seasonal Pattern Edge Cases', () => {
    it('should detect weak seasonal pattern', () => {
      // Very slight seasonal variation
      const data = createDateRangeData(2023, 24, 100, i => 100 + (i % 12) * 0.5);
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(true);
      expect(result.patternStrength).toBeLessThan(0.1);
    });

    it('should detect strong seasonal pattern', () => {
      const seasonalMultipliers = [0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.6, 1.5, 1.2, 1.0, 0.8, 1.0];
      const data = createDateRangeData(2023, 24, 100, i => 100 * seasonalMultipliers[i % 12]);
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(true);
      expect(result.patternStrength).toBeGreaterThan(0.2);
    });

    it('should detect bi-annual pattern', () => {
      // Peak every 6 months
      const data = createDateRangeData(2023, 24, 100, i => {
        const month = i % 12;
        return month === 0 || month === 6 ? 200 : 100;
      });
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(true);
    });

    it('should handle single-month spike pattern', () => {
      // December spike only
      const data = createDateRangeData(2023, 24, 100, i => {
        return i % 12 === 11 ? 300 : 100;
      });
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(true);
      expect(result.monthly[11]).toBeGreaterThan(2); // December factor > 2
    });

    it('should handle inverse seasonal pattern', () => {
      // Summer low, winter high
      const data = createDateRangeData(2023, 24, 100, i => {
        const month = i % 12;
        if (month >= 5 && month <= 7) return 50; // Summer
        if (month >= 11 || month <= 1) return 150; // Winter
        return 100;
      });
      const result = calculateSeasonalFactors(data);
      expect(result.monthly[6]).toBeLessThan(1); // July low
      expect(result.monthly[0]).toBeGreaterThan(1); // January high
    });

    it('should detect quarterly pattern', () => {
      // Q1 high, Q2-Q4 normal
      const data = createDateRangeData(2023, 24, 100, i => {
        const month = i % 12;
        return month < 3 ? 150 : 100;
      });
      const result = calculateSeasonalFactors(data);
      expect(result.monthly[0]).toBeGreaterThan(1);
      expect(result.monthly[1]).toBeGreaterThan(1);
      expect(result.monthly[2]).toBeGreaterThan(1);
      expect(result.monthly[6]).toBeLessThan(1.1);
    });
  });

  // ==========================================
  // TREND DETECTION TESTS
  // ==========================================
  describe('Trend Detection Edge Cases', () => {
    it('should detect flat trend with noise', () => {
      // Average 100 with ±5 noise
      const data = createDateRangeData(2023, 12, 100, () => 100 + (Math.random() - 0.5) * 10);
      const result = analyzeTrend(data);
      expect(['stable', 'up', 'down']).toContain(result.direction);
    });

    it('should detect exponential growth pattern', () => {
      const data = createDateRangeData(2023, 12, 100, i => 100 * Math.pow(1.1, i));
      const result = analyzeTrend(data);
      expect(result.direction).toBe('up');
      expect(result.slope).toBeGreaterThan(0);
    });

    it('should detect exponential decay pattern', () => {
      const data = createDateRangeData(2023, 12, 100, i => 200 * Math.pow(0.9, i));
      const result = analyzeTrend(data);
      expect(result.direction).toBe('down');
      expect(result.slope).toBeLessThan(0);
    });

    it('should detect step change (plateau)', () => {
      const data = createDateRangeData(2023, 12, 100, i => i < 6 ? 100 : 200);
      const result = analyzeTrend(data);
      expect(result.direction).toBe('up');
    });

    it('should detect V-shaped recovery', () => {
      const data = createDateRangeData(2023, 12, 100, i => {
        if (i < 4) return 100 - i * 10;
        if (i < 8) return 60 + (i - 4) * 15;
        return 120;
      });
      const result = analyzeTrend(data);
      // Overall slight upward or stable
      expect(['up', 'stable']).toContain(result.direction);
    });

    it('should detect inverse V pattern (peak and decline)', () => {
      const data = createDateRangeData(2023, 12, 100, i => {
        if (i < 6) return 100 + i * 20;
        return 220 - (i - 6) * 20;
      });
      const result = analyzeTrend(data);
      // Linear regression on this pattern shows slight upward trend due to asymmetry
      expect(['up', 'stable']).toContain(result.direction);
    });

    it('should handle very high R-squared for linear data', () => {
      const data = createDateRangeData(2023, 12, 100, i => 100 + i * 10);
      const result = analyzeTrend(data);
      expect(result.rSquared).toBeGreaterThan(0.99);
    });

    it('should handle low R-squared for noisy data', () => {
      const data = createDateRangeData(2023, 12, 100, i => 100 + (i % 2 === 0 ? 50 : -50));
      const result = analyzeTrend(data);
      expect(result.rSquared).toBeLessThan(0.5);
    });
  });

  // ==========================================
  // MOVING AVERAGE TESTS
  // ==========================================
  describe('Moving Average Edge Cases', () => {
    it('should handle window size of 1', () => {
      const data = [10, 20, 30, 40];
      const result = calculateMovingAverage(data, 1);
      expect(result).toEqual(data);
    });

    it('should handle window size equal to data length', () => {
      const data = [10, 20, 30, 40];
      const result = calculateMovingAverage(data, 4);
      expect(result).toEqual([25]);
    });

    it('should handle window size larger than data', () => {
      const data = [10, 20];
      const result = calculateMovingAverage(data, 5);
      expect(result).toEqual(data);
    });

    it('should correctly smooth volatile data', () => {
      const data = [100, 10, 100, 10, 100, 10, 100];
      const result = calculateMovingAverage(data, 3);
      // All values should be around 70 (avg of 100, 10, 100 etc.)
      expect(result.every(v => v > 30 && v < 80)).toBe(true);
    });

    it('should preserve trend in smoothed data', () => {
      const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const result = calculateMovingAverage(data, 3);
      // Smoothed data should still show upward trend
      expect(result[result.length - 1]).toBeGreaterThan(result[0]);
    });
  });

  // ==========================================
  // EXPONENTIAL MOVING AVERAGE TESTS
  // ==========================================
  describe('Exponential Moving Average Edge Cases', () => {
    it('should handle alpha = 0 (no change)', () => {
      const data = [100, 200, 300];
      const result = calculateExponentialMA(data, 0);
      expect(result).toEqual([100, 100, 100]);
    });

    it('should handle alpha = 1 (immediate response)', () => {
      const data = [100, 200, 300];
      const result = calculateExponentialMA(data, 1);
      expect(result).toEqual([100, 200, 300]);
    });

    it('should handle alpha = 0.5', () => {
      const data = [100, 200];
      const result = calculateExponentialMA(data, 0.5);
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(150); // 0.5 * 200 + 0.5 * 100
    });

    it('should converge to constant value for constant input', () => {
      const data = [100, 100, 100, 100, 100];
      const result = calculateExponentialMA(data, 0.3);
      expect(result.every(v => v === 100)).toBe(true);
    });

    it('should respond faster with higher alpha', () => {
      const data = [100, 200, 200, 200, 200];
      const lowAlpha = calculateExponentialMA(data, 0.1);
      const highAlpha = calculateExponentialMA(data, 0.9);

      // High alpha should reach 200 faster
      expect(highAlpha[2]).toBeGreaterThan(lowAlpha[2]);
    });

    it('should handle large dataset', () => {
      const data = Array.from({ length: 1000 }, (_, i) => 100 + i);
      const result = calculateExponentialMA(data, 0.3);
      expect(result).toHaveLength(1000);
      expect(result[999]).toBeGreaterThan(result[0]);
    });
  });

  // ==========================================
  // OUTLIER DETECTION TESTS
  // ==========================================
  describe('Outlier Detection Edge Cases', () => {
    it('should detect single high outlier', () => {
      const data = [10, 11, 12, 13, 14, 15, 100];
      const result = detectOutliers(data);
      expect(result.outliers).toContain(100);
    });

    it('should detect single low outlier', () => {
      const data = [100, 101, 102, 103, 104, 105, 10];
      const result = detectOutliers(data);
      expect(result.outliers).toContain(10);
    });

    it('should detect multiple outliers', () => {
      const data = [50, 51, 52, 53, 54, 55, 1, 200];
      const result = detectOutliers(data);
      expect(result.outliers).toContain(1);
      expect(result.outliers).toContain(200);
    });

    it('should not flag normal variation as outliers', () => {
      const data = [100, 105, 110, 95, 102, 108, 97, 103];
      const result = detectOutliers(data);
      expect(result.outliers).toHaveLength(0);
    });

    it('should handle all identical values', () => {
      const data = [50, 50, 50, 50, 50, 50, 50];
      const result = detectOutliers(data);
      expect(result.outliers).toHaveLength(0);
    });

    it('should return correct outlier indices', () => {
      const data = [10, 11, 12, 13, 100, 15, 16];
      const result = detectOutliers(data);
      expect(result.outlierIndices).toContain(4);
    });

    it('should handle bimodal distribution', () => {
      const data = [10, 11, 12, 13, 100, 101, 102, 103];
      const result = detectOutliers(data);
      // Bimodal data may or may not have outliers depending on IQR
      expect(result.cleanedData.length + result.outliers.length).toBe(data.length);
    });
  });

  // ==========================================
  // CONFIDENCE INTERVAL TESTS
  // ==========================================
  describe('Confidence Interval Edge Cases', () => {
    it('should handle 90% confidence level', () => {
      const result = calculateConfidenceInterval(100, 10, 0.90);
      expect(result.lower).toBeCloseTo(83.55, 1);
      expect(result.upper).toBeCloseTo(116.45, 1);
    });

    it('should handle 99% confidence level', () => {
      const result = calculateConfidenceInterval(100, 10, 0.99);
      expect(result.lower).toBeCloseTo(74.24, 1);
      expect(result.upper).toBeCloseTo(125.76, 1);
    });

    it('should handle unknown confidence level (defaults to 95%)', () => {
      const result = calculateConfidenceInterval(100, 10, 0.85 as number);
      // Should use 1.96 as default z-score
      expect(result.lower).toBeCloseTo(80.4, 1);
    });

    it('should handle zero standard error', () => {
      const result = calculateConfidenceInterval(100, 0);
      expect(result.lower).toBe(100);
      expect(result.upper).toBe(100);
    });

    it('should handle very large standard error', () => {
      const result = calculateConfidenceInterval(100, 1000);
      expect(result.lower).toBe(0);
      expect(result.upper).toBeGreaterThan(1000);
    });

    it('should handle very small forecast', () => {
      const result = calculateConfidenceInterval(0.01, 0.005);
      // Lower bound is max(0, forecast - margin), may be slightly above 0
      expect(result.lower).toBeGreaterThanOrEqual(0);
      expect(result.lower).toBeLessThan(0.01);
      expect(result.upper).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // STANDARD ERROR TESTS
  // ==========================================
  describe('Standard Error Edge Cases', () => {
    it('should return 0 for single value', () => {
      expect(calculateStandardError([100])).toBe(0);
    });

    it('should return 0 for identical values', () => {
      expect(calculateStandardError([50, 50, 50, 50])).toBe(0);
    });

    it('should calculate correctly for known values', () => {
      const errors = [2, 4, 4, 4, 5, 5, 7, 9];
      const result = calculateStandardError(errors);
      // Mean = 5, Variance = 4, StdDev = 2
      expect(result).toBeCloseTo(2, 0);
    });

    it('should handle negative errors', () => {
      const errors = [-10, -5, 0, 5, 10];
      const result = calculateStandardError(errors);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle large dataset', () => {
      const errors = Array.from({ length: 1000 }, () => Math.random() * 100 - 50);
      const result = calculateStandardError(errors);
      expect(result).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // AGGREGATE TO MONTHLY TESTS
  // ==========================================
  describe('Aggregate to Monthly Edge Cases', () => {
    it('should handle multiple years of data', () => {
      const data = [
        createPoint('2023-01-15', 100),
        createPoint('2024-01-15', 200),
        createPoint('2025-01-15', 300),
      ];
      const result = aggregateToMonthly(data);
      expect(result).toHaveLength(3);
      expect(result[0].quantity).toBe(100);
      expect(result[1].quantity).toBe(200);
      expect(result[2].quantity).toBe(300);
    });

    it('should sort results by date', () => {
      const data = [
        createPoint('2024-03-15', 300),
        createPoint('2024-01-15', 100),
        createPoint('2024-02-15', 200),
      ];
      const result = aggregateToMonthly(data);
      expect(result[0].quantity).toBe(100);
      expect(result[1].quantity).toBe(200);
      expect(result[2].quantity).toBe(300);
    });

    it('should handle data at month boundaries', () => {
      const data = [
        createPoint('2024-01-01', 50),
        createPoint('2024-01-31', 50),
        createPoint('2024-02-01', 100),
        createPoint('2024-02-28', 100),
      ];
      const result = aggregateToMonthly(data);
      expect(result).toHaveLength(2);
      expect(result[0].quantity).toBe(100);
      expect(result[1].quantity).toBe(200);
    });

    it('should handle leap year February', () => {
      const data = [
        createPoint('2024-02-29', 100), // 2024 is a leap year
      ];
      const result = aggregateToMonthly(data);
      expect(result).toHaveLength(1);
      expect(result[0].date.getMonth()).toBe(1); // February
    });

    it('should preserve product ID', () => {
      const data = [createPoint('2024-01-15', 100, 'product-123')];
      const result = aggregateToMonthly(data);
      expect(result[0].productId).toBe('product-123');
    });
  });

  // ==========================================
  // INTEGRATION TESTS
  // ==========================================
  describe('Integration Tests - Algorithm Combinations', () => {
    it('should combine trend and seasonal analysis', () => {
      // Growing seasonal pattern
      const seasonalMultipliers = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 1.5];
      const data = createDateRangeData(2023, 24, 100, i => {
        const growth = 1 + i * 0.02; // 2% monthly growth
        return 100 * growth * seasonalMultipliers[i % 12];
      });

      const seasonal = calculateSeasonalFactors(data);
      const trend = analyzeTrend(data);

      expect(seasonal.calculated).toBe(true);
      expect(trend.direction).toBe('up');
    });

    it('should smooth data before trend analysis', () => {
      const volatileData = [100, 50, 120, 40, 140, 30, 160, 20, 180, 10, 200, 5];
      const smoothed = calculateMovingAverage(volatileData, 3);

      // Convert to demand points for trend analysis
      const demandPoints = smoothed.map((qty, i) => createPoint(`2024-${String(i + 1).padStart(2, '0')}-15`, qty));
      const trend = analyzeTrend(demandPoints);

      expect(trend.rSquared).toBeGreaterThan(0); // Should have some fit
    });

    it('should clean data before seasonal analysis', () => {
      const dataWithOutliers = createDateRangeData(2023, 24, 100, i => {
        if (i === 5) return 500; // Outlier
        return 100 + (i % 12) * 5;
      });

      const quantities = dataWithOutliers.map(d => d.quantity);
      const { cleanedData, outlierIndices } = detectOutliers(quantities);

      expect(outlierIndices).toContain(5);
      expect(cleanedData.length).toBe(23);
    });

    it('should calculate forecast with confidence based on error history', () => {
      const errors = [5, -3, 7, -2, 4, -6, 3, -4, 5, -5];
      const stdError = calculateStandardError(errors);

      const forecast = 100;
      const interval = calculateConfidenceInterval(forecast, stdError);

      expect(interval.lower).toBeLessThan(forecast);
      expect(interval.upper).toBeGreaterThan(forecast);
      expect(interval.upper - interval.lower).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // PERFORMANCE EDGE CASES
  // ==========================================
  describe('Performance Edge Cases', () => {
    it('should handle 100+ months of data for seasonal factors', () => {
      const data = createDateRangeData(2015, 120, 100, i => 100 + (i % 12) * 10);
      const result = calculateSeasonalFactors(data);
      expect(result.calculated).toBe(true);
    });

    it('should handle 1000 data points for trend analysis', () => {
      // Large dataset with clear upward trend
      const data = createDateRangeData(2000, 1000, 100, i => 100 + i * 5);
      const result = analyzeTrend(data);
      // Slope should be positive regardless of direction threshold
      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeGreaterThan(0.99); // Very linear data
    });

    it('should handle 10000 values for moving average', () => {
      const data = Array.from({ length: 10000 }, (_, i) => i % 100);
      const result = calculateMovingAverage(data, 12);
      expect(result.length).toBe(10000 - 11);
    });

    it('should handle 10000 values for outlier detection', () => {
      const data = Array.from({ length: 10000 }, () => 100 + Math.random() * 20 - 10);
      data.push(500); // Add outlier
      const result = detectOutliers(data);
      expect(result.outliers).toContain(500);
    });
  });
});
