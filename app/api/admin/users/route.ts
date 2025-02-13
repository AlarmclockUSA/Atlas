import { NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'
import * as admin from 'firebase-admin'
import { getAdminAuth } from '@/lib/firebase-admin'

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()
    
    // Verify admin status
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    
    // Delete the user using Admin SDK
    const adminAuth = getAdminAuth()
    await adminAuth.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 