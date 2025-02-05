'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'

export default function SignUpSuccessPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const createAccount = async () => {
      const pendingSignUpString = localStorage.getItem('pendingSignUp')
      if (!pendingSignUpString) {
        setError('No pending sign-up found')
        setIsLoading(false)
        return
      }

      const { email, password, displayName } = JSON.parse(pendingSignUpString)

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        await updateProfile(user, { displayName })

        await setDoc(doc(db, 'Users', user.uid), {
          email: user.email,
          displayName: displayName,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          role: 'user',
          isActive: true,
          totalTokenUsage: 0,
          totalTimeUsage: 0,
          maxTimeLimit: 600, // 10 hours in minutes
          lastResetDate: serverTimestamp(),
          trackingStartDate: serverTimestamp(),
          tier: 'basic',
          callDurations: [],
          totalCallDuration: 0,
          // Trial and subscription fields
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          isTrialComplete: false,
          hasPaid: false,
          isOverdue: false
        })

        localStorage.removeItem('pendingSignUp')

        const token = await user.getIdToken()
        document.cookie = `session=${token}; path=/`
        router.push('/')
      } catch (error: any) {
        console.error('Account creation error:', error)
        setError(error.message || 'Failed to create account. Please contact support.')
        setIsLoading(false)
      }
    }

    createAccount()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-custom">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Creating Your Account</CardTitle>
            <CardDescription>Please wait while we set up your account...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-custom">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>There was a problem creating your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

