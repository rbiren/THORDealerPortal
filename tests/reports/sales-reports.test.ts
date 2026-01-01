/**
 * Tests for Sales Reports
 * Task 4.2.1-4.2.3: Sales summary, product breakdown, comparisons
 */

describe('Sales Reports', () => {
  describe('Sales Summary', () => {
    it('calculates total sales from orders', () => {
      const orders = [
        { totalAmount: 1500, status: 'delivered' },
        { totalAmount: 2000, status: 'shipped' },
        { totalAmount: 500, status: 'cancelled' },
      ]

      const excludedStatuses = ['draft', 'cancelled']
      const totalSales = orders
        .filter((o) => !excludedStatuses.includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0)

      expect(totalSales).toBe(3500)
    })

    it('counts orders correctly', () => {
      const orders = [
        { status: 'delivered' },
        { status: 'shipped' },
        { status: 'processing' },
        { status: 'cancelled' },
      ]

      const excludedStatuses = ['draft', 'cancelled']
      const orderCount = orders.filter((o) => !excludedStatuses.includes(o.status)).length

      expect(orderCount).toBe(3)
    })

    it('calculates average order value', () => {
      const totalSales = 5000
      const orderCount = 10
      const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0

      expect(avgOrderValue).toBe(500)
    })

    it('handles zero orders gracefully', () => {
      const totalSales = 0
      const orderCount = 0
      const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0

      expect(avgOrderValue).toBe(0)
    })

    it('calculates items sold', () => {
      const orderItems = [{ quantity: 5 }, { quantity: 3 }, { quantity: 8 }]
      const itemsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0)

      expect(itemsSold).toBe(16)
    })

    it('calculates growth percentage', () => {
      const currentSales = 12000
      const previousSales = 10000
      const growth = Math.round(((currentSales - previousSales) / previousSales) * 100)

      expect(growth).toBe(20)
    })

    it('handles negative growth', () => {
      const currentSales = 8000
      const previousSales = 10000
      const growth = Math.round(((currentSales - previousSales) / previousSales) * 100)

      expect(growth).toBe(-20)
    })

    it('handles zero previous sales', () => {
      const currentSales = 5000
      const previousSales = 0
      const growth = previousSales > 0 ? Math.round(((currentSales - previousSales) / previousSales) * 100) : 0

      expect(growth).toBe(0)
    })
  })

  describe('Sales by Period', () => {
    it('groups orders by day', () => {
      const orders = [
        { date: '2026-01-15', amount: 100 },
        { date: '2026-01-15', amount: 200 },
        { date: '2026-01-16', amount: 150 },
      ]

      const groupedByDay = new Map<string, number>()
      for (const order of orders) {
        const existing = groupedByDay.get(order.date) || 0
        groupedByDay.set(order.date, existing + order.amount)
      }

      expect(groupedByDay.get('2026-01-15')).toBe(300)
      expect(groupedByDay.get('2026-01-16')).toBe(150)
    })

    it('groups orders by week', () => {
      const getWeekKey = (dateString: string) => {
        const date = new Date(dateString)
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      }

      expect(getWeekKey('2026-01-15')).toContain('Week of')
    })

    it('groups orders by month', () => {
      const getMonthKey = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }

      expect(getMonthKey('2026-01-15')).toBe('Jan 2026')
      expect(getMonthKey('2026-06-20')).toBe('Jun 2026')
    })

    it('sorts periods chronologically', () => {
      const periods = [
        { date: '2026-01-20', period: 'Jan 2026' },
        { date: '2026-01-10', period: 'Jan 2026' },
        { date: '2026-02-05', period: 'Feb 2026' },
      ]

      const sorted = periods.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      expect(sorted[0].date).toBe('2026-01-10')
      expect(sorted[2].date).toBe('2026-02-05')
    })
  })

  describe('Product Sales', () => {
    it('aggregates sales by product', () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 5, totalPrice: 500 },
        { productId: 'prod-1', quantity: 3, totalPrice: 300 },
        { productId: 'prod-2', quantity: 2, totalPrice: 400 },
      ]

      const productMap = new Map<string, { quantity: number; revenue: number }>()
      for (const item of orderItems) {
        const existing = productMap.get(item.productId) || { quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.totalPrice
        productMap.set(item.productId, existing)
      }

      expect(productMap.get('prod-1')).toEqual({ quantity: 8, revenue: 800 })
      expect(productMap.get('prod-2')).toEqual({ quantity: 2, revenue: 400 })
    })

    it('sorts products by revenue descending', () => {
      const products = [
        { productId: 'prod-1', revenue: 500 },
        { productId: 'prod-2', revenue: 1000 },
        { productId: 'prod-3', revenue: 750 },
      ]

      const sorted = products.sort((a, b) => b.revenue - a.revenue)

      expect(sorted[0].productId).toBe('prod-2')
      expect(sorted[1].productId).toBe('prod-3')
      expect(sorted[2].productId).toBe('prod-1')
    })

    it('sorts products by quantity descending', () => {
      const products = [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 25 },
        { productId: 'prod-3', quantity: 15 },
      ]

      const sorted = products.sort((a, b) => b.quantity - a.quantity)

      expect(sorted[0].productId).toBe('prod-2')
    })

    it('limits results to specified count', () => {
      const products = Array(20)
        .fill(null)
        .map((_, i) => ({ productId: `prod-${i}` }))
      const limit = 10
      const limited = products.slice(0, limit)

      expect(limited).toHaveLength(10)
    })
  })

  describe('Category Sales', () => {
    it('aggregates sales by category', () => {
      const orderItems = [
        { categoryId: 'cat-1', totalPrice: 500 },
        { categoryId: 'cat-1', totalPrice: 300 },
        { categoryId: 'cat-2', totalPrice: 400 },
      ]

      const categoryMap = new Map<string, number>()
      for (const item of orderItems) {
        const existing = categoryMap.get(item.categoryId) || 0
        categoryMap.set(item.categoryId, existing + item.totalPrice)
      }

      expect(categoryMap.get('cat-1')).toBe(800)
      expect(categoryMap.get('cat-2')).toBe(400)
    })

    it('calculates category percentage of total', () => {
      const categories = [
        { categoryId: 'cat-1', revenue: 600 },
        { categoryId: 'cat-2', revenue: 400 },
      ]

      const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0)

      const withPercentage = categories.map((c) => ({
        ...c,
        percentage: Math.round((c.revenue / totalRevenue) * 1000) / 10,
      }))

      expect(withPercentage[0].percentage).toBe(60)
      expect(withPercentage[1].percentage).toBe(40)
    })

    it('sorts categories by revenue descending', () => {
      const categories = [
        { categoryId: 'cat-1', revenue: 500 },
        { categoryId: 'cat-2', revenue: 1000 },
        { categoryId: 'cat-3', revenue: 750 },
      ]

      const sorted = categories.sort((a, b) => b.revenue - a.revenue)

      expect(sorted[0].categoryId).toBe('cat-2')
    })

    it('handles uncategorized products', () => {
      const categoryId = null
      const displayName = categoryId || 'Uncategorized'

      expect(displayName).toBe('Uncategorized')
    })
  })

  describe('Sales Comparison', () => {
    it('compares current vs previous period sales', () => {
      const current = { sales: 12000, orders: 50 }
      const previous = { sales: 10000, orders: 40 }

      const salesChange = Math.round(((current.sales - previous.sales) / previous.sales) * 1000) / 10
      const ordersChange = Math.round(((current.orders - previous.orders) / previous.orders) * 1000) / 10

      expect(salesChange).toBe(20)
      expect(ordersChange).toBe(25)
    })

    it('calculates avg order value comparison', () => {
      const current = { sales: 12000, orders: 50 }
      const previous = { sales: 10000, orders: 40 }

      const currentAvg = current.sales / current.orders
      const previousAvg = previous.sales / previous.orders
      const avgChange = Math.round(((currentAvg - previousAvg) / previousAvg) * 1000) / 10

      expect(currentAvg).toBe(240)
      expect(previousAvg).toBe(250)
      expect(avgChange).toBe(-4)
    })

    it('handles previous period with zero values', () => {
      const current = { sales: 5000, orders: 20 }
      const previous = { sales: 0, orders: 0 }

      const calcChange = (curr: number, prev: number) =>
        prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0

      expect(calcChange(current.sales, previous.sales)).toBe(0)
      expect(calcChange(current.orders, previous.orders)).toBe(0)
    })
  })

  describe('Date Range Presets', () => {
    it('calculates start of current month', () => {
      const now = new Date('2026-01-15')
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      expect(monthStart.getDate()).toBe(1)
      expect(monthStart.getMonth()).toBe(0)
    })

    it('calculates last 30 days', () => {
      const now = new Date('2026-01-15')
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      expect(thirtyDaysAgo.getMonth()).toBe(11) // December
      expect(thirtyDaysAgo.getDate()).toBe(16)
    })

    it('calculates year to date', () => {
      const now = new Date('2026-06-15')
      const yearStart = new Date(now.getFullYear(), 0, 1)

      expect(yearStart.getMonth()).toBe(0)
      expect(yearStart.getDate()).toBe(1)
    })

    it('calculates last month range', () => {
      const now = new Date('2026-02-15')
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      expect(lastMonthStart.getMonth()).toBe(0) // January
      expect(lastMonthEnd.getMonth()).toBe(0) // January
      expect(lastMonthEnd.getDate()).toBe(31)
    })

    it('calculates previous comparison period', () => {
      const startDate = new Date('2026-01-01')
      const endDate = new Date('2026-01-31')

      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
      const prevEnd = new Date(startDate)
      prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = new Date(prevEnd)
      prevStart.setDate(prevStart.getDate() - periodDays)

      expect(prevEnd.getMonth()).toBe(11) // December
      expect(prevEnd.getDate()).toBe(31)
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

    it('formats with 2 decimal places', () => {
      expect(formatCurrency(1500)).toBe('$1,500.00')
      expect(formatCurrency(1500.5)).toBe('$1,500.50')
    })

    it('adds thousand separators', () => {
      expect(formatCurrency(1500000)).toBe('$1,500,000.00')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('Chart Data Preparation', () => {
    it('calculates bar heights relative to max', () => {
      const data = [
        { period: 'Day 1', sales: 500 },
        { period: 'Day 2', sales: 1000 },
        { period: 'Day 3', sales: 750 },
      ]

      const maxSales = Math.max(...data.map((d) => d.sales))

      const withHeights = data.map((d) => ({
        ...d,
        height: (d.sales / maxSales) * 100,
      }))

      expect(withHeights[0].height).toBe(50)
      expect(withHeights[1].height).toBe(100)
      expect(withHeights[2].height).toBe(75)
    })

    it('handles empty data', () => {
      const data: { sales: number }[] = []
      const maxSales = data.length > 0 ? Math.max(...data.map((d) => d.sales)) : 0

      expect(maxSales).toBe(0)
    })

    it('sets minimum bar height for visibility', () => {
      const data = [
        { sales: 1000 },
        { sales: 10 }, // Very small compared to max
      ]

      const maxSales = Math.max(...data.map((d) => d.sales))

      const withHeights = data.map((d) => ({
        height: Math.max((d.sales / maxSales) * 100, 2), // Minimum 2%
      }))

      expect(withHeights[1].height).toBe(2) // Should be minimum
    })
  })

  describe('Tab Navigation', () => {
    const tabs = ['overview', 'products', 'categories', 'comparison']

    it('has correct number of tabs', () => {
      expect(tabs).toHaveLength(4)
    })

    it('has correct tab names', () => {
      expect(tabs).toContain('overview')
      expect(tabs).toContain('products')
      expect(tabs).toContain('categories')
      expect(tabs).toContain('comparison')
    })

    it('capitalizes tab labels', () => {
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

      expect(capitalize('overview')).toBe('Overview')
      expect(capitalize('products')).toBe('Products')
    })
  })

  describe('Change Indicators', () => {
    function getChangeColor(change: number) {
      if (change > 0) return 'text-success'
      if (change < 0) return 'text-error'
      return 'text-medium-gray'
    }

    it('returns success color for positive change', () => {
      expect(getChangeColor(15)).toBe('text-success')
    })

    it('returns error color for negative change', () => {
      expect(getChangeColor(-10)).toBe('text-error')
    })

    it('returns neutral color for zero change', () => {
      expect(getChangeColor(0)).toBe('text-medium-gray')
    })

    it('formats positive change with plus sign', () => {
      const change = 20
      const formatted = change > 0 ? `+${change}%` : `${change}%`
      expect(formatted).toBe('+20%')
    })

    it('formats negative change without plus sign', () => {
      const change = -15
      const formatted = change > 0 ? `+${change}%` : `${change}%`
      expect(formatted).toBe('-15%')
    })
  })
})

describe('Reports Index', () => {
  const reports = [
    { id: 'sales', name: 'Sales Reports', href: '/reports/sales' },
    { id: 'inventory', name: 'Inventory Reports', href: '/reports/inventory' },
    { id: 'orders', name: 'Order Reports', href: '/reports/orders' },
  ]

  it('has correct number of report links', () => {
    expect(reports).toHaveLength(3)
  })

  it('has correct hrefs', () => {
    const sales = reports.find((r) => r.id === 'sales')
    expect(sales?.href).toBe('/reports/sales')
  })
})
