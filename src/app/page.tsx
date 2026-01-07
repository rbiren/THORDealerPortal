import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    // Redirect authenticated users to dashboard
    redirect('/dashboard')
  } else {
    // Redirect unauthenticated users to login
    redirect('/login')
  }
}
