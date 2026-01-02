import { auth } from '@/lib/auth'

export default auth

export const config = {
  // Match all routes except static files and public assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
