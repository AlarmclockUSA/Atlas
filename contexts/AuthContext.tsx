'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { ensureMaxTimeLimit } from '@/lib/firebaseUtils'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (window.location.pathname === '/create-password') {
        setLoading(false)
        return
      }

      if (user) {
        try {
          console.log('Attempting to fetch user data for UID:', user.uid)
          const userRef = doc(db, 'Users', user.uid)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log('Found user document:', userDoc.id)
            console.log('Firestore user data:', userData)

            // Check both isAdmin and role fields
            const isAdmin = userData?.isAdmin === true || userData?.role === 'Admin'
            setIsAdmin(isAdmin)

            // Check and update trial fields if missing
            if (!userData.trialEndDate || !userData.hasOwnProperty('isTrialComplete')) {
              // Calculate trial end date based on account creation
              const createdAt = userData.createdAt?.toDate() || new Date()
              const trialEndDate = new Date(createdAt)
              trialEndDate.setDate(trialEndDate.getDate() + 3) // 3 day trial from creation
              
              // Update the user document with trial fields
              await updateDoc(userRef, {
                trialEndDate: trialEndDate,
                isTrialComplete: false
              })
              
              console.log('Updated trial fields based on creation date:', {
                createdAt,
                trialEndDate,
                userId: user.uid
              })
            } else {
              // Check if trial has expired
              const trialEndDate = userData.trialEndDate.toDate()
              const now = new Date()
              const hasPaid = userData.hasPaid || false
              
              // Only update isTrialComplete if they haven't paid
              if (trialEndDate < now && !userData.isTrialComplete && !hasPaid) {
                // Trial has expired, update isTrialComplete
                await updateDoc(userRef, {
                  isTrialComplete: true
                })
                console.log('Trial expired, marked as complete for user:', user.uid)
              }
            }
          } else {
            console.log('No matching user document found for UserUID:', user.uid)
            setIsAdmin(false)

            // Create a new user document with default max time limit
            await ensureMaxTimeLimit(user.uid)
          }
          setUser(user)
        } catch (error) {
          console.error('Error processing user data:', error)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
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
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

