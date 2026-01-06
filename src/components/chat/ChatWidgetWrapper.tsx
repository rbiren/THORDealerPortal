'use client'

import { useSession } from 'next-auth/react'
import { ChatWidget } from './ChatWidget'

/**
 * Wrapper component for ChatWidget that handles session context
 * Only shows chat widget for dealer users (not admins)
 */
export function ChatWidgetWrapper() {
  const { data: session, status } = useSession()

  // Don't show for unauthenticated users or while loading
  if (status !== 'authenticated' || !session?.user) {
    return null
  }

  // Only show for dealer users (not admins who have their own dashboard)
  const isDealer = ['dealer_admin', 'dealer_user'].includes(session.user.role)

  if (!isDealer) {
    return null
  }

  return <ChatWidget position="bottom-right" defaultDepartment="general" />
}
