import React, { useState, useEffect } from 'react';
import { Conversation } from '@11labs/client';

export default function ConversationalAI() {
  const [conversation, setConversation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [agentStatus, setAgentStatus] = useState('listening');

  async function startConversation() {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation
      const newConversation = await Conversation.startSession({
        agentId: 'YOUR_AGENT_ID', // Replace with your agent ID
        onConnect: () => {
          setConnectionStatus('Connected');
        },
        onDisconnect: () => {
          setConnectionStatus('Disconnected');
          setConversation(null);
        },
        onError: (error) => {
          console.error('Error:', error);
        },
        onModeChange: (mode) => {
          setAgentStatus(mode.mode === 'speaking' ? 'speaking' : 'listening');
        },
      });

      setConversation(newConversation);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }

  async function stopConversation() {
    if (conversation) {
      await conversation.endSession();
      setConversation(null);
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '50px' }}>
      <h1>ElevenLabs Conversational AI</h1>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startConversation} 
          disabled={conversation !== null}
          style={{ padding: '10px 20px', margin: '5px' }}
        >
          Start Conversation
        </button>
        <button 
          onClick={stopConversation} 
          disabled={conversation === null}
          style={{ padding: '10px 20px', margin: '5px' }}
        >
          Stop Conversation
        </button>
      </div>
      <div style={{ fontSize: '18px' }}>
        <p>Status: <span>{connectionStatus}</span></p>
        <p>Agent is <span>{agentStatus}</span></p>
      </div>
    </div>
  );
}

