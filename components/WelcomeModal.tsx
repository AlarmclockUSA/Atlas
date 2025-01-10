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

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to AI Character Interactions</DialogTitle>
          <DialogDescription>
            Please read this important information before proceeding.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto py-4">
          <p className="mb-4">
            These aren't just simple scripts or basic chatbots - they're carefully crafted personalities with rich backstories, emotional depth, and complex life situations that influence how they interact with potential buyers.
          </p>
          <h3 className="text-lg font-semibold mb-2">Natural Trust Building</h3>
          <p className="mb-4">
            Just like real people, these characters don't immediately share everything. They have:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Private concerns they only discuss once comfortable</li>
            <li>Emotional triggers that can end conversations</li>
            <li>Personal boundaries they maintain</li>
            <li>Topics they're proud to share early (Jim loves talking about his workshop)</li>
          </ul>
          <h3 className="text-lg font-semibold mb-2">Practical Tips for Interaction</h3>
          <p className="mb-2">Remember:</p>
          <ul className="list-disc list-inside mb-4">
            <li>Their trust is earned through respectful, understanding interaction</li>
            <li>They have real concerns that need addressing</li>
            <li>Each has unique triggers that can either build rapport or create distance</li>
            <li>They're dealing with significant life changes that affect their decision-making</li>
          </ul>
          <p>
            While these are AI characters, they represent real human situations. Their stories - from Linda's struggle to maintain stability for her kids to Jim's battle with health issues while living alone - reflect genuine challenges that many people face when selling their homes.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>I understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

