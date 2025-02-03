import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  agentName: string;
  agentId: string;
  elevenlabsAgentId: string;
  elevenlabsConversationId: string;
  status: string;
  conversation_id: string;
  userId: string;
  anthropicAnalysis?: any;
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
  hideConversationIds?: boolean
  userId?: string
}

export function ConversationList({ onSelectConversation, hideConversationIds = false, userId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()

  useEffect(() => {
    const conversationsRef = collection(db, 'Conversations')
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(10)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedConversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime?.toDate(),
        duration: doc.data().duration,
        agentId: doc.data().agentId,
        elevenlabsAgentId: doc.data().elevenlabsAgentId,
        elevenlabsConversationId: doc.data().elevenlabsConversationId,
        conversation_id: doc.data().conversation_id,
        userId: doc.data().userId,
        anthropicAnalysis: doc.data().anthropicAnalysis || null
      } as Conversation))
      setConversations(fetchedConversations)
    }, (error) => {
      console.error("Error fetching conversations: ", error)
    })

    return () => unsubscribe()
  }, [userId])

  const handleViewAnalysis = (conversationId: string) => {
    router.push(`/analysis/${conversationId}?hideTranscript=true`)
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="font-medium">Start Time</TableHead>
            <TableHead className="font-medium">Call Duration</TableHead>
            <TableHead className="font-medium">Agent</TableHead>
            {!hideConversationIds && <TableHead className="font-medium">ElevenLabs Conversation ID</TableHead>}
            {!hideConversationIds && <TableHead className="font-medium">Conversation ID</TableHead>}
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conversation) => (
            <TableRow key={conversation.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{conversation.startTime.toLocaleString()}</TableCell>
              <TableCell>
                {conversation.duration
                  ? `${conversation.duration} sec`
                  : conversation.endTime
                    ? `${Math.round((conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000)} sec`
                    : 'N/A'}
              </TableCell>
              <TableCell>{conversation.agentName}</TableCell>
              {!hideConversationIds && (
                <TableCell>
                  {conversation.elevenlabsConversationId || 'Processing...'}
                </TableCell>
              )}
              {!hideConversationIds && (
                <TableCell>
                  {conversation.conversation_id || 'N/A'}
                </TableCell>
              )}
              <TableCell>{conversation.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button onClick={() => onSelectConversation(conversation.id)} variant="secondary" size="sm">
                    Quick View
                  </Button>
                  {conversation.anthropicAnalysis && (
                    <Button onClick={() => handleViewAnalysis(conversation.id)} variant="default" size="sm">
                      Full Analysis
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

