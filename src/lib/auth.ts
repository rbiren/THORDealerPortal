import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Adapter } from 'next-auth/adapters'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db'

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Cast adapter to handle extended User type with custom fields (role, dealerId)
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials format
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          include: { dealer: true },
        })

        if (!user || user.status !== 'active') {
          return null
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.passwordHash)
        if (!passwordValid) {
          return null
        }

        // Return user object for JWT
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          dealerId: user.dealerId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.dealerId = user.dealerId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.dealerId = token.dealerId as string | null
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard')
      const isOnAdmin = request.nextUrl.pathname.startsWith('/admin')
      const isOnApi = request.nextUrl.pathname.startsWith('/api')
      const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth')

      // Allow auth API routes
      if (isAuthApi) {
        return true
      }

      // Protect dashboard routes
      if (isOnDashboard || isOnAdmin) {
        if (!isLoggedIn) {
          return false
        }
        // Check admin routes
        if (isOnAdmin && !['super_admin', 'admin'].includes(auth.user.role)) {
          return Response.redirect(new URL('/dashboard', request.nextUrl))
        }
        return true
      }

      // Protect API routes (except auth)
      if (isOnApi && !isLoggedIn) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return true
    },
  },
})

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Helper to verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
