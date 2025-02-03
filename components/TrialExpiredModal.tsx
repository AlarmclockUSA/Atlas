import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

interface TrialExpiredModalProps {
  isOpen: boolean;
}

export function TrialExpiredModal({ isOpen }: TrialExpiredModalProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ready to Take Your Training Further?</DialogTitle>
          <DialogDescription>
            Great work with your trial! Unlock 10 hours of monthly conversations and continue mastering your skills with ATLAS.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Here's everything you'll get with your subscription:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 mb-6">
            <li>• 10 hours of AI conversations per month</li>
            <li>• Access to all training drills</li>
            <li>• Full scenario library</li>
            <li>• Advanced analytics and insights</li>
            <li>• Priority support</li>
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button 
            className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-medium w-full" 
            onClick={() => window.open('https://billing.stripe.com/p/login/9AQeVr3nIeWHcQU4gg', '_blank')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Continue to Payment
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <p className="text-muted-foreground text-sm text-center">
            Use your ATLAS login email on this portal
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 