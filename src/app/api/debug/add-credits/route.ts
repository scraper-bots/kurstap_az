import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { credits } = await request.json()
    const creditsToAdd = credits || 5

    // Get user from database using Clerk ID
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add credits
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { 
        interviewCredits: {
          increment: creditsToAdd
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Added ${creditsToAdd} credits`,
      newBalance: updatedUser.interviewCredits,
      creditsSystem: 'ACTIVE'
    })
  } catch (error) {
    console.error('Error adding credits:', error)
    return NextResponse.json(
      { error: 'Failed to add credits' },
      { status: 500 }
    )
  }
}