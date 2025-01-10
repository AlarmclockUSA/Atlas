import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalysisDisplayProps {
  analysis: any
}

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  if (!analysis) return null

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Conversation Analysis</CardTitle>
        <CardDescription>Detailed breakdown of the conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Transcript Summary</h3>
              <p className="text-sm text-muted-foreground">{analysis.transcript_summary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Call Outcome</h3>
              <Badge variant={analysis.call_successful === "success" ? "success" : "destructive"}>
                {analysis.call_successful === "success" ? "Successful" : "Failed"}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Evaluation Criteria Results</h3>
              {Object.entries(analysis.evaluation_criteria_results).map(([key, value]: [string, any]) => (
                <Card key={key} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {value.criteria_id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={value.result === "success" ? "success" : "destructive"} className="mb-2">
                      {value.result}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{value.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Data Collection Results</h3>
              {Object.entries(analysis.data_collection_results).map(([key, value]: [string, any]) => (
                <Card key={key} className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">{value.data_collection_id}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Value: {value.value || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground mt-2">{value.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

