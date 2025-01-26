'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from '@/components/admin/UserManagement'
import { SellerManagement } from '@/components/admin/SellerManagement'
import { ScenarioManagement } from '@/components/admin/ScenarioManagement'
import { Button } from './ui/button'
import { LogOut, ArrowLeft } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export function AdminPanel() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    return <div>Please sign in to access the admin panel.</div>
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      // Remove the session cookie
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      // Clear any client-side storage
      localStorage.clear()
      sessionStorage.clear()
      // Redirect to signin page
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push('/')} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold">Admin Panel</h1>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
      <Tabs defaultValue="users">
        <TabsList className="w-full">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="sellers">
          <SellerManagement />
        </TabsContent>
        <TabsContent value="scenarios">
          <ScenarioManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

