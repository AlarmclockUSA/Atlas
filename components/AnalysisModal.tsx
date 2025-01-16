import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from 'lucide-react'
import { AnalysisCallButtons } from './AnalysisCallButtons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: any
}

export function AnalysisModal({ isOpen, onClose, analysis }: AnalysisModalProps) {
  if (!analysis) return null

  const formatCriteriaId = (id: string) => {
    return id.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Calculate success metrics
  const totalCriteria = Object.keys(analysis.evaluation_criteria_results || {}).length
  const successfulCriteria = Object.values(analysis.evaluation_criteria_results || {})
    .filter((value: any) => value.result === "success").length
  const successRate = totalCriteria ? (successfulCriteria / totalCriteria) * 100 : 0

  // Get evaluation results in order
  const evaluationResults = Object.entries(analysis.evaluation_criteria_results || {}).map(([_, value]: [string, any]) => ({
    id: value.criteria_id,
    success: value.result === "success"
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[85vh] p-0">
        <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Header Section */}
          <div className="flex-none p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>Conversation Analysis</DialogTitle>
              <DialogDescription>
                Analysis metadata from ElevenLabs for the completed conversation.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Success Rate Section */}
          <div className="flex-none px-6 py-4 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold">Success Rate</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{successfulCriteria} of {totalCriteria} criteria met</span>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-muted">
                    {successRate >= 70 ? 'Meeting Expectations' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold tabular-nums">{Math.round(successRate)}%</span>
                {successRate >= 70 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="flex justify-center items-center gap-6 my-6">
              {Array.from({ length: 5 }).map((_, index) => {
                const result = evaluationResults[index]
                const isComplete = result !== undefined
                const isSuccess = isComplete && result.success
                const label = result?.id ? formatCriteriaId(result.id) : `Criteria ${index + 1}`
                
                return (
                  <div key={index} className="relative group">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        className="text-muted-foreground/20"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="transparent"
                        r="24"
                        cx="28"
                        cy="28"
                      />
                      {isComplete && (
                        <circle
                          className={isSuccess ? "text-green-500" : "text-red-500"}
                          strokeWidth="4"
                          strokeDasharray={`${isSuccess ? 151 : 0} 151`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="24"
                          cx="28"
                          cy="28"
                        />
                      )}
                    </svg>
                    {isComplete && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isSuccess ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Call Button Section */}
          <div className="flex-none px-6 py-3 border-b">
            <AnalysisCallButtons />
          </div>

          {/* Content Section */}
          <div className="flex-1">
            <Tabs defaultValue="criteria" className="h-full">
              <div className="px-6 pt-2">
                <TabsList className="w-full grid grid-cols-3 bg-muted/50">
                  <TabsTrigger value="criteria">Evaluation Criteria</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="data">Data Collection</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="criteria" className="mt-0">
                <ScrollArea className="h-[500px] px-6 pt-4">
                  <div className="space-y-4 pb-6">
                    {Object.entries(analysis.evaluation_criteria_results || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-muted/30 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">
                            {formatCriteriaId(value.criteria_id)}
                          </h4>
                          <Badge variant="outline" className={value.result === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                            {value.result === "success" ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{value.rationale}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="transcript" className="mt-0">
                <ScrollArea className="h-[500px] px-6 pt-4">
                  <div className="space-y-4 pb-6">
                    {/* Summary Section */}
                    {analysis.transcript_summary && (
                      <div>
                        <h4 className="font-medium mb-2">Summary</h4>
                        <div className="bg-background/50 p-4 rounded-lg">
                          <p className="text-sm leading-relaxed">{analysis.transcript_summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Full Transcript Section */}
                    {analysis.transcript && (
                      <div>
                        <h4 className="font-medium mb-2">Full Transcript</h4>
                        <div className="bg-background/50 p-4 rounded-lg space-y-4">
                          {analysis.transcript.map((entry: any, index: number) => (
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
                    {!analysis.transcript_summary && !analysis.transcript && (
                      <div className="text-sm text-muted-foreground">No transcript available.</div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <ScrollArea className="h-[400px] px-6">
                  <div className="space-y-3 pb-6">
                    {Object.entries(analysis.data_collection_results || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-background/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          {formatCriteriaId(value.data_collection_id)}
                        </h4>
                        <div className="space-y-2">
                          <div className="bg-muted p-2 rounded">
                            <span className="font-medium">Value: </span>
                            <span className="text-sm">
                              {typeof value.value === 'object' 
                                ? JSON.stringify(value.value, null, 2) 
                                : value.value || 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{value.rationale}</p>
                          {value.json_schema && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Type: {value.json_schema.type} - {value.json_schema.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

