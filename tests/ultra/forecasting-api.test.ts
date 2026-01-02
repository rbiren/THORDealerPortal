/**
 * Ultra Comprehensive Forecasting API Integration Tests
 * Task 4.6.27 - Tests all forecasting services
 * Minimum 30 integration tests
 */

import { prisma } from '../setup';
import {
  generateDemandForecasts,
  generateSuggestedOrderPlan,
  getOrCreateForecastConfig,
  updateForecastConfig,
  getSuggestedOrders,
  updateSuggestedOrderStatus,
  getMarketAnalysis,
  getForecastChartData,
  getOrderTimelineData,
} from '../../src/lib/services/forecasting';

// Helper to create test dealer with address
async function createTestDealer() {
  return prisma.dealer.create({
    data: {
      code: `DLR-API-${Date.now()}`,
      name: 'API Test Dealer',
      status: 'active',
      addresses: {
        create: {
          type: 'physical',
          street: '123 Test Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'US',
          isPrimary: true,
        },
      },
    },
  });
}

// Helper to create test products
async function createTestProducts(locationId: string, count = 3) {
  const productIds: string[] = [];
  for (let i = 1; i <= count; i++) {
    const product = await prisma.product.create({
      data: {
        sku: `API-TEST-SKU-${Date.now()}-${i}-${Math.random()}`,
        name: `API Test Product ${i}`,
        price: 100 * i,
        costPrice: 50 * i,
        status: 'active',
        inventory: {
          create: {
            locationId,
            quantity: 50,
            reserved: 0,
            lowStockThreshold: 20,
          },
        },
      },
    });
    productIds.push(product.id);
  }
  return productIds;
}

// Helper to create test location
async function createTestLocation() {
  return prisma.inventoryLocation.create({
    data: {
      name: 'Test Warehouse',
      code: `WH-API-${Date.now()}-${Math.random()}`,
      type: 'warehouse',
      isActive: true,
    },
  });
}

// Helper to create order history
async function createOrderHistory(dealerId: string, productIds: string[]) {
  for (let monthsAgo = 1; monthsAgo <= 12; monthsAgo++) {
    const orderDate = new Date();
    orderDate.setMonth(orderDate.getMonth() - monthsAgo);

    const order = await prisma.order.create({
      data: {
        dealerId,
        orderNumber: `ORD-API-${Date.now()}-${monthsAgo}-${Math.random()}`,
        status: 'delivered',
        totalAmount: 1000 * monthsAgo,
        createdAt: orderDate,
        updatedAt: orderDate,
      },
    });

    for (let j = 0; j < productIds.length; j++) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: productIds[j],
          quantity: 10 + j + monthsAgo,
          unitPrice: 100 * (j + 1),
          totalPrice: (10 + j + monthsAgo) * 100 * (j + 1),
        },
      });
    }
  }
}

describe('Forecasting API Integration Tests', () => {
  // ==========================================
  // FORECAST CONFIG SERVICE TESTS
  // ==========================================
  describe('Forecast Config Service', () => {
    it('should create config for new dealer', async () => {
      const dealer = await createTestDealer();
      const config = await getOrCreateForecastConfig(dealer.id);

      expect(config).toBeDefined();
      expect(config.dealerId).toBe(dealer.id);
      expect(config.forecastHorizon).toBe(18);
      expect(config.historyPeriod).toBe(24);
      expect(config.confidenceLevel).toBe(0.95);
      expect(config.isActive).toBe(true);
    });

    it('should return existing config on subsequent calls', async () => {
      const dealer = await createTestDealer();
      const config1 = await getOrCreateForecastConfig(dealer.id);
      const config2 = await getOrCreateForecastConfig(dealer.id);

      expect(config1.id).toBe(config2.id);
    });

    it('should update config with valid parameters', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      const updatedConfig = await updateForecastConfig(dealer.id, {
        forecastHorizon: 24,
        safetyStockDays: 21,
      });

      expect(updatedConfig.forecastHorizon).toBe(24);
      expect(updatedConfig.safetyStockDays).toBe(21);
    });

    it('should update market growth rate', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      const updatedConfig = await updateForecastConfig(dealer.id, {
        marketGrowthRate: 5.5,
      });

      expect(updatedConfig.marketGrowthRate).toBe(5.5);
    });

    it('should update local market factor', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      const updatedConfig = await updateForecastConfig(dealer.id, {
        localMarketFactor: 1.15,
      });

      expect(updatedConfig.localMarketFactor).toBe(1.15);
    });

    it('should update seasonality settings', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      const updatedConfig = await updateForecastConfig(dealer.id, {
        useSeasonality: true,
        seasonalityType: 'multiplicative',
      });

      expect(updatedConfig.useSeasonality).toBe(true);
      expect(updatedConfig.seasonalityType).toBe('multiplicative');
    });

    it('should update reorder settings', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      const updatedConfig = await updateForecastConfig(dealer.id, {
        reorderPointMethod: 'dynamic',
        minOrderQuantity: 10,
        orderMultiple: 5,
      });

      expect(updatedConfig.reorderPointMethod).toBe('dynamic');
      expect(updatedConfig.minOrderQuantity).toBe(10);
      expect(updatedConfig.orderMultiple).toBe(5);
    });

    it('should preserve other settings when updating specific fields', async () => {
      const dealer = await createTestDealer();
      await getOrCreateForecastConfig(dealer.id);

      await updateForecastConfig(dealer.id, {
        forecastHorizon: 12,
        leadTimeDays: 10,
      });

      const config = await updateForecastConfig(dealer.id, {
        safetyStockDays: 30,
      });

      expect(config.forecastHorizon).toBe(12);
      expect(config.leadTimeDays).toBe(10);
      expect(config.safetyStockDays).toBe(30);
    });
  });

  // ==========================================
  // DEMAND FORECAST SERVICE TESTS
  // ==========================================
  describe('Demand Forecast Service', () => {
    it('should generate forecasts for all products', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      const forecasts = await generateDemandForecasts(dealer.id);

      expect(forecasts).toBeDefined();
      expect(forecasts.length).toBeGreaterThan(0);
    });

    it('should generate forecasts for specific products', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      const forecasts = await generateDemandForecasts(dealer.id, [productIds[0]]);

      expect(forecasts).toBeDefined();
      expect(forecasts.length).toBe(1);
      expect(forecasts[0].productId).toBe(productIds[0]);
    });

    it('should include confidence intervals in forecasts', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      const forecasts = await generateDemandForecasts(dealer.id);

      for (const forecast of forecasts) {
        expect(forecast.periods).toBeDefined();
        for (const period of forecast.periods) {
          expect(period.forecastedDemand).toBeGreaterThanOrEqual(0);
          expect(period.lowerBound).toBeLessThanOrEqual(period.forecastedDemand);
          expect(period.upperBound).toBeGreaterThanOrEqual(period.forecastedDemand);
        }
      }
    });

    it('should store forecasts in database', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      await generateDemandForecasts(dealer.id);

      const config = await getOrCreateForecastConfig(dealer.id);
      const storedForecasts = await prisma.demandForecast.findMany({
        where: { forecastConfigId: config.id },
      });

      expect(storedForecasts.length).toBeGreaterThan(0);
    });

    it('should replace previous forecasts on regeneration', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      await generateDemandForecasts(dealer.id);
      const config = await getOrCreateForecastConfig(dealer.id);
      const count1 = await prisma.demandForecast.count({
        where: { forecastConfigId: config.id },
      });

      await generateDemandForecasts(dealer.id);
      const count2 = await prisma.demandForecast.count({
        where: { forecastConfigId: config.id },
      });

      expect(count1).toBe(count2);
    });

    it('should return chart data format', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      await generateDemandForecasts(dealer.id);
      const chartData = await getForecastChartData(dealer.id);

      expect(chartData).toBeDefined();
      expect(chartData.labels).toBeDefined();
      expect(chartData.datasets).toBeDefined();
    });

    it('should handle empty product list', async () => {
      const dealer = await createTestDealer();
      const forecasts = await generateDemandForecasts(dealer.id, []);

      expect(forecasts).toBeDefined();
      expect(forecasts.length).toBe(0);
    });
  });

  // ==========================================
  // SUGGESTED ORDER PLAN SERVICE TESTS
  // ==========================================
  describe('Suggested Order Plan Service', () => {
    it('should generate order plan', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);

      const orderPlan = await generateSuggestedOrderPlan(dealer.id);

      expect(orderPlan).toBeDefined();
      expect(orderPlan.orders).toBeDefined();
      expect(orderPlan.summary).toBeDefined();
    });

    it('should include order summary stats', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);

      const orderPlan = await generateSuggestedOrderPlan(dealer.id);

      expect(orderPlan.summary).toHaveProperty('totalOrders');
      expect(orderPlan.summary).toHaveProperty('totalUnits');
      expect(orderPlan.summary).toHaveProperty('totalEstimatedCost');
    });

    it('should set order priority levels', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);

      const orderPlan = await generateSuggestedOrderPlan(dealer.id);

      for (const order of orderPlan.orders) {
        expect(['critical', 'high', 'normal', 'low']).toContain(order.priority);
      }
    });

    it('should store orders in database', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);

      await generateSuggestedOrderPlan(dealer.id);

      const config = await getOrCreateForecastConfig(dealer.id);
      const storedOrders = await prisma.suggestedOrder.findMany({
        where: { forecastConfigId: config.id },
      });

      expect(storedOrders.length).toBeGreaterThan(0);
    });

    it('should get suggested orders', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const orders = await getSuggestedOrders(dealer.id);

      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const pendingOrders = await getSuggestedOrders(dealer.id, 'pending');

      for (const order of pendingOrders) {
        expect(order.status).toBe('pending');
      }
    });

    it('should update order status to accepted', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const orders = await getSuggestedOrders(dealer.id, 'pending');

      if (orders.length > 0) {
        const updated = await updateSuggestedOrderStatus(orders[0].id, 'accepted');
        expect(updated.status).toBe('accepted');
        expect(updated.acceptedAt).toBeDefined();
      }
    });

    it('should update order status to skipped', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const orders = await getSuggestedOrders(dealer.id, 'pending');

      if (orders.length > 0) {
        const updated = await updateSuggestedOrderStatus(orders[0].id, 'skipped');
        expect(updated.status).toBe('skipped');
      }
    });

    it('should return timeline data format', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const timelineData = await getOrderTimelineData(dealer.id);

      expect(timelineData).toBeDefined();
      expect(timelineData.months).toBeDefined();
      expect(Array.isArray(timelineData.months)).toBe(true);
    });

    it('should include products in timeline months', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const timelineData = await getOrderTimelineData(dealer.id);

      for (const month of timelineData.months) {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('orders');
        expect(month).toHaveProperty('units');
        expect(month).toHaveProperty('products');
      }
    });
  });

  // ==========================================
  // MARKET ANALYSIS SERVICE TESTS
  // ==========================================
  describe('Market Analysis Service', () => {
    it('should return market analysis for dealer', async () => {
      const dealer = await createTestDealer();
      const analysis = await getMarketAnalysis(dealer.id);

      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('region');
      expect(analysis).toHaveProperty('overallOutlook');
      expect(analysis).toHaveProperty('adjustmentFactor');
    });

    it('should include market indicators', async () => {
      const dealer = await createTestDealer();
      const analysis = await getMarketAnalysis(dealer.id);

      expect(analysis).toHaveProperty('indicators');
      expect(Array.isArray(analysis.indicators)).toBe(true);
    });

    it('should have valid outlook value', async () => {
      const dealer = await createTestDealer();
      const analysis = await getMarketAnalysis(dealer.id);

      expect(['positive', 'neutral', 'negative']).toContain(analysis.overallOutlook);
    });

    it('should have reasonable adjustment factor', async () => {
      const dealer = await createTestDealer();
      const analysis = await getMarketAnalysis(dealer.id);

      expect(analysis.adjustmentFactor).toBeGreaterThan(0);
      expect(analysis.adjustmentFactor).toBeLessThan(3);
    });
  });

  // ==========================================
  // END-TO-END FLOW TESTS
  // ==========================================
  describe('End-to-End Flow Tests', () => {
    it('should complete full forecasting workflow', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      // Step 1: Get/Create config
      const config = await getOrCreateForecastConfig(dealer.id);
      expect(config).toBeDefined();

      // Step 2: Generate demand forecasts
      const forecasts = await generateDemandForecasts(dealer.id);
      expect(forecasts.length).toBeGreaterThan(0);

      // Step 3: Generate order plan
      const orderPlan = await generateSuggestedOrderPlan(dealer.id);
      expect(orderPlan.orders.length).toBeGreaterThan(0);

      // Step 4: Get market analysis
      const market = await getMarketAnalysis(dealer.id);
      expect(market).toBeDefined();
    });

    it('should regenerate forecasts after config change', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);
      await getOrCreateForecastConfig(dealer.id);

      await updateForecastConfig(dealer.id, {
        forecastHorizon: 12,
        confidenceLevel: 0.90,
      });

      const forecasts = await generateDemandForecasts(dealer.id);
      expect(forecasts.length).toBeGreaterThan(0);

      for (const forecast of forecasts) {
        expect(forecast.periods.length).toBeLessThanOrEqual(12);
      }
    });

    it('should maintain data consistency after multiple operations', async () => {
      const dealer = await createTestDealer();
      const location = await createTestLocation();
      const productIds = await createTestProducts(location.id);
      await createOrderHistory(dealer.id, productIds);

      await generateDemandForecasts(dealer.id);
      await generateSuggestedOrderPlan(dealer.id);

      const config = await getOrCreateForecastConfig(dealer.id);
      const initialForecastCount = await prisma.demandForecast.count({
        where: { forecastConfigId: config.id },
      });

      await generateDemandForecasts(dealer.id);

      const finalForecastCount = await prisma.demandForecast.count({
        where: { forecastConfigId: config.id },
      });

      expect(finalForecastCount).toBe(initialForecastCount);
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================
  describe('Error Handling Tests', () => {
    it('should handle order status update for non-existent order', async () => {
      await expect(
        updateSuggestedOrderStatus('non-existent-order-id', 'accepted')
      ).rejects.toThrow();
    });

    it('should fail config creation for non-existent dealer (FK constraint)', async () => {
      await expect(
        getOrCreateForecastConfig('non-existent-dealer-id')
      ).rejects.toThrow();
    });
  });
});
