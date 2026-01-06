/**
 * Chat Channels API
 * GET - List channels (filtered by user role)
 * POST - Create new chat channel
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createChannel,
  getDealerChannels,
  getAdminChannels,
  type ChatDepartment,
  type ChatStatus,
} from '@/lib/services/chat'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.split(',') as ChatStatus[] | undefined
    const department = searchParams.get('department') as ChatDepartment | undefined
    const unassignedOnly = searchParams.get('unassigned') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)

    let channels

    if (isAdmin) {
      // Admins see all channels
      channels = await getAdminChannels({
        status,
        department,
        unassignedOnly,
        limit,
      })
    } else if (session.user.dealerId) {
      // Dealers see their own channels
      channels = await getDealerChannels(session.user.dealerId, { status, limit })
    } else {
      return NextResponse.json({ error: 'No dealer associated' }, { status: 403 })
    }

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.dealerId) {
      return NextResponse.json({ error: 'No dealer associated' }, { status: 403 })
    }

    const body = await request.json()
    const { department, subject, initialMessage } = body

    const channel = await createChannel({
      dealerId: session.user.dealerId,
      userId: session.user.id,
      department: department as ChatDepartment,
      subject,
      initialMessage,
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
  }
}
