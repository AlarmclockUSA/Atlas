import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find the document in PaymentFailed collection
    const paymentFailedRef = collection(db, 'PaymentFailed')
    const q = query(paymentFailedRef, where('email', '==', email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    // Delete all matching documents
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    return NextResponse.json({
      success: true,
      message: `Deleted ${querySnapshot.size} documents for email: ${email}`
    })

  } catch (error) {
    console.error('Error in payment success handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 