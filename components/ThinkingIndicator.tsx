'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface ThinkingIndicatorProps {
  isThinking?: boolean
  size?: number
  className?: string
}

export function ThinkingIndicator({ 
  isThinking = true, 
  size = 80,
  className = '' 
}: ThinkingIndicatorProps) {

  return (
    <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Thinking...</span>
    </div>
  )
}

export default ThinkingIndicator

