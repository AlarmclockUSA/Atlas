'use client'

import React from 'react'

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
    <div 
      className={`relative aspect-square ${className}`}
      style={{ width: size }}
    >
      {/* Empty fragment to maintain component structure */}
      <></>
    </div>
  )
}

