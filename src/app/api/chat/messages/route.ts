/**
 * Chat Messages API
 * POST - Send a new message
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendMessage, getChannel } from '@/lib/services/chat'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, content, attachments } = body

    if (!channelId || !content) {
      return NextResponse.json(
        { error: 'channelId and content are required' },
        { status: 400 }
      )
    }

    // Verify user has access to channel
    const channel = await getChannel(channelId)

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)
    const isDealerOwner = channel.dealerId === session.user.dealerId

    if (!isAdmin && !isDealerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if channel is closed
    if (channel.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot send messages to a closed chat' },
        { status: 400 }
      )
    }

    const message = await sendMessage({
      channelId,
      senderId: session.user.id,
      content,
      messageType: attachments?.length ? 'attachment' : 'text',
      attachments,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
