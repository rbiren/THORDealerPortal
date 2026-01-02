import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasRole, type UserRole } from '@/lib/roles'

// Re-export role utilities for convenience
export { hasRole, isAdmin, canAccessDealer, getRoleLevel, ROLE_HIERARCHY } from '@/lib/roles'
export type { UserRole } from '@/lib/roles'

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  return await auth()
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

/**
 * Require a minimum role level
 */
export async function requireRole(minRole: UserRole) {
  const session = await requireAuth()

  if (!hasRole(session.user.role, minRole)) {
    redirect('/dashboard')
  }
  return session
}
