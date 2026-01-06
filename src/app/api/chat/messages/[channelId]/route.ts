/**
 * Channel Messages API
 * GET - Get messages for a channel with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChannelMessages, getChannel, markMessagesRead } from '@/lib/services/chat'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await params
    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)

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

    const messages = await getChannelMessages(channelId, { before, limit })

    // Mark messages as read
    if (messages.length > 0) {
      await markMessagesRead(channelId, session.user.id)
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}
