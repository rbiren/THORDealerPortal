/**
 * Single Chat Channel API
 * GET - Get channel details with messages
 * PATCH - Update channel (assign, close, transfer)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getChannel,
  assignChannel,
  closeChannel,
  transferChannel,
  submitSatisfactionRating,
  type ChatDepartment,
} from '@/lib/services/chat'

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
    const channel = await getChannel(channelId)

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Check access: admins can see all, dealers can only see their own
    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)
    const isDealerOwner = channel.dealerId === session.user.dealerId

    if (!isAdmin && !isDealerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Error fetching channel:', error)
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await params
    const body = await request.json()
    const { action, ...data } = body

    const existingChannel = await getChannel(channelId)

    if (!existingChannel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Check access
    const isAdmin = ['admin', 'super_admin'].includes(session.user.role)
    const isDealerOwner = existingChannel.dealerId === session.user.dealerId

    if (!isAdmin && !isDealerOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let channel

    switch (action) {
      case 'assign':
        if (!isAdmin) {
          return NextResponse.json({ error: 'Only admins can assign chats' }, { status: 403 })
        }
        // If 'current' is passed, use the session user ID
        const assigneeId = data.assignedToId === 'current' ? session.user.id : data.assignedToId
        channel = await assignChannel(channelId, assigneeId, session.user.id)
        break

      case 'close':
        const closeReason = isAdmin
          ? data.closeReason || 'agent_closed'
          : 'dealer_closed'
        channel = await closeChannel(channelId, session.user.id, closeReason)
        break

      case 'transfer':
        if (!isAdmin) {
          return NextResponse.json({ error: 'Only admins can transfer chats' }, { status: 403 })
        }
        channel = await transferChannel(
          channelId,
          data.department as ChatDepartment,
          data.assignedToId,
          session.user.id
        )
        break

      case 'rate':
        if (!isDealerOwner) {
          return NextResponse.json({ error: 'Only chat owner can rate' }, { status: 403 })
        }
        await submitSatisfactionRating(channelId, data.rating, data.comment)
        channel = await getChannel(channelId)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Error updating channel:', error)
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
  }
}
