import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, CreditCard, Bell, Key, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut, updateProfile, getIdToken, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { db } from '../lib/firebase'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { Progress } from "@/components/ui/progress"
import { setMaxTimeLimit } from '../lib/firebaseUtils';

// Add this style
const progressBarStyle = `
  .progress-bar {
    --progress-background: hsl(120, 100%, 50%);
  }
  .progress-bar > div {
    background-color: var(--progress-background) !important;
  }
`;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function MyAccount() {
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [usedTime, setUsedTime] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [remainingTime, setRemainingTime] = useState(0)
  const [totalCallDuration, setTotalCallDuration] = useState(0)
  const [trackingStartDate, setTrackingStartDate] = useState<Date>(new Date())
  const [maxTimeLimit, setMaxTimeLimit] = useState(600); // Default to 10 hours
  const [newMaxTimeLimit, setNewMaxTimeLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      const fetchUserData = async () => {
        const userDoc = await getDoc(doc(db, 'Users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setTotalTokens(userData.totalTokenUsage || 0)
          setTotalCallDuration(Number(userData.totalCallDuration) || 0)
          console.log('Total Call Duration:', Number(userData.totalCallDuration) || 0);

          // Check and reset tracking if necessary
          await checkAndResetTracking(user.uid);
          setMaxTimeLimit(userData.maxTimeLimit || 600);

          // Fetch updated user data after potential reset
          const updatedUserDoc = await getDoc(doc(db, 'Users', user.uid))
          const updatedUserData = updatedUserDoc.data()

          setUsedTime(updatedUserData.totalTimeUsage || 0)

          // Calculate remaining time based on max time limit
          const remaining = Math.max(updatedUserData.maxTimeLimit - (updatedUserData.totalTimeUsage || 0), 0)
          setRemainingTime(remaining)

          // Set tracking start date
          setTrackingStartDate(updatedUserData.trackingStartDate ? updatedUserData.trackingStartDate.toDate() : new Date())
        }
      }
      fetchUserData()
    }
  }, [user])


  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      setError('Failed to sign out')
      console.error(error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      await updateProfile(user, { displayName })
      setError(null)
    } catch (error) {
      setError('Failed to update profile')
      console.error(error)
    }
  }

  const handleUpdateMaxTimeLimit = async () => {
    if (!user) return;
    const newLimit = parseInt(newMaxTimeLimit);
    if (isNaN(newLimit) || newLimit <= 0) {
      setError('Please enter a valid number for the max time limit');
      return;
    }
    try {
      await setMaxTimeLimit(user.uid, newLimit);
      setMaxTimeLimit(newLimit);
      setNewMaxTimeLimit('');
      setError(null);
    } catch (error) {
      setError('Failed to update max time limit');
      console.error(error);
    }
  };

  const handleBillingPortal = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const idToken = await getIdToken(user);
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error accessing billing portal:', error);
      setError(error.message || 'Failed to access billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      setError('Failed to send password reset email: ' + error.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!user) {
    return <div>Please sign in to view your account.</div>
  }


  return (
    <>
      <style>{progressBarStyle}</style>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Manage your account details and preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {user?.displayName || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {remainingTime > 0 ? `${formatTime(remainingTime)} remaining in this 30-day period` : '30-day time limit reached'}
              </p>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>30-Day Usage</span>
                <span>{Math.round((usedTime / maxTimeLimit) * 100)}%</span>
              </div>
              <Progress 
                value={(usedTime / maxTimeLimit) * 100} 
                className="w-full" 
                style={{
                  '--progress-background': `hsl(${120 - (usedTime / maxTimeLimit) * 120}, 100%, 50%)`,
                } as React.CSSProperties}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Time Spent on Calls</span>
                <span className="font-medium">
                  {formatTime(totalCallDuration)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time Used This Month</span>
                <span className="font-medium">{formatTime(usedTime)} ({Math.round((usedTime / maxTimeLimit) * 100)}% of limit)</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Time Left This Month</span>
                <span className="text-primary">{formatTime(remainingTime)} ({Math.round((remainingTime / maxTimeLimit) * 100)}% of limit)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Cycle Started</span>
                <span className="font-medium">{trackingStartDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Cycle Ends</span>
                <span className="font-medium">
                  {new Date(trackingStartDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Max Time Limit</span>
                <span className="font-medium">{formatTime(maxTimeLimit)}</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Button
                onClick={() => window.open('https://billing.stripe.com/p/login/9AQeVr3nIeWHcQU4gg', '_blank')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                For security reasons, please login using your ATLAS account email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpdateProfile}>Update Profile</Button>
          <Button 
            variant="outline" 
            onClick={handleResetPassword}
            disabled={isResettingPassword}
          >
            <Key className="mr-2 h-4 w-4" />
            {isResettingPassword ? 'Sending...' : 'Reset Password'}
          </Button>
        </div>
      </div>

      <Button variant="destructive" className="w-full" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
    </>
  )
}

// Placeholder for the checkAndResetTracking function.  You'll need to implement this.
async function checkAndResetTracking(uid: string): Promise<void> {
  // Your logic to check and reset tracking here.  This will likely involve
  // interacting with Firestore to update the user's data.  Example below:

  const userDocRef = doc(db, 'Users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const currentDate = new Date();
    const lastResetDate = userDoc.data().lastResetDate?.toDate() || new Date(0);

    if (currentDate.getMonth() !== lastResetDate.getMonth() || currentDate.getFullYear() !== lastResetDate.getFullYear()) {
      await updateDoc(userDocRef, {
        totalTimeUsage: 0,
        lastResetDate: currentDate,
        trackingStartDate: currentDate
      });
    }
  }
}

