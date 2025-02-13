import * as admin from 'firebase-admin'

let adminAuth: admin.auth.Auth | null = null

export function getAdminAuth(): admin.auth.Auth {
  if (!adminAuth) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        })
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error)
        throw new Error('Failed to initialize Firebase Admin')
      }
    }
    adminAuth = admin.auth()
  }
  return adminAuth
} 