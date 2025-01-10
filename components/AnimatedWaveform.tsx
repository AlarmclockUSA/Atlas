import React from 'react'

interface AnimatedWaveformProps {
  isAnimating: boolean;
}

export function AnimatedWaveform({ isAnimating }: AnimatedWaveformProps) {
  const numberOfLines = 32
  const radius = 40

  return (
    <div className="w-full h-32 flex items-center justify-center overflow-hidden" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="-50 -50 100 100">
        <g className={`${isAnimating ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }}>
          {Array.from({ length: numberOfLines }).map((_, index) => {
            const angle = (index / numberOfLines) * 2 * Math.PI
            const x1 = Math.cos(angle) * radius
            const y1 = Math.sin(angle) * radius
            const x2 = Math.cos(angle) * (radius + (isAnimating ? Math.random() * 10 : 0))
            const y2 = Math.sin(angle) * (radius + (isAnimating ? Math.random() * 10 : 0))

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#3B82F6"
                strokeWidth="1"
                className={`transform origin-center transition-all duration-300 ease-in-out ${
                  isAnimating ? 'animate-pulse' : ''
                }`}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

