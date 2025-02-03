const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
admin.initializeApp({
  projectId: 'atlas-ai-dev'
});

const db = admin.firestore();

async function updateTrialFields() {
  try {
    const usersRef = db.collection('Users');
    const snapshot = await usersRef.get();
    
    console.log(`Found ${snapshot.size} users to update`);
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      
      // Skip if already has trial fields
      if (userData.trialEndDate && userData.hasOwnProperty('isTrialComplete')) {
        console.log(`User ${userDoc.id} already has trial fields, skipping`);
        continue;
      }

      const createdAt = userData.createdAt?._seconds ? new Date(userData.createdAt._seconds * 1000) : new Date();
      const trialEndDate = new Date(createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 day trial from creation

      await userDoc.ref.update({
        trialEndDate: admin.firestore.Timestamp.fromDate(trialEndDate),
        isTrialComplete: false
      });

      console.log(`Updated trial fields for user ${userDoc.id}:`, {
        createdAt,
        trialEndDate
      });
    }

    console.log('Finished updating all users');
    process.exit(0);
  } catch (error) {
    console.error('Error updating trial fields:', error);
    process.exit(1);
  }
}

// Run the update
updateTrialFields(); 
