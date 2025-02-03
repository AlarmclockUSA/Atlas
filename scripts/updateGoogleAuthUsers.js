const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'atlas-ba8aa' // Updated project ID
});

const db = admin.firestore();
const auth = admin.auth();

async function updateGoogleAuthUsers() {
  try {
    const usersRef = db.collection('Users');
    const snapshot = await usersRef.get();
    
    console.log(`Found ${snapshot.size} users to check`);
    let updatedCount = 0;
    
    for (const userDoc of snapshot.docs) {
      try {
        // Get the auth user data
        const authUser = await auth.getUser(userDoc.id);
        const userData = userDoc.data();
        
        // Check if email is missing
        if (!userData.email && authUser.email) {
          console.log(`Updating user ${userDoc.id} with email: ${authUser.email}`);
          
          await userDoc.ref.update({
            email: authUser.email
          });
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
      }
    }

    console.log(`Updated ${updatedCount} users with missing email fields`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

// Run the update
updateGoogleAuthUsers(); 
