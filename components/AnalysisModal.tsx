import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: any
}

export function AnalysisModal({ isOpen, onClose, analysis }: AnalysisModalProps) {
  if (!analysis) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Conversation Analysis</DialogTitle>
          <DialogDescription>
            Analysis metadata from ElevenLabs for the completed conversation.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="space-y-4 p-4">
            {analysis.call_successful !== undefined && (
              <div>
                <h3 className="text-lg font-semibold">Call Successful</h3>
                <p>{analysis.call_successful ? 'Yes' : 'No'}</p>
              </div>
            )}
            {analysis.transcript_summary && (
              <div>
                <h3 className="text-lg font-semibold">Transcript Summary</h3>
                <p>{analysis.transcript_summary}</p>
              </div>
            )}
            {analysis.evaluation_criteria_results && (
              <div>
                <h3 className="text-lg font-semibold">Evaluation Criteria Results</h3>
                {Object.entries(analysis.evaluation_criteria_results).map(([key, value]: [string, any]) => (
                  <div key={key} className="ml-4 mt-2">
                    <h4 className="font-semibold">{value.criteria_id}</h4>
                    <p>Result: {value.result}</p>
                    <p>Rationale: {value.rationale}</p>
                  </div>
                ))}
              </div>
            )}
            {analysis.data_collection_results && (
              <div>
                <h3 className="text-lg font-semibold">Data Collection Results</h3>
                {Object.entries(analysis.data_collection_results).map(([key, value]: [string, any]) => (
                  <div key={key} className="ml-4 mt-2">
                    <h4 className="font-semibold">{value.data_collection_id}</h4>
                    <p>Value: {JSON.stringify(value.value)}</p>
                    <p>Rationale: {value.rationale}</p>
                    {value.json_schema && (
                      <p>Type: {value.json_schema.type} - {value.json_schema.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

