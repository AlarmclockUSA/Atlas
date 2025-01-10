export async function fetchCallAnalysis(conversationId: string) {
  const response = await fetch(`/api/call-analysis/${conversationId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch call analysis')
  }
  return response.json()
}

