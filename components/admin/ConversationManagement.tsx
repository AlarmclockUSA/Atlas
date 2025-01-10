'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Conversation {
 id: string
 userId: string
 agentId: string
 startTime: any
 endTime: any
 status: string
}

export function ConversationManagement() {
 const [conversations, setConversations] = useState<Conversation[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 useEffect(() => {
   fetchConversations()
 }, [])

 const fetchConversations = async () => {
  setLoading(true)
  setError(null)
  try {
    const conversationsCollection = collection(db, 'Conversations')
    const conversationSnapshot = await getDocs(conversationsCollection)
    const conversationList = conversationSnapshot.docs
      .filter(doc => doc.data().userId) // Filter out documents without a userId
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Conversation))
    setConversations(conversationList)
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    if (error.code === 'permission-denied') {
      setError('You do not have permission to access conversations.')
    } else {
      setError('Failed to fetch conversations. Please try again.')
    }
  }
  setLoading(false)
}

 const deleteConversation = async (conversationId: string) => {
   setError(null)
   if (window.confirm('Are you sure you want to delete this conversation?')) {
     try {
       await deleteDoc(doc(db, 'Conversations', conversationId))
       fetchConversations()
     } catch (error) {
       console.error('Error deleting conversation:', error)
       setError('Failed to delete conversation. Please try again.')
     }
   }
 }

 if (loading) {
   return <div>Loading conversations...</div>
 }

 return (
   <div className="space-y-4">
     <h2 className="text-2xl font-bold">Conversation Management</h2>
     {error && (
       <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Error</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
       </Alert>
     )}
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead>User ID</TableHead>
           <TableHead>Agent ID</TableHead>
           <TableHead>Start Time</TableHead>
           <TableHead>End Time</TableHead>
           <TableHead>Status</TableHead>
           <TableHead>Actions</TableHead>
         </TableRow>
       </TableHeader>
       <TableBody>
         {conversations.map((conversation) => (
           <TableRow key={conversation.id}>
             <TableCell>{conversation.userId}</TableCell>
             <TableCell>{conversation.agentId}</TableCell>
             <TableCell>{conversation.startTime?.toDate().toLocaleString()}</TableCell>
             <TableCell>{conversation.endTime?.toDate().toLocaleString()}</TableCell>
             <TableCell>{conversation.status}</TableCell>
             <TableCell>
               <Button onClick={() => deleteConversation(conversation.id)} variant="destructive">Delete</Button>
             </TableCell>
           </TableRow>
         ))}
       </TableBody>
     </Table>
   </div>
 )
}

