'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Phone, User2 } from 'lucide-react'
import { Conversation } from '@11labs/client'
import { AnimatedWaveform } from '@/components/AnimatedWaveform'

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ANALYSIS_AGENT_ID = 'Hg12137peEh0lu8nRlOb'

interface AnalysisCallButtonsProps {
  className?: string
}

export function AnalysisCallButtons({ className = '' }: AnalysisCallButtonsProps) {
  const [conversation, setConversation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [agentStatus, setAgentStatus] = useState('listening')

  React.useEffect(() => {
    let interval: NodeJS.Timeout
    if (conversation) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [conversation])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startConversation = async () => {
    if (!ELEVENLABS_API_KEY) {
      setError('Invalid ElevenLabs API key')
      return
    }

    try {
      const newConversation = await Conversation.startSession({
        agentId: ANALYSIS_AGENT_ID,
        'xi-api-key': ELEVENLABS_API_KEY,
        onConnect: () => {
          setError(null)
        },
        onDisconnect: () => {
          setConversation(null)
          setCallDuration(0)
        },
        onError: (error: Error | string) => {
          console.error('ElevenLabs API Error:', error)
          const errorMessage = typeof error === 'string' ? error : error.message
          setError(`Connection error: ${errorMessage}`)
        },
        onModeChange: (mode) => {
          setAgentStatus(mode.mode === 'speaking' ? 'speaking' : 'listening')
        }
      })

      if (!newConversation) {
        throw new Error('Failed to create conversation session')
      }

      setConversation(newConversation)
      setCallDuration(0)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to start conversation: ${errorMessage}`)
    }
  }

  const stopConversation = async () => {
    if (conversation) {
      try {
        await conversation.endSession()
      } catch (error) {
        console.error('Error ending conversation:', error)
      }
    }
  }

  return (
    <div className={`${className} space-y-4`}>
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User2 className="w-6 h-6 text-primary" />
            </div>
            {conversation && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>
          <div>
            <h3 className="font-medium">Sales Coach</h3>
            <p className="text-sm text-muted-foreground">
              {conversation ? (
                agentStatus === 'speaking' ? (
                  <span className="flex items-center gap-2">
                    Speaking <AnimatedWaveform className="w-4 h-4" />
                  </span>
                ) : 'Listening'
              ) : 'Ready to analyze your call'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {conversation && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatDuration(callDuration)}
            </span>
          )}
          
          {!conversation ? (
            <Button 
              onClick={startConversation} 
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Coaching Call
            </Button>
          ) : (
            <Button 
              onClick={stopConversation}
              size="sm"
              variant="outline"
              className="text-gray-500"
            >
              <Phone className="w-4 h-4 mr-2" />
              End Call
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 