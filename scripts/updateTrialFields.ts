import { db } from '@/lib/firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

async function updateTrialFields() {
  try {
    const usersRef = collection(db, 'Users')
    const snapshot = await getDocs(usersRef)
    
    console.log(`Found ${snapshot.size} users to update`)
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data()
      
      // Skip if already has trial fields
      if (userData.trialEndDate && userData.hasOwnProperty('isTrialComplete')) {
        console.log(`User ${userDoc.id} already has trial fields, skipping`)
        continue
      }

      const createdAt = userData.createdAt?.toDate() || new Date()
      const trialEndDate = new Date(createdAt)
      trialEndDate.setDate(trialEndDate.getDate() + 3) // 3 day trial from creation

      await updateDoc(doc(db, 'Users', userDoc.id), {
        trialEndDate: trialEndDate,
        isTrialComplete: false
      })

      console.log(`Updated trial fields for user ${userDoc.id}:`, {
        createdAt,
        trialEndDate
      })
    }

    console.log('Finished updating all users')
  } catch (error) {
    console.error('Error updating trial fields:', error)
  }
}

// Run the update
updateTrialFields() 