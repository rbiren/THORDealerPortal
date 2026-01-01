import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'THOR Dealer Portal',
  description: 'B2B dealer portal for inventory, orders, and analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
