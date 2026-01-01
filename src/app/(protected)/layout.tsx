import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// Thor Industries Logo Component
function ThorLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`font-heading font-extrabold tracking-tight ${className}`}>
      <span className="text-off-white">THOR</span>
      <span className="text-burnt-orange ml-1">DEALER</span>
    </div>
  )
}

// Navigation Items
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
]

const adminItems = [
  { href: '/admin/dealers', label: 'Dealers', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { href: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-light-beige">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-sidebar bg-charcoal z-sidebar">
        {/* Logo */}
        <div className="h-header flex items-center px-6 border-b border-charcoal-800">
          <Link href="/dashboard">
            <ThorLogo className="text-xl" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2.5 text-sm font-medium text-medium-gray rounded-md hover:text-off-white hover:bg-charcoal-800 transition-colors"
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin Section */}
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-heading font-semibold text-medium-gray uppercase tracking-wider">
                Administration
              </h3>
              <div className="mt-2 space-y-1">
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-medium-gray rounded-md hover:text-off-white hover:bg-charcoal-800 transition-colors"
                  >
                    <NavIcon d={item.icon} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Menu */}
        <div className="border-t border-charcoal-800 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-olive flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-off-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-medium-gray truncate capitalize">
                {user.role?.replace('_', ' ')}
              </p>
            </div>
            <Link
              href="/profile"
              className="p-1.5 text-medium-gray hover:text-off-white rounded-md hover:bg-charcoal-800 transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-sidebar">
        {/* Header */}
        <header className="sticky top-0 z-header h-header bg-white border-b border-light-gray">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-medium-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="input pl-10 bg-light-beige border-0 focus:bg-white focus:ring-1"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-medium-gray hover:text-charcoal rounded-md hover:bg-light-beige transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Help */}
              <button className="p-2 text-medium-gray hover:text-charcoal rounded-md hover:bg-light-beige transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Sign Out */}
              <Link
                href="/api/auth/signout"
                className="btn-ghost text-sm"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
