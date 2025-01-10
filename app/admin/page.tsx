'use client'

import { AdminPanel } from '@/components/AdminPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
 const { user, isAdmin } = useAuth()
 const router = useRouter()

 useEffect(() => {
   if (user && !isAdmin) {
     router.push('/')
   }
 }, [user, isAdmin, router])

 if (!user || !isAdmin) {
   return null
 }

 return <AdminPanel />
}

