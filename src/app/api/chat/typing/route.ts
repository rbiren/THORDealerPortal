/**
 * Chat Typing Indicator API
 * POST - Broadcast typing status
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { broadcastTyping, getChannel } from '@/lib/services/chat'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, isTyping } = body

    if (!channelId || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'channelId and isTyping are required' },
        { status: 400 }
      )
    }

    // Verify access
    const channel = await getChannel(channelId)

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)
    const isDealerOwner = channel.dealerId === session.user.dealerId

    if (!isAdmin && !isDealerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await broadcastTyping(channelId, session.user.id, isTyping)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error broadcasting typing:', error)
    return NextResponse.json({ error: 'Failed to broadcast typing' }, { status: 500 })
  }
}
