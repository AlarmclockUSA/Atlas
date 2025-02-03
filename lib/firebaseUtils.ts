import { db } from './firebase'; // Ensure this path is correct
import { collection, addDoc, updateDoc, doc, Timestamp, increment, serverTimestamp, runTransaction, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { AnalysisResponse } from './anthropicApi';

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
  analysis?: any; // Eleven Labs analysis
  anthropicAnalysis?: AnalysisResponse; // Anthropic analysis
}

interface ConversationData {
  userId: string;
  userEmail: string;
  agentId: string; // Our internal AgentID
  agentName: string;
  propertyAddress: string;
  elevenlabsAgentId: string; // ElevenLabs AgentID
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  agentId: string;
  agentName: string;
  objectives: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PracticeAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  elevenLabsId: string;
  type: 'buyer' | 'seller' | 'coach';
  expertise: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

export async function createScenario(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const scenariosRef = collection(db, 'Scenarios');
    const now = Timestamp.now();
    const docRef = await addDoc(scenariosRef, {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    console.log('Created scenario with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating scenario:', error);
    throw error;
  }
}

export async function updateScenario(id: string, data: Partial<Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  try {
    const scenarioRef = doc(db, 'Scenarios', id);
    await updateDoc(scenarioRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    console.log('Updated scenario:', id);
  } catch (error) {
    console.error('Error updating scenario:', error);
    throw error;
  }
}

export async function deleteScenario(id: string): Promise<void> {
  try {
    const scenarioRef = doc(db, 'Scenarios', id);
    await deleteDoc(scenarioRef);
    console.log('Deleted scenario:', id);
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
}

export async function getScenarios(): Promise<Scenario[]> {
  try {
    const scenariosRef = collection(db, 'Scenarios');
    const snapshot = await getDocs(scenariosRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Scenario));
  } catch (error) {
    console.error('Error getting scenarios:', error);
    throw error;
  }
}

export async function createPracticeAgent(data: Omit<PracticeAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const agentsRef = collection(db, 'PracticeAgents');
    const now = Timestamp.now();
    const docRef = await addDoc(agentsRef, {
      ...data,
      createdAt: now,
      updatedAt: now
    });
    console.log('Created practice agent with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating practice agent:', error);
    throw error;
  }
}

export async function getPracticeAgent(id: string): Promise<PracticeAgent | null> {
  try {
    const agentRef = doc(db, 'PracticeAgents', id);
    const agentDoc = await getDoc(agentRef);
    if (!agentDoc.exists()) {
      return null;
    }
    return {
      id: agentDoc.id,
      ...agentDoc.data()
    } as PracticeAgent;
  } catch (error) {
    console.error('Error getting practice agent:', error);
    throw error;
  }
}

export async function getPracticeAgents(): Promise<PracticeAgent[]> {
  try {
    const agentsRef = collection(db, 'PracticeAgents');
    const snapshot = await getDocs(agentsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PracticeAgent));
  } catch (error) {
    console.error('Error getting practice agents:', error);
    throw error;
  }
}

export async function saveAnalysisToFirebase(conversationId: string, analysis: any): Promise<void> {
  try {
    const conversationRef = doc(db, 'Conversations', conversationId);
    await updateDoc(conversationRef, {
      analysis,
      analysisTimestamp: serverTimestamp()
    });
    console.log('Analysis saved for conversation:', conversationId);
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
}

export async function saveAnthropicAnalysis(conversationId: string, analysis: AnalysisResponse): Promise<void> {
  try {
    const conversationRef = doc(db, 'Conversations', conversationId);
    await updateDoc(conversationRef, {
      anthropicAnalysis: analysis
    });
    console.log('Anthropic analysis saved for conversation: ', conversationId);
  } catch (error) {
    console.error('Error saving Anthropic analysis: ', error);
    throw error;
  }
}

export async function checkTrialStatus(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const trialEndDate = userData.trialEndDate?.toDate();
    const isTrialComplete = userData.isTrialComplete;
    const hasPaid = userData.hasPaid || false;
    const isOverdue = userData.isOverdue || false;

    // If they've paid but are not overdue, grant access
    if (hasPaid && !isOverdue) {
      return true;
    }

    // If trial end date exists and hasn't passed, allow access
    if (trialEndDate && trialEndDate > new Date()) {
      return true;
    }

    // If we get here, either:
    // 1. Trial has expired (trialEndDate < now)
    // 2. No trial end date exists
    // 3. Trial is complete but they haven't paid
    // 4. They've paid but are overdue
    // In all these cases, deny access
    return false;
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
}

