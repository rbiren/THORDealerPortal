'use client'

import { useSession } from './useSession'
import { hasRole, isAdmin, canAccessDealer, type UserRole } from '@/lib/roles'

export interface UsePermissionReturn {
  // Loading state
  isLoading: boolean

  // Role checks
  hasRole: (minRole: UserRole) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isDealerAdmin: () => boolean
  isDealerUser: () => boolean

  // Dealer access
  canAccessDealer: (targetDealerId: string) => boolean
  dealerId: string | null

  // Current role
  role: string | null
}

/**
 * Hook for permission checking in client components
 */
export function usePermission(): UsePermissionReturn {
  const { user, isLoading } = useSession()

  const userRole = user?.role ?? ''
  const userDealerId = user?.dealerId ?? null

  return {
    isLoading,

    hasRole: (minRole: UserRole) => {
      if (!user) return false
      return hasRole(userRole, minRole)
    },

    isAdmin: () => {
      if (!user) return false
      return isAdmin(userRole)
    },

    isSuperAdmin: () => {
      if (!user) return false
      return userRole === 'super_admin'
    },

    isDealerAdmin: () => {
      if (!user) return false
      return userRole === 'dealer_admin'
    },

    isDealerUser: () => {
      if (!user) return false
      return userRole === 'dealer_user' || userRole === 'dealer_admin'
    },

    canAccessDealer: (targetDealerId: string) => {
      if (!user) return false
      return canAccessDealer(userRole, userDealerId, targetDealerId)
    },

    dealerId: userDealerId,
    role: user?.role ?? null,
  }
}
