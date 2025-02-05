"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { TrialExpiredModal } from '@/components/TrialExpiredModal'
import { OverdueModal } from '@/components/OverdueModal'

interface TrialContextType {
  hasAccess: boolean
}

const TrialContext = createContext<TrialContextType | undefined>(undefined)

export function TrialProvider({ children }: { children: React.ReactNode }) {
  const { user, hasValidAccess, accessBlockedReason } = useAuth()
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [showOverdueModal, setShowOverdueModal] = useState(false)

  useEffect(() => {
    if (!user) {
      setShowTrialModal(false)
      setShowOverdueModal(false)
      return
    }

    // Show appropriate modal based on access blocked reason
    if (accessBlockedReason === 'payment_failed') {
      console.log('Showing overdue modal due to payment failure')
      setShowOverdueModal(true)
      setShowTrialModal(false)
    } else if (accessBlockedReason === 'trial_ended') {
      console.log('Showing trial modal due to trial end')
      setShowTrialModal(true)
      setShowOverdueModal(false)
    } else {
      setShowTrialModal(false)
      setShowOverdueModal(false)
    }
  }, [user, accessBlockedReason])

  return (
    <TrialContext.Provider value={{ hasAccess: hasValidAccess }}>
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