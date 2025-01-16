import { db } from './firebase'; // Ensure this path is correct
import { collection, addDoc, updateDoc, doc, Timestamp, increment, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';

interface Conversation {
  userId: string;
  agentId: string; // Our internal AgentID
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'ongoing' | 'completed';
  userEmail?: string;
  agentName?: string;
  propertyAddress?: string;
  tokenUsage: number;
  elevenlabsAgentId: string; // ElevenLabs AgentID
  duration?: number;
}

interface ConversationData {
  userId: string;
  userEmail: string;
  agentId: string; // Our internal AgentID
  agentName: string;
  propertyAddress: string;
  elevenlabsAgentId: string; // ElevenLabs AgentID
}

export async function createConversation(data: ConversationData): Promise<string> {
  try {
    const conversationRef = await addDoc(collection(db, 'Conversations'), {
      ...data,
      startTime: Timestamp.now(),
      status: 'ongoing',
      tokenUsage: 0
    } as Conversation);

    console.log('Conversation created with ID: ', conversationRef.id);
    return conversationRef.id;
  } catch (error) {
    console.error('Error creating conversation: ', error);
    throw error;
  }
}

export async function endConversation(conversationId: string): Promise<void> {
  try {
    const conversationRef = doc(db, 'Conversations', conversationId);
    await updateDoc(conversationRef, {
      endTime: Timestamp.now(),
      status: 'completed'
    });

    console.log('Conversation ended: ', conversationId);
  } catch (error) {
    console.error('Error ending conversation: ', error);
    throw error;
  }
}

export async function updateConversationTokenUsage(conversationId: string, tokenUsage: number): Promise<void> {
  try {
    const conversationRef = doc(db, 'Conversations', conversationId);
    await updateDoc(conversationRef, { tokenUsage });
    console.log('Token usage updated for conversation: ', conversationId);
  } catch (error) {
    console.error('Error updating token usage: ', error);
    throw error;
  }
}

export async function updateUserTokenUsage(userId: string, additionalTokens: number): Promise<void> {
  try {
    const userRef = doc(db, 'Users', userId);
    await updateDoc(userRef, {
      totalTokenUsage: increment(additionalTokens)
    });
    console.log('Total token usage updated for user: ', userId);
  } catch (error) {
    console.error('Error updating user token usage: ', error);
    throw error;
  }
}

export async function updateConversationDuration(conversationId: string, duration: number): Promise<void> {
  try {
    const conversationRef = doc(db, 'Conversations', conversationId);
    await updateDoc(conversationRef, { duration });
    console.log('Call duration updated for conversation:', conversationId);
  } catch (error) {
    console.error('Error updating call duration:', error);
    throw error;
  }
}

export async function updateUserTotalCallDuration(userId: string, duration: number): Promise<void> {
  try {
    const userRef = doc(db, 'Users', userId);
    
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        // If the user document doesn't exist, create it with initial data
        transaction.set(userRef, {
          callDurations: [duration],
          totalCallDuration: duration,
          lastUpdated: serverTimestamp()
        });
      } else {
        // If it exists, update the existing document
        const userData = userDoc.data();
        const callDurations = userData.callDurations || [];
        callDurations.push(duration);
        const totalCallDuration = callDurations.reduce((sum, dur) => sum + dur, 0);
        
        transaction.update(userRef, {
          callDurations: callDurations,
          totalCallDuration: totalCallDuration,
          lastUpdated: serverTimestamp()
        });
      }
    });
    
    console.log('Successfully updated user call durations and total duration');
  } catch (error) {
    console.error('Error updating user call durations:', error);
    throw error;
  }
}

export async function updateTimeUsage(userId: string, duration: number): Promise<void> {
  const userRef = doc(db, 'Users', userId);
  
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist!");
    }

    const userData = userDoc.data();
    const currentDate = new Date();
    const lastResetDate = userData.lastResetDate ? userData.lastResetDate.toDate() : null;
    const maxTimeLimit = userData.maxTimeLimit || 600; // Default to 10 hours (600 minutes) if not set

    let newTotalTimeUsage = userData.totalTimeUsage || 0;

    // Check if 30 days have passed since the last reset
    if (!lastResetDate || (currentDate.getTime() - lastResetDate.getTime() >= 30 * 24 * 60 * 60 * 1000)) {
      newTotalTimeUsage = 0;
    }

    // Add the new duration to the total time usage
    newTotalTimeUsage += Math.ceil(duration / 60);

    // Check if the new total time usage exceeds the max time limit
    if (newTotalTimeUsage > maxTimeLimit) {
      throw new Error("Max time limit exceeded");
    }

    transaction.update(userRef, {
      lastResetDate: currentDate,
      totalTimeUsage: newTotalTimeUsage
    });
  });
}

export async function checkAndResetTracking(userId: string): Promise<void> {
  const userRef = doc(db, 'Users', userId);
  
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist!");
    }

    const userData = userDoc.data();
    const currentDate = new Date();
    const lastResetDate = userData.lastResetDate ? userData.lastResetDate.toDate() : null;

    if (!lastResetDate || (currentDate.getTime() - lastResetDate.getTime() >= 30 * 24 * 60 * 60 * 1000)) {
      // If it's been 30 days since the last reset, reset the tracking
      transaction.update(userRef, {
        trackingStartDate: currentDate,
        lastResetDate: currentDate,
        totalTimeUsage: 0
      });
    }
  });
}

export async function setMaxTimeLimit(userId: string, maxTimeLimit: number): Promise<void> {
  try {
    const userRef = doc(db, 'Users', userId);
    await updateDoc(userRef, {
      maxTimeLimit: maxTimeLimit
    });
    console.log('Max time limit updated for user:', userId);
  } catch (error) {
    console.error('Error updating max time limit:', error);
    throw error;
  }
}

export async function ensureMaxTimeLimit(userId: string, defaultLimit: number = 600): Promise<void> {
  try {
    const userRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() || userDoc.data().maxTimeLimit === undefined) {
      await updateDoc(userRef, {
        maxTimeLimit: defaultLimit
      });
      console.log(`Max time limit set to default (${defaultLimit} minutes) for user:`, userId);
    }
  } catch (error) {
    console.error('Error ensuring max time limit:', error);
    throw error;
  }
}

