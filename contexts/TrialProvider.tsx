"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { checkTrialStatus } from '@/lib/firebaseUtils'
import { TrialExpiredModal } from '@/components/TrialExpiredModal'
import { OverdueModal } from '@/components/OverdueModal'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface TrialContextType {
  hasAccess: boolean
}

const TrialContext = createContext<TrialContextType | undefined>(undefined)

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState(true)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showOverdueModal, setShowOverdueModal] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(true) // Allow access to auth pages
        setShowTrialModal(false)
        setShowOverdueModal(false)
        return
      }

      const hasValidAccess = await checkTrialStatus(user.uid)
      setHasAccess(hasValidAccess)

      // Check which modal to show based on user status
      const userRef = doc(db, 'Users', user.uid)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.data()

      if (!hasValidAccess) {
        if (userData?.hasPaid && userData?.isOverdue) {
          setShowOverdueModal(true)
          setShowTrialModal(false)
        } else {
          setShowTrialModal(true)
          setShowOverdueModal(false)
        }
      } else {
        setShowTrialModal(false)
        setShowOverdueModal(false)
      }
    }

    checkAccess()
  }, [user])

  return (
    <TrialContext.Provider value={{ hasAccess }}>
      {children}
      <TrialExpiredModal isOpen={showTrialModal} />
      <OverdueModal isOpen={showOverdueModal} />
    </TrialContext.Provider>
  )
}

export function useTrial() {
  const context = useContext(TrialContext)
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider')
  }
  return context
} 