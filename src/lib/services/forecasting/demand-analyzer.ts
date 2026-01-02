// Demand Analysis Service
// Analyzes historical sales data to identify trends, seasonality, and patterns

import type {
  HistoricalDemandPoint,
  SeasonalFactors,
  TrendAnalysis,
} from '@/types/forecasting';

/**
 * Calculate monthly seasonal factors from historical demand data
 * Uses ratio-to-moving-average method
 */
export function calculateSeasonalFactors(
  historicalData: HistoricalDemandPoint[]
): SeasonalFactors {
  if (historicalData.length < 24) {
    // Not enough data for seasonal analysis
    return {
      monthly: Array(12).fill(1.0),
      calculated: false,
      patternStrength: 0,
    };
  }

  // Group by month
  const monthlyData: Map<number, number[]> = new Map();
  for (let i = 0; i < 12; i++) {
    monthlyData.set(i, []);
  }

  for (const point of historicalData) {
    const month = point.date.getMonth();
    monthlyData.get(month)?.push(point.quantity);
  }

  // Calculate average for each month
  const monthlyAverages: number[] = [];
  for (let i = 0; i < 12; i++) {
    const values = monthlyData.get(i) || [];
    const avg = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    monthlyAverages.push(avg);
  }

  // Calculate overall average
  const overallAverage = monthlyAverages.reduce((a, b) => a + b, 0) / 12;

  if (overallAverage === 0) {
    return {
      monthly: Array(12).fill(1.0),
      calculated: false,
      patternStrength: 0,
    };
  }

  // Calculate seasonal factors (ratio to overall average)
  const factors = monthlyAverages.map(avg => avg / overallAverage);

  // Calculate pattern strength (coefficient of variation of factors)
  const factorMean = factors.reduce((a, b) => a + b, 0) / 12;
  const factorVariance = factors.reduce((sum, f) => sum + Math.pow(f - factorMean, 2), 0) / 12;
  const patternStrength = Math.min(Math.sqrt(factorVariance) / factorMean, 1);

  return {
    monthly: factors,
    calculated: true,
    patternStrength,
  };
}

/**
 * Perform linear regression to identify trend
 */
export function analyzeTrend(
  historicalData: HistoricalDemandPoint[]
): TrendAnalysis {
  if (historicalData.length < 3) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      direction: 'stable',
      monthlyGrowthRate: 0,
    };
  }

  // Sort by date
  const sorted = [...historicalData].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Convert dates to numeric x values (months from start)
  const startDate = sorted[0].date;
  const n = sorted.length;

  const points = sorted.map((point, i) => ({
    x: i,
    y: point.quantity,
  }));

  // Calculate means
  const xMean = points.reduce((sum, p) => sum + p.x, 0) / n;
  const yMean = points.reduce((sum, p) => sum + p.y, 0) / n;

  // Calculate slope and intercept using least squares
  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    numerator += (point.x - xMean) * (point.y - yMean);
    denominator += Math.pow(point.x - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  const yPredicted = points.map(p => slope * p.x + intercept);
  const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - yPredicted[i], 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Determine direction
  let direction: 'up' | 'down' | 'stable';
  const slopeThreshold = yMean * 0.01; // 1% of mean as threshold

  if (slope > slopeThreshold) {
    direction = 'up';
  } else if (slope < -slopeThreshold) {
    direction = 'down';
  } else {
    direction = 'stable';
  }

  // Calculate monthly growth rate
  const monthlyGrowthRate = yMean !== 0 ? (slope / yMean) * 100 : 0;

  return {
    slope,
    intercept,
    rSquared,
    direction,
    monthlyGrowthRate,
  };
}

/**
 * Calculate moving average for smoothing
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  if (data.length < windowSize) {
    return data;
  }

  const result: number[] = [];

  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    const avg = window.reduce((a, b) => a + b, 0) / windowSize;
    result.push(avg);
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMA(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];

  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const ema = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data: number[]): {
  outliers: number[];
  outlierIndices: number[];
  cleanedData: number[];
} {
  if (data.length < 4) {
    return { outliers: [], outlierIndices: [], cleanedData: data };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const outlierIndices: number[] = [];
  const cleanedData: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i] < lowerBound || data[i] > upperBound) {
      outliers.push(data[i]);
      outlierIndices.push(i);
    } else {
      cleanedData.push(data[i]);
    }
  }

  return { outliers, outlierIndices, cleanedData };
}

/**
 * Calculate confidence intervals for forecasts
 */
export function calculateConfidenceInterval(
  forecast: number,
  standardError: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const margin = z * standardError;

  return {
    lower: Math.max(0, forecast - margin),
    upper: forecast + margin,
  };
}

/**
 * Calculate standard error from historical forecast errors
 */
export function calculateStandardError(errors: number[]): number {
  if (errors.length === 0) return 0;

  const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
  const squaredDiffs = errors.map(e => Math.pow(e - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / errors.length;

  return Math.sqrt(variance);
}

/**
 * Aggregate daily/weekly data into monthly buckets
 */
export function aggregateToMonthly(
  data: HistoricalDemandPoint[]
): HistoricalDemandPoint[] {
  const monthlyMap = new Map<string, number>();

  for (const point of data) {
    const key = `${point.date.getFullYear()}-${point.date.getMonth()}`;
    const current = monthlyMap.get(key) || 0;
    monthlyMap.set(key, current + point.quantity);
  }

  const result: HistoricalDemandPoint[] = [];

  for (const [key, quantity] of monthlyMap) {
    const [year, month] = key.split('-').map(Number);
    result.push({
      date: new Date(year, month, 1),
      quantity,
      productId: data[0]?.productId || '',
    });
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}
