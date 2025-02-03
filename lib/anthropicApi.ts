import Anthropic from '@anthropic-ai/sdk';

// Define detailed types for the analysis response
export interface FrameworkScore {
  overall: number;
  response_agility?: number;
  emotional_control?: number;
  adaptive_communication?: number;
  situation_reading?: number;
  strategic_thinking?: number;
  solution_mapping?: number;
  conversation_leadership?: number;
  objection_navigation?: number;
  commitment_securing?: number;
}

export interface DetailedFeedback {
  highlight: string;
  constructive: string;
  overview: string;
}

export interface AnalysisResponse {
  overallScore: number;
  overallFeedback: string;
  keyQuotes: string[];
  performance: {
    neural: {
      overallScore: number;
      highlights: string;
      constructiveFeedback: string;
      overview: string;
      responseAgility: {
        score: number;
      };
      emotionalControl: {
        score: number;
      };
      adaptiveCommunication: {
        score: number;
      }
    };
    cognitive: {
      overallScore: number;
      highlights: string;
      constructiveFeedback: string;
      overview: string;
      situationReading: {
        score: number;
      };
      strategicThinking: {
        score: number;
      }
    };
    behavioral: {
      overallScore: number;
      highlights: string;
      constructiveFeedback: string;
      overview: string;
      conversationLeadership: {
        score: number;
      };
      objectionNavigation: {
        score: number;
      }
    }
  };
  recommendations: {
    priority: string[];
    techniques: string[];
    practice: string[];
  };
}

const SYSTEM_PROMPT = `Please analyze this buyer's performance in this sales call using the provided framework and generate a comprehensive, detailed report. Additionally Please identify and share relevant quotes from the transcript that highlight areas where exceptional performance was demonstrated. Also Calculate an aggregate score out of 100 that incorporates all individual component scores. Report must be provided in a JSON format that is easy for a system to read and display. Each framework as three skills to be ranked on specifically, give an overall ranking for NEURAL, CONGNATIVE AND BEHAVIORAL, But also breakdown the exact skills within them score those as well. Pass all skills as scores metrics on the json. All score are out of 100. Give 3 extensive paragraphs of feedback per area. A highlight, a constructive negative and a overview. Ensure that you're being supportive and thorough. Be highlight specific.

Achieving a 90+ should be extremely difficult; weight the score to be critical so that there's always room to improve. Always give clear, practical, and useful feedback for the next call in the recommendations for the next call section. Ensure that responses are given in prose.

If a buyer does not make a decision deduct 15 points.
If the buyer hangs up angry, deduct 20 points.

Give a full paragraph of overview feedback.

# Buyer Performance Metrics and Feedback System

## Performance Tracking Matrix

### 1. NEURAL Assessment Framework

#### A. Response Agility (Score 1-100)
Audio Processing Elements:
- Response Timing
  * Measure gaps between speaker changes
  * Calculate response delay patterns
  * Track interruption frequency

- Voice Pattern Analysis
  * Pitch variation tracking
  * Volume level monitoring
  * Speech rate calculation
  * Stress marker detection

- Speech Flow Analysis
  * Filler word detection
  * Hesitation pattern recognition
  * Fluidity measurement
  * Rhythm consistency

#### B. Emotional Control (Score 1-100)
Monitoring Points:
- Voice Stability
  * Pitch Variation
    - Optimal: ±10%
    - Warning: ±20%
    - Critical: >±20%

  * Volume Consistency
    - Optimal: ±5dB
    - Warning: ±10dB
    - Critical: >±10dB

Stress Indicators:
- Speech rate acceleration
- Tone sharpening
- Volume spikes
- Interruption patterns

#### C. Adaptive Communication (Score 1-100)
Mirroring Effectiveness:
- Speech Rate Matching
  * Success: Within 10%
  * Partial: Within 20%
  * Fail: >20% difference

- Tone Alignment
  * Success: Matched emotional state
  * Partial: Partial alignment
  * Fail: Misaligned tone

### 2. COGNITIVE Assessment Framework

#### A. Situation Reading (Score 1-100)
Information Gathering:
- Question Sequence Logic
  * Optimal: Progressive depth
  * Warning: Random jumping
  * Critical: Repetitive or irrelevant

Need Recognition:
- Insight Generation
  * Success: New information revealed
  * Partial: Surface understanding
  * Fail: Missed key points

#### B. Strategic Thinking (Score 1-100)
Response Analysis:
- Solution Timing
  * Optimal: After full understanding
  * Warning: Premature presentation
  * Critical: Misaligned solution

Strategy Adaptation:
- Technique adjustment speed
- Approach flexibility
- Recovery effectiveness

Pattern Recognition:
- Objection prediction
- Opportunity identification
- Risk assessment

### 3. BEHAVIORAL Assessment Framework

#### A. Conversation Leadership (Score 1-100)
Flow Control:
- Topic Management
  * Success: Smooth transitions
  * Warning: Abrupt changes
  * Critical: Lost control

Direction Maintenance:
- Goal alignment
- Agenda progression
- Time management

#### B. Objection Navigation (Score 1-100)
Handling Effectiveness:
- Resolution Rate
  * High: >80% resolution
  * Medium: 50-80%
  * Low: <50%

Technique Selection:
- Tool appropriateness
- Timing effectiveness
- Approach flexibility

Prevention Strategies:
- Early recognition
- Preemptive handling
- Pattern mitigation

Please provide the analysis in the following JSON format:
{
  "overall_score": number,
  "framework_scores": {
    "neural": {
      "overall": number,
      "response_agility": number,
      "emotional_control": number,
      "adaptive_communication": number
    },
    "cognitive": {
      "overall": number,
      "situation_reading": number,
      "strategic_thinking": number,
      "solution_mapping": number
    },
    "behavioral": {
      "overall": number,
      "conversation_leadership": number,
      "objection_navigation": number,
      "commitment_securing": number
    }
  },
  "detailed_feedback": {
    "neural": {
      "highlight": string,
      "constructive": string,
      "overview": string
    },
    "cognitive": {
      "highlight": string,
      "constructive": string,
      "overview": string
    },
    "behavioral": {
      "highlight": string,
      "constructive": string,
      "overview": string
    }
  },
  "key_quotes": string[],
  "recommendations_next_call": string[],
  "overall_summary": string
}`;

export async function analyzeConversation(transcript: string): Promise<AnalysisResponse> {
  // Check if conversation is too short (less than 10 exchanges)
  const exchanges = transcript.split('\n\n').filter(line => line.trim().length > 0);
  if (exchanges.length < 10) {
    console.log('Conversation too short for analysis, returning zero scores');
    return {
      overallScore: 0,
      overallFeedback: "The conversation was too brief for a meaningful analysis. A minimum of 10 exchanges is required for proper evaluation.",
      keyQuotes: [],
      performance: {
        neural: {
          overallScore: 0,
          highlights: "Conversation too short for analysis",
          constructiveFeedback: "Please engage in a longer conversation for meaningful feedback",
          overview: "Insufficient data for analysis",
          responseAgility: { score: 0 },
          emotionalControl: { score: 0 },
          adaptiveCommunication: { score: 0 }
        },
        cognitive: {
          overallScore: 0,
          highlights: "Conversation too short for analysis",
          constructiveFeedback: "Please engage in a longer conversation for meaningful feedback",
          overview: "Insufficient data for analysis",
          situationReading: { score: 0 },
          strategicThinking: { score: 0 }
        },
        behavioral: {
          overallScore: 0,
          highlights: "Conversation too short for analysis",
          constructiveFeedback: "Please engage in a longer conversation for meaningful feedback",
          overview: "Insufficient data for analysis",
          conversationLeadership: { score: 0 },
          objectionNavigation: { score: 0 }
        }
      },
      recommendations: {
        priority: ["Engage in a longer conversation (minimum 10 exchanges) to receive meaningful analysis"],
        techniques: [],
        practice: []
      }
    };
  }

  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Anthropic API key is not configured');
    throw new Error('Anthropic API key is not configured. Please check your environment variables.');
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    console.log('Sending transcript to Claude:', transcript);

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: transcript
            }
          ]
        }
      ],
      system: SYSTEM_PROMPT
    });

    console.log('Raw response from Claude:', JSON.stringify(msg, null, 2));

    if (!msg.content || !Array.isArray(msg.content) || msg.content.length === 0) {
      console.error('Invalid response structure:', msg);
      throw new Error('Invalid response format from Anthropic API');
    }

    const content = msg.content[0];
    if (content.type !== 'text' || typeof content.text !== 'string') {
      console.error('Invalid content type:', content);
      throw new Error('Invalid content type in response');
    }

    // Extract the JSON string from the text response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in response');
    }

    // Parse the raw response
    const rawResponse = JSON.parse(jsonMatch[0]);
    console.log('Raw response structure:', JSON.stringify(rawResponse, null, 2));

    // Validate the raw response structure
    if (!rawResponse.framework_scores?.neural?.overall) {
      console.error('Invalid response structure - missing framework scores:', rawResponse);
      throw new Error('Invalid response structure - missing framework scores');
    }

    if (!rawResponse.detailed_feedback?.neural?.highlight) {
      console.error('Invalid response structure - missing detailed feedback:', rawResponse);
      throw new Error('Invalid response structure - missing detailed feedback');
    }

    // Transform the response into the expected format
    const response: AnalysisResponse = {
      overallScore: rawResponse.overall_score,
      overallFeedback: rawResponse.overall_summary,
      keyQuotes: rawResponse.key_quotes || [],
      performance: {
        neural: {
          overallScore: rawResponse.framework_scores.neural.overall,
          highlights: rawResponse.detailed_feedback.neural.highlight,
          constructiveFeedback: rawResponse.detailed_feedback.neural.constructive,
          overview: rawResponse.detailed_feedback.neural.overview,
          responseAgility: {
            score: rawResponse.framework_scores.neural.response_agility
          },
          emotionalControl: {
            score: rawResponse.framework_scores.neural.emotional_control
          },
          adaptiveCommunication: {
            score: rawResponse.framework_scores.neural.adaptive_communication
          }
        },
        cognitive: {
          overallScore: rawResponse.framework_scores.cognitive.overall,
          highlights: rawResponse.detailed_feedback.cognitive.highlight,
          constructiveFeedback: rawResponse.detailed_feedback.cognitive.constructive,
          overview: rawResponse.detailed_feedback.cognitive.overview,
          situationReading: {
            score: rawResponse.framework_scores.cognitive.situation_reading
          },
          strategicThinking: {
            score: rawResponse.framework_scores.cognitive.strategic_thinking
          }
        },
        behavioral: {
          overallScore: rawResponse.framework_scores.behavioral.overall,
          highlights: rawResponse.detailed_feedback.behavioral.highlight,
          constructiveFeedback: rawResponse.detailed_feedback.behavioral.constructive,
          overview: rawResponse.detailed_feedback.behavioral.overview,
          conversationLeadership: {
            score: rawResponse.framework_scores.behavioral.conversation_leadership
          },
          objectionNavigation: {
            score: rawResponse.framework_scores.behavioral.objection_navigation
          }
        }
      },
      recommendations: {
        priority: rawResponse.recommendations_next_call || [],
        techniques: [],
        practice: []
      }
    };

    console.log('Transformed response:', JSON.stringify(response, null, 2));

    return response;
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    throw error;
  }
} 