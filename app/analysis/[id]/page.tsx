'use client'

import React, { useEffect, useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { fetchElevenLabsAnalysis } from '@/lib/elevenlabsApi'
import { Button } from "@/components/ui/button"

// Dynamically import components
const SkillsRadarChart = dynamic(() => import('@/components/SkillsRadarChart'), { ssr: false })
const AnalysisCallButtons = dynamic(() => import('@/components/AnalysisCallButtons').then(mod => mod.AnalysisCallButtons), { ssr: false })

// Import types and functions from anthropicApi
import type { AnalysisResponse } from '@/lib/anthropicApi'

interface ElevenLabsAnalysis {
  transcript_summary?: string;
  transcript?: Array<{
    role: string;
    message: string;
    time_in_call_secs?: number;
  }>;
  evaluation_criteria_results?: Record<string, {
    criteria_id: string;
    result: "success" | "failure";
    rationale: string;
  }>;
}

interface PageProps {
  params: {
    id: string
  },
  searchParams: {
    hideTranscript?: string
  }
}

async function getAnalysis(id: string): Promise<{ 
  elevenLabsAnalysis: ElevenLabsAnalysis | null;
  anthropicAnalysis: AnalysisResponse | null;
} | null> {
  try {
    const conversationRef = doc(db, 'Conversations', id)
    const conversationDoc = await getDoc(conversationRef)
    
    if (!conversationDoc.exists()) {
      return null
    }

    const data = conversationDoc.data()
    return {
      elevenLabsAnalysis: data.analysis || null,
      anthropicAnalysis: data.anthropicAnalysis || null
    }
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return null
  }
}

export default function AnalysisPage({ params, searchParams }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [elevenLabsAnalysis, setElevenLabsAnalysis] = useState<ElevenLabsAnalysis | null>(null)
  const [anthropicAnalysis, setAnthropicAnalysis] = useState<AnalysisResponse | null>(null)
  const [isNewFormat, setIsNewFormat] = useState(false)

  useEffect(() => {
    async function loadAnalysis() {
      try {
        const conversationRef = doc(db, 'Conversations', params.id)
        const conversationDoc = await getDoc(conversationRef)
        
        if (!conversationDoc.exists()) {
          setError('Conversation not found')
          return
        }

        const data = conversationDoc.data()
        let elevenlabs = data.analysis
        let anthropic = data.anthropicAnalysis

        // Check if this is a new format conversation with complete data
        setIsNewFormat(!!elevenlabs?.transcript && !!elevenlabs?.evaluation_criteria_results)

        // If no Eleven Labs analysis in Firebase, try to fetch it
        if (!elevenlabs) {
          try {
            elevenlabs = await fetchElevenLabsAnalysis(params.id)
          } catch (error) {
            console.error('Error fetching Eleven Labs analysis:', error)
          }
        }

        // If we have the transcript but no Anthropic analysis, generate it
        if (elevenlabs?.transcript && !anthropic) {
          try {
            const transcript = elevenlabs.transcript
              .map((entry: any) => `{${entry.role}} ${entry.message}`)
              .join('\n\n')
            const { analyzeConversation } = await import('@/lib/anthropicApi')
            anthropic = await analyzeConversation(transcript)
          } catch (error) {
            console.error('Error generating Anthropic analysis:', error)
          }
        }

        setElevenLabsAnalysis(elevenlabs)
        setAnthropicAnalysis(anthropic)
      } catch (error) {
        console.error('Error in loadAnalysis:', error)
        setError('Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading analysis...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || (!elevenLabsAnalysis && !anthropicAnalysis)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">{error || 'No analysis found'}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error ? 'Please try again later.' : 'We couldn\'t find any analysis for this conversation.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Calculate success metrics from Anthropic analysis if available
  const successRate = anthropicAnalysis ? anthropicAnalysis.overallScore : 
    (elevenLabsAnalysis ? calculateElevenLabsSuccessRate(elevenLabsAnalysis) : 0)

  // Determine which tabs to show based on hideTranscript parameter
  const tabTriggers = searchParams.hideTranscript === 'true' ? [
    { value: 'overview', label: 'Overview' },
    { value: 'details', label: 'Detailed Analysis' },
    { value: 'recommendations', label: 'Recommendations' }
  ] : [
    { value: 'overview', label: 'Overview' },
    { value: 'details', label: 'Detailed Analysis' },
    { value: 'transcript', label: 'Transcript' },
    { value: 'recommendations', label: 'Recommendations' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-primary mb-2">
                  <span>Powered By</span>
                  <span className="font-semibold">Deep Reality Protocol™</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">Performance Analysis</h1>
                <p className="text-muted-foreground">
                  Neuroscience-Driven Training System for Real Results
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Success Rate Section */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Overall Performance</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {anthropicAnalysis ? 'AI-Powered Deep Analysis' : 'Basic Analysis'}
                    </span>
                    <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">
                      {successRate >= 70 ? 'Meeting Expectations' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tabular-nums">{Math.round(successRate)}%</span>
                  {successRate >= 70 ? (
                    <CheckCircle className="h-8 w-8 text-primary" />
                  ) : (
                    <XCircle className="h-8 w-8 text-yellow-500" />
                  )}
                </div>
              </div>

              {anthropicAnalysis && (
                <div className="grid grid-cols-3 gap-6">
                  <ScoreCard
                    title="Neural Adaptation"
                    score={anthropicAnalysis.performance.neural.overallScore || 0}
                    highlights={anthropicAnalysis.performance.neural.highlights}
                  />
                  <ScoreCard
                    title="Cognitive Enhancement"
                    score={anthropicAnalysis.performance.cognitive.overallScore || 0}
                    highlights={anthropicAnalysis.performance.cognitive.highlights}
                  />
                  <ScoreCard
                    title="Behavioral Integration"
                    score={anthropicAnalysis.performance.behavioral.overallScore || 0}
                    highlights={anthropicAnalysis.performance.behavioral.highlights}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Call Button Section - Only show for new format conversations */}
          {isNewFormat && (
            <div className="mb-6">
              <AnalysisCallButtons />
            </div>
          )}

          {/* Content Section */}
          <Card className="flex-1">
            <Tabs defaultValue="overview" className="h-full">
              <div className="px-6 pt-4">
                <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${tabTriggers.length}, 1fr)` }}>
                  {tabTriggers.map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-0 p-6">
                {anthropicAnalysis ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4">Overall Assessment</h3>
                      <p className="text-muted-foreground leading-relaxed">{anthropicAnalysis.overallFeedback}</p>
                    </div>
                    
                    <div className="bg-muted p-6 rounded-xl">
                      <SkillsRadarChart performance={anthropicAnalysis.performance} />
                    </div>
                    
                    <div>
                      <div className="grid gap-4">
                        {anthropicAnalysis.keyQuotes.map((quote: string, index: number) => (
                          <div key={index} className="bg-muted p-4 rounded-xl border">
                            <p className="text-muted-foreground italic">"{quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Detailed analysis not available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="mt-0 p-6">
                {anthropicAnalysis ? (
                  <div className="space-y-8">
                    <PerformanceSection
                      title="Neural Adaptation"
                      data={anthropicAnalysis.performance.neural}
                    />
                    <PerformanceSection
                      title="Cognitive Enhancement"
                      data={anthropicAnalysis.performance.cognitive}
                    />
                    <PerformanceSection
                      title="Behavioral Integration"
                      data={anthropicAnalysis.performance.behavioral}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <p>Detailed analysis not available.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transcript" className="mt-0 p-6">
                <div className="space-y-4">
                  {/* Summary Section */}
                  {elevenLabsAnalysis?.transcript_summary && (
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm leading-relaxed text-muted-foreground">{elevenLabsAnalysis.transcript_summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Full Transcript Section */}
                  {elevenLabsAnalysis?.transcript && (
                    <div>
                      <h4 className="font-medium mb-2">Full Transcript</h4>
                      <div className="bg-muted p-4 rounded-lg space-y-4">
                        {elevenLabsAnalysis.transcript.map((entry: any, index: number) => (
                          <div key={index} className="text-sm leading-relaxed">
                            <span className="font-medium">{entry.role}: </span>
                            <span className="text-muted-foreground">{entry.message}</span>
                            {entry.time_in_call_secs && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({Math.floor(entry.time_in_call_secs / 60)}:{(entry.time_in_call_secs % 60).toString().padStart(2, '0')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback Message */}
                  {!elevenLabsAnalysis?.transcript_summary && !elevenLabsAnalysis?.transcript && (
                    <div className="text-sm text-muted-foreground">No transcript available.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-0 p-6">
                {anthropicAnalysis ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Priority Improvements</h3>
                      <div className="space-y-2">
                        {anthropicAnalysis.recommendations.priority.map((rec: string, index: number) => (
                          <div key={index} className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recommended Techniques</h3>
                      <div className="space-y-2">
                        {anthropicAnalysis.recommendations.techniques.map((tech: string, index: number) => (
                          <div key={index} className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">{tech}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Recommendations not available.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

function calculateElevenLabsSuccessRate(analysis: any) {
  const totalCriteria = Object.keys(analysis.evaluation_criteria_results || {}).length
  const successfulCriteria = Object.values(analysis.evaluation_criteria_results || {})
    .filter((value: any) => value.result === "success").length
  return totalCriteria ? (successfulCriteria / totalCriteria) * 100 : 0
}

interface ScoreCardProps {
  title: string;
  score: number;
  highlights?: string;
}

function ScoreCard({ title, score, highlights }: ScoreCardProps) {
  return (
    <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#34D399]/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-lg">{title}</h4>
        <span className="text-2xl font-bold text-[#34D399]">{Math.round(score)}%</span>
      </div>
      {highlights && (
        <p className="text-gray-400 text-sm line-clamp-3">{highlights}</p>
      )}
    </div>
  )
}

interface PerformanceSectionProps {
  title: string;
  data: any;
}

function PerformanceSection({ title, data }: PerformanceSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">{title}</h3>
      
      <div className="grid gap-6">
        {data.highlights && (
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#34D399]/10">
            <h4 className="font-bold text-lg mb-3">Highlights</h4>
            <p className="text-gray-300">{data.highlights}</p>
          </div>
        )}
        
        {data.constructiveFeedback && (
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#34D399]/10">
            <h4 className="font-bold text-lg mb-3">Areas for Improvement</h4>
            <p className="text-gray-300">{data.constructiveFeedback}</p>
          </div>
        )}
        
        {data.overview && (
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-[#34D399]/10">
            <h4 className="font-bold text-lg mb-3">Overview</h4>
            <p className="text-gray-300">{data.overview}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value]: [string, any]) => {
          if (key === 'overallScore' || key === 'highlights' || key === 'constructiveFeedback' || key === 'overview') {
            return null;
          }
          
          return (
            <div key={key} className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{formatMetricName(key)}</h4>
                <span className="text-lg font-bold">{Math.round(value.score)}%</span>
              </div>
              <div className="space-y-2">
                {value.details?.strengths && value.details.strengths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-500">Strengths</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {value.details.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {value.details?.weaknesses && value.details.weaknesses.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-yellow-500">Areas to Improve</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {value.details.weaknesses.map((weakness: string, index: number) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMetricName(key: string): string {
  return key
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 
