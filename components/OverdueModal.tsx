import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

interface OverdueModalProps {
  isOpen: boolean;
}

export function OverdueModal({ isOpen }: OverdueModalProps) {
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
          <DialogTitle className="text-2xl font-semibold">Ughh, This Is a Little Awkward...</DialogTitle>
          <DialogDescription className="text-base mt-2">
            We noticed there's a hiccup with your payment. Let's get you back to training!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <p className="text-base text-muted-foreground mb-4">
            Your subscription is taking a brief pause due to a payment issue. Here's how we can fix this together:
          </p>
          <ul className="text-base text-muted-foreground space-y-3 mb-6">
            <li>• Quick payment method update</li>
            <li>• Clear up any pending charges</li>
            <li>• Get right back to your training</li>
          </ul>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button 
            className="bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-black font-medium w-full text-base py-6" 
            onClick={() => window.open('https://billing.stripe.com/p/login/9AQeVr3nIeWHcQU4gg', '_blank')}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Update Payment Method
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-base py-6" 
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
          <p className="text-base text-muted-foreground text-center">
            Just use your ATLAS login email and we'll get you sorted
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
