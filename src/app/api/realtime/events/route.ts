import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  createClientSubscription,
  type RealtimeEvent,
  type ClientConnection,
} from '@/lib/services/realtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events endpoint for real-time updates
 *
 * Clients connect to this endpoint and receive real-time events
 * based on their user ID, dealer ID, and role.
 */
export async function GET(request: NextRequest) {
  // Authenticate the request
  const session = await auth()

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id as string
  const dealerId = (session.user as { dealerId?: string }).dealerId
  const role = (session.user as { role?: string }).role || 'dealer_user'

  // Create the connection info
  const connection: ClientConnection = {
    userId,
    dealerId,
    role,
    connectedAt: new Date(),
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        userId,
        timestamp: new Date().toISOString(),
      })}\n\n`
      controller.enqueue(encoder.encode(connectEvent))

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `:heartbeat ${Date.now()}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Every 30 seconds

      // Subscribe to events
      const unsubscribe = createClientSubscription(connection, (event: RealtimeEvent) => {
        try {
          const payload = typeof event.payload === 'object' && event.payload !== null
            ? event.payload as Record<string, unknown>
            : { data: event.payload }
          const eventData = `event: ${event.type}\ndata: ${JSON.stringify({
            ...payload,
            timestamp: event.timestamp.toISOString(),
          })}\n\n`
          controller.enqueue(encoder.encode(eventData))
        } catch {
          // Connection closed, clean up
          clearInterval(heartbeatInterval)
          unsubscribe()
        }
      })

      // Handle request abort (client disconnect)
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
