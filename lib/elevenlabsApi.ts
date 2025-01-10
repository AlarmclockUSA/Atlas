const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

export async function getElevenLabsConversationId(agentId: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });
    

    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error occurred');
      throw new Error(`Failed to fetch conversations: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data.conversations)) {
      return null;
    }
    
    const conversation = data.conversations.find(
      (conv: any) => conv.agent_id === agentId && conv.status === 'processing'
    );
    
    return conversation?.conversation_id || null;
  } catch (error) {
    console.error('Error fetching conversation data');
    return null;
  }
}

export async function getMostRecentConversationId(agentId: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });
    

    if (response.status === 404) {
      console.log('No conversations found for agent:', agentId);
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error occurred');
      throw new Error(`Failed to fetch conversations: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data.conversations)) {
      return null;
    }
    
    const conversations = data.conversations.filter((conv: any) => conv.agent_id === agentId);
    
    if (conversations.length === 0) return null;
    
    // Sort conversations by start_time in descending order and get the most recent one
    const mostRecentConversation = conversations.sort((a: any, b: any) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )[0];
    
    return mostRecentConversation.conversation_id;
  } catch (error) {
    console.error('Error fetching conversation data');
    return null;
  }
}

export async function fetchElevenLabsAnalysis(conversationId: string, maxRetries = 10, initialDelay = 2000): Promise<any> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        console.log('Analysis not ready, retrying...');
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs Analysis API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          attempt: i + 1
        });
        throw new Error(`HTTP error! status: ${response.status}, error: ${errorText}`);
      }

      const data = await response.json();

      if (data.analysis) {
        return data.analysis;
      } else {
        console.log(`Analysis not complete, retrying in ${delay/1000} seconds... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    } catch (error) {
      console.error('Error fetching ElevenLabs analysis:', error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error(`Max retries (${maxRetries}) reached, failed to fetch analysis`);
}

