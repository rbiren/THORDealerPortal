import { hasRole, isAdmin, canAccessDealer, type UserRole } from '@/lib/roles'

describe('Auth Utilities', () => {
  describe('hasRole', () => {
    it('should return true when user has exact required role', () => {
      expect(hasRole('admin', 'admin')).toBe(true)
      expect(hasRole('super_admin', 'super_admin')).toBe(true)
      expect(hasRole('dealer_admin', 'dealer_admin')).toBe(true)
    })

    it('should return true when user has higher role than required', () => {
      expect(hasRole('super_admin', 'admin')).toBe(true)
      expect(hasRole('super_admin', 'dealer_admin')).toBe(true)
      expect(hasRole('admin', 'dealer_admin')).toBe(true)
      expect(hasRole('dealer_admin', 'dealer_user')).toBe(true)
      expect(hasRole('dealer_admin', 'readonly')).toBe(true)
    })

    it('should return false when user has lower role than required', () => {
      expect(hasRole('admin', 'super_admin')).toBe(false)
      expect(hasRole('dealer_admin', 'admin')).toBe(false)
      expect(hasRole('dealer_user', 'dealer_admin')).toBe(false)
      expect(hasRole('readonly', 'dealer_user')).toBe(false)
    })

    it('should handle unknown roles as lowest level', () => {
      expect(hasRole('unknown_role', 'readonly')).toBe(false)
      expect(hasRole('dealer_user', 'unknown_role' as UserRole)).toBe(true)
    })
  })

  describe('isAdmin', () => {
    it('should return true for super_admin', () => {
      expect(isAdmin('super_admin')).toBe(true)
    })

    it('should return true for admin', () => {
      expect(isAdmin('admin')).toBe(true)
    })

    it('should return false for dealer_admin', () => {
      expect(isAdmin('dealer_admin')).toBe(false)
    })

    it('should return false for dealer_user', () => {
      expect(isAdmin('dealer_user')).toBe(false)
    })

    it('should return false for readonly', () => {
      expect(isAdmin('readonly')).toBe(false)
    })

    it('should return false for unknown role', () => {
      expect(isAdmin('unknown')).toBe(false)
    })
  })

  describe('canAccessDealer', () => {
    const dealerId = 'dealer-123'
    const otherDealerId = 'dealer-456'

    it('should allow super_admin to access any dealer', () => {
      expect(canAccessDealer('super_admin', null, dealerId)).toBe(true)
      expect(canAccessDealer('super_admin', 'some-dealer', otherDealerId)).toBe(true)
    })

    it('should allow admin to access any dealer', () => {
      expect(canAccessDealer('admin', null, dealerId)).toBe(true)
      expect(canAccessDealer('admin', 'some-dealer', otherDealerId)).toBe(true)
    })

    it('should allow dealer_admin to access own dealer', () => {
      expect(canAccessDealer('dealer_admin', dealerId, dealerId)).toBe(true)
    })

    it('should deny dealer_admin access to other dealers', () => {
      expect(canAccessDealer('dealer_admin', dealerId, otherDealerId)).toBe(false)
    })

    it('should allow dealer_user to access own dealer', () => {
      expect(canAccessDealer('dealer_user', dealerId, dealerId)).toBe(true)
    })

    it('should deny dealer_user access to other dealers', () => {
      expect(canAccessDealer('dealer_user', dealerId, otherDealerId)).toBe(false)
    })

    it('should deny access when user has no dealerId', () => {
      expect(canAccessDealer('dealer_admin', null, dealerId)).toBe(false)
      expect(canAccessDealer('dealer_user', null, dealerId)).toBe(false)
    })
  })
})
