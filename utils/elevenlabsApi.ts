export async function getElevenLabsConversationId(agentId: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.us.elevenlabs.io/v1/convai/conversations', {
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch conversations');
    
    const data = await response.json();
    const conversation = data.conversations.find(
      (conv: any) => conv.agent_id === agentId && conv.status === 'processing'
    );
    
    return conversation?.conversation_id || null;
  } catch (error) {
    console.error('Error fetching ElevenLabs conversation:', error);
    return null;
  }
}

