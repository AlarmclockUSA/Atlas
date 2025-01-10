import ConversationalAI from '@/components/ConversationalAI'
import { Suspense } from 'react'
import { LoadingScreen } from '@/components/LoadingScreen'

export default function DynamicPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-custom">
      <Suspense fallback={<LoadingScreen />}>
        <ConversationalAI initialConversationId={params.id} />
      </Suspense>
    </div>
  )
}

