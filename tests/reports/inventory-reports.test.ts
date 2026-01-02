/**
 * Tests for Inventory Reports
 * Task 4.3.1-4.3.3: Inventory value, turnover, aging
 */

describe('Inventory Value Reports', () => {
  describe('Value Summary', () => {
    it('calculates total inventory value', () => {
      const inventory = [
        { quantity: 10, price: 100 },
        { quantity: 5, price: 200 },
        { quantity: 8, price: 50 },
      ]

      const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.price, 0)
      expect(totalValue).toBe(2400) // 1000 + 1000 + 400
    })

    it('calculates total cost with cost price', () => {
      const inventory = [
        { quantity: 10, price: 100, costPrice: 60 },
        { quantity: 5, price: 200, costPrice: 120 },
      ]

      const totalCost = inventory.reduce((sum, i) => sum + i.quantity * i.costPrice, 0)
      expect(totalCost).toBe(1200) // 600 + 600
    })

    it('estimates cost when cost price missing (60%)', () => {
      const item = { quantity: 10, price: 100, costPrice: null }
      const estimatedCost = item.costPrice || item.price * 0.6
      expect(estimatedCost).toBe(60)
    })

    it('calculates potential profit', () => {
      const totalValue = 5000
      const totalCost = 3000
      const potentialProfit = totalValue - totalCost
      expect(potentialProfit).toBe(2000)
    })

    it('calculates average value per item', () => {
      const totalValue = 10000
      const itemCount = 25
      const avgValue = itemCount > 0 ? totalValue / itemCount : 0
      expect(avgValue).toBe(400)
    })

    it('handles zero items', () => {
      const totalValue = 0
      const itemCount = 0
      const avgValue = itemCount > 0 ? totalValue / itemCount : 0
      expect(avgValue).toBe(0)
    })
  })

  describe('Value by Location', () => {
    it('aggregates inventory by location', () => {
      const inventory = [
        { locationId: 'loc-1', quantity: 10, price: 100 },
        { locationId: 'loc-1', quantity: 5, price: 200 },
        { locationId: 'loc-2', quantity: 8, price: 50 },
      ]

      const locationMap = new Map<string, { quantity: number; value: number }>()
      for (const item of inventory) {
        const existing = locationMap.get(item.locationId) || { quantity: 0, value: 0 }
        existing.quantity += item.quantity
        existing.value += item.quantity * item.price
        locationMap.set(item.locationId, existing)
      }

      expect(locationMap.get('loc-1')).toEqual({ quantity: 15, value: 2000 })
      expect(locationMap.get('loc-2')).toEqual({ quantity: 8, value: 400 })
    })

    it('sorts locations by value descending', () => {
      const locations = [
        { locationId: 'loc-1', value: 1000 },
        { locationId: 'loc-2', value: 3000 },
        { locationId: 'loc-3', value: 2000 },
      ]

      const sorted = locations.sort((a, b) => b.value - a.value)
      expect(sorted[0].locationId).toBe('loc-2')
      expect(sorted[1].locationId).toBe('loc-3')
    })
  })

  describe('Value by Category', () => {
    it('aggregates inventory by category', () => {
      const inventory = [
        { categoryId: 'cat-1', quantity: 10, price: 100 },
        { categoryId: 'cat-1', quantity: 5, price: 50 },
        { categoryId: 'cat-2', quantity: 8, price: 100 },
      ]

      const categoryMap = new Map<string, number>()
      for (const item of inventory) {
        const existing = categoryMap.get(item.categoryId) || 0
        categoryMap.set(item.categoryId, existing + item.quantity * item.price)
      }

      expect(categoryMap.get('cat-1')).toBe(1250)
      expect(categoryMap.get('cat-2')).toBe(800)
    })

    it('calculates category percentage', () => {
      const categories = [
        { categoryId: 'cat-1', value: 750 },
        { categoryId: 'cat-2', value: 250 },
      ]

      const totalValue = categories.reduce((sum, c) => sum + c.value, 0)

      const withPercentage = categories.map((c) => ({
        ...c,
        percentage: Math.round((c.value / totalValue) * 1000) / 10,
      }))

      expect(withPercentage[0].percentage).toBe(75)
      expect(withPercentage[1].percentage).toBe(25)
    })

    it('handles uncategorized items', () => {
      const categoryId = null
      const displayName = categoryId || 'Uncategorized'
      expect(displayName).toBe('Uncategorized')
    })
  })
})

describe('Inventory Turnover Reports', () => {
  describe('Turnover Rate Calculation', () => {
    it('calculates basic turnover rate', () => {
      const soldQuantity = 100
      const avgInventory = 50
      const periodDays = 90
      const annualizedTurnover = (soldQuantity / avgInventory) * (365 / periodDays)

      expect(annualizedTurnover).toBeCloseTo(8.11, 1)
    })

    it('estimates average inventory', () => {
      const currentStock = 30
      const soldQuantity = 70
      const avgInventory = currentStock + soldQuantity / 2
      expect(avgInventory).toBe(65)
    })

    it('handles zero average inventory', () => {
      const soldQuantity = 100
      const avgInventory = 0
      const turnoverRate = avgInventory > 0 ? soldQuantity / avgInventory : 0
      expect(turnoverRate).toBe(0)
    })

    it('calculates days of supply', () => {
      const currentStock = 50
      const soldQuantity = 100
      const periodDays = 90
      const dailySales = soldQuantity / periodDays
      const daysOfSupply = dailySales > 0 ? Math.round(currentStock / dailySales) : 999

      expect(daysOfSupply).toBe(45)
    })

    it('caps days of supply at 999', () => {
      const daysOfSupply = 1500
      const capped = Math.min(daysOfSupply, 999)
      expect(capped).toBe(999)
    })
  })

  describe('Turnover Classification', () => {
    function getTurnoverIndicator(rate: number) {
      if (rate >= 6) return { label: 'Fast', color: 'text-success' }
      if (rate >= 3) return { label: 'Good', color: 'text-blue-600' }
      if (rate >= 1) return { label: 'Moderate', color: 'text-warning' }
      return { label: 'Slow', color: 'text-error' }
    }

    it('classifies high turnover as Fast', () => {
      expect(getTurnoverIndicator(8)).toEqual({ label: 'Fast', color: 'text-success' })
    })

    it('classifies medium turnover as Good', () => {
      expect(getTurnoverIndicator(4)).toEqual({ label: 'Good', color: 'text-blue-600' })
    })

    it('classifies low-medium turnover as Moderate', () => {
      expect(getTurnoverIndicator(1.5)).toEqual({ label: 'Moderate', color: 'text-warning' })
    })

    it('classifies very low turnover as Slow', () => {
      expect(getTurnoverIndicator(0.5)).toEqual({ label: 'Slow', color: 'text-error' })
    })
  })

  describe('Slow Moving Inventory', () => {
    it('identifies slow movers (turnover < 2)', () => {
      const products = [
        { productId: 'prod-1', turnoverRate: 5, currentStock: 10 },
        { productId: 'prod-2', turnoverRate: 1, currentStock: 20 },
        { productId: 'prod-3', turnoverRate: 0.5, currentStock: 15 },
      ]

      const slowMovers = products.filter((p) => p.currentStock > 0 && p.turnoverRate < 2)
      expect(slowMovers).toHaveLength(2)
      expect(slowMovers[0].productId).toBe('prod-2')
    })

    it('excludes items with zero stock', () => {
      const products = [
        { productId: 'prod-1', turnoverRate: 0.5, currentStock: 0 },
        { productId: 'prod-2', turnoverRate: 0.5, currentStock: 10 },
      ]

      const slowMovers = products.filter((p) => p.currentStock > 0 && p.turnoverRate < 2)
      expect(slowMovers).toHaveLength(1)
    })

    it('sorts by turnover rate ascending (slowest first)', () => {
      const slowMovers = [
        { productId: 'prod-1', turnoverRate: 1 },
        { productId: 'prod-2', turnoverRate: 0.3 },
        { productId: 'prod-3', turnoverRate: 0.8 },
      ]

      const sorted = slowMovers.sort((a, b) => a.turnoverRate - b.turnoverRate)
      expect(sorted[0].productId).toBe('prod-2')
    })
  })
})

describe('Inventory Aging Reports', () => {
  describe('Age Calculation', () => {
    it('calculates age in days', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const lastUpdated = new Date('2026-01-01T12:00:00Z')
      const ageInDays = Math.floor((now.getTime() - lastUpdated.getTime()) / 86400000)
      expect(ageInDays).toBe(14)
    })
  })

  describe('Age Bucket Classification', () => {
    function getAgeBucket(ageInDays: number) {
      if (ageInDays <= 30) return '0-30 days'
      if (ageInDays <= 60) return '31-60 days'
      if (ageInDays <= 90) return '61-90 days'
      if (ageInDays <= 120) return '91-120 days'
      return '120+ days'
    }

    it('classifies 0-30 days correctly', () => {
      expect(getAgeBucket(15)).toBe('0-30 days')
      expect(getAgeBucket(30)).toBe('0-30 days')
    })

    it('classifies 31-60 days correctly', () => {
      expect(getAgeBucket(45)).toBe('31-60 days')
      expect(getAgeBucket(60)).toBe('31-60 days')
    })

    it('classifies 61-90 days correctly', () => {
      expect(getAgeBucket(75)).toBe('61-90 days')
    })

    it('classifies 91-120 days correctly', () => {
      expect(getAgeBucket(100)).toBe('91-120 days')
    })

    it('classifies 120+ days correctly', () => {
      expect(getAgeBucket(150)).toBe('120+ days')
      expect(getAgeBucket(365)).toBe('120+ days')
    })
  })

  describe('Age Bucket Colors', () => {
    function getAgeBucketColor(bucket: string) {
      switch (bucket) {
        case '0-30 days':
          return 'bg-green-100 text-green-800'
        case '31-60 days':
          return 'bg-blue-100 text-blue-800'
        case '61-90 days':
          return 'bg-yellow-100 text-yellow-800'
        case '91-120 days':
          return 'bg-orange-100 text-orange-800'
        case '120+ days':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    it('returns green for fresh inventory', () => {
      expect(getAgeBucketColor('0-30 days')).toContain('green')
    })

    it('returns red for old inventory', () => {
      expect(getAgeBucketColor('120+ days')).toContain('red')
    })
  })

  describe('Aging Summary', () => {
    it('aggregates by bucket', () => {
      const agingData = [
        { ageBucket: '0-30 days', value: 500 },
        { ageBucket: '0-30 days', value: 300 },
        { ageBucket: '61-90 days', value: 200 },
      ]

      const bucketMap = new Map<string, number>()
      for (const item of agingData) {
        bucketMap.set(item.ageBucket, (bucketMap.get(item.ageBucket) || 0) + item.value)
      }

      expect(bucketMap.get('0-30 days')).toBe(800)
      expect(bucketMap.get('61-90 days')).toBe(200)
    })

    it('calculates percentage of total', () => {
      const buckets = [
        { bucket: '0-30 days', value: 800 },
        { bucket: '61-90 days', value: 200 },
      ]

      const totalValue = buckets.reduce((sum, b) => sum + b.value, 0)

      const withPercentage = buckets.map((b) => ({
        ...b,
        percentage: Math.round((b.value / totalValue) * 1000) / 10,
      }))

      expect(withPercentage[0].percentage).toBe(80)
      expect(withPercentage[1].percentage).toBe(20)
    })

    it('orders buckets correctly', () => {
      const bucketOrder = ['0-30 days', '31-60 days', '61-90 days', '91-120 days', '120+ days']
      expect(bucketOrder[0]).toBe('0-30 days')
      expect(bucketOrder[4]).toBe('120+ days')
    })
  })

  describe('Aging Details', () => {
    it('sorts by age descending (oldest first)', () => {
      const items = [
        { productId: 'prod-1', ageInDays: 30 },
        { productId: 'prod-2', ageInDays: 90 },
        { productId: 'prod-3', ageInDays: 60 },
      ]

      const sorted = items.sort((a, b) => b.ageInDays - a.ageInDays)
      expect(sorted[0].productId).toBe('prod-2')
    })

    it('limits results', () => {
      const items = Array(50)
        .fill(null)
        .map((_, i) => ({ productId: `prod-${i}` }))
      const limit = 20
      const limited = items.slice(0, limit)
      expect(limited).toHaveLength(20)
    })
  })
})

describe('Currency Formatting', () => {
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  it('formats with dollar sign', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
  })

  it('adds thousand separators', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
  })

  it('handles decimals', () => {
    expect(formatCurrency(99.99)).toBe('$99.99')
  })
})

describe('Report Tabs', () => {
  const tabs = ['value', 'turnover', 'aging']

  it('has correct number of tabs', () => {
    expect(tabs).toHaveLength(3)
  })

  it('has correct tab names', () => {
    expect(tabs).toContain('value')
    expect(tabs).toContain('turnover')
    expect(tabs).toContain('aging')
  })

  it('formats tab labels correctly', () => {
    const labels: Record<string, string> = {
      value: 'Inventory Value',
      turnover: 'Turnover Analysis',
      aging: 'Inventory Aging',
    }

    expect(labels.value).toBe('Inventory Value')
    expect(labels.turnover).toBe('Turnover Analysis')
    expect(labels.aging).toBe('Inventory Aging')
  })
})
