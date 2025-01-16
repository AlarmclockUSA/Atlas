import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnalysisDisplay } from './AnalysisDisplay'
import { Badge } from "@/components/ui/badge"

type ConversationDetails = {
  startTime: { toDate: () => Date };
  endTime?: { toDate: () => Date };
  agentName: string;
  agentId: string;
  status: string;
  transcript?: string;
  analysis?: any;
  supportConversationId?: string;
}

interface ConversationModalProps {
  conversationId: string | null
  isOpen: boolean
  onClose: () => void
}

export function ConversationModal({ conversationId, isOpen, onClose }: ConversationModalProps) {
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null)

  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!conversationId) return

      const conversationRef = doc(db, 'Conversations', conversationId)
      const conversationSnap = await getDoc(conversationRef)

      if (conversationSnap.exists()) {
        setConversationDetails(conversationSnap.data() as ConversationDetails);
      } else {
        console.log('No such conversation!')
      }
    }

    if (isOpen && conversationId) {
      fetchConversationDetails()
    }
  }, [conversationId, isOpen])

  if (!conversationDetails) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Conversation Details</DialogTitle>
          <DialogDescription>
            Support Conversation ID: {conversationDetails.supportConversationId || 'Not available'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-4 h-[calc(80vh-120px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Call Outcome</h3>
              <Badge variant={conversationDetails.analysis?.call_successful === "success" ? "success" : "destructive"}>
                {conversationDetails.analysis?.call_successful === "success" ? "Successful" : "Failed"}
              </Badge>
            </div>

            {conversationDetails.analysis?.transcript_summary && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Transcript Summary</h3>
                <p className="text-sm text-muted-foreground">{conversationDetails.analysis.transcript_summary}</p>
              </div>
            )}

            {conversationDetails.transcript && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Full Transcript</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p className="whitespace-pre-wrap text-sm">{conversationDetails.transcript}</p>
                </div>
              </div>
            )}

            {conversationDetails.analysis && (
              <div>
                <AnalysisDisplay analysis={conversationDetails.analysis} />
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Conversation Metadata</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Start Time</h4>
                  <p className="text-base">{conversationDetails.startTime.toDate().toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">End Time</h4>
                  <p className="text-base">{conversationDetails.endTime?.toDate().toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                  <p className="text-base">
                    {conversationDetails.endTime
                      ? `${Math.round((conversationDetails.endTime.toDate().getTime() - conversationDetails.startTime.toDate().getTime()) / 1000 / 60)} minutes`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Agent</h4>
                  <p className="text-base">{conversationDetails.agentName}</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

