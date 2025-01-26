import { createScenario } from '@/lib/firebaseUtils'
import type { Scenario } from '@/lib/firebaseUtils'

type ScenarioInput = Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>

const scenarios: ScenarioInput[] = [
  {
    title: "First-Time Home Buyer Consultation",
    description: "Guide a first-time home buyer through the initial consultation process, explaining key concepts and addressing common concerns.",
    difficulty: "Beginner",
    category: "Buyer Consultation",
    agentId: "sarah_johnson",
    agentName: "Sarah Johnson",
    objectives: [
      "Explain the home buying process step by step",
      "Discuss mortgage pre-approval and its importance",
      "Cover down payment options and requirements",
      "Address common first-time buyer concerns",
      "Explain the role of a buyer's agent"
    ]
  },
  {
    title: "Luxury Property Presentation",
    description: "Present a high-end luxury property to potential buyers, highlighting unique features and demonstrating market knowledge.",
    difficulty: "Advanced",
    category: "Property Presentation",
    agentId: "michael_chen",
    agentName: "Michael Chen",
    objectives: [
      "Highlight unique architectural features",
      "Discuss premium amenities and smart home technology",
      "Present neighborhood and lifestyle benefits",
      "Address security and privacy features",
      "Explain property investment potential"
    ]
  },
  {
    title: "Investment Property Analysis",
    description: "Help an investor evaluate a potential rental property, covering ROI calculations and market analysis.",
    difficulty: "Intermediate",
    category: "Investment Analysis",
    agentId: "emma_wilson",
    agentName: "Emma Wilson",
    objectives: [
      "Calculate potential rental income",
      "Analyze operating expenses and maintenance costs",
      "Discuss market trends and appreciation potential",
      "Evaluate neighborhood development plans",
      "Review property management considerations"
    ]
  },
  {
    title: "Property Listing Presentation",
    description: "Present a comprehensive listing presentation to potential sellers, covering pricing strategy and marketing plan.",
    difficulty: "Intermediate",
    category: "Seller Consultation",
    agentId: "david_martinez",
    agentName: "David Martinez",
    objectives: [
      "Present comparative market analysis",
      "Explain pricing strategy",
      "Outline marketing plan and timeline",
      "Discuss staging recommendations",
      "Review seller's disclosure requirements"
    ]
  },
  {
    title: "Negotiation Strategy Session",
    description: "Practice handling complex negotiations, including multiple offers and contingency discussions.",
    difficulty: "Advanced",
    category: "Negotiation",
    agentId: "lisa_thompson",
    agentName: "Lisa Thompson",
    objectives: [
      "Handle multiple offer scenarios",
      "Navigate inspection contingencies",
      "Address appraisal concerns",
      "Manage seller expectations",
      "Negotiate repair requests"
    ]
  }
]

async function seedScenarios() {
  try {
    for (const scenario of scenarios) {
      const id = await createScenario(scenario)
      console.log(`Created scenario: ${scenario.title} with ID: ${id}`)
    }
    console.log('All scenarios created successfully!')
  } catch (error) {
    console.error('Error seeding scenarios:', error)
  }
}

// Run the seeding function
seedScenarios() 