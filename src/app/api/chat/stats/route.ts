/**
 * Chat Statistics API
 * GET - Get chat statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChatStats, getChatHistory, type ChatDepartment, type ChatStatus } from '@/lib/services/chat'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access stats
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'

    if (type === 'stats') {
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined

      const stats = await getChatStats({ startDate, endDate })

      return NextResponse.json({ stats })
    }

    if (type === 'history') {
      const dealerId = searchParams.get('dealerId') || undefined
      const department = searchParams.get('department') as ChatDepartment | undefined
      const status = searchParams.get('status') as ChatStatus | undefined
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined
      const limit = parseInt(searchParams.get('limit') || '50', 10)
      const offset = parseInt(searchParams.get('offset') || '0', 10)

      const history = await getChatHistory({
        dealerId,
        department,
        status,
        startDate,
        endDate,
        limit,
        offset,
      })

      return NextResponse.json(history)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching chat stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
