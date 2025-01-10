import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            Our commitment to protecting your privacy
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-4">
          <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us. This may include your name, email address, and any other information you choose to provide.
          </p>
          <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
          <p className="mb-4">
            We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect our company and our users.
          </p>
          <h3 className="text-lg font-semibold mb-2">3. Sharing of Information</h3>
          <p className="mb-4">
            We do not share personal information with companies, organizations, or individuals outside of our company except in the following cases: with your consent, for legal reasons, or to protect rights, property, or safety.
          </p>
          <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
          <p className="mb-4">
            We work hard to protect our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
          </p>
          <h3 className="text-lg font-semibold mb-2">5. Changes to This Policy</h3>
          <p className="mb-4">
            Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

