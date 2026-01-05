import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/layout/SidebarLayout'

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
    <SidebarLayout user={user}>
      {children}
    </SidebarLayout>
  )
}
