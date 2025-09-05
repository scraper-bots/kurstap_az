import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database using Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: {
        interviewCredits: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simple credit-based check
    const hasCredits = user.interviewCredits > 0
    const canStartInterview = hasCredits

    return NextResponse.json({
      systemType: 'CREDIT_BASED',
      interviewCredits: user.interviewCredits,
      remainingInterviews: user.interviewCredits, // Alias for compatibility
      hasCredits,
      canStartInterview,
      message: !canStartInterview ? 'No interview credits available. Please purchase credits to continue.' : undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  } catch (error) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}