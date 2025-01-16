import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

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
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
  hideConversationIds?: boolean
  userId?: string
}

export function ConversationList({ onSelectConversation, hideConversationIds = false, userId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])

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
        userId: doc.data().userId
      } as Conversation))
      setConversations(fetchedConversations)
    }, (error) => {
      console.error("Error fetching conversations: ", error)
    })

    // Cleanup function
    return () => unsubscribe()
  }, [userId])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Start Time</TableHead>
          <TableHead>Call Duration</TableHead>
          <TableHead>Agent</TableHead>
          {!hideConversationIds && <TableHead>ElevenLabs Conversation ID</TableHead>}
          {!hideConversationIds && <TableHead>Conversation ID</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conversations.map((conversation) => (
          <TableRow key={conversation.id}>
            <TableCell>{conversation.startTime.toLocaleString()}</TableCell>
            <TableCell>
              {conversation.duration
                ? `${conversation.duration} min`
                : conversation.endTime
                  ? `${Math.round((conversation.endTime.getTime() - conversation.startTime.getTime()) / 1000 / 60)} min`
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
              <Button onClick={() => onSelectConversation(conversation.id)}>
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

