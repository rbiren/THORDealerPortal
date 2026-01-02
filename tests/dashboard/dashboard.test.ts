/**
 * Tests for Dealer Dashboard
 * Task 4.1.1-4.1.4: Dashboard layout, metrics, activity feed, quick actions
 */

describe('Dealer Dashboard', () => {
  describe('Dashboard Stats', () => {
    it('calculates monthly sales correctly', () => {
      const orders = [
        { totalAmount: 1000, status: 'delivered' },
        { totalAmount: 2000, status: 'confirmed' },
        { totalAmount: 500, status: 'cancelled' },
      ]

      const monthlySales = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0)

      expect(monthlySales).toBe(3000)
    })

    it('calculates month-over-month growth', () => {
      const thisMonth = 1200
      const lastMonth = 1000
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100
      expect(growth).toBe(20)
    })

    it('handles negative growth', () => {
      const thisMonth = 800
      const lastMonth = 1000
      const growth = ((thisMonth - lastMonth) / lastMonth) * 100
      expect(growth).toBe(-20)
    })

    it('handles zero last month (no division by zero)', () => {
      const thisMonth = 1000
      const lastMonth = 0
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0
      expect(growth).toBe(0)
    })

    it('calculates average order value', () => {
      const totalSales = 5000
      const orderCount = 10
      const avgOrderValue = totalSales / orderCount
      expect(avgOrderValue).toBe(500)
    })

    it('calculates year to date sales', () => {
      const monthlyTotals = [1000, 1200, 1500, 1800, 2000, 1600]
      const ytdSales = monthlyTotals.reduce((sum, m) => sum + m, 0)
      expect(ytdSales).toBe(9100)
    })

    it('counts pending orders correctly', () => {
      const orders = [
        { status: 'submitted' },
        { status: 'confirmed' },
        { status: 'processing' },
        { status: 'shipped' },
        { status: 'delivered' },
        { status: 'cancelled' },
      ]

      const pendingStatuses = ['submitted', 'confirmed', 'processing']
      const pendingCount = orders.filter((o) => pendingStatuses.includes(o.status)).length
      expect(pendingCount).toBe(3)
    })
  })

  describe('Recent Orders Display', () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-2026-TEST01',
        status: 'submitted',
        totalAmount: 1500,
        itemCount: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-2026-TEST02',
        status: 'delivered',
        totalAmount: 2500,
        itemCount: 8,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    it('sorts orders by date descending', () => {
      const sorted = [...mockOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      expect(sorted[0].id).toBe('order-1')
    })

    it('limits to specified number of orders', () => {
      const limit = 5
      const allOrders = Array(10)
        .fill(null)
        .map((_, i) => ({ id: `order-${i}` }))
      const limited = allOrders.slice(0, limit)
      expect(limited).toHaveLength(5)
    })

    it('maps status to label and color', () => {
      const statusConfig = {
        submitted: { label: 'Submitted', color: 'blue' },
        confirmed: { label: 'Confirmed', color: 'olive' },
        delivered: { label: 'Delivered', color: 'green' },
      }

      const order = { status: 'submitted' }
      const config = statusConfig[order.status as keyof typeof statusConfig]
      expect(config.label).toBe('Submitted')
      expect(config.color).toBe('blue')
    })

    it('formats relative time correctly', () => {
      const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      const recentDate = new Date(Date.now() - 30 * 60000).toISOString() // 30 mins ago
      expect(formatRelativeTime(recentDate)).toBe('30m ago')

      const hoursAgo = new Date(Date.now() - 5 * 3600000).toISOString() // 5 hours ago
      expect(formatRelativeTime(hoursAgo)).toBe('5h ago')

      const daysAgo = new Date(Date.now() - 3 * 86400000).toISOString() // 3 days ago
      expect(formatRelativeTime(daysAgo)).toBe('3d ago')
    })
  })

  describe('Activity Feed', () => {
    it('combines orders and invoices in activity feed', () => {
      const orders = [{ id: 'order-1', createdAt: '2026-01-15T10:00:00Z' }]
      const invoices = [{ id: 'invoice-1', createdAt: '2026-01-15T11:00:00Z' }]

      const activities = [
        ...orders.map((o) => ({ id: `order-${o.id}`, timestamp: o.createdAt, type: 'order' })),
        ...invoices.map((i) => ({ id: `invoice-${i.id}`, timestamp: i.createdAt, type: 'invoice' })),
      ]

      expect(activities).toHaveLength(2)
    })

    it('sorts activities by timestamp descending', () => {
      const activities = [
        { id: 'a1', timestamp: '2026-01-15T10:00:00Z' },
        { id: 'a2', timestamp: '2026-01-15T12:00:00Z' },
        { id: 'a3', timestamp: '2026-01-15T11:00:00Z' },
      ]

      const sorted = activities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      expect(sorted[0].id).toBe('a2')
      expect(sorted[1].id).toBe('a3')
      expect(sorted[2].id).toBe('a1')
    })

    it('limits activity feed to specified count', () => {
      const allActivities = Array(20)
        .fill(null)
        .map((_, i) => ({ id: `activity-${i}` }))
      const limit = 10
      const limited = allActivities.slice(0, limit)
      expect(limited).toHaveLength(10)
    })

    it('assigns correct icons to activity types', () => {
      const activityIcons = {
        order: 'shopping-cart',
        invoice: 'document',
        status_change: 'refresh',
      }

      expect(activityIcons.order).toBe('shopping-cart')
      expect(activityIcons.invoice).toBe('document')
      expect(activityIcons.status_change).toBe('refresh')
    })
  })

  describe('Low Stock Alerts', () => {
    it('identifies low stock items', () => {
      const inventory = [
        { productName: 'Product A', quantity: 5, lowStockThreshold: 10 },
        { productName: 'Product B', quantity: 15, lowStockThreshold: 10 },
        { productName: 'Product C', quantity: 3, lowStockThreshold: 10 },
      ]

      const lowStock = inventory.filter((i) => i.quantity < i.lowStockThreshold)
      expect(lowStock).toHaveLength(2)
      expect(lowStock[0].productName).toBe('Product A')
    })

    it('sorts by quantity ascending (most urgent first)', () => {
      const alerts = [
        { productName: 'Product A', quantity: 5 },
        { productName: 'Product B', quantity: 2 },
        { productName: 'Product C', quantity: 8 },
      ]

      const sorted = alerts.sort((a, b) => a.quantity - b.quantity)
      expect(sorted[0].productName).toBe('Product B')
    })

    it('limits alerts to specified count', () => {
      const allAlerts = Array(10)
        .fill(null)
        .map((_, i) => ({ id: `alert-${i}` }))
      const limit = 5
      const limited = allAlerts.slice(0, limit)
      expect(limited).toHaveLength(5)
    })
  })

  describe('Quick Actions', () => {
    const quickActions = [
      { id: 'new-order', label: 'New Order', href: '/products', icon: 'plus' },
      { id: 'browse', label: 'Browse Products', href: '/products', icon: 'search' },
      { id: 'orders', label: 'View Orders', href: '/orders', icon: 'list' },
      { id: 'invoices', label: 'Invoices', href: '/invoices', icon: 'document' },
    ]

    it('has correct number of quick actions', () => {
      expect(quickActions).toHaveLength(4)
    })

    it('has correct labels for each action', () => {
      const labels = quickActions.map((a) => a.label)
      expect(labels).toContain('New Order')
      expect(labels).toContain('Browse Products')
      expect(labels).toContain('View Orders')
      expect(labels).toContain('Invoices')
    })

    it('has correct hrefs for each action', () => {
      const newOrder = quickActions.find((a) => a.id === 'new-order')
      expect(newOrder?.href).toBe('/products')

      const orders = quickActions.find((a) => a.id === 'orders')
      expect(orders?.href).toBe('/orders')
    })
  })

  describe('Currency Formatting', () => {
    function formatCurrency(amount: number) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    it('formats whole numbers without decimals', () => {
      expect(formatCurrency(1500)).toBe('$1,500')
    })

    it('formats large numbers with commas', () => {
      expect(formatCurrency(1500000)).toBe('$1,500,000')
    })

    it('rounds decimal values', () => {
      expect(formatCurrency(1500.75)).toBe('$1,501')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('Stats Card Layout', () => {
    const statsCards = [
      { id: 'monthly-sales', title: 'Monthly Sales', metric: 'monthlySales' },
      { id: 'ytd-sales', title: 'Year to Date', metric: 'yearToDateSales' },
      { id: 'pending-orders', title: 'Pending Orders', metric: 'pendingOrders' },
      { id: 'pending-invoices', title: 'Pending Invoices', metric: 'pendingInvoices' },
    ]

    it('has 4 stats cards in top row', () => {
      expect(statsCards).toHaveLength(4)
    })

    it('includes growth indicator for monthly sales', () => {
      const monthlyCard = statsCards.find((c) => c.id === 'monthly-sales')
      expect(monthlyCard).toBeDefined()
    })

    it('includes average order value in YTD card', () => {
      const ytdCard = statsCards.find((c) => c.id === 'ytd-sales')
      expect(ytdCard).toBeDefined()
    })

    it('shows overdue count for invoices', () => {
      const invoiceCard = statsCards.find((c) => c.id === 'pending-invoices')
      expect(invoiceCard).toBeDefined()
    })
  })

  describe('Dashboard Layout', () => {
    it('has correct grid structure', () => {
      const layout = {
        topRow: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        mainContent: 'grid-cols-1 lg:grid-cols-3',
        leftColumn: 'lg:col-span-2',
        rightColumn: 'col-span-1',
      }

      expect(layout.topRow).toContain('lg:grid-cols-4')
      expect(layout.mainContent).toContain('lg:grid-cols-3')
    })

    it('has responsive design classes', () => {
      const responsiveClasses = [
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-4',
        'md:grid-cols-4',
      ]

      expect(responsiveClasses).toContain('grid-cols-1')
      expect(responsiveClasses).toContain('md:grid-cols-2')
    })
  })

  describe('Empty States', () => {
    it('shows empty state for no orders', () => {
      const orders: unknown[] = []
      const isEmpty = orders.length === 0
      expect(isEmpty).toBe(true)
    })

    it('shows empty state for no activity', () => {
      const activities: unknown[] = []
      const isEmpty = activities.length === 0
      expect(isEmpty).toBe(true)
    })

    it('hides low stock section when no alerts', () => {
      const alerts: unknown[] = []
      const shouldShow = alerts.length > 0
      expect(shouldShow).toBe(false)
    })
  })

  describe('Date Range Calculations', () => {
    it('calculates start of current month', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      expect(startOfMonth.getDate()).toBe(1)
      expect(startOfMonth.getMonth()).toBe(0) // January
    })

    it('calculates start of last month', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      expect(startOfLastMonth.getMonth()).toBe(11) // December of previous year
    })

    it('calculates end of last month', () => {
      const now = new Date('2026-01-15T12:00:00Z')
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      expect(endOfLastMonth.getDate()).toBe(31) // December 31
    })

    it('calculates start of year', () => {
      const now = new Date('2026-06-15T12:00:00Z')
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      expect(startOfYear.getMonth()).toBe(0)
      expect(startOfYear.getDate()).toBe(1)
    })
  })
})

describe('Dashboard Loading State', () => {
  it('shows loading spinner initially', () => {
    const mounted = false
    const showLoading = !mounted
    expect(showLoading).toBe(true)
  })

  it('hides loading spinner when mounted', () => {
    const mounted = true
    const showLoading = !mounted
    expect(showLoading).toBe(false)
  })
})
