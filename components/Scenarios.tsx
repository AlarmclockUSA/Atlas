'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getScenarios, getPracticeAgent, type Scenario, type PracticeAgent } from '@/lib/firebaseUtils'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Conversation } from '@11labs/client'

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [practiceAgents, setPracticeAgents] = useState<Record<string, PracticeAgent>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeCall, setActiveCall] = useState<{ conversation: any; scenarioId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadScenarios()
  }, [])

  async function loadScenarios() {
    try {
      const fetchedScenarios = await getScenarios()
      setScenarios(fetchedScenarios)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading scenarios:', error)
      toast.error('Failed to load scenarios')
      setIsLoading(false)
    }
  }

  async function startCall(agentId: string, scenarioId: string) {
    if (!ELEVENLABS_API_KEY) {
      setError('Invalid ElevenLabs API key')
      return
    }

    try {
      console.log('Starting call with agent:', agentId)
      const conversation = await Conversation.startSession({
        agentId: agentId,
        'xi-api-key': ELEVENLABS_API_KEY,
        onConnect: () => {
          setError(null)
          toast.success('Call connected')
        },
        onDisconnect: () => {
          setActiveCall(null)
          toast.info('Call ended')
        },
        onError: (error: Error | string) => {
          console.error('ElevenLabs API Error:', error)
          const errorMessage = typeof error === 'string' ? error : error.message
          setError(`Connection error: ${errorMessage}`)
          setActiveCall(null)
        }
      })

      if (!conversation) {
        throw new Error('Failed to create conversation session')
      }

      setActiveCall({ conversation, scenarioId })
    } catch (error) {
      console.error('Failed to start call:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to start call: ${errorMessage}`)
      setActiveCall(null)
    }
  }

  async function endCall() {
    if (activeCall?.conversation) {
      try {
        await activeCall.conversation.endSession()
      } catch (error) {
        console.error('Error ending call:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="h-4 bg-secondary rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-secondary rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Practice Scenarios</h2>
      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded mb-4">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => {
          const agent = practiceAgents[scenario.agentId]
          const isActive = activeCall?.scenarioId === scenario.id
          
          return (
            <Card key={scenario.id} className="p-4 space-y-4">
              <div className="flex items-start space-x-4">
                {agent && (
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={agent.avatar} alt={agent.name} />
                    <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{scenario.title}</h3>
                  <p className="text-muted-foreground">{scenario.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge>{scenario.difficulty}</Badge>
                <Badge variant="outline">{scenario.category}</Badge>
                {agent && <Badge variant="secondary">{agent.type}</Badge>}
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Objectives:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {scenario.objectives?.map((objective, index) => (
                    <li key={index} className="text-sm text-muted-foreground">{objective}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Practice with: {agent?.name || scenario.agentName}</p>
                  {agent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expertise: {agent.expertise.join(', ')}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => isActive ? endCall() : startCall(scenario.agentId, scenario.id)}
                  variant={isActive ? "destructive" : "default"}
                >
                  {isActive ? "End Call" : "Start Call"}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 