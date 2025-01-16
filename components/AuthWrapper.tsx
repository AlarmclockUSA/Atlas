'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LoadingScreen } from '@/components/LoadingScreen'
import { usePathname } from 'next/navigation'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return <LoadingScreen />
  }

  if (pathname === '/signin') {
    return <>{children}</>
  }

  if (!user) {
    return null // This will be handled by the middleware redirect
  }

  return <>{children}</>
}

