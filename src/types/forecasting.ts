// Forecasting Module Types
// Types for demand forecasting, order planning, and market analysis

export interface ForecastConfigInput {
  dealerId: string;
  forecastHorizon?: number;
  historyPeriod?: number;
  confidenceLevel?: number;
  useSeasonality?: boolean;
  seasonalityType?: 'additive' | 'multiplicative';
  safetyStockDays?: number;
  leadTimeDays?: number;
  reorderPointMethod?: 'fixed' | 'dynamic' | 'min_max';
  minOrderQuantity?: number;
  orderMultiple?: number;
  marketGrowthRate?: number;
  localMarketFactor?: number;
}

export interface DemandForecastResult {
  productId: string;
  productName: string;
  productSku: string;
  periods: ForecastPeriod[];
  summary: ForecastSummary;
}

export interface ForecastPeriod {
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  forecastedDemand: number;
  lowerBound: number;
  upperBound: number;
  historicalAverage: number | null;
  yearOverYearChange: number | null;
  trendComponent: number | null;
  seasonalComponent: number | null;
}

export interface ForecastSummary {
  totalForecastedDemand: number;
  averageMonthlyDemand: number;
  peakMonth: string;
  lowMonth: string;
  trendDirection: 'up' | 'down' | 'stable';
  confidenceScore: number;
}

export interface SuggestedOrderPlan {
  dealerId: string;
  dealerName: string;
  generatedAt: Date;
  horizonMonths: number;
  orders: SuggestedOrderItem[];
  summary: OrderPlanSummary;
}

export interface SuggestedOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  suggestedOrderDate: Date;
  expectedDeliveryDate: Date;
  suggestedQuantity: number;
  minimumQuantity: number;
  economicOrderQty: number | null;
  currentStock: number;
  projectedStock: number;
  projectedDemand: number;
  estimatedCost: number | null;
  estimatedValue: number | null;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'accepted' | 'ordered' | 'skipped';
  reasoning: OrderReasoning;
}

export interface OrderReasoning {
  primaryReason: string;
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  stockoutRisk: number; // 0-100%
  overstockRisk: number; // 0-100%
}

export interface OrderPlanSummary {
  totalOrders: number;
  totalUnits: number;
  totalEstimatedCost: number;
  totalEstimatedValue: number;
  criticalOrders: number;
  upcomingWeek: number;
  upcomingMonth: number;
}

export interface HistoricalDemandPoint {
  date: Date;
  quantity: number;
  productId: string;
}

export interface SeasonalFactors {
  monthly: number[]; // 12 factors for each month
  calculated: boolean;
  patternStrength: number; // 0-1, how strong the pattern is
}

export interface TrendAnalysis {
  slope: number;
  intercept: number;
  rSquared: number;
  direction: 'up' | 'down' | 'stable';
  monthlyGrowthRate: number;
}

export interface MarketAnalysis {
  region: string;
  indicators: MarketIndicatorSummary[];
  overallOutlook: 'positive' | 'neutral' | 'negative';
  adjustmentFactor: number;
}

export interface MarketIndicatorSummary {
  name: string;
  type: string;
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'neutral' | 'negative';
}

export interface ForecastAccuracy {
  productId: string;
  periodsCovered: number;
  meanAbsoluteError: number;
  meanAbsolutePercentageError: number;
  rootMeanSquareError: number;
  bias: number; // positive = overforecast, negative = underforecast
}

export interface InventoryProjection {
  date: Date;
  projectedStock: number;
  expectedDemand: number;
  safetyStock: number;
  reorderPoint: number;
  stockoutProbability: number;
}

// Chart data types for visualization
export interface ForecastChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface OrderTimelineData {
  months: MonthlyOrderSummary[];
}

export interface MonthlyOrderSummary {
  month: string;
  orders: number;
  units: number;
  estimatedCost: number;
  products: {
    name: string;
    quantity: number;
    priority: string;
  }[];
}
