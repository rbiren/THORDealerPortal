'use client'

import { usePermission } from '@/hooks/usePermission'
import type { UserRole } from '@/lib/roles'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RequireRoleProps {
  children: ReactNode
  /**
   * Minimum role required to view the content
   */
  minRole: UserRole
  /**
   * Where to redirect if access is denied (default: /dashboard)
   */
  redirectTo?: string
  /**
   * Content to show while checking permissions
   */
  loading?: ReactNode
}

/**
 * Redirects users who don't have the required role
 *
 * @example
 * // Redirect non-admins away
 * <RequireRole minRole="admin">
 *   <AdminDashboard />
 * </RequireRole>
 */
export function RequireRole({
  children,
  minRole,
  redirectTo = '/dashboard',
  loading,
}: RequireRoleProps) {
  const router = useRouter()
  const permission = usePermission()

  const hasAccess = permission.hasRole(minRole)

  useEffect(() => {
    // Wait for session to load
    if (permission.isLoading) return

    // Redirect if no access
    if (!hasAccess) {
      router.replace(redirectTo)
    }
  }, [permission.isLoading, hasAccess, router, redirectTo])

  // Show loading while checking
  if (permission.isLoading) {
    return (
      <>
        {loading || (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}
      </>
    )
  }

  // Don't render if no access (redirect will happen)
  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}

/**
 * Requires admin role to view content
 */
export function RequireAdmin({
  children,
  redirectTo = '/dashboard',
  loading,
}: Omit<RequireRoleProps, 'minRole'>) {
  return (
    <RequireRole minRole="admin" redirectTo={redirectTo} loading={loading}>
      {children}
    </RequireRole>
  )
}

/**
 * Requires super_admin role to view content
 */
export function RequireSuperAdmin({
  children,
  redirectTo = '/dashboard',
  loading,
}: Omit<RequireRoleProps, 'minRole'>) {
  return (
    <RequireRole minRole="super_admin" redirectTo={redirectTo} loading={loading}>
      {children}
    </RequireRole>
  )
}

/**
 * Requires dealer_admin or higher role to view content
 */
export function RequireDealerAdmin({
  children,
  redirectTo = '/dashboard',
  loading,
}: Omit<RequireRoleProps, 'minRole'>) {
  return (
    <RequireRole minRole="dealer_admin" redirectTo={redirectTo} loading={loading}>
      {children}
    </RequireRole>
  )
}
