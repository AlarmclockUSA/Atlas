'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { Eye, EyeOff } from 'lucide-react'

async function setupUserFirestore(uid: string, email: string, displayName: string) {
  const userRef = doc(db, 'Users', uid)
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 3) // 3 day trial

  await setDoc(userRef, {
    email: email,
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
    totalCallDuration: 0
  })
}

export default function CreatePasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Check if email exists in PendingUsers
      console.log('Checking for email:', email);
      const pendingUserRef = doc(db, 'PendingUsers', email)
      const pendingUserSnap = await getDoc(pendingUserRef)

      if (!pendingUserSnap.exists()) {
        console.log('No matching document found in PendingUsers');
        throw new Error('Email not found in pending users. Please check your email or contact support.')
      }

      console.log('Matching document found:', pendingUserSnap.data());

      const pendingUserData = pendingUserSnap.data();
      const displayName = pendingUserData.displayName || email.split('@')[0];


      // Create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await updateProfile(user, { displayName: displayName })

      // Set up user's Firestore document
      await setupUserFirestore(user.uid, email, displayName)

      // Delete from PendingUsers
      await deleteDoc(pendingUserRef)

      setSuccessMessage('Account created successfully. Please log in.')

      router.push('/signin')
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please try signing in.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.')
      } else if (error.code === 'permission-denied') {
        setError('Permission denied. Please ensure you have access to create an account.')
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred. Please try again or contact support.')
      }
      console.error('Error creating account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-custom">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create Your Password</CardTitle>
          <CardDescription>Set up your password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Password'}
            </Button>
          </form>
          {successMessage && (
            <Alert variant="success" className="mt-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

