'use client'

import { usePermission } from '@/hooks/usePermission'
import type { UserRole } from '@/lib/roles'
import type { ReactNode } from 'react'

interface PermissionGateProps {
  children: ReactNode
  /**
   * Minimum role required to view the content
   */
  minRole?: UserRole
  /**
   * Check if user is an admin (super_admin or admin)
   */
  requireAdmin?: boolean
  /**
   * Check if user can access specific dealer
   */
  dealerId?: string
  /**
   * Content to show while loading
   */
  loading?: ReactNode
  /**
   * Content to show when access is denied
   */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on user permissions
 *
 * @example
 * // Only show to admins
 * <PermissionGate requireAdmin>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * @example
 * // Only show to users with dealer_admin or higher
 * <PermissionGate minRole="dealer_admin">
 *   <DealerSettings />
 * </PermissionGate>
 *
 * @example
 * // Only show if user can access specific dealer
 * <PermissionGate dealerId={dealer.id}>
 *   <DealerData />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  minRole,
  requireAdmin,
  dealerId,
  loading = null,
  fallback = null,
}: PermissionGateProps) {
  const permission = usePermission()

  // Show loading state
  if (permission.isLoading) {
    return <>{loading}</>
  }

  // Check admin requirement
  if (requireAdmin && !permission.isAdmin()) {
    return <>{fallback}</>
  }

  // Check minimum role
  if (minRole && !permission.hasRole(minRole)) {
    return <>{fallback}</>
  }

  // Check dealer access
  if (dealerId && !permission.canAccessDealer(dealerId)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Only renders children if user is an admin
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate requireAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Only renders children if user is a super admin
 */
export function SuperAdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate minRole="super_admin" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * Only renders children if user can access the specified dealer
 */
export function DealerAccessGate({
  dealerId,
  children,
  fallback = null,
}: {
  dealerId: string
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGate dealerId={dealerId} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
