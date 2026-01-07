import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'THOR Dealer Portal',
  description: 'B2B dealer portal for inventory, orders, and analytics',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
