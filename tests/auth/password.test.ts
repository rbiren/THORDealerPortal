import bcrypt from 'bcryptjs'

describe('Password Hashing', () => {
  const testPassword = 'SecurePassword123!'

  it('should hash password with bcrypt', async () => {
    const hash = await bcrypt.hash(testPassword, 12)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(testPassword)
    expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are ~60 chars
    expect(hash).toMatch(/^\$2[aby]?\$/) // bcrypt hash prefix
  })

  it('should verify correct password', async () => {
    const hash = await bcrypt.hash(testPassword, 12)
    const isValid = await bcrypt.compare(testPassword, hash)

    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const hash = await bcrypt.hash(testPassword, 12)
    const isValid = await bcrypt.compare('WrongPassword123!', hash)

    expect(isValid).toBe(false)
  })

  it('should produce unique hashes for same password', async () => {
    const hash1 = await bcrypt.hash(testPassword, 12)
    const hash2 = await bcrypt.hash(testPassword, 12)

    expect(hash1).not.toBe(hash2)
    // Both should still verify
    expect(await bcrypt.compare(testPassword, hash1)).toBe(true)
    expect(await bcrypt.compare(testPassword, hash2)).toBe(true)
  })

  it('should handle empty password', async () => {
    const hash = await bcrypt.hash('', 12)
    expect(await bcrypt.compare('', hash)).toBe(true)
    expect(await bcrypt.compare('not-empty', hash)).toBe(false)
  })

  it('should handle long passwords', async () => {
    const longPassword = 'a'.repeat(100)
    const hash = await bcrypt.hash(longPassword, 12)
    expect(await bcrypt.compare(longPassword, hash)).toBe(true)
  })

  it('should handle special characters', async () => {
    const specialPassword = 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?'
    const hash = await bcrypt.hash(specialPassword, 12)
    expect(await bcrypt.compare(specialPassword, hash)).toBe(true)
  })
})
