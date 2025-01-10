import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon, PhoneIcon, ClockIcon, CheckCircleIcon, XCircleIcon, LinkIcon, CalendarIcon, UserIcon } from 'lucide-react'
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ConversationList } from './ConversationList'
import { ConversationModal } from './ConversationModal'
import { useAuth } from '@/contexts/AuthContext'

export function StatsInfo() {
  const { user } = useAuth()
  const [kpiData, setKpiData] = useState([
    { title: 'Total Calls', value: 0, change: 0, icon: PhoneIcon, link: true },
    { title: 'Calls This Month', value: 0, change: 0, icon: CalendarIcon },
    { title: 'Successful Calls', value: 0, change: 0, icon: CheckCircleIcon, description: 'Calls meeting success criteria' },
    { title: 'Failed Calls', value: 0, change: 0, icon: XCircleIcon },
    { title: 'Avg. Call Duration', value: '0m 0s', change: 0, icon: ClockIcon },
    { title: 'Success Rate', value: '0%', change: 0, icon: CheckCircleIcon },
    { title: 'Sellers Closed', value: 0, change: 0, icon: UserIcon },
    { title: 'Follow up calls booked', value: 0, change: 0, icon: CalendarIcon },
  ])

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const conversationsRef = collection(db, 'Conversations');
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const conversationsSnapshot = await getDocs(query(
        conversationsRef,
        where('userId', '==', user.uid),
        orderBy('startTime', 'desc')
      ));

      const conversations = conversationsSnapshot.docs.map(doc => doc.data());
      const totalCalls = conversations.length;

      let totalDuration = 0;
      let successfulCalls = 0;
      let failedCalls = 0;
      let callsThisMonth = 0;
      let sellersClosed = 0;
      let followUpCallsBooked = 0;

      conversations.forEach(conv => {
        if (conv.duration) {
          totalDuration += conv.duration;
        }
        if (conv.analysis?.call_successful === "success") {
          successfulCalls++;
        } else {
          failedCalls++;
        }
        if (conv.startTime.toDate() >= firstDayOfMonth && conv.startTime.toDate() <= lastDayOfMonth) {
          callsThisMonth++;
        }
        if (conv.status === 'completed' && conv.outcome === 'closed') {
          sellersClosed++;
        }
        if (conv.status === 'completed' && conv.followUpBooked) {
          followUpCallsBooked++;
        }
      });

      const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      const avgMinutes = Math.floor(avgDuration / 60);
      const avgSeconds = Math.floor(avgDuration % 60);

      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      setKpiData([
        { title: 'Total Calls', value: totalCalls, change: 0, icon: PhoneIcon, link: true },
        { title: 'Calls This Month', value: callsThisMonth, change: 0, icon: CalendarIcon },
        { title: 'Successful Calls', value: successfulCalls, change: 0, icon: CheckCircleIcon, description: 'Calls meeting success criteria' },
        { title: 'Failed Calls', value: failedCalls, change: 0, icon: XCircleIcon },
        { title: 'Avg. Call Duration', value: `${avgMinutes}m ${avgSeconds}s`, change: 0, icon: ClockIcon },
        { title: 'Success Rate', value: `${successRate.toFixed(1)}%`, change: 0, icon: CheckCircleIcon },
        { title: 'Sellers Closed', value: sellersClosed, change: 0, icon: UserIcon },
        { title: 'Follow up calls booked', value: followUpCallsBooked, change: 0, icon: CalendarIcon },
      ]);
    };

    fetchData();
  }, [user])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                {item.description && (
                  <CardDescription className="text-xs mt-1">
                    {item.description}
                  </CardDescription>
                )}
              </div>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {item.value}
                {item.link && (
                  <LinkIcon className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.change > 0 ? (
                  <span className="text-green-500 flex items-center">
                    <ArrowUpIcon className="mr-1 h-4 w-4" />
                    {item.change}%
                  </span>
                ) : item.change < 0 ? (
                  <span className="text-red-500 flex items-center">
                    <ArrowDownIcon className="mr-1 h-4 w-4" />
                    {Math.abs(item.change)}%
                  </span>
                ) : (
                  <span>No change</span>
                )}
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>List of the 10 most recent conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <ConversationList 
            onSelectConversation={handleSelectConversation}
            hideConversationIds={true}
            userId={user?.uid} // Add this prop to filter conversations
          />
        </CardContent>
      </Card>

      <ConversationModal
        conversationId={selectedConversationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

