'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  hasValidAccess: boolean
  accessBlockedReason: 'payment_failed' | 'trial_ended' | null
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAdmin: false,
  hasValidAccess: true,
  accessBlockedReason: null
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasValidAccess, setHasValidAccess] = useState(true)
  const [accessBlockedReason, setAccessBlockedReason] = useState<'payment_failed' | 'trial_ended' | null>(null)
  const router = useRouter()

  const checkAccessStatus = async (user: User) => {
    try {
      if (!user?.email) {
        console.log('No user email available')
        return { hasAccess: false, blockReason: null }
      }

      console.log('Checking access status for:', user.email)
      
      // Ensure we have a valid Firebase instance
      if (!db) {
        console.error('Firebase not initialized')
        return { hasAccess: false, blockReason: null }
      }

      // Check PaymentFailed collection
      const paymentFailedRef = collection(db, 'PaymentFailed')
      const paymentFailedQuery = query(paymentFailedRef, where('email', '==', user.email.toLowerCase()))
      const paymentFailedDocs = await getDocs(paymentFailedQuery)
      
      if (!paymentFailedDocs.empty) {
        return { hasAccess: false, blockReason: 'payment_failed' }
      }

      // Check TrialEnded collection
      const trialEndedRef = collection(db, 'TrialEnded')
      const trialEndedQuery = query(trialEndedRef, where('email', '==', user.email.toLowerCase()))
      const trialEndedDocs = await getDocs(trialEndedQuery)
      
      if (!trialEndedDocs.empty) {
        return { hasAccess: false, blockReason: 'trial_ended' }
      }

      // If we get here, the user has access
      return { hasAccess: true, blockReason: null }
    } catch (error) {
      console.error('Error checking access status:', error)
      return { hasAccess: false, blockReason: null }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (window.location.pathname === '/create-password') {
        setLoading(false)
        return
      }

      if (user) {
        // First set the user
        setUser(user)
        
        try {
          // Wait for the ID token to be available
          const idToken = await user.getIdToken(true)
          console.log('Got valid ID token, proceeding with access checks')
          
          // Get user document for admin status
          const userRef = doc(db, 'Users', user.uid)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const isAdmin = userData?.isAdmin === true || userData?.role === 'Admin'
            setIsAdmin(isAdmin)
          }

          // Then check access status
          const { hasAccess, blockReason } = await checkAccessStatus(user)
          console.log('Setting final access state:', { hasAccess, blockReason })
          
          setHasValidAccess(hasAccess)
          setAccessBlockedReason(blockReason)
          
        } catch (error) {
          console.error('Error in auth state change:', error)
          setHasValidAccess(false)
          setAccessBlockedReason(null)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        setHasValidAccess(true)
        setAccessBlockedReason(null)
        router.push('/signin')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      hasValidAccess,
      accessBlockedReason
    }}>
      {children}
    </AuthContext.Provider>
  )
}

