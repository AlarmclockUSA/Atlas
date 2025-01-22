'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Conversation } from '@11labs/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Mic, Phone, Info, ChevronDown, ChevronUp, Users, BarChart, User, LogOut, Loader, Clock, Grid, List } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsInfo } from '@/components/StatsInfo'
import { MyAccount } from '@/components/MyAccount'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { createConversation, endConversation, updateConversationTokenUsage, updateUserTokenUsage, updateConversationDuration, updateUserTotalCallDuration, checkAndResetTracking } from '@/lib/firebaseUtils'
import { collection, getDocs, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { getMostRecentConversationId, fetchElevenLabsAnalysis } from '@/lib/elevenlabsApi'
import { AnalysisModal } from './AnalysisModal'
import { AnimatedWaveform } from '@/components/AnimatedWaveform'

async function getElevenLabsConversationId(agentId: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.us.elevenlabs.io/v1/convai/conversations', {
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch conversations');
    
    const data = await response.json();
    const conversation = data.conversations.find(
      (conv: any) => conv.agent_id === agentId && conv.status === 'processing'
    );
    
    return conversation?.conversation_id || null;
  } catch (error) {
    console.error('Error fetching ElevenLabs conversation:', error);
    return null;
  }
}

// Removed: console.log('ELEVENLABS_API_KEY:', process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'Set' : 'Not set');
// Removed: console.log('ELEVENLABS_AGENT_ID:', process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);

interface ConversationalAIProps {
  initialConversationId?: string;
}

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'default_agent_id'
const INITIAL_DELAY = 2000

interface Agent {
  id: string;
  name: string;
  description: string;
  propertyInfo: {
    address: string;
    details: string[];
  };
  avatar: string;
  elevenLabsId: string; 
  imageUrl: string; // Added imageUrl property
  profilePictureUrl?: string; // Added profilePictureUrl property
  isPlaceholder?: boolean;
  comps?: Array<{
    address: string;
    soldDate: string;
    price: string;
    condition: string;
  }>;
}

const TOKEN_LIMIT = 30000
const TOKENS_PER_SECOND = 16


const ConversationalAI: React.FC<ConversationalAIProps> = ({ initialConversationId }) => {
  const { user, isAdmin } = useAuth(); // Updated destructuring
  console.log('ConversationalAI component - Admin status:', { isAdmin, userId: user?.uid })
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [agentStatus, setAgentStatus] = useState('listening')
  const [error, setError] = useState<string | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string>('details')
  const router = useRouter()
  const [firebaseAgents, setFirebaseAgents] = useState<Agent[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [isTokenLimitReached, setIsTokenLimitReached] = useState(false)
  const [isTokenLimitModalOpen, setIsTokenLimitModalOpen] = useState(false)
  const [elevenLabsConversationId, setElevenLabsConversationId] = useState<string | null>(null); 
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid') // Added viewMode state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const updateTimeUsage = async (userId: string, duration: number) => {
    const userRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    if (!userData) return;

    const currentDate = new Date();
    const lastResetDate = userData.lastResetDate ? userData.lastResetDate.toDate() : new Date(0);
    
    if (currentDate.getMonth() !== lastResetDate.getMonth() || currentDate.getFullYear() !== lastResetDate.getFullYear()) {
      await updateDoc(userRef, {
        totalTimeUsage: Math.ceil(duration / 60),
        lastResetDate: currentDate
      });
    } else {
      const newUsedTime = (userData.totalTimeUsage || 0) + Math.ceil(duration / 60);
      await updateDoc(userRef, {
        totalTimeUsage: newUsedTime
      });
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (conversation) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [conversation])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsCollection = collection(db, 'Sellers')
        const agentSnapshot = await getDocs(agentsCollection)
        const agentList = agentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          imageUrl: doc.data().imageUrl || "/placeholder.svg" // Updated to set imageUrl
        } as Agent))
        setFirebaseAgents(agentList)
        
      } catch (error) {
        console.error('Error fetching agents:', error)
        setError('Failed to fetch agents. Please try again.')
      }
    }

    fetchAgents()
  }, [])

  useEffect(() => {
    const fetchUserTokenUsage = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'Users', user.uid))
        if (userDoc.exists()) {
          setTotalTokens(userDoc.data().totalTokenUsage || 0)
        }
      }
    }
    fetchUserTokenUsage()
  }, [user])

  useEffect(() => {
    if (totalTokens >= TOKEN_LIMIT) {
      setIsTokenLimitReached(true)
      setIsTokenLimitModalOpen(true)
    }
  }, [totalTokens])

  useEffect(() => {
    return () => {
      if (conversation) {
        conversation.endSession().catch(console.error)
      }
    }
  }, [conversation])

  useEffect(() => {
    if (user) {
      checkAndResetTracking(user.uid).catch(console.error)
    }
  }, [user])

  const checkMonthlyUsage = async (userId: string): Promise<boolean> => {
    const userRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const totalTimeUsage = userData.totalTimeUsage || 0;
      const maxTimeLimit = userData.maxTimeLimit || 600; // Default to 10 hours if not set
      return totalTimeUsage < maxTimeLimit;
    }
    return true; // If user document doesn't exist, allow the call
  };

  async function startConversation() {
    if (!activeAgent || !user) {
      setError('No active agent or user selected')
      return
    }
    
    setError(null)

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'Set') {
      setError('Invalid ElevenLabs API key')
      return
    }

    if (activeAgent.isPlaceholder) {
      setError('This agent is not available yet')
      return
    }

    // Check if user has exceeded monthly limit
    const isWithinLimit = await checkMonthlyUsage(user.uid);
    if (!isWithinLimit) {
      setError('You have reached your 10-hour time limit for the current 30-day period. Please try again later or contact support to increase your limit.')
      return
    }

    // Rest of the startConversation function remains the same
    let newConversationId: string | null = null

    try {
      newConversationId = await createConversation({
        userId: user.uid,
        userEmail: user.email || '',
        agentId: activeAgent.id, 
        agentName: activeAgent.name,
        propertyAddress: activeAgent.propertyInfo.address,
        elevenlabsAgentId: activeAgent.elevenLabsId 
      })

      const newConversation = await Conversation.startSession({
        agentId: activeAgent.elevenLabsId, 
        apiKey: ELEVENLABS_API_KEY,
        onConnect: () => {
          setConnectionStatus('Connected')
        },
        onDisconnect: () => {
          setConnectionStatus('Disconnected')
          setConversation(null)
        },
        onError: (error) => {
          console.error('ElevenLabs API Error Details:', {
            error,
            connectionStatus,
            websocketState: conversation?.getWebSocketState?.() || 'unknown'
          });
          if (newConversationId) {
            endConversation(newConversationId).catch(console.error);
          }
          setError(`Connection error: ${error.message || JSON.stringify(error)}`);
        },
        onModeChange: (mode) => {
          setAgentStatus(mode.mode === 'speaking' ? 'speaking' : 'listening')
        },
        onTokenUsage: async (tokenUsage) => {
          if (newConversationId) {
            await updateConversationTokenUsage(newConversationId, tokenUsage)
            await updateUserTokenUsage(user.uid, tokenUsage)
            setTotalTokens(prevTokens => {
              const newTotal = prevTokens + tokenUsage
              if (newTotal >= TOKEN_LIMIT) {
                setIsTokenLimitReached(true)
                setIsTokenLimitModalOpen(true)
              }
              return newTotal
            })
          }
        },
        onConversationStart: (conversationId) => {
          setElevenLabsConversationId(conversationId);
          if (newConversationId) {
            const conversationRef = doc(db, 'Conversations', newConversationId);
            updateDoc(conversationRef, { elevenlabsConversationId: conversationId });
          }
        },
      })

      if (!newConversation) {
        throw new Error('Failed to create conversation session')
      }

      setConversation(newConversation)
      setConversationId(newConversationId)
      setCallDuration(0); // Reset call duration when starting a new conversation
      const elevenLabsId = await getElevenLabsConversationId(activeAgent.elevenLabsId);
      if (elevenLabsId) {
        setElevenLabsConversationId(elevenLabsId);
      }

    } catch (error) {
      console.error('Failed to start conversation') 
      let errorMessage = 'Failed to start conversation'
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      } else if (typeof error === 'object' && error !== null) {
        errorMessage += `: ${JSON.stringify(error)}`
      }
      setError(errorMessage)
      if (newConversationId) {
        endConversation(newConversationId).catch(console.error)
      }
    }
  }

  async function stopConversation() {
    if (conversation && conversationId && activeAgent && user) {
      try {
        setIsEnding(true);
        await conversation.endSession();
        await endConversation(conversationId);
        await updateConversationDuration(conversationId, callDuration);
        await updateUserTotalCallDuration(user.uid, callDuration); 
        await updateTimeUsage(user.uid, callDuration);
        setConversation(null);
        setElevenLabsConversationId(null);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const recentConversationId = await getMostRecentConversationId(activeAgent.elevenLabsId);
        
        if (recentConversationId) {
          setIsAnalysisLoading(true);
          setIsAnalysisModalOpen(true);
          try {
            const analysis = await fetchElevenLabsAnalysis(recentConversationId);
            if (!analysis) {
              throw new Error('Analysis data is null or undefined');
            }
            setAnalysisData(analysis);

            const conversationRef = doc(db, 'Conversations', conversationId);
            await updateDoc(conversationRef, { 
              analysis,
              elevenlabsConversationId: recentConversationId
            });
          } catch (analysisError) {
            console.error('Error fetching or processing analysis:', analysisError);
            setError(`Failed to fetch conversation analysis: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`);
          } finally {
            setIsAnalysisLoading(false);
          }
        } else {
          throw new Error('Failed to fetch conversation details: No recent conversation ID found');
        }
      } catch (error) {
        console.error('Error ending conversation:', error);
        setError(`Error ending conversation: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      } finally {
        setIsEnding(false);
        setCallDuration(0); // Reset call duration
      }
    }
  }

  const toggleAgentCompletion = (agentId: string) => {
    setCompletedAgents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(agentId)) {
        newSet.delete(agentId)
      } else {
        newSet.add(agentId)
      }
      return newSet
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      localStorage.clear()
      sessionStorage.clear()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const navigateToAdminPanel = () => {
    router.push('/admin')
  }


  if (isEnding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader className="h-8 w-8 animate-spin text-primary" style={{ animationDuration: '3s' }} />
            <p className="text-lg font-medium">Analysing call...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-custom overflow-x-hidden">
      <div className="w-full px-4 py-6 md:px-8 relative z-10">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">
            ATLAS
          </h1>
          
          {/* Mobile Hamburger */}
          <div className="relative md:hidden">
            <button 
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-background rounded-lg shadow-lg">
                {isAdmin && (
                  <button
                    onClick={navigateToAdminPanel}
                    className="w-full px-4 py-2 text-sm hover:bg-accent flex items-center"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm hover:bg-accent flex items-center"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:flex-wrap items-center gap-4">
            {isAdmin && (
              <Button onClick={navigateToAdminPanel} variant="outline" size="sm">
                Admin Panel
              </Button>
            )}
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="flex justify-between w-full p-1 bg-secondary/20 rounded-lg mb-6">
            <TabsTrigger 
              value="agents" 
              className="flex-1 text-sm sm:text-base flex items-center justify-center h-10 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold"
            >
              <Users className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex-1 text-sm sm:text-base flex items-center justify-center h-10 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold"
            >
              <BarChart className="w-4 h-4 mr-2" />
              Stats & Info
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="flex-1 text-sm sm:text-base flex items-center justify-center h-10 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold"
            >
              <User className="w-4 h-4 mr-2" />
              My Account
            </TabsTrigger>
          </TabsList>
          <TabsContent value="agents">
            <div className="grid grid-cols-1 gap-6">
              {activeAgent && (
                <Card
                  key={activeAgent.id}
                  className="col-span-1 overflow-hidden relative flex flex-col"
                >
                  <div className="relative h-48 sm:h-64 md:h-72 lg:h-80">
                    <Image
                      src={activeAgent.imageUrl || "/placeholder.svg"}
                      alt={`Property of ${activeAgent.name}`}
                      fill
                      className="object-cover w-full h-full"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-0 right-0 m-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveAgent(null)}
                        className="bg-green-500/80 hover:bg-green-500/90 text-white"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                          <AvatarImage src={activeAgent.profilePictureUrl || activeAgent.avatar} alt={activeAgent.name} />
                          <AvatarFallback className="bg-secondary text-primary">
                            {activeAgent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-4">
                            <h3 className="text-2xl font-bold">{activeAgent.name}</h3>
                            <div className="flex items-center gap-2">
                              {conversation && (
                                <>
                                  <AnimatedWaveform isAnimating={true} />
                                  <div className="text-sm font-medium">
                                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground italic">{activeAgent.description}</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto pb-2">
                        <div className="flex gap-2 min-w-max">
                          <Button 
                            onClick={startConversation} 
                            disabled={conversation !== null || activeAgent?.id?.startsWith('placeholder')}
                            className="space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Mic className="h-4 w-4" />
                            <span className="hidden sm:inline">Start Call</span>
                          </Button>
                          <Button 
                            onClick={stopConversation} 
                            disabled={conversation === null}
                            variant="outline"
                            className="space-x-2 border-primary/20 hover:bg-primary/10"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">End Call</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Property Information</h4>
                      <p className="text-sm mb-2">{activeAgent.propertyInfo.address}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeAgent.propertyInfo.details.map((detail, index) => (
                          <div key={index} className="text-xs bg-background/50 p-2 rounded">
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">Comparable Properties</h5>
                      {activeAgent.comps && activeAgent.comps.length > 0 ? (
                        <div className="overflow-x-auto">
                          <div className="flex space-x-4">
                            {activeAgent.comps.map((comp, index) => (
                              <div key={index} className="flex-shrink-0 w-64 text-sm bg-background/50 p-2 rounded">
                                <p className="font-medium">{comp.address}</p>
                                <p>Sold: {comp.soldDate} for {comp.price}</p>
                                <p>Condition: {comp.condition}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No comparable properties available.</p>
                      )}
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {error}
                          {error.includes('Microphone permission denied') && (
                            <p className="mt-2 text-sm">
                              Please ensure you have granted microphone permissions to this application in your browser settings.
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {conversation && ( 
                      <div className="text-center">
                        <Badge variant="secondary" className="text-xs bg-secondary/50">
                          {elevenLabsConversationId
                            ? `ElevenLabs Call ID: ${elevenLabsConversationId}`
                            : 'Processing...'}
                        </Badge>
                      </div>
                    )}
                    {conversation && (
                      <div className="mt-4 p-2 bg-secondary/20 rounded-md flex items-center justify-center space-x-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          Call Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Hello, {user?.displayName || 'there'}!
                  </h2>
                  <p className="text-sm text-white mt-1">
                    Click any seller to get started
                  </p>
                </div>
                <div className="flex justify-end">
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      title="Switch to Grid View"
                      className={`mr-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode('list')}
                      title="Switch to List View"
                      className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {firebaseAgents
                  .filter(agent => agent.id !== activeAgent?.id)
                  .sort((a, b) => {
                    if (a.isPlaceholder === b.isPlaceholder) return 0;
                    return a.isPlaceholder ? 1 : -1;
                  })
                  .map((agent, index) => (
                    <Card
                      key={agent.id}
                      className={`transition-all hover:shadow-lg frosted-glass rounded-t-none relative ${
                        agent.isPlaceholder ? 'opacity-50 cursor-not-allowed' : ''
                      } ${viewMode === 'list' ? 'flex items-center' : ''} 
                      hover:border-2 hover:border-green-500/50`}
                    >
                      <button
                        className={`w-full text-left ${viewMode === 'list' ? 'flex items-center rounded-lg' : ''}`}
                        onClick={() => !agent.isPlaceholder && setActiveAgent(agent)}
                        disabled={agent.isPlaceholder}
                      >
                        <div className={`${viewMode === 'list' ? 'w-24 h-24 mr-4 flex-shrink-0' : 'mb-4 w-full h-48'} relative`}>
                          <Image
                            src={agent.imageUrl || "/placeholder.svg"}
                            alt={`Property of ${agent.name}`}
                            fill
                            className="object-cover"
                            sizes={viewMode === 'list' ? "96px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                          />
                        </div>
                        <div className={`space-y-4 ${viewMode === 'list' ? 'flex-grow min-w-0' : ''}`}>
                          <div className={`flex items-start ${viewMode === 'list' ? 'space-x-4' : ''} p-4 relative`}>
                            {viewMode === 'grid' && (
                              <Avatar className="w-16 h-16 ring-2 ring-primary/20 flex-shrink-0">
                                <AvatarImage src={agent.profilePictureUrl || agent.avatar} alt={agent.name} className="mr-2" />
                                <AvatarFallback className="bg-secondary text-primary">
                                  {agent.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-grow pl-4">
                              <h3 className="font-bold text-xl mb-1 text-white">{agent.name}</h3>
                              <p className="text-base font-medium text-white mt-1 mb-2">{agent.propertyInfo?.address}</p>
                              <p className="text-sm text-muted-foreground italic">{agent.description}</p>
                              {agent.isPlaceholder && (
                                <Badge variant="secondary" className="mt-2 bg-secondary/50">Coming Soon</Badge>
                              )}
                            </div>
                            {!agent.isPlaceholder && (
                              <div className={`${viewMode === 'list' ? 'ml-4' : 'absolute right-4 top-4'}`}>
                                <ChevronDown className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))}
              </div>
              <p className="text-center text-muted-foreground mt-6">New Sellers Every Month</p>
            </div>
          </TabsContent>
          <TabsContent value="stats">
            <StatsInfo />
          </TabsContent>
          <TabsContent value="account">
            <MyAccount />
          </TabsContent>
        </Tabs>

        <Dialog open={isTokenLimitModalOpen} onOpenChange={setIsTokenLimitModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Token Limit Reached</DialogTitle>
              <DialogDescription>
                You have reached your monthly token limit of {TOKEN_LIMIT} tokens. Please contact support to increase your limit or wait until your tokens reset next month.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setIsTokenLimitModalOpen(false)}>Close</Button>
          </DialogContent>
        </Dialog>
        <AnalysisModal 
          isOpen={isAnalysisModalOpen} 
          onClose={() => setIsAnalysisModalOpen(false)} 
          analysis={analysisData} 
        />
      </div>
    </div>
  )
}

export default ConversationalAI

