import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface SkillsRadarChartProps {
  performance: {
    neural: {
      responseAgility: { score: number };
      emotionalControl: { score: number };
      adaptiveCommunication: { score: number };
    };
    cognitive: {
      situationReading: { score: number };
      strategicThinking: { score: number };
    };
    behavioral: {
      conversationLeadership: { score: number };
      objectionNavigation: { score: number };
    };
  };
}

export default function SkillsRadarChart({ performance }: SkillsRadarChartProps) {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const data = [
    {
      skill: 'Response Agility',
      value: performance.neural.responseAgility.score,
      category: 'Neural'
    },
    {
      skill: 'Emotional Control',
      value: performance.neural.emotionalControl.score,
      category: 'Neural'
    },
    {
      skill: 'Adaptive Communication',
      value: performance.neural.adaptiveCommunication.score,
      category: 'Neural'
    },
    {
      skill: 'Situation Reading',
      value: performance.cognitive.situationReading.score,
      category: 'Cognitive'
    },
    {
      skill: 'Strategic Thinking',
      value: performance.cognitive.strategicThinking.score,
      category: 'Cognitive'
    },
    {
      skill: 'Conversation Leadership',
      value: performance.behavioral.conversationLeadership.score,
      category: 'Behavioral'
    },
    {
      skill: 'Objection Navigation',
      value: performance.behavioral.objectionNavigation.score,
      category: 'Behavioral'
    }
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  return (
    <div className="w-full h-[400px]">
      <div 
        className="w-full h-full bg-[#1A1A1A] rounded-xl"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <defs>
              {mousePosition && (
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0.2
                            0 0 0 0 0.827
                            0 0 0 0 0.6
                            0 0 0 1 0"
                  />
                </filter>
              )}
            </defs>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#94a3b8' }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#34D399"
              strokeWidth={2}
              fill="#34D399"
              fillOpacity={0.3}
              filter={mousePosition ? "url(#glow)" : undefined}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value;
                  return (
                    <div className="bg-[#1A1A1A] border border-[#34D399]/10 p-2 rounded-lg shadow-xl">
                      <p className="text-sm text-gray-300">{payload[0].payload.skill}</p>
                      <p className="text-sm font-bold text-[#34D399]">
                        {typeof value === 'number' ? Math.round(value) : 0}%
                      </p>
                      <p className="text-xs text-gray-400">{payload[0].payload.category}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 