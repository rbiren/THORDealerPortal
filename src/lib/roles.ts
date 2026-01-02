// Role hierarchy for permission checking - pure functions with no external dependencies

export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  dealer_admin: 60,
  dealer_user: 40,
  readonly: 20,
}

export type UserRole = keyof typeof ROLE_HIERARCHY

/**
 * Check if user has at least the specified role
 */
export function hasRole(userRole: string, minRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0
  return userLevel >= requiredLevel
}

/**
 * Check if user is admin (super_admin or admin)
 */
export function isAdmin(role: string): boolean {
  return hasRole(role, 'admin')
}

/**
 * Check if user can access dealer data
 */
export function canAccessDealer(
  userRole: string,
  userDealerId: string | null,
  targetDealerId: string
): boolean {
  // Admins can access any dealer
  if (isAdmin(userRole)) {
    return true
  }
  // Dealer users can only access their own dealer
  return userDealerId === targetDealerId
}

/**
 * Get role level for a given role
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] || 0
}
