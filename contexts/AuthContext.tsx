'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/LoadingScreen'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
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
        setLoading(false);
        return;
      }
      if (user) {
        try {
          console.log('Attempting to fetch user data for UID:', user.uid)
          
          // Query the Users collection where UserUID matches the Firebase Auth UID
          const usersRef = collection(db, 'Users')
          const q = query(usersRef, where('UserUID', '==', user.uid))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            console.log('Found user document:', userDoc.id)
            console.log('Firestore user data:', userData)

            // Check both isAdmin and role fields
            const isAdmin = userData?.isAdmin === true || userData?.role === 'Admin'

            console.log('Admin status:', {
              isAdmin,
              role: userData?.role,
              finalStatus: isAdmin
            })

            setIsAdmin(isAdmin)

            // Ensure max time limit is set
            await ensureMaxTimeLimit(user.uid)
          } else {
            console.log('No matching user document found for UserUID:', user.uid)
            setIsAdmin(false)

            // Create a new user document with default max time limit
            await ensureMaxTimeLimit(user.uid)
          }
          setUser({...user, isAdmin}) // Updated setUser call
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(user)
          setIsAdmin(false)
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

