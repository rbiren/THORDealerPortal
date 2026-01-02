'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'
import type { Session } from 'next-auth'

export interface UseSessionReturn {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
  user: Session['user'] | null
}

/**
 * Enhanced session hook with convenient accessors
 */
export function useSession(): UseSessionReturn {
  const { data: session, status } = useNextAuthSession()

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user: session?.user ?? null,
  }
}
