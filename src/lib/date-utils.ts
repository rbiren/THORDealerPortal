// Date utility functions (non-server)

export type DateRange = {
  startDate: string
  endDate: string
}

// Get preset date ranges for reports
export function getPresetDateRanges(): Record<string, DateRange> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // Last 30 days
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Last 90 days
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Start of year
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]

  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  return {
    'This Month': { startDate: monthStart, endDate: today },
    'Last 30 Days': { startDate: thirtyDaysAgo.toISOString().split('T')[0], endDate: today },
    'Last 90 Days': { startDate: ninetyDaysAgo.toISOString().split('T')[0], endDate: today },
    'Year to Date': { startDate: yearStart, endDate: today },
    'Last Month': { startDate: lastMonthStart, endDate: lastMonthEnd },
  }
}
