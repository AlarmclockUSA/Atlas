import { Suspense } from 'react'
import ConversationalAI from '@/components/ConversationalAI'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AuthWrapper } from '@/components/AuthWrapper'

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthWrapper>
        <ConversationalAI />
      </AuthWrapper>
    </Suspense>
  )
}

