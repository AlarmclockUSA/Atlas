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
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

async function setupUserFirestore(uid: string, email: string, displayName: string) {
  const userRef = doc(db, 'Users', uid)
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
  const router = useRouter()

  // Password validation
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isPasswordValid = hasMinLength && hasNumber && hasSpecialChar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Check if email exists in PendingUsers
      const pendingUserRef = doc(db, 'PendingUsers', email)
      const pendingUserSnap = await getDoc(pendingUserRef)

      if (!pendingUserSnap.exists()) {
        throw new Error('Your invitation is still being processed. Please try again in a few moments, or contact admin@atlastraining.io if the issue persists.')
      }

      const pendingUserData = pendingUserSnap.data()
      const displayName = pendingUserData.displayName || email.split('@')[0]

      // Create new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await updateProfile(user, { displayName: displayName })

      // Set up user's Firestore document
      await setupUserFirestore(user.uid, email, displayName)

      // Delete from PendingUsers
      await deleteDoc(pendingUserRef)

      router.push('/signin')
    } catch (error: any) {
      console.error('Full error object:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please try signing in.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 8 characters long.')
      } else if (error.code === 'permission-denied') {
        setError('Permission denied. Please ensure you have access to create an account.')
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred. Please try again or contact support.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-custom p-4">
      <Card className="w-[450px] max-w-full">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Complete Your Account Setup</CardTitle>
          <CardDescription className="space-y-2">
            <p className="text-base">Welcome to ATLAS! Follow these steps to activate your account:</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
                <span>Enter the email address from your invitation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
                <span>Create a secure password that meets the requirements</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
                <span>Click 'Create Account' to begin your training journey</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter the email from your invitation"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
              <p className="text-sm text-muted-foreground">
                This should match the email address where you received your invitation
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background"
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
              <div className="space-y-2 mt-2 text-sm">
                <p className="text-muted-foreground">Password requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${hasMinLength ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className={hasMinLength ? 'text-green-500' : 'text-muted-foreground'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${hasNumber ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className={hasNumber ? 'text-green-500' : 'text-muted-foreground'}>
                      Include at least one number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className={hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}>
                      Include at least one special character
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading || !isPasswordValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Already have an account? <Link href="/signin" className="text-primary hover:underline">Sign in instead</Link></p>
            <p className="mt-2">Need help? <a href="mailto:admin@atlastraining.io" className="text-primary hover:underline">Contact support</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

